import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import { Loader } from '@/components/ui/Loader';
import { Save, ShoppingCart, CheckSquare, Square, Warehouse } from 'lucide-react';
import { purchaseQuotationService } from '@/lib/scm/api/purchase-quotation.service';
import { warehouseService } from '@/lib/scm/api/warehouse.service';
import { purchaseOrderService, PurchaseOrderDetail } from '@/lib/scm/api/purchase-order.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { cn } from '@/lib/utils';

interface CreatePOFromPQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  quotationId: number | null;
}

interface SelectableItem {
  _key: number;
  quotation_detail_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  selected: boolean;
}

let _nextKey = 1;

export function CreatePOFromPQModal({ isOpen, onClose, onSave, quotationId }: CreatePOFromPQModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pqData, setPqData] = useState<any>(null);
  const [items, setItems] = useState<SelectableItem[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | number>('');
  const [warehouses, setWarehouses] = useState<{ value: string | number; label: string }[]>([]);
  const [remarks, setRemarks] = useState('');

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    if (!isOpen || !quotationId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [pqRes, whRes] = await Promise.all([
          purchaseQuotationService.getById(quotationId),
          warehouseService.getWarehouseCombo(),
        ]);

        const pq = pqRes?.data ?? pqRes;
        setPqData(pq);

        setWarehouses(Array.isArray(whRes) ? whRes : []);

        if (pq?.details && Array.isArray(pq.details)) {
          setItems(pq.details.map((det: any) => ({
            _key: _nextKey++,
            quotation_detail_id: det.quotation_detail_id ?? 0,
            product_id: det.product_id ?? 0,
            product_name: det.product_name ?? '',
            quantity: Number(det.quantity ?? 0),
            unit_price: Number(det.unit_price ?? 0),
            amount: Number(det.amount ?? 0),
            selected: true,
          })));
        }
      } catch (err) {
        console.error('Failed to load PQ details:', err);
        toast({ title: 'Error', description: 'Failed to load quotation details.', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, quotationId]);

  const toggleItem = (key: number) => {
    setItems(prev => prev.map(item =>
      item._key === key ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateQuantity = (key: number, value: string) => {
    setItems(prev => prev.map(item => {
      if (item._key !== key) return item;
      const qty = Number(value) || 0;
      return { ...item, quantity: qty, amount: qty * item.unit_price };
    }));
  };

  const selectedItems = items.filter(i => i.selected);
  const totalAmount = selectedItems.reduce((sum, i) => sum + i.amount, 0);

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast({ title: 'Validation Error', description: 'Please select a warehouse.', status: 'error' });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: 'Validation Error', description: 'Please select at least one item.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const details: PurchaseOrderDetail[] = selectedItems.map(item => ({
        po_detail_id: 0,
        product_id: item.product_id,
        warehouse_id: warehouseId,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_amount: 0,
        tax_amount: 0,
        total_price: item.amount,
      }));

      const payload = {
        po_id: 0,
        po_no: 'Auto',
        quotation_id: quotationId!,
        supplier_id: pqData?.supplier_id ?? 0,
        warehouse_id: Number(warehouseId),
        po_date: new Date().toISOString().slice(0, 10),
        total_amount: totalAmount,
        status: 0,
        remarks: remarks,
        details,
      };

      const res = await purchaseOrderService.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Purchase Order created successfully.', status: 'success' });
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
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-primary-600" />
          <span>Create Purchase Order from Quotation</span>
        </div>
      }
      headerAction={
        <div className="flex items-center gap-3 pr-2">
          <Button
            type="button"
            disabled={saving || loading}
            onClick={handleSubmit}
            className="bg-[#2e125c] hover:bg-[#3d187a] text-white flex items-center gap-2 py-1.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {saving ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Creating...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Create PO</span>
              </>
            )}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : pqData ? (
        <div className="space-y-6">
          {/* PQ Info Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface-secondary rounded-lg">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Quotation</label>
              <p className="text-sm font-bold text-text-main mt-1">{pqData.quotation_no || '—'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Supplier</label>
              <p className="text-sm font-bold text-text-main mt-1">{pqData.supplier_name || `#${pqData.supplier_id}`}</p>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</label>
              <p className="text-sm font-bold text-text-main mt-1">
                {pqData.quotation_date ? new Date(pqData.quotation_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Warehouse className="h-3.5 w-3.5" />
              Warehouse <span className="text-red-500">*</span>
            </label>
            <Select
              options={warehouses}
              value={warehouseId || null}
              onChange={(val) => setWarehouseId(val ?? '')}
              placeholder="Select warehouse"
              className="w-full"
            />
          </div>

          {/* Items Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Line Items <span className="text-text-muted/50">({selectedItems.length} of {items.length} selected)</span>
              </label>
            </div>

            <div className="overflow-x-auto border border-border-theme rounded-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-secondary text-[9px] font-black uppercase tracking-widest text-text-muted">
                    <th className="px-2 py-2 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = items.every(i => i.selected);
                          setItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
                        }}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {items.every(i => i.selected) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2 text-right w-20">PQ Qty</th>
                    <th className="px-2 py-2 text-right w-24">Order Qty</th>
                    <th className="px-2 py-2 text-right w-24">Unit Price</th>
                    <th className="px-2 py-2 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item._key} className={cn(
                      "border-t border-border-theme hover:bg-surface-secondary/50 transition-colors",
                      item.selected ? "bg-primary-500/5" : "opacity-60"
                    )}>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleItem(item._key)}
                          className="hover:text-primary-600 transition-colors"
                        >
                          {item.selected ? (
                            <CheckSquare className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Square className="h-4 w-4 text-text-muted" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-[11px] font-bold text-text-main">{item.product_name || `Product #${item.product_id}`}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="text-[11px] font-medium text-text-muted">{item.quantity}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item._key, e.target.value)}
                          disabled={!item.selected}
                          className="text-[11px] text-right w-20 h-8 ml-auto"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="text-[11px] font-mono font-bold">{Number(item.unit_price).toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="text-[11px] font-mono font-bold">{item.amount.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-theme bg-surface-secondary/50">
                    <td colSpan={5} className="px-2 py-2 text-right text-[11px] font-black uppercase tracking-widest text-text-muted">
                      Total Amount
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className="text-[13px] font-mono font-bold text-primary-700">{totalAmount.toFixed(2)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-border-theme bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              placeholder="Optional notes..."
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <p>Quotation not found.</p>
        </div>
      )}
    </Modal>
      <ToastComponent />
    </>
  );
}
