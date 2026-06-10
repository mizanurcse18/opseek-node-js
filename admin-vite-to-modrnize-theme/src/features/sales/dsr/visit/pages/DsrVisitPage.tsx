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
import { Edit2, Trash2, Plus, Calendar, Clock, User, Compass, HelpCircle } from 'lucide-react';

interface DsrVisitPageProps {
  isSuperUser?: boolean;
}

export default function DsrVisitPage({ isSuperUser = false }: DsrVisitPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [dsrUserId, setDsrUserId] = useState<number>(0);
  const [stakeholderId, setStakeholderId] = useState<number>(0);
  const [planDetailId, setPlanDetailId] = useState<string>('');
  const [checkInTime, setCheckInTime] = useState('10:00');
  const [checkOutTime, setCheckOutTime] = useState('10:30');
  const [visitStatus, setVisitStatus] = useState('Visited');
  const [notes, setNotes] = useState('');

  const [dsrOptions, setDsrOptions] = useState<{ value: number; label: string }[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value: number; label: string }[]>([]);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Log Visit' },
    { button_id: 'btnEdit', button_title: 'Edit Visit' },
    { button_id: 'btnDelete', button_title: 'Delete Visit' }
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
    setPlanDetailId('');
    setCheckInTime('10:00');
    setCheckOutTime('10:30');
    setVisitStatus('Visited');
    setNotes('');
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setDsrUserId(record.dsr_user_id || record.dsrUserId);
    setStakeholderId(record.stakeholder_id || record.stakeholderId);
    setPlanDetailId(record.plan_detail_id ? String(record.plan_detail_id) : '');
    setCheckInTime(record.check_in_time || '10:00');
    setCheckOutTime(record.check_out_time || '10:30');
    setVisitStatus(record.visit_status || record.status || 'Visited');
    setNotes(record.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!dsrUserId || !stakeholderId) {
      toast({ title: 'Validation Error', description: 'Please select both DSR Agent and Customer.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        visit_id: selectedRecord?.visit_id || 0,
        dsr_user_id: dsrUserId,
        stakeholder_id: stakeholderId,
        plan_detail_id: planDetailId ? Number(planDetailId) : null,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        visit_status: visitStatus,
        notes: notes.trim()
      };

      const res = await dsrService.visit.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Visit report logged successfully.', status: 'success' });
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
      const id = itemToDelete.visit_id || itemToDelete.id;
      const res = await dsrService.visit.delete(id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Visit record deleted.', status: 'success' });
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
    return dsrService.visit.getGrid(params, isSuperUser);
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
      header: 'Check-In',
      accessor: 'check_in_time',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-mono text-[11px] flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-emerald-500" />
          {val || '—'}
        </span>
      )
    },
    {
      header: 'Check-Out',
      accessor: 'check_out_time',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-mono text-[11px] flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-red-500" />
          {val || '—'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'visit_status',
      sortable: true,
      render: (val: any, row: any) => {
        const status = val || row.status || 'Visited';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            status === 'Visited' ? 'bg-green-50 text-green-600 border-green-100' :
            status === 'Skipped' ? 'bg-red-50 text-red-600 border-red-100' :
            'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (val: any) => <span className="text-xs text-text-muted truncate max-w-[150px] block">{val || '—'}</span>
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
            {pageTitle || 'DSR Visits'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Review actual visit check-ins, duration tracking, and agent feedback notes.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search visit logs..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Log Visit</span>
              </Button>
            )}
          </>
        )}
      />

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRecord ? 'Edit Visit Log' : 'Log Field Visit'}
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
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Check-In Time</Label>
              <Input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Check-Out Time</Label>
              <Input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Visit Status</Label>
              <Select
                value={visitStatus}
                onValueChange={(val) => setVisitStatus(val || 'Visited')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Visit Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visited">Visited</SelectItem>
                  <SelectItem value="Skipped">Skipped</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Plan Detail ID (Optional)</Label>
              <Input
                value={planDetailId}
                onChange={(e) => setPlanDetailId(e.target.value)}
                placeholder="e.g. 1045"
                className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Visit Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer requested follow-up next Monday..."
              className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
            />
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
              Log Visit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Visit"
        description="Are you sure you want to delete this visit report entry? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
