import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui-old/Select';
import { Loader } from '@/components/ui/Loader';
import { Save, Plus, Trash2, CheckCircle2, XCircle, ArrowLeft, BarChart3, DollarSign, TrendingDown, BadgeCheck, FileText, Building2 } from 'lucide-react';
import { purchaseQuotationService } from '@/lib/scm/api/purchase-quotation.service';
import { purchaseRequisitionService } from '@/lib/scm/api/purchase-requisition.service';
import { supplierService } from '@/lib/scm/api/supplier.service';
import { useToast } from '@/components/ui/Toast';

interface PurchaseQuotationCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  preselectedPrId?: string | null;
  isSuperUser?: boolean;
}

interface DetailRow {
  _key: number;
  requisition_detail_id: number;
  product_id: number | string;
  product_name: string;
  pr_quantity: number;
  quoted_quantity: number;
  unit_price: number;
  amount: number;
  delivery_time_days: number | null;
  remarks: string;
}

interface SupplierEntry {
  id: string;
  supplier_id: number | string;
  supplier_name: string;
  quotation_no: string;
  quotation_date: string;
  valid_until: string;
  details: DetailRow[];
  total_amount: number;
  status: 'draft' | 'saving' | 'saved' | 'error';
  error?: string;
}

let _nextKey = 1;

function createDetailFromPR(det: any): DetailRow {
  return {
    _key: _nextKey++,
    requisition_detail_id: det.requisition_detail_id ?? 0,
    product_id: det.product_id ?? '',
    product_name: det.product_name ?? '',
    pr_quantity: Number(det.quantity ?? 1),
    quoted_quantity: Number(det.quantity ?? 1),
    unit_price: Number(det.price ?? 0),
    amount: Number(det.quantity ?? 1) * Number(det.price ?? 0),
    delivery_time_days: null,
    remarks: '',
  };
}

function calcTotal(details: DetailRow[]): number {
  return details.reduce((sum, d) => sum + (d.unit_price * d.quoted_quantity), 0);
}

