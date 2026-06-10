import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { handleApiError } from '@/lib/error-handler';
import { visitPlanService } from '../api/visit-plans.api';
import { PLAN_STATUS_OPTIONS, PLAN_TYPE_OPTIONS } from '../types';
import { Eye, Edit2, Trash2, Plus, MapPin, CalendarDays, Play, XCircle } from 'lucide-react';

interface VisitPlanTableProps {
  onAdd?: () => void;
  onEdit?: (plan: any) => void;
  onView?: (plan: any) => void;
  isSuperUser?: boolean;
}

function StatusBadge({ status }: { status: number }) {
  const opt = PLAN_STATUS_OPTIONS.find(o => o.value === status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${opt?.color || ''}`}>
      {opt?.label || status}
    </span>
  );
}

function PlanTypeBadge({ type }: { type: number }) {
  const colors = ['text-violet-600 bg-violet-50 border-violet-100', 'text-cyan-600 bg-cyan-50 border-cyan-100', 'text-amber-600 bg-amber-50 border-amber-100'];
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors[type] || colors[0]}`}>
      {PLAN_TYPE_OPTIONS.find(o => o.value === type)?.label || type}
    </span>
  );
}

export default function VisitPlanTable({ onAdd, onEdit, onView, isSuperUser = false }: VisitPlanTableProps) {
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd',    button_title: 'Add Plan' },
    { button_id: 'btnEdit',   button_title: 'Edit Plan' },
    { button_id: 'btnView',   button_title: 'View Plan' },
    { button_id: 'btnDelete', button_title: 'Delete Plan' },
    { button_id: 'btnActivate', button_title: 'Activate' },
    { button_id: 'btnCancel', button_title: 'Cancel Plan' },
  ], []));

  const btnAdd     = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit    = buttons.find(b => b.button_id === 'btnEdit');
  const btnView    = buttons.find(b => b.button_id === 'btnView');
  const btnDelete  = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await visitPlanService.deletePlan(itemToDelete.plan_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS')) {
        toast({ title: 'Success', description: 'Plan deleted successfully.', status: 'success' });
        setInternalRefreshKey(prev => prev + 1);
        setItemToDelete(null);
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDataFn = useMemo(() =>
    isSuperUser ? visitPlanService.getGridDataSuper : visitPlanService.getGridData,
  [isSuperUser]);

  const columns: Column[] = useMemo(() => [
    {
      header: 'SL',
      accessor: 'autogenrownum',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-mono text-[10px] font-bold bg-content-bg px-2 py-1 rounded text-text-main">
          {row.autogenrownum}
        </span>
      ),
    },
    {
      header: 'Plan Name',
      accessor: 'plan_name',
      searchFieldName: 'plan_name',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <CalendarDays className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <div>
            <span className="font-bold text-text-main text-[11px] block">{row.plan_name}</span>
            <span className="text-[9px] text-text-muted">{row.dealer_business_name || `Dealer #${row.dealer_id}`}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'plan_type',
      sortable: true,
      render: (val: any) => <PlanTypeBadge type={Number(val)} />,
    },
    {
      header: 'Duration',
      accessor: 'start_date',
      sortable: true,
      render: (_: any, row: any) => (
        <span className="text-[10px] font-medium text-text-muted">
          {row.start_date ? new Date(row.start_date).toLocaleDateString() : '—'} – {row.end_date ? new Date(row.end_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Visits',
      accessor: 'total_visits',
      sortable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-main">{row.completed_visits || 0}</span>
          <span className="text-[9px] text-text-muted">/ {row.total_visits || 0}</span>
          {row.total_visits > 0 && (
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((row.completed_visits || 0) / row.total_visits) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val: any) => <StatusBadge status={Number(val)} />,
    },
    ...(isSuperUser ? [{
      header: 'Company' as string,
      accessor: 'company_id' as string,
      sortable: true,
      render: (val: any) => (
        <span className="text-[10px] font-mono font-bold text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded">
          {val || '—'}
        </span>
      ),
    }] : []),
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1">
          {btnView?.visible && (
            <Button variant="ghost" size="sm" title="View Plan" onClick={() => onView?.(row)}
              className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-500/10">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {btnEdit?.visible && (
            <Button variant="ghost" size="sm" title={btnEdit.button_title} onClick={() => onEdit?.(row)}
              className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10">
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {btnDelete?.visible && (
            <Button variant="ghost" size="sm" title={btnDelete.button_title} onClick={() => setItemToDelete(row)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [onEdit, onView, btnEdit, btnView, btnDelete, isSuperUser]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={internalRefreshKey}
        striped
        searchPlaceholder="Search visit plans..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button onClick={onAdd} size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3">
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">{btnAdd.button_title}</span>
              </Button>
            )}
          </>
        )}
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Visit Plan"
        description={`Are you sure you want to delete plan "${itemToDelete?.plan_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
