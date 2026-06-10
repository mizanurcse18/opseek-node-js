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
import { Edit2, Trash2, Plus, Calendar, Clock, User, ClipboardList } from 'lucide-react';

interface DsrAttendancePageProps {
  isSuperUser?: boolean;
}

export default function DsrAttendancePage({ isSuperUser = false }: DsrAttendancePageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [dsrUserId, setDsrUserId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [status, setStatus] = useState('Present');

  const [dsrOptions, setDsrOptions] = useState<{ value: number; label: string }[]>([]);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Attendance' },
    { button_id: 'btnEdit', button_title: 'Edit Attendance' },
    { button_id: 'btnDelete', button_title: 'Delete Attendance' }
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
    setDate(new Date().toISOString().split('T')[0]);
    setCheckInTime('09:00');
    setCheckOutTime('17:00');
    setStatus('Present');
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setDsrUserId(record.dsr_user_id || record.dsrUserId);
    setDate(record.date ? new Date(record.date).toISOString().split('T')[0] : '');
    setCheckInTime(record.check_in_time || '09:00');
    setCheckOutTime(record.check_out_time || '17:00');
    setStatus(record.status || 'Present');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!dsrUserId) {
      toast({ title: 'Validation Error', description: 'Please select a DSR user.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        attendance_id: selectedRecord?.attendance_id || 0,
        dsr_user_id: dsrUserId,
        date: new Date(date).toISOString(),
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        status: status
      };

      const res = await dsrService.attendance.save(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Attendance saved successfully.', status: 'success' });
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
      const res = await dsrService.attendance.delete(itemToDelete.attendance_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Attendance record deleted.', status: 'success' });
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
    return dsrService.attendance.getGrid(params, isSuperUser);
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
      header: 'DSR Name',
      accessor: 'dsr_name',
      sortable: true,
      searchable: true,
      searchFieldName: 'dsr_name',
      className: 'font-bold text-text-main',
      render: (val: any, row: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary-500 shrink-0" />
          <span className="font-bold text-text-main">{val || row.dsr_user_id || 'DSR User'}</span>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Check-In',
      accessor: 'check_in_time',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-mono text-[11px] flex items-center gap-1">
          <Clock className="h-3 w-3 text-emerald-500" />
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
          <Clock className="h-3 w-3 text-red-500" />
          {val || '—'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          val === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          val === 'Absent' ? 'bg-red-50 text-red-600 border-red-100' :
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {val || 'Present'}
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
            {pageTitle || 'DSR Attendance'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Track daily attendance, check-in schedules, and statuses for field sales agents.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search attendance records..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Add Record</span>
              </Button>
            )}
          </>
        )}
      />

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRecord ? 'Edit Attendance Record' : 'Add Attendance Record'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">DSR User</Label>
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
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 border-slate-200 rounded-xl"
            />
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

          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val || 'Present')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
              </SelectContent>
            </Select>
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
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Save Record
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
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
