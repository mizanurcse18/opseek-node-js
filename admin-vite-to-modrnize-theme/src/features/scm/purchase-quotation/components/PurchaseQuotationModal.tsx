import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/ui/Loader';
import { Save, Plus, Trash2 } from 'lucide-react';
import { purchaseQuotationService } from '@/lib/scm/api/purchase-quotation.service';
import { purchaseRequisitionService } from '@/lib/scm/api/purchase-requisition.service';
import { productService, parseComboResponse } from '@/lib/scm/api/product.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { supplierService } from '@/lib/scm/api/supplier.service';

interface PurchaseQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
  isSuperUser?: boolean;
  preselectedPrId?: string | null;
  preselectedCompanyId?: string;
}

interface DetailRow {
  _key: number;
  quotation_detail_id?: number;
  requisition_detail_id: number;
  product_id: number | string;
  product_name?: string;
  quantity: number | string;
  unit_price: number | string;
  amount: number | string;
  delivery_time_days?: number | null;
  remarks: string;
}

let _nextKey = 1;
const newRow = (): DetailRow => ({
  _key: _nextKey++,
  requisition_detail_id: 0,
  product_id: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
  delivery_time_days: null,
  remarks: '',
});

export function PurchaseQuotationModal({ isOpen, onClose, onSave, initialData, isSuperUser, preselectedPrId, preselectedCompanyId }: PurchaseQuotationModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    quotation_id: 0,
    quotation_no: 'Auto',
    requisition_id: '',
    supplier_id: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: '',
    total_amount: 0,
    status: 0,
    remarks: '',
  });
  const [details, setDetails] = useState<DetailRow[]>([newRow()]);

  const [suppliers, setSuppliers] = useState<{ value: string | number; label: string }[]>([]);
  const [requisitions, setRequisitions] = useState<{ value: string | number; label: string }[]>([]);
  const [products, setProducts] = useState<{ value: string | number; label: string }[]>([]);
  const [productMap, setProductMap] = useState<Record<string, any>>({});

  const { toast, ToastComponent } = useToast();

  const isEditing = !!(initialData?.quotation_id ?? initialData?.id);

  useEffect(() => {
    if (!isOpen) return;
    const loadCombos = async () => {
      setLoading(true);
      try {
        const [suppRes, prodRes, prRes] = await Promise.all([
          supplierService.getCombo(preselectedCompanyId),
          productService.getAllProducts(),
          purchaseRequisitionService.getGridData({ Limit: 100, Offset: 0 }),
        ]);

        // Normalize supplier combo — API returns { data: [{value, label},...] }
        const suppList = parseComboResponse(suppRes);
        setSuppliers(suppList);

        // Load PRs for the requisition dropdown
        const prData = prRes?.data?.rows ?? prRes?.data ?? [];
        const prList = Array.isArray(prData) ? prData : [];
        setRequisitions(prList.map((p: any) => ({
          value: p.requisition_id ?? p.id,
          label: `${p.requisition_no ?? ''}`,
        })));

        const prodData = prodRes?.data ?? prodRes ?? [];
        const prodList = Array.isArray(prodData) ? prodData : [];
        setProducts(prodList.map((p: any) => ({
          value: p.product_id ?? p.id,
          label: p.product_name ?? String(p.product_id ?? ''),
        })));
        const pMap: Record<string, any> = {};
        prodList.forEach((p: any) => {
          pMap[p.product_id ?? p.id] = p;
        });
        setProductMap(pMap);
      } catch (err) {
        console.error('Failed to load combos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCombos();
  }, [isOpen]);

  // Load requisition details when requisition is selected
  useEffect(() => {
    if (!formData.requisition_id || isEditing) return;
    const loadPRDetails = async () => {
      try {
        const res = await purchaseRequisitionService.getById(formData.requisition_id);
        const prData = res?.data ?? res;
        if (prData?.details && Array.isArray(prData.details)) {
          const mapped = prData.details.map((det: any) => ({
            _key: _nextKey++,
            quotation_detail_id: 0,
            requisition_detail_id: det.requisition_detail_id ?? 0,
            product_id: det.product_id ?? '',
            product_name: det.product_name ?? '',
            quantity: det.quantity ?? 1,
            unit_price: det.price ?? 0,
            amount: det.price ? Number(det.quantity) * Number(det.price) : 0,
            delivery_time_days: null,
            remarks: '',
          }));
          setDetails(mapped);
          const total = mapped.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
          setFormData(prev => ({ ...prev, total_amount: total }));
        }
      } catch (err) {
        console.error('Failed to load PR details:', err);
      }
    };
    loadPRDetails();
  }, [formData.requisition_id, isEditing]);

  useEffect(() => {
    if (isOpen && initialData) {
      const d = initialData;
      setFormData({
        quotation_id: d.quotation_id ?? 0,
        quotation_no: d.quotation_no ?? 'Auto',
        requisition_id: d.requisition_id ?? '',
        supplier_id: d.supplier_id ?? '',
        quotation_date: d.quotation_date ? d.quotation_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        valid_until: d.valid_until ? d.valid_until.slice(0, 10) : '',
        total_amount: Number(d.total_amount ?? 0),
        status: d.status ?? 0,
        remarks: d.remarks ?? '',
      });
      if (d.details && Array.isArray(d.details)) {
        setDetails(d.details.map((det: any) => ({
          _key: _nextKey++,
          quotation_detail_id: det.quotation_detail_id,
          requisition_detail_id: det.requisition_detail_id ?? 0,
          product_id: det.product_id ?? '',
          product_name: det.product_name ?? '',
          quantity: det.quantity ?? 1,
          unit_price: det.unit_price ?? 0,
          amount: det.amount ?? 0,
          delivery_time_days: det.delivery_time_days ?? null,
          remarks: det.remarks ?? '',
        })));
      }
    } else if (isOpen && !initialData) {
      setFormData({
        quotation_id: 0,
        quotation_no: 'Auto',
        requisition_id: preselectedPrId ?? '',
        supplier_id: '',
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: '',
        total_amount: 0,
        status: 0,
        remarks: '',
      });
      setDetails([newRow()]);
    }
  }, [isOpen, initialData, preselectedPrId]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (key: number, field: string, value: any) => {
    setDetails(prev => {
      const updated = prev.map(d => {
        if (d._key !== key) return d;
        const next = { ...d, [field]: value };

        if (field === 'quantity' || field === 'unit_price') {
          const qty = Number(next.quantity || 0);
          const price = Number(next.unit_price || 0);
          next.amount = qty * price;
        }

        return next;
      });

      const total = updated.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      setFormData(prev => ({ ...prev, total_amount: total }));

      return updated;
    });
  };

  const addRow = () => {
    setDetails(prev => {
      if (prev.length === 0) return [newRow()];
      // Clone the last row's product info but zero out prices
      const last = prev[prev.length - 1];
      const newR = { ...newRow(), product_id: last.product_id };
      return [...prev, newR];
    });
  };

  const removeRow = (key: number) => {
    setDetails(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter(d => d._key !== key);
      const total = updated.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      setFormData(prev => ({ ...prev, total_amount: total }));
      return updated;
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        quotation_no: formData.quotation_no,
        requisition_id: Number(formData.requisition_id),
        supplier_id: Number(formData.supplier_id),
        valid_until: formData.valid_until || null,
        details: details.map(d => ({
          quotation_detail_id: (d as any).quotation_detail_id ?? 0,
          requisition_detail_id: Number(d.requisition_detail_id),
          product_id: Number(d.product_id),
          quantity: Number(d.quantity),
          unit_price: Number(d.unit_price),
          amount: Number(d.amount),
          delivery_time_days: d.delivery_time_days !== null && d.delivery_time_days !== '' ? Number(d.delivery_time_days) : null,
          remarks: d.remarks ?? '',
        })),
      };

      const res = await purchaseQuotationService.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: isEditing ? 'Quotation updated.' : 'Quotation created.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="7xl"
      className="w-full"
      title={
        <div className="flex items-center gap-3">
          <span>{isEditing ? 'Edit Quotation' : 'New Quotation'}</span>
          {isSuperUser && (
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded uppercase tracking-[0.15em]">
              Super Admin
            </span>
          )}
        </div>
      }
      headerAction={
        <div className="flex items-center gap-3 pr-2">
          <Button
            type="button"
            disabled={loading || saving}
            onClick={handleSubmit}
            className="bg-[#2e125c] hover:bg-[#3d187a] text-white flex items-center gap-2 py-1.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {saving ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Saving...</span>
              </>
            ) : loading ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Loading...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">
                  {isEditing ? 'Update' : 'Save'}
                </span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Master Fields */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Quotation No</label>
            <Input
              value={formData.quotation_no}
              onChange={(e) => handleFieldChange('quotation_no', e.target.value)}
              placeholder="Auto"
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Date</label>
            <Input
              type="date"
              value={formData.quotation_date}
              onChange={(e) => handleFieldChange('quotation_date', e.target.value)}
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Valid Until</label>
            <Input
              type="date"
              value={formData.valid_until}
              onChange={(e) => handleFieldChange('valid_until', e.target.value)}
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Purchase Requisition</label>
            <Select
              options={requisitions}
              value={formData.requisition_id}
              onChange={(val) => handleFieldChange('requisition_id', val ?? '')}
              placeholder="Select PR"
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Supplier</label>
            <Select
              options={suppliers}
              value={formData.supplier_id}
              onChange={(val) => handleFieldChange('supplier_id', val ?? '')}
              placeholder="Select supplier"
              className="text-[12px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</label>
            <Select
              options={[
                { value: 0, label: 'Draft' },
                { value: 1, label: 'Pending' },
              ]}
              value={formData.status}
              onChange={(val) => handleFieldChange('status', val ?? 0)}
              placeholder="Select status"
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Amount</label>
            <Input
              value={Number(formData.total_amount).toFixed(2)}
              disabled
              className="text-[12px] font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Remarks</label>
          <Textarea
            value={formData.remarks}
            onChange={(e) => handleFieldChange('remarks', e.target.value)}
            rows={2}
            className="text-[12px]"
          />
        </div>

        {/* Details Section */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block">Line Items</label>

          <div className="overflow-x-auto border border-border-theme rounded-lg">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-secondary text-[9px] font-black uppercase tracking-widest text-text-muted">
                  <th className="px-2 py-2 w-[180px]">Product</th>
                  <th className="px-2 py-2 w-[80px] text-right">PR Qty</th>
                  <th className="px-2 py-2 w-[80px] text-right">Quoted Qty</th>
                  <th className="px-2 py-2 w-[90px] text-right">Unit Price</th>
                  <th className="px-2 py-2 w-[90px] text-right">Amount</th>
                  <th className="px-2 py-2 w-[70px] text-right">Lead Time</th>
                  <th className="px-2 py-2 w-[130px]">Remarks</th>
                  <th className="px-2 py-2 w-[70px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row, idx) => (
                  <tr key={row._key} className="border-t border-border-theme hover:bg-surface-secondary/50">
                    <td className="px-2 py-1.5">
                      <Select
                        options={products}
                        value={row.product_id}
                        onChange={(val) => handleDetailChange(row._key, 'product_id', val ?? '')}
                        placeholder="Select product"
                        className="text-[11px]"
                        isSearchable
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={String(row.quantity)}
                        disabled
                        className="text-[11px] text-right bg-surface-secondary"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleDetailChange(row._key, 'quantity', e.target.value)}
                        className="text-[11px] text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row.unit_price}
                        onChange={(e) => handleDetailChange(row._key, 'unit_price', e.target.value === '' ? 0 : e.target.value)}
                        className="text-[11px] text-right"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={Number(row.amount).toFixed(2)}
                        disabled
                        className="text-[11px] text-right font-bold"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        value={row.delivery_time_days ?? ''}
                        onChange={(e) => handleDetailChange(row._key, 'delivery_time_days', e.target.value === '' ? null : Number(e.target.value))}
                        className="text-[11px] text-right"
                        placeholder="Days"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.remarks ?? ''}
                        onChange={(e) => handleDetailChange(row._key, 'remarks', e.target.value)}
                        className="text-[11px]"
                        placeholder="Remarks"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">
                      {idx === details.length - 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addRow}
                          className="h-7 w-7 p-0 text-primary-600 hover:bg-primary-50 inline-flex"
                          title="Add item"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {details.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row._key)}
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 inline-flex"
                          title="Remove item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </Modal>
      <ToastComponent />
    </>
  );
}
