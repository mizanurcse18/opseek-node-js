import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/select';
import { Loader } from '@/components/ui/Loader';
import { Save, Plus, Trash2 } from 'lucide-react';
import { salesService } from '@/lib/scm/api/sales.service';
import { productService, parseComboResponse } from '@/lib/scm/api/product.service';
import { warehouseService } from '@/lib/scm/api/warehouse.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
  isSuperUser?: boolean;
  preselectedCompanyId?: string;
}

interface DetailRow {
  _key: number;
  sales_detail_id?: number;
  product_id: number | string;
  product_name?: string;
  quantity: number | string;
  unit_price: number | string;
  vat_amount: number | string;
  tax_amount: number | string;
  total_price: number | string;
}

let _nextKey = 1;
const newRow = (): DetailRow => ({
  _key: _nextKey++,
  sales_detail_id: 0,
  product_id: '',
  quantity: 1,
  unit_price: 0,
  vat_amount: 0,
  tax_amount: 0,
  total_price: 0,
});

export function SalesModal({ isOpen, onClose, onSave, initialData, isSuperUser, preselectedCompanyId }: SalesModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    sales_id: 0,
    sales_no: 'Auto',
    customer_id: '',
    warehouse_id: '',
    sales_date: new Date().toISOString().slice(0, 10),
    total_amount: 0,
    status: 0,
    remarks: '',
  });
  const [details, setDetails] = useState<DetailRow[]>([newRow()]);

  const [customers, setCustomers] = useState<{ value: string | number; label: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ value: string | number; label: string }[]>([]);
  const [products, setProducts] = useState<{ value: string | number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  const isEditing = !!(initialData?.sales_id ?? initialData?.id);

  useEffect(() => {
    if (!isOpen) return;
    const loadCombos = async () => {
      setLoading(true);
      try {
        const [custRes, whRes, prodRes] = await Promise.all([
          salesService.getCustomerCombo(preselectedCompanyId),
          warehouseService.getWarehouseCombo(),
          productService.getAllProducts(),
        ]);

        const custData = custRes?.data ?? custRes;
        setCustomers(Array.isArray(custData) ? custData : []);

        setWarehouses(Array.isArray(whRes) ? whRes : []);

        const prodData = prodRes?.data ?? prodRes ?? [];
        const prodList = Array.isArray(prodData) ? prodData : [];
        setProducts(prodList.map((p: any) => ({
          value: p.product_id ?? p.id,
          label: p.product_name ?? String(p.product_id ?? ''),
        })));
      } catch (err) {
        console.error('Failed to load combos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCombos();
  }, [isOpen, preselectedCompanyId]);

  useEffect(() => {
    if (isOpen && initialData) {
      const d = initialData;
      setFormData({
        sales_id: d.sales_id ?? 0,
        sales_no: d.sales_no ?? 'Auto',
        customer_id: d.customer_id ?? '',
        warehouse_id: d.warehouse_id ?? '',
        sales_date: d.sales_date ? d.sales_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        total_amount: Number(d.total_amount ?? 0),
        status: d.status ?? 0,
        remarks: d.remarks ?? '',
      });
      if (d.details && Array.isArray(d.details)) {
        setDetails(d.details.map((det: any) => ({
          _key: _nextKey++,
          sales_detail_id: det.sales_detail_id,
          product_id: det.product_id ?? '',
          product_name: det.product_name ?? '',
          quantity: det.quantity ?? 1,
          unit_price: det.unit_price ?? 0,
          vat_amount: det.vat_amount ?? 0,
          tax_amount: det.tax_amount ?? 0,
          total_price: det.total_price ?? 0,
        })));
      }
    } else if (isOpen && !initialData) {
      setFormData({
        sales_id: 0,
        sales_no: 'Auto',
        customer_id: '',
        warehouse_id: '',
        sales_date: new Date().toISOString().slice(0, 10),
        total_amount: 0,
        status: 0,
        remarks: '',
      });
      setDetails([newRow()]);
    }
  }, [isOpen, initialData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calcRowTotal = (qty: number, price: number, vat: number, tax: number) => {
    const subtotal = qty * price;
    return subtotal + vat + tax;
  };

  const handleDetailChange = (key: number, field: string, value: any) => {
    setDetails(prev => {
      const updated = prev.map(d => {
        if (d._key !== key) return d;
        const next = { ...d, [field]: value };

        if (['quantity', 'unit_price', 'vat_amount', 'tax_amount'].includes(field)) {
          const qty = Number(next.quantity || 0);
          const price = Number(next.unit_price || 0);
          const vat = Number(next.vat_amount || 0);
          const tax = Number(next.tax_amount || 0);
          next.total_price = calcRowTotal(qty, price, vat, tax);
        }

        return next;
      });

      const total = updated.reduce((sum, d) => sum + Number(d.total_price || 0), 0);
      setFormData(prev => ({ ...prev, total_amount: total }));

      return updated;
    });
  };

  const addRow = () => {
    setDetails(prev => [...prev, newRow()]);
  };

  const removeRow = (key: number) => {
    setDetails(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter(d => d._key !== key);
      const total = updated.reduce((sum, d) => sum + Number(d.total_price || 0), 0);
      setFormData(prev => ({ ...prev, total_amount: total }));
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      toast({ title: 'Validation Error', description: 'Please select a customer.', status: 'error' });
      return;
    }
    if (!formData.warehouse_id) {
      toast({ title: 'Validation Error', description: 'Please select a warehouse.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        sales_no: formData.sales_no,
        customer_id: Number(formData.customer_id),
        warehouse_id: Number(formData.warehouse_id),
        details: details.map(d => ({
          sales_detail_id: (d as any).sales_detail_id ?? 0,
          product_id: Number(d.product_id),
          quantity: Number(d.quantity),
          unit_price: Number(d.unit_price),
          vat_amount: Number(d.vat_amount || 0),
          tax_amount: Number(d.tax_amount || 0),
          total_price: Number(d.total_price),
        })),
      };

      const res = await salesService.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: isEditing ? 'Sales order updated.' : 'Sales order created.', status: 'success' });
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
          <span>{isEditing ? 'Edit Sales Order' : 'New Sales Order'}</span>
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
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sales No</label>
            <Input
              value={formData.sales_no}
              onChange={(e) => handleFieldChange('sales_no', e.target.value)}
              placeholder="Auto"
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Date</label>
            <Input
              type="date"
              value={formData.sales_date}
              onChange={(e) => handleFieldChange('sales_date', e.target.value)}
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Customer <span className="text-red-500">*</span></label>
            <Select
              options={customers}
              value={formData.customer_id}
              onChange={(val) => handleFieldChange('customer_id', val ?? '')}
              placeholder="Select customer"
              className="text-[12px]"
              isSearchable
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Warehouse <span className="text-red-500">*</span></label>
            <Select
              options={warehouses}
              value={formData.warehouse_id}
              onChange={(val) => handleFieldChange('warehouse_id', val ?? '')}
              placeholder="Select warehouse"
              className="text-[12px]"
            />
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Amount</label>
            <Input
              value={Number(formData.total_amount).toFixed(2)}
              disabled
              className="text-[12px] font-bold"
            />
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
        </div>

        {/* Details Section */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block">Line Items</label>

          <div className="overflow-x-auto border border-border-theme rounded-lg">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-secondary text-[9px] font-black uppercase tracking-widest text-text-muted">
                  <th className="px-2 py-2 w-[180px]">Product</th>
                  <th className="px-2 py-2 w-[70px] text-right">Qty</th>
                  <th className="px-2 py-2 w-[90px] text-right">Unit Price</th>
                  <th className="px-2 py-2 w-[70px] text-right">VAT</th>
                  <th className="px-2 py-2 w-[70px] text-right">Tax</th>
                  <th className="px-2 py-2 w-[90px] text-right">Total</th>
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
                        type="number"
                        min={0}
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleDetailChange(row._key, 'quantity', e.target.value === '' ? 0 : e.target.value)}
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
                        type="number"
                        min={0}
                        step="any"
                        value={row.vat_amount}
                        onChange={(e) => handleDetailChange(row._key, 'vat_amount', e.target.value === '' ? 0 : e.target.value)}
                        className="text-[11px] text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row.tax_amount}
                        onChange={(e) => handleDetailChange(row._key, 'tax_amount', e.target.value === '' ? 0 : e.target.value)}
                        className="text-[11px] text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={Number(row.total_price).toFixed(2)}
                        disabled
                        className="text-[11px] text-right font-bold"
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
