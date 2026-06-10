import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/ui/Loader';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { purchaseRequisitionService, type PurchaseRequisitionDetail } from '@/lib/scm/api/purchase-requisition.service';
import { warehouseService } from '@/lib/scm/api/warehouse.service';
import { productService, parseComboResponse } from '@/lib/scm/api/product.service';
import { unitService } from '@/lib/scm/api/product.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { cn } from '@/lib/utils';

interface PurchaseRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
  isSuperUser?: boolean;
}

interface DetailRow extends PurchaseRequisitionDetail {
  _key: number;
}

let _nextKey = 1;
const newRow = (): DetailRow => ({
  _key: _nextKey++,
  product_id: '',
  description: '',
  uom: '',
  quantity: 1,
  price: null,
  amount: null,
  remarks: '',
});

export function PurchaseRequisitionModal({ isOpen, onClose, onSave, initialData, isSuperUser }: PurchaseRequisitionModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    requisition_id: 0,
    requisition_no: 'Auto',
    requisition_date: new Date().toISOString().slice(0, 10),
    warehouse_id: '',
    remarks: '',
    total_amount: 0,
  });
  const [details, setDetails] = useState<DetailRow[]>([newRow()]);

  const [warehouses, setWarehouses] = useState<{ value: string | number; label: string }[]>([]);
  const [products, setProducts] = useState<{ value: string | number; label: string }[]>([]);
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});

  const { toast, ToastComponent } = useToast();

  const isEditing = !!(initialData?.requisition_id ?? initialData?.id);

  const [validationErrors, setValidationErrors] = useState<{
    warehouse?: string;
    rows?: Record<number, { product?: string; quantity?: string; price?: string }>;
    footer?: string;
  }>({});

  const [showValidation, setShowValidation] = useState(false);

  const validate = useCallback(() => {
    const errors: Record<string, any> = {};
    const rowErrors: Record<number, any> = {};

    if (!formData.warehouse_id || formData.warehouse_id === '') {
      errors.warehouse = 'Warehouse is required';
    }

    let hasValidProduct = false;

    details.forEach(row => {
      const re: Record<string, string> = {};
      if (!row.product_id || row.product_id === '') {
        re.product = 'Product is required';
      } else {
        hasValidProduct = true;
      }
      if (!row.quantity || Number(row.quantity) <= 0) {
        re.quantity = 'Qty is required';
      }
      if (row.price === null || row.price === '' || Number(row.price) <= 0) {
        re.price = 'Price is required';
      }
      if (Object.keys(re).length > 0) {
        rowErrors[row._key] = re;
      }
    });

    if (!hasValidProduct) {
      errors.footer = 'Select at least one product to continue';
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.rows = rowErrors;
    }

    setValidationErrors(errors);
    setShowValidation(true);
    return Object.keys(errors).length === 0;
  }, [formData.warehouse_id, details]);

  useEffect(() => {
    if (!isOpen) return;
    const loadCombos = async () => {
      setLoading(true);
      try {
        const [whRes, prodRes, unitRes] = await Promise.all([
          warehouseService.getWarehouseCombo(isSuperUser),
          productService.getAllProducts(),
          unitService.getCombo(),
        ]);

        setWarehouses(Array.isArray(whRes) ? whRes : []);

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

        const uData = parseComboResponse(unitRes);
        const uMap: Record<string, string> = {};
        uData.forEach((u: any) => { uMap[u.value] = u.label; });
        setUnitMap(uMap);
      } catch (err) {
        console.error('Failed to load combos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCombos();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      setShowValidation(false);
      setValidationErrors({});
      const d = initialData;
      setFormData({
        requisition_id: d.requisition_id ?? 0,
        requisition_no: d.requisition_no ?? 'Auto',
        requisition_date: d.requisition_date ? d.requisition_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        warehouse_id: d.warehouse_id ?? '',
        remarks: d.remarks ?? '',
        total_amount: Number(d.total_amount ?? 0),
      });
      if (d.details && Array.isArray(d.details)) {
        setDetails(d.details.map((det: any) => ({
          _key: _nextKey++,
          requisition_detail_id: det.requisition_detail_id,
          product_id: det.product_id ?? '',
          description: det.description ?? '',
          uom: det.uom ?? '',
          quantity: det.quantity ?? 1,
          price: det.price ?? null,
          amount: det.amount ?? null,
          remarks: det.remarks ?? '',
        })));
      } else {
        setDetails([newRow()]);
      }
    } else if (isOpen && !initialData) {
      setShowValidation(false);
      setValidationErrors({});
      setFormData({
        requisition_id: 0,
        requisition_no: 'Auto',
        requisition_date: new Date().toISOString().slice(0, 10),
        warehouse_id: '',
        remarks: '',
        total_amount: 0,
      });
      setDetails([newRow()]);
    }
  }, [isOpen, initialData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (key: number, field: string, value: any) => {
    setDetails(prev => {
      const updated = prev.map(d => {
        if (d._key !== key) return d;
        const next = { ...d, [field]: value };

        if (field === 'product_id') {
          const prod = productMap[value];
          if (prod) {
            next.description = prod.description ?? '';
            next.uom = prod.unit_id ?? '';
            next.price = prod.purchase_price != null ? Number(prod.purchase_price) : null;
          }
        }

        if (field === 'product_id' || field === 'quantity' || field === 'price') {
          const qty = Number(next.quantity || 0);
          const price = Number(next.price || 0);
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
    setDetails(prev => [...prev, newRow()]);
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
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        requisition_no: formData.requisition_no,
        warehouse_id: Number(formData.warehouse_id),
        details: details.map(d => ({
          requisition_detail_id: (d as any).requisition_detail_id ?? 0,
          product_id: Number(d.product_id),
          description: d.description ?? '',
          uom: Number(d.uom),
          quantity: Number(d.quantity),
          price: d.price !== null && d.price !== '' ? Number(d.price) : null,
          amount: d.amount !== null && d.amount !== '' ? Number(d.amount) : null,
          remarks: d.remarks ?? '',
        })),
      };

      const res = await purchaseRequisitionService.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: isEditing ? 'Requisition updated.' : 'Requisition created.', status: 'success' });
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
          <span>{isEditing ? 'Edit Requisition' : 'New Requisition'}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Req No</label>
            <Input
              value={formData.requisition_no}
              onChange={(e) => handleFieldChange('requisition_no', e.target.value)}
              placeholder="Auto"
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Date</label>
            <Input
              type="date"
              value={formData.requisition_date}
              onChange={(e) => handleFieldChange('requisition_date', e.target.value)}
              className="text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Warehouse
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Select
              options={warehouses}
              value={formData.warehouse_id}
              onChange={(val) => handleFieldChange('warehouse_id', val ?? '')}
              placeholder="Select warehouse"
              className="text-[12px]"
              error={showValidation && !!validationErrors.warehouse}
            />
            {showValidation && validationErrors.warehouse && (
              <span className="text-[10px] text-red-500 font-medium mt-0.5 block">{validationErrors.warehouse}</span>
            )}
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
                  <th className="px-2 py-2 w-[180px]">Product <span className="text-red-500">*</span></th>
                  <th className="px-2 py-2 w-[160px]">Description</th>
                  <th className="px-2 py-2 w-[60px]">UOM</th>
                  <th className="px-2 py-2 w-[130px] text-right">Qty <span className="text-red-500">*</span></th>
                  <th className="px-2 py-2 w-[170px] text-right">Price <span className="text-red-500">*</span></th>
                  <th className="px-2 py-2 w-[130px] text-right">Amount</th>
                  <th className="px-2 py-2 w-[130px]">Remarks</th>
                  <th className="px-2 py-2 w-[70px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row, idx) => {
                  const rowErr = showValidation ? validationErrors.rows?.[row._key] : undefined;
                  return (
                  <tr key={row._key} className={cn("border-t border-border-theme hover:bg-surface-secondary/50", rowErr && "bg-red-50/30")}>
                    <td className="px-2 py-1.5">
                      <Select
                        options={products}
                        value={row.product_id}
                        onChange={(val) => handleDetailChange(row._key, 'product_id', val ?? '')}
                        placeholder="Select product"
                        className={cn("text-[11px]", rowErr?.product && "border-red-500")}
                        isSearchable
                        error={!!rowErr?.product}
                      />
                      {rowErr?.product && <span className="text-[9px] text-red-500 font-medium mt-0.5 block">{rowErr.product}</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.description ?? ''}
                        onChange={(e) => handleDetailChange(row._key, 'description', e.target.value)}
                        className="h-8 py-1 px-2 text-[11px]"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        options={Object.entries(unitMap).map(([val, label]) => ({ value: val, label }))}
                        value={row.uom}
                        onChange={(val) => handleDetailChange(row._key, 'uom', val ?? '')}
                        placeholder="UOM"
                        className="text-[11px]"
                        isSearchable={false}
                        disabled
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleDetailChange(row._key, 'quantity', e.target.value)}
                        className={cn("h-8 py-1 px-2 text-[11px] text-right", rowErr?.quantity && "border-red-500")}
                      />
                      {rowErr?.quantity && <span className="text-[10px] text-red-500 font-medium mt-0.5 block leading-tight">{rowErr.quantity}</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row.price ?? ''}
                        onChange={(e) => handleDetailChange(row._key, 'price', e.target.value === '' ? null : e.target.value)}
                        className={cn("h-8 py-1 px-2 text-[11px] text-right", rowErr?.price && "border-red-500")}
                        placeholder="0.00"
                      />
                      {rowErr?.price && <span className="text-[10px] text-red-500 font-medium mt-0.5 block leading-tight">{rowErr.price}</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.amount !== null ? Number(row.amount).toFixed(2) : ''}
                        disabled
                        className="h-8 py-1 px-2 text-[11px] text-right font-bold"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.remarks ?? ''}
                        onChange={(e) => handleDetailChange(row._key, 'remarks', e.target.value)}
                        className="h-8 py-1 px-2 text-[11px]"
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {showValidation && validationErrors.footer && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium text-red-700">{validationErrors.footer}</span>
            </div>
          )}
        </div>
      </div>

    </Modal>
      <ToastComponent />
    </>
  );
}