export function PurchaseQuotationCompareModal({
  isOpen, onClose, onSave, preselectedPrId, isSuperUser,
}: PurchaseQuotationCompareModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'entry' | 'comparison'>('entry');

  // PR data
  const [prInfo, setPrInfo] = useState<any>(null);
  const [prDetailsSource, setPrDetailsSource] = useState<DetailRow[]>([]);

  // Suppliers
  const [suppliers, setSuppliers] = useState<{ value: string | number; label: string }[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number>('');

  // Current entry being configured
  const [currentEntryDate, setCurrentEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [currentEntryValidUntil, setCurrentEntryValidUntil] = useState('');
  const [currentEntryDetails, setCurrentEntryDetails] = useState<DetailRow[]>([]);

  // Saved entries
  const [entries, setEntries] = useState<SupplierEntry[]>([]);

  const { toast, ToastComponent } = useToast();

  // Load combos and PR data on open
  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      setLoading(true);
      try {
        const [suppRes, prRes] = await Promise.all([
          supplierService.getCombo(),
          preselectedPrId ? purchaseRequisitionService.getById(preselectedPrId) : Promise.resolve(null),
        ]);

        setSuppliers(Array.isArray(suppRes) ? suppRes : []);

        if (prRes?.data || prRes) {
          const pr = prRes?.data ?? prRes;
          setPrInfo(pr);
          const details = pr.details && Array.isArray(pr.details)
            ? pr.details.map(createDetailFromPR)
            : [];
          setPrDetailsSource(details);
        }

        // Reset state
        setView('entry');
        setEntries([]);
        setSelectedSupplierId('');
        setCurrentEntryDate(new Date().toISOString().slice(0, 10));
        setCurrentEntryValidUntil('');
        setCurrentEntryDetails([]);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isOpen, preselectedPrId]);

  // When supplier changes, populate line items from PR
  useEffect(() => {
    if (!selectedSupplierId || prDetailsSource.length === 0) {
      setCurrentEntryDetails([]);
      return;
    }
    setCurrentEntryDetails(
      prDetailsSource.map(d => ({ ...d, _key: _nextKey++ }))
    );
  }, [selectedSupplierId, prDetailsSource]);

  const handleDetailChange = useCallback((key: number, field: string, value: any) => {
    setCurrentEntryDetails(prev => {
      const updated = prev.map(d => {
        if (d._key !== key) return d;
        const next = { ...d, [field]: value };

        if (field === 'unit_price' || field === 'quoted_quantity') {
          next.amount = Number(next.quoted_quantity || 0) * Number(next.unit_price || 0);
        }
        return next;
      });
      return updated;
    });
  }, []);

  const currentTotal = useMemo(() => calcTotal(currentEntryDetails), [currentEntryDetails]);

  const addEntryToList = useCallback(() => {
    if (!selectedSupplierId) {
      toast({ title: 'Error', description: 'Please select a supplier first.', status: 'error' });
      return;
    }
    const sup = suppliers.find(s => String(s.value) === String(selectedSupplierId));
    if (currentEntryDetails.length === 0) {
      toast({ title: 'Error', description: 'No line items to add.', status: 'error' });
      return;
    }

    // Validate prices > 0 and quantity > 0
    const invalidItems = currentEntryDetails.filter(d => Number(d.unit_price) <= 0 || Number(d.quoted_quantity) <= 0);
    if (invalidItems.length > 0) {
      const names = invalidItems.map(d => d.product_name || `#${d.product_id}`).slice(0, 3).join(', ');
      const suffix = invalidItems.length > 3 ? ` and ${invalidItems.length - 3} more` : '';
      toast({
        title: 'Validation Error',
        description: `Invalid price or quantity for: ${names}${suffix}`,
        status: 'error',
      });
      return;
    }

    const entry: SupplierEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      supplier_id: selectedSupplierId,
      supplier_name: sup?.label ?? String(selectedSupplierId),
      quotation_no: 'Auto',
      quotation_date: currentEntryDate,
      valid_until: currentEntryValidUntil,
      details: currentEntryDetails.map(d => ({ ...d, _key: _nextKey++ })),
      total_amount: currentTotal,
      status: 'draft',
    };

    setEntries(prev => [...prev, entry]);
    setSelectedSupplierId('');
    setCurrentEntryDetails([]);
    setCurrentEntryDate(new Date().toISOString().slice(0, 10));
    setCurrentEntryValidUntil('');

    toast({ title: 'Added', description: `Quotation for ${entry.supplier_name} added to list.`, status: 'success' });
  }, [selectedSupplierId, suppliers, currentEntryDetails, currentEntryDate, currentEntryValidUntil, currentTotal, toast]);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (entries.length === 0) {
      toast({ title: 'Error', description: 'No supplier quotations to save.', status: 'error' });
      return;
    }

    setSaving(true);

    // Mark all as saving
    const draftIds = entries.filter(e => e.status === 'draft').map(e => e.id);
    setEntries(prev => prev.map(e =>
      draftIds.includes(e.id) ? { ...e, status: 'saving' as const } : e
    ));

    // Build payloads for draft entries
    const draftEntries = entries.filter(e => e.status === 'draft');
    const payloads = draftEntries.map(entry => ({
      entry,
      payload: {
        quotation_no: entry.quotation_no,
        requisition_id: Number(preselectedPrId),
        supplier_id: Number(entry.supplier_id),
        quotation_date: entry.quotation_date,
        valid_until: entry.valid_until || null,
        total_amount: entry.total_amount,
        status: 0,
        remarks: '',
        details: entry.details.map(d => ({
          quotation_detail_id: 0,
          requisition_detail_id: d.requisition_detail_id,
          product_id: Number(d.product_id),
          quantity: d.quoted_quantity,
          unit_price: d.unit_price,
          amount: d.amount,
          delivery_time_days: d.delivery_time_days,
          remarks: d.remarks,
        })),
      },
    }));

    // Fire all saves in parallel
    const saveResponses = await Promise.allSettled(
      payloads.map(({ entry, payload }) =>
        purchaseQuotationService.save(payload).then(res => ({ entry, res }))
      )
    );

    // Process results into outcomes
    const results: { entry: SupplierEntry; success: boolean; error?: string }[] = [];
    const statusUpdates: Record<string, { status: 'saved' | 'error'; error?: string }> = {};

    saveResponses.forEach((result, idx) => {
      const entry = payloads[idx].entry;
      if (result.status === 'fulfilled') {
        const res = result.value.res;
        if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
          results.push({ entry, success: true });
          statusUpdates[entry.id] = { status: 'saved' };
        } else {
          const msg = res?.message || 'Save failed';
          results.push({ entry, success: false, error: msg });
          statusUpdates[entry.id] = { status: 'error', error: msg };
        }
      } else {
        const msg = result.reason?.message || 'Network error';
        results.push({ entry, success: false, error: msg });
        statusUpdates[entry.id] = { status: 'error', error: msg };
      }
    });

    // Apply all status updates at once
    setEntries(prev => prev.map(e => {
      const update = statusUpdates[e.id];
      return update ? { ...e, ...update } : e;
    }));

    setSaving(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      toast({
        title: 'Success',
        description: `All ${successCount} quotation(s) saved successfully.`,
        status: 'success',
      });
      onSave?.();
      onClose();
    } else {
      toast({
        title: 'Partial Success',
        description: `${successCount} saved, ${failCount} failed. Check entries with errors.`,
        status: 'error',
      });
    }
  }, [entries, preselectedPrId, toast, onSave, onClose]);

  const comparisonData = useMemo(() => {
    if (entries.length === 0) return null;

    // Get all unique products across all entries
    const productMap = new Map<string, { name: string; prQty: number }>();
    entries.forEach(entry => {
      entry.details.forEach(d => {
        const pid = String(d.product_id);
        if (!productMap.has(pid)) {
          productMap.set(pid, { name: d.product_name || `Product #${pid}`, prQty: d.pr_quantity });
        }
      });
    });

    const products = Array.from(productMap.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      prQty: info.prQty,
    }));

    // For each product, find the cheapest supplier
    const cheapestPerProduct = new Map<string, string>();
    products.forEach(p => {
      let minPrice = Infinity;
      let minSupplierId = '';
      entries.forEach(entry => {
        const det = entry.details.find(d => String(d.product_id) === p.id);
        if (det && det.unit_price < minPrice) {
          minPrice = det.unit_price;
          minSupplierId = entry.id;
        }
      });
      cheapestPerProduct.set(p.id, minSupplierId);
    });

    // Find cheapest overall supplier (by total amount)
    let minTotal = Infinity;
    let cheapestSupplierId = '';
    entries.forEach(entry => {
      if (entry.total_amount < minTotal) {
        minTotal = entry.total_amount;
        cheapestSupplierId = entry.id;
      }
    });

    return { products, cheapestPerProduct, cheapestSupplierId };
  }, [entries]);

  const hasUnsavedEntries = entries.some(e => e.status === 'draft');
  const hasErrorEntries = entries.some(e => e.status === 'error');

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={view === 'comparison' ? 'full' : '7xl'}
      className="w-full"
      title={
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg shadow-emerald-500/20">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-text-main font-bold">Supplier Quotations</span>
          {isSuperUser && (
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded uppercase tracking-[0.15em]">
              Super Admin
            </span>
          )}
        </div>
      }
      headerAction={
        entries.length > 1 && (
          <div className="flex items-center gap-2 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setView(view === 'entry' ? 'comparison' : 'entry')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                view === 'comparison'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-text-muted hover:bg-surface-secondary'
              }`}
            >
              {view === 'comparison' ? (
                <><ArrowLeft className="h-3.5 w-3.5" /> Back to Entry</>
              ) : (
                <><BarChart3 className="h-3.5 w-3.5" /> Compare ({entries.length})</>
              )}
            </Button>
          </div>
        )
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary-500" />
            <span className="text-[11px] font-medium text-text-muted">Loading PR details...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* PR Info Banner — shows which PR is selected with full details */}
          {prInfo && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-primary-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-100 rounded-lg shadow-sm">
                    <FileText className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-black uppercase tracking-wider text-primary-700">
                        {prInfo.requisition_no || 'PR'}
                      </span>
                      {prInfo.warehouse_name && (
                        <span className="px-2 py-0.5 rounded-md bg-primary-100/80 text-[9px] font-bold text-primary-600 uppercase tracking-wider">
                          {prInfo.warehouse_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {prInfo.requisition_date && (
                        <span className="text-[10px] font-medium text-text-muted">
                          {new Date(prInfo.requisition_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span className="text-[9px] text-text-muted/40">•</span>
                      <span className="text-[10px] font-medium text-text-muted">
                        {prDetailsSource.length} item{prDetailsSource.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-black text-text-main">
                    {prDetailsSource.reduce((s, d) => s + (Number(d.pr_quantity) * Number(d.unit_price)), 0).toFixed(2)}
                  </div>
                  <div className="text-[9px] font-medium text-text-muted uppercase tracking-wider">Est. Budget</div>
                </div>
              </div>
              {/* Mini line items summary */}
              {prDetailsSource.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary-50/50 text-[8px] font-black uppercase tracking-widest text-primary-500">
                        <th className="px-5 py-2 w-[50%]">Product</th>
                        <th className="px-3 py-2 text-right w-[15%]">Qty</th>
                        <th className="px-3 py-2 text-right w-[17%]">Unit Price</th>
                        <th className="px-5 py-2 text-right w-[18%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prDetailsSource.map((d, idx) => {
                        const prQty = Number(d.pr_quantity);
                        const prPrice = Number(d.unit_price);
                        return (
                          <tr key={idx} className="border-t border-primary-100/40 hover:bg-primary-50/30 transition-colors">
                            <td className="px-5 py-2">
                              <span className="text-[11px] font-medium text-text-main">{d.product_name || `Product #${d.product_id}`}</span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-[11px] text-text-main">{prQty}</td>
                            <td className="px-3 py-2 text-right font-mono text-[11px] text-text-main">{prPrice.toFixed(2)}</td>
                            <td className="px-5 py-2 text-right font-mono text-[11px] font-bold text-text-main">{(prQty * prPrice).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {prInfo.remarks && (
                <div className="px-5 py-2 border-t border-primary-100/40 bg-primary-50/20">
                  <span className="text-[10px] text-text-muted italic">{prInfo.remarks}</span>
                </div>
              )}
            </div>
          )}

          {view === 'entry' ? (
            <>
              {/* Supplier Selector + Entry */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" />
                    Supplier
                  </label>
                  <Select
                    options={suppliers}
                    value={selectedSupplierId}
                    onChange={(val) => setSelectedSupplierId(val ?? '')}
                    placeholder="Select supplier..."
                    isSearchable
                    className="text-[12px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Quotation Date</label>
                  <Input
                    type="date"
                    value={currentEntryDate}
                    onChange={(e) => setCurrentEntryDate(e.target.value)}
                    className="text-[12px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Valid Until</label>
                  <Input
                    type="date"
                    value={currentEntryValidUntil}
                    onChange={(e) => setCurrentEntryValidUntil(e.target.value)}
                    className="text-[12px]"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              {selectedSupplierId && currentEntryDetails.length > 0 && (
                <div className="border border-border-theme rounded-xl overflow-hidden">
                  <div className="bg-surface-secondary px-4 py-2.5 border-b border-border-theme">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Line Items — {currentEntryDetails.length} product(s)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-secondary/50 text-[9px] font-black uppercase tracking-widest text-text-muted">
                          <th className="px-3 py-2 w-[160px]">Product</th>
                          <th className="px-3 py-2 w-[60px] text-right">PR Qty</th>
                          <th className="px-3 py-2 w-[80px] text-right">Qty</th>
                          <th className="px-3 py-2 w-[100px] text-right">Unit Price</th>
                          <th className="px-3 py-2 w-[100px] text-right">Amount</th>
                          <th className="px-3 py-2 w-[70px] text-right">Lead Time</th>
                          <th className="px-3 py-2 w-[120px]">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEntryDetails.map((row, idx) => (
                          <tr key={row._key} className="border-t border-border-theme hover:bg-surface-secondary/30 transition-colors">
                            <td className="px-3 py-1.5">
                              <span className="text-[11px] font-medium text-text-main">{row.product_name || `Product #${row.product_id}`}</span>
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <span className="text-[11px] text-text-muted">{row.pr_quantity}</span>
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={row.quoted_quantity}
                                onChange={(e) => handleDetailChange(row._key, 'quoted_quantity', Number(e.target.value))}
                                className="h-8 py-1 px-2 text-[11px] text-right"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={row.unit_price}
                                onChange={(e) => handleDetailChange(row._key, 'unit_price', Number(e.target.value))}
                                className="h-8 py-1 px-2 text-[11px] text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <span className="text-[11px] font-bold font-mono text-text-main">
                                {row.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={row.delivery_time_days ?? ''}
                                onChange={(e) => handleDetailChange(row._key, 'delivery_time_days', e.target.value === '' ? null : Number(e.target.value))}
                                className="h-8 py-1 px-2 text-[11px] text-right"
                                placeholder="Days"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                value={row.remarks}
                                onChange={(e) => handleDetailChange(row._key, 'remarks', e.target.value)}
                                className="h-8 py-1 px-2 text-[11px]"
                                placeholder="—"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border-theme bg-surface-secondary/30">
                          <td className="px-3 py-2" colSpan={4}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total</span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[13px] text-primary-700">
                            {currentTotal.toFixed(2)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Add to List Button */}
              {selectedSupplierId && currentEntryDetails.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={addEntryToList}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 py-2 px-5 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all text-[11px] font-black uppercase tracking-[0.12em]"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Quotation List
                  </Button>
                </div>
              )}

              {/* Entries Summary */}
              {entries.length > 0 && (
                <div className="border border-border-theme rounded-xl overflow-hidden">
                  <div className="bg-surface-secondary px-4 py-2.5 border-b border-border-theme flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Supplier Quotations ({entries.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        hasUnsavedEntries
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>
                        {hasUnsavedEntries ? 'Unsaved' : 'All Saved'}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-border-theme">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-secondary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            entry.status === 'saved' ? 'bg-green-50' :
                            entry.status === 'error' ? 'bg-red-50' :
                            entry.status === 'saving' ? 'bg-amber-50' :
                            'bg-surface-secondary'
                          }`}>
                            {entry.status === 'saved' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : entry.status === 'error' ? (
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            ) : entry.status === 'saving' ? (
                              <Loader className="h-3.5 w-3.5 animate-spin text-amber-500" />
                            ) : (
                              <Building2 className="h-3.5 w-3.5 text-text-muted" />
                            )}
                          </div>
                          <div>
                            <span className="text-[12px] font-bold text-text-main">{entry.supplier_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-text-muted">{entry.quotation_date}</span>
                              <span className="text-[9px] text-text-muted/50">•</span>
                              <span className="text-[10px] font-mono font-bold text-primary-600">{entry.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.status === 'error' && entry.error && (
                            <span className="text-[9px] text-red-500 max-w-[150px] truncate">{entry.error}</span>
                          )}
                          {entry.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEntry(entry.id)}
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Comparison View ── */
            comparisonData && entries.length >= 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-widest text-text-muted">
                    Price Comparison — {entries.length} supplier(s)
                  </span>
                </div>

                <div className="overflow-x-auto border border-border-theme rounded-xl shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                        <th className="px-4 py-3 w-[180px] text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Product
                        </th>
                        <th className="px-3 py-3 w-[60px] text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                          PR Qty
                        </th>
                        {entries.map((entry) => {
                          const isCheapest = comparisonData.cheapestSupplierId === entry.id;
                          return (
                            <th key={entry.id} className={`px-3 py-3 min-w-[140px] text-right ${
                              isCheapest ? 'bg-emerald-50' : ''
                            }`}>
                              <div className="flex items-center justify-end gap-1.5">
                                {isCheapest && (
                                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                  isCheapest ? 'text-emerald-700' : 'text-slate-500'
                                }`}>
                                  {entry.supplier_name}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.products.map((product, idx) => {
                        const cheapestEntryId = comparisonData.cheapestPerProduct.get(product.id);
                        return (
                          <tr key={product.id} className={`border-t border-border-theme hover:bg-slate-50/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}>
                            <td className="px-4 py-2.5">
                              <span className="text-[12px] font-semibold text-slate-800">{product.name}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className="text-[11px] font-mono text-slate-400">{product.prQty}</span>
                            </td>
                            {entries.map((entry) => {
                              const det = entry.details.find(d => String(d.product_id) === product.id);
                              const isCheapest = entry.id === cheapestEntryId;
                              return (
                                <td key={entry.id} className={`px-3 py-2.5 text-right ${
                                  isCheapest ? 'bg-emerald-50/80' : ''
                                }`}>
                                  {det ? (
                                    <div className="flex flex-col items-end">
                                      <span className={`text-[12px] font-bold font-mono ${
                                        isCheapest ? 'text-emerald-600' : 'text-slate-700'
                                      }`}>
                                        {det.unit_price.toFixed(2)}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                        {det.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {/* ── Subtotal Row ── */}
                      <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subtotal</span>
                        </td>
                        <td></td>
                        {entries.map((entry) => (
                          <td key={entry.id} className={`px-3 py-3 text-right ${
                            comparisonData.cheapestSupplierId === entry.id ? 'bg-emerald-50' : ''
                          }`}>
                            <span className={`text-[14px] font-black font-mono ${
                              comparisonData.cheapestSupplierId === entry.id ? 'text-emerald-600' : 'text-slate-800'
                            }`}>
                              {entry.total_amount.toFixed(2)}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* ── Savings Row ── */}
                      {comparisonData.cheapestSupplierId && (
                        <tr className="bg-emerald-50/50 border-t border-emerald-100">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <BadgeCheck className="h-4 w-4 text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                                Best Value
                              </span>
                            </div>
                          </td>
                          <td></td>
                          {entries.map((entry) => {
                            const cheapestEntry = entries.find(e => e.id === comparisonData.cheapestSupplierId);
                            const savings = cheapestEntry ? entry.total_amount - cheapestEntry.total_amount : 0;
                            const isCheapest = comparisonData.cheapestSupplierId === entry.id;
                            return (
                              <td key={entry.id} className={`px-3 py-3 text-right ${
                                isCheapest ? 'bg-emerald-50' : ''
                              }`}>
                                {isCheapest ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-[12px] font-black text-emerald-600">Selected</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-red-500">
                                      +{savings.toFixed(2)} more
                                    </span>
                                    <span className="text-[9px] text-red-400 font-medium">
                                      {savings > 0 ? `${((savings / cheapestEntry!.total_amount) * 100).toFixed(1)}% higher` : ''}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ── Actions Footer ── */}
          {entries.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border-theme">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  hasUnsavedEntries
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  {hasUnsavedEntries ? (
                    <><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse inline-block" /> {entries.filter(e => e.status === 'draft').length} unsaved</>
                  ) : hasErrorEntries ? (
                    <><XCircle className="h-2.5 w-2.5" /> {entries.filter(e => e.status === 'error').length} with errors</>
                  ) : (
                    <><CheckCircle2 className="h-2.5 w-2.5" /> All saved</>
                  )}
                </span>
                {hasUnsavedEntries && (
                  <span className="text-[10px] text-text-muted font-medium">
                    Total: {entries.reduce((s, e) => s + e.total_amount, 0).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {entries.length >= 2 && view === 'entry' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setView('comparison')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-primary-600 border-primary-200 hover:bg-primary-50 transition-all"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Preview Comparison
                  </Button>
                )}
                {hasUnsavedEntries && (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveAll}
                    className="bg-[#2e125c] hover:bg-[#3d187a] text-white flex items-center gap-2 py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-[11px] font-black uppercase tracking-[0.12em]"
                  >
                    {saving ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save All ({entries.filter(e => e.status === 'draft').length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
      <ToastComponent />
    </>
  );
}
