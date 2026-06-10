import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { handleApiError } from '@/lib/error-handler';
import { dsrService } from '@/lib/sales/api/dsr.service';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { Edit2, Trash2, Plus, Eye, Trash, Calendar, ShoppingCart, User, Tag, PlusCircle } from 'lucide-react';

interface SalesLine {
  product_id: number;
  qty: number;
  price: number;
}

export default function DsrDailySalesPage({ isSuperUser = false }: { isSuperUser?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [dsrUserId, setDsrUserId] = useState<number>(0);
  const [stakeholderId, setStakeholderId] = useState<number>(0);
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesLines, setSalesLines] = useState<SalesLine[]>([
    { product_id: 0, qty: 1, price: 0 }
  ]);

  const [dsrOptions, setDsrOptions] = useState<{ value: number; label: string }[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value: number; label: string }[]>([]);
  const [productOptions, setProductOptions] = useState<{ value: number; label: string; price: number }[]>([]);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Sale' },
    { button_id: 'btnDelete', button_title: 'Delete Sale' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  useEffect(() => {
    const loadCombos = async () => {
      try {
        const [dsrs, customers, products] = await Promise.all([
          dsrService.getDsrCombo(),
          dsrService.getCustomerCombo(),
          dsrService.getProductCombo()
        ]);
        setDsrOptions(dsrs);
        setCustomerOptions(customers);
        setProductOptions(products);
      } catch (err) {
        console.error('Failed to load combos:', err);
      }
    };
    loadCombos();
  }, []);

  const totalSalesAmount = useMemo(() => {
    return salesLines.reduce((sum, line) => sum + (line.qty * line.price), 0);
  }, [salesLines]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setDsrUserId(0);
    setStakeholderId(0);
    setSalesDate(new Date().toISOString().split('T')[0]);
    setSalesLines([{ product_id: 0, qty: 1, price: 0 }]);
  };

  const handleAddLine = () => {
    setSalesLines(prev => [...prev, { product_id: 0, qty: 1, price: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (salesLines.length <= 1) return;
    setSalesLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, key: keyof SalesLine, value: any) => {
    setSalesLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      const updated = { ...line, [key]: value };
      if (key === 'product_id') {
        const product = productOptions.find(p => p.value === Number(value));
        updated.price = product ? product.price : 0;
      }
      return updated;
    }));
  };

  const handleViewDetails = async (record: any) => {
    try {
      const resp = await dsrService.dailySales.getById(record.sales_id || record.id);
      setSelectedRecord(resp?.data || record);
      setIsDetailOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load sales details.', status: 'error' });
    }
  };

  const handleSave = async () => {
    if (!dsrUserId || !stakeholderId || totalSalesAmount <= 0) {
      toast({ title: 'Validation Error', description: 'Please fill out all required fields and ensure total amount is greater than 0.', status: 'error' });
      return;
    }

    const invalidLine = salesLines.find(l => l.product_id === 0 || l.qty <= 0 || l.price < 0);
    if (invalidLine) {
      toast({ title: 'Validation Error', description: 'All detail lines must have a valid product and positive quantity.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sales_id: selectedRecord?.sales_id || 0,
        dsr_user_id: dsrUserId,
        stakeholder_id: stakeholderId,
        sales_date: new Date(salesDate).toISOString(),
        total_amount: totalSalesAmount,
        details: salesLines.map(l => ({
          product_id: l.product_id,
          qty: l.qty,
          price: l.price
        }))
      };

      const res = await dsrService.dailySales.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Sale saved successfully.', status: 'success' });
        handleCloseModal();
        setRefreshKey(prev => prev + 1);
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const id = itemToDelete.sales_id || itemToDelete.id;
      const res = await dsrService.dailySales.delete(id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Sales record deleted.', status: 'success' });
        setItemToDelete(null);
        setRefreshKey(prev => prev + 1);
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const fetchDataFn = useCallback((params: any) => {
    return dsrService.dailySales.getGrid(params, isSuperUser);
  }, [isSuperUser]);

  const columns: Column[] = useMemo(() => [
    {
      header: 'SL',
      accessor: 'autogenrownum',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-mono text-[10px] font-bold bg-content-bg px-2 py-1 rounded text-text-main">{row.autogenrownum}</span>
      )
    },
    {
      header: 'DSR Agent',
      accessor: 'dsr_name',
      sortable: true,
      searchable: true,
      searchFieldName: 'dsr_name',
      render: (val: any, row: any) => (
        <span className="font-bold text-text-main">{val || row.dsr_user_id || 'DSR Agent'}</span>
      )
    },
    {
      header: 'Customer',
      accessor: 'stakeholder_name',
      sortable: true,
      searchable: true,
      searchFieldName: 'stakeholder_name',
      render: (val: any, row: any) => <span className="font-semibold text-text-main">{val || row.stakeholder_id || '—'}</span>
    },
    {
      header: 'Sale Date',
      accessor: 'sales_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Total Sale',
      accessor: 'total_amount',
      sortable: true,
      render: (val: any) => (
        <span className="font-mono font-bold text-[12px] text-text-main">
          {val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row)}
            className="h-8 w-8 p-0 text-primary-500 hover:bg-primary-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {btnDelete?.visible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemToDelete(row)}
              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [btnDelete]);

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'DSR Daily Sales'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Review daily field invoicing, sales totals, and products shipped by sales reps.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search sales records..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">New Sale</span>
              </Button>
            )}
          </>
        )}
      />

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Record Daily Sales Entry"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">DSR Agent</Label>
              <Select
                value={dsrUserId ? String(dsrUserId) : undefined}
                onValueChange={(val) => setDsrUserId(Number(val || 0))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select DSR Agent" />
                </SelectTrigger>
                <SelectContent>
                  {dsrOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Customer</Label>
              <Select
                value={stakeholderId ? String(stakeholderId) : undefined}
                onValueChange={(val) => setStakeholderId(Number(val || 0))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Sale Date</Label>
              <Input
                type="date"
                value={salesDate}
                onChange={(e) => setSalesDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/2">Product</th>
                  <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/6">Qty</th>
                  <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/6">Price</th>
                  <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/6">Total</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {salesLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2">
                      <Select
                        value={line.product_id ? String(line.product_id) : undefined}
                        onValueChange={(val) => handleLineChange(idx, 'product_id', Number(val || 0))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productOptions.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="1"
                        value={line.qty || ''}
                        onChange={(e) => handleLineChange(idx, 'qty', Number(e.target.value || 0))}
                        className="h-9 font-mono text-xs font-bold text-right border-slate-200 rounded-xl"
                        placeholder="1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.price || ''}
                        onChange={(e) => handleLineChange(idx, 'price', Number(e.target.value || 0))}
                        className="h-9 font-mono text-xs font-bold text-right border-slate-200 rounded-xl"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-xs text-text-main">
                      {((line.qty || 0) * (line.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemoveLine(idx)}
                        disabled={salesLines.length <= 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-mono text-xs font-bold text-slate-800">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right">Total Amount:</td>
                  <td className="px-4 py-3 text-right text-primary-600">
                    {totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-left">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddLine}
                      className="h-7 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add Row
                    </Button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || totalSalesAmount <= 0}
              isLoading={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm px-6"
            >
              Save Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      {selectedRecord && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setSelectedRecord(null); }}
          title="Daily Sale Details"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Agent</span>
                <span className="text-xs font-bold text-slate-800">{selectedRecord.dsr_name || selectedRecord.dsr_user_id}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Date</span>
                <span className="text-xs font-bold text-slate-800">{new Date(selectedRecord.sales_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Customer</span>
                <span className="text-xs font-bold text-slate-800">{selectedRecord.stakeholder_name}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Total Bill</span>
                <span className="text-xs font-bold text-slate-800">
                  {Number(selectedRecord.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Product</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Qty</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 font-mono text-[11px] font-semibold text-slate-700">
                  {(selectedRecord.details || []).map((line: any, idx: number) => {
                    const product = productOptions.find(p => p.value === line.product_id);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 truncate max-w-[200px]">{product ? product.label : `Product #${line.product_id}`}</td>
                        <td className="px-4 py-2 text-right">{line.qty}</td>
                        <td className="px-4 py-2 text-right">
                          {Number(line.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Sales Record"
        description="Are you sure you want to delete this daily sales record? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
