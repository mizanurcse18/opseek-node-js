import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Save, Package, FileText, Plus, Warehouse } from 'lucide-react';
import { purchaseOrderService } from '@/lib/scm/api/purchase-order.service';
import { goodsReceiptService, GoodsReceiptDetail } from '@/lib/scm/api/goods-receipt.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { cn } from '@/lib/utils';

interface CreateGRNFromPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  poId: number | null;
}

interface ReceivableItem {
  _key: number;
  po_detail_id: number;
  product_id: number;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
}

let _nextKey = 1;

export function CreateGRNFromPOModal({ isOpen, onClose, onSave, poId }: CreateGRNFromPOModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [poData, setPoData] = useState<any>(null);
  const [items, setItems] = useState<ReceivableItem[]>([]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    if (!isOpen || !poId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await purchaseOrderService.getById(poId);
        const po = res?.data ?? res;
        setPoData(po);

        if (po?.details && Array.isArray(po.details)) {
          setItems(po.details.map((det: any) => ({
            _key: _nextKey++,
            po_detail_id: det.po_detail_id ?? 0,
            product_id: det.product_id ?? 0,
            product_name: det.product_name ?? '',
            quantity_ordered: Number(det.quantity ?? 0),
            quantity_received: Number(det.quantity ?? 0), // default: receive full qty
            unit_price: Number(det.unit_price ?? 0),
            total_price: Number(det.total_price ?? 0),
          })));
        }

        // Reset invoice fields
        setInvoiceNo('');
        setInvoiceDate(new Date().toISOString().slice(0, 10));
        setRemarks('');
      } catch (err) {
        console.error('Failed to load PO details:', err);
        toast({ title: 'Error', description: 'Failed to load purchase order details.', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, poId]);

  const updateReceivedQty = (key: number, value: string) => {
    setItems(prev => prev.map(item => {
      if (item._key !== key) return item;
      const qty = Math.min(Number(value) || 0, item.quantity_ordered);
      return { ...item, quantity_received: qty, total_price: qty * item.unit_price };
    }));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.total_price, 0);
  const hasItems = items.some(i => i.quantity_received > 0);

  const handleSubmit = async () => {
    if (!hasItems) {
      toast({ title: 'Validation Error', description: 'Please enter received quantity for at least one item.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const details: GoodsReceiptDetail[] = items
        .filter(item => item.quantity_received > 0)
        .map(item => ({
          grn_detail_id: 0,
          po_detail_id: item.po_detail_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_ordered: item.quantity_ordered,
          quantity_received: item.quantity_received,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

      const payload = {
        grn_id: 0,
        grn_no: 'Auto',
        po_id: poId!,
        po_no: poData?.po_no ?? '',
        supplier_id: poData?.supplier_id ?? 0,
        supplier_name: poData?.supplier_name ?? '',
        warehouse_id: poData?.warehouse_id ?? 0,
        warehouse_name: poData?.warehouse_name ?? '',
        grn_date: new Date().toISOString().slice(0, 10),
        invoice_no: invoiceNo || undefined,
        invoice_date: invoiceDate ? new Date(invoiceDate).toISOString() : undefined,
        total_amount: totalAmount,
        status: 2, // Auto-complete (2=Completed) to trigger stock + ledger posting
        remarks: remarks,
        details,
      };

      const res = await goodsReceiptService.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Goods received successfully. Stock and ledger updated.', status: 'success' });
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
          <Package className="h-5 w-5 text-primary-600" />
          <span>Receive Goods — {poData?.po_no || 'Purchase Order'}</span>
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
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Receive Goods</span>
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
      ) : poData ? (
        <div className="space-y-6">
          {/* PO Info Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-surface-secondary rounded-lg">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Purchase Order</label>
              <p className="text-sm font-bold text-text-main mt-1">{poData.po_no || '—'}</p>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Supplier</label>
              <p className="text-sm font-bold text-text-main mt-1">{poData.supplier_name || `#${poData.supplier_id}`}</p>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Warehouse</label>
              <p className="text-sm font-bold text-text-main mt-1 flex items-center gap-1.5">
                <Warehouse className="h-3.5 w-3.5 text-text-muted" />
                {poData.warehouse_name || `#${poData.warehouse_id}`}
              </p>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</label>
              <p className="text-sm font-bold text-text-main mt-1">
                {poData.po_date ? new Date(poData.po_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Invoice No</label>
              <Input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Supplier invoice number"
                className="text-[12px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Invoice Date</label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="text-[12px]"
              />
            </div>
          </div>

          {/* Items Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Line Items
              </label>
            </div>

            <div className="overflow-x-auto border border-border-theme rounded-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-secondary text-[9px] font-black uppercase tracking-widest text-text-muted">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right w-24">Ordered Qty</th>
                    <th className="px-3 py-2 text-right w-28">Receive Qty</th>
                    <th className="px-3 py-2 text-right w-24">Unit Price</th>
                    <th className="px-3 py-2 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item._key} className={cn(
                      "border-t border-border-theme hover:bg-surface-secondary/50 transition-colors",
                      item.quantity_received > 0 ? "bg-primary-500/5" : "opacity-70"
                    )}>
                      <td className="px-3 py-1.5">
                        <span className="text-[11px] font-mono font-bold text-text-muted">{idx + 1}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-[11px] font-bold text-text-main">{item.product_name || `Product #${item.product_id}`}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <span className="text-[11px] font-medium text-text-muted">{item.quantity_ordered}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity_ordered}
                          step="any"
                          value={item.quantity_received}
                          onChange={(e) => updateReceivedQty(item._key, e.target.value)}
                          className="text-[11px] text-right w-24 h-8 ml-auto"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <span className="text-[11px] font-mono font-bold">{Number(item.unit_price).toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <span className="text-[11px] font-mono font-bold">{item.total_price.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-theme bg-surface-secondary/50">
                    <td colSpan={5} className="px-3 py-2 text-right text-[11px] font-black uppercase tracking-widest text-text-muted">
                      Total Amount
                    </td>
                    <td className="px-3 py-2 text-right">
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
          <p>Purchase order not found.</p>
        </div>
      )}
    </Modal>
      <ToastComponent />
    </>
  );
}
