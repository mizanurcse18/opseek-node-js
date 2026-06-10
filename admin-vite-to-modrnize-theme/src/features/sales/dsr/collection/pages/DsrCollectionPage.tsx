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
import { Edit2, Trash2, Plus, Calendar, DollarSign, User, ShieldCheck } from 'lucide-react';

interface DsrCollectionPageProps {
  isSuperUser?: boolean;
}

export default function DsrCollectionPage({ isSuperUser = false }: DsrCollectionPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [dsrUserId, setDsrUserId] = useState<number>(0);
  const [stakeholderId, setStakeholderId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');

  const [dsrOptions, setDsrOptions] = useState<{ value: number; label: string }[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value: number; label: string }[]>([]);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Collection' },
    { button_id: 'btnEdit', button_title: 'Edit Collection' },
    { button_id: 'btnDelete', button_title: 'Delete Collection' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  useEffect(() => {
    const loadCombos = async () => {
      try {
        const [dsrs, customers] = await Promise.all([
          dsrService.getDsrCombo(),
          dsrService.getCustomerCombo()
        ]);
        setDsrOptions(dsrs);
        setCustomerOptions(customers);
      } catch (err) {
        console.error('Failed to load combos:', err);
      }
    };
    loadCombos();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setDsrUserId(0);
    setStakeholderId(0);
    setAmount(0);
    setCollectionDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Cash');
    setReference('');
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setDsrUserId(record.dsr_user_id || record.dsrUserId);
    setStakeholderId(record.stakeholder_id || record.stakeholderId);
    setAmount(Number(record.amount || 0));
    setCollectionDate(record.collection_date ? new Date(record.collection_date).toISOString().split('T')[0] : '');
    setPaymentMethod(record.payment_method || 'Cash');
    setReference(record.reference || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!dsrUserId || !stakeholderId || amount <= 0) {
      toast({ title: 'Validation Error', description: 'Please fill out all required fields and ensure amount is greater than 0.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        collection_id: selectedRecord?.collection_id || 0,
        dsr_user_id: dsrUserId,
        stakeholder_id: stakeholderId,
        amount: amount,
        collection_date: new Date(collectionDate).toISOString(),
        payment_method: paymentMethod,
        reference: reference.trim()
      };

      const res = await dsrService.collection.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Collection details saved successfully.', status: 'success' });
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
      const res = await dsrService.collection.delete(itemToDelete.collection_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Collection record deleted successfully.', status: 'success' });
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
    return dsrService.collection.getGrid(params, isSuperUser);
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
      className: 'font-semibold text-text-main',
      render: (val: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-[#3b2768]" />
          <span>{val || row.stakeholder_id || '—'}</span>
        </div>
      )
    },
    {
      header: 'Amount Collected',
      accessor: 'amount',
      sortable: true,
      render: (val: any) => (
        <span className="font-mono font-bold text-[12px] text-emerald-600">
          {val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
        </span>
      )
    },
    {
      header: 'Payment Method',
      accessor: 'payment_method',
      sortable: true,
      render: (val: any) => (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200">
          {val || 'Cash'}
        </span>
      )
    },
    {
      header: 'Date',
      accessor: 'collection_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Reference',
      accessor: 'reference',
      sortable: true,
      render: (val: any) => <span className="font-mono text-[10px] text-text-muted">{val || '—'}</span>
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1">
          {btnEdit?.visible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
              className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-50"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
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
  ], [btnEdit, btnDelete]);

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'DSR Collections'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Monitor and record payments, deposits, and invoice settlement transactions collected by DSRs.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search collection records..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Add Collection</span>
              </Button>
            )}
          </>
        )}
      />

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRecord ? 'Edit Collection Details' : 'Record Customer Collection'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Amount Collected</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value || 0))}
                  className="pl-8 h-10 border-slate-200 rounded-xl font-mono text-sm font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Collection Date</Label>
              <Input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val || 'Cash')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="MFS">Mobile Financial Services (MFS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Reference No.</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Bank slip / TxId"
                className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
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
              disabled={saving}
              isLoading={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              Save Collection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Record"
        description="Are you sure you want to delete this payment collection entry? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
