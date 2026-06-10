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
import { Edit2, Trash2, Plus, Calendar, DollarSign, User, ShieldAlert, Award } from 'lucide-react';

interface DsrTargetPageProps {
  isSuperUser?: boolean;
}

export default function DsrTargetPage({ isSuperUser = false }: DsrTargetPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [dsrUserId, setDsrUserId] = useState<number>(0);
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

  const [dsrOptions, setDsrOptions] = useState<{ value: number; label: string }[]>([]);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Assign Target' },
    { button_id: 'btnEdit', button_title: 'Edit Target' },
    { button_id: 'btnDelete', button_title: 'Delete Target' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  useEffect(() => {
    const loadDsrs = async () => {
      try {
        const dsrs = await dsrService.getDsrCombo();
        setDsrOptions(dsrs);
      } catch (err) {
        console.error('Failed to load DSR list:', err);
      }
    };
    loadDsrs();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setDsrUserId(0);
    setTargetAmount(0);
    setPeriod('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setDsrUserId(record.dsr_user_id || record.dsrUserId);
    setTargetAmount(Number(record.target_amount || record.targetAmount || 0));
    setPeriod(record.period || 'monthly');
    setStartDate(record.start_date ? new Date(record.start_date).toISOString().split('T')[0] : '');
    setEndDate(record.end_date ? new Date(record.end_date).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!dsrUserId || targetAmount <= 0) {
      toast({ title: 'Validation Error', description: 'Please select a DSR agent and specify a valid target amount.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        target_id: selectedRecord?.target_id || 0,
        dsr_user_id: dsrUserId,
        target_amount: targetAmount,
        period: period,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString()
      };

      const res = await dsrService.target.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Target assigned successfully.', status: 'success' });
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
      const id = itemToDelete.target_id || itemToDelete.id;
      const res = await dsrService.target.delete(id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Target deleted.', status: 'success' });
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
    return dsrService.target.getGrid(params, isSuperUser);
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
      header: 'Target Amount',
      accessor: 'target_amount',
      sortable: true,
      render: (val: any) => (
        <span className="font-mono font-bold text-[12px] text-text-main">
          {val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
        </span>
      )
    },
    {
      header: 'Period',
      accessor: 'period',
      sortable: true,
      render: (val: any) => (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary-50 text-primary-600 border border-primary-100">
          {val || 'monthly'}
        </span>
      )
    },
    {
      header: 'Start Date',
      accessor: 'start_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'End Date',
      accessor: 'end_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
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
            {pageTitle || 'DSR Sales Targets'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Review sales quotas, time periods, and targets defined for field sales agents.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search target allocations..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Assign Target</span>
              </Button>
            )}
          </>
        )}
      />

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRecord ? 'Edit Target Allocation' : 'Assign Sales Target'}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Target Amount</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetAmount || ''}
                  onChange={(e) => setTargetAmount(Number(e.target.value || 0))}
                  className="pl-8 h-10 border-slate-200 rounded-xl font-mono text-sm font-bold shadow-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Quota Period</Label>
              <Select
                value={period}
                onValueChange={(val) => setPeriod(val || 'monthly')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
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
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm"
            >
              Assign Target
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Target"
        description="Are you sure you want to delete this target allocation? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
