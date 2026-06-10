import { useState, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { visitPlanService } from '../api/visit-plans.api';
import { TEMPLATE_STATUS_OPTIONS } from '../types';
import { Plus, FileText, CalendarDays, Play, Trash2 } from 'lucide-react';

interface VisitPlanTemplateTableProps {
  onAdd: () => void;
  onEdit: (template: any) => void;
  onGenerate: (template: any) => void;
  isSuperUser?: boolean;
}

export default function VisitPlanTemplateTable({
  onAdd,
  onEdit,
  onGenerate,
  isSuperUser = false,
}: VisitPlanTemplateTableProps) {
  const { toast, ToastComponent } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const { canCreate, canUpdate, canDelete } = usePermission();

  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await visitPlanService.deleteTemplate(itemToDelete.template_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS')) {
        toast({ title: 'Success', description: 'Template deleted successfully.', status: 'success' });
        setRefreshKey(prev => prev + 1);
        setItemToDelete(null);
      } else {
        const errMsg = res?.message || res?.data?.message || 'Failed to delete template';
        toast({ title: 'Error', description: errMsg, status: 'error' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'An unexpected error occurred.', status: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDataFn = useMemo(() =>
    isSuperUser ? visitPlanService.getTemplateGridDataSuper : visitPlanService.getTemplateGridData,
  [isSuperUser]);

  const columns: Column[] = useMemo(() => [
    {
      accessor: 'template_id',
      header: 'ID',
      sortable: true,
      render: (val: any) => <span className="text-xs text-gray-400 font-mono">{val}</span>,
    },
    {
      accessor: 'template_name',
      header: 'Template Name',
      sortable: true,
      searchable: true,
      searchFieldName: 'template_name',
      render: (val: any, row: any) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-800">{val}</span>
        </div>
      ),
    },
    {
      accessor: 'dealer_business_name',
      header: 'Dealer',
      render: (val: any) => (
        <span className="text-xs text-gray-500">{val || '—'}</span>
      ),
    },
    {
      accessor: 'total_slots',
      header: 'Slots',
      sortable: true,
      render: (val: any) => (
        <span className="text-xs font-bold text-gray-600">{val ?? 0}</span>
      ),
    },
    {
      accessor: 'status',
      header: 'Status',
      sortable: true,
      render: (val: any) => {
        const opt = TEMPLATE_STATUS_OPTIONS.find(o => o.value === val);
        return (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${opt?.color || ''}`}>
            {opt?.label || 'Unknown'}
          </span>
        );
      },
    },
    {
      accessor: 'created_date',
      header: 'Created',
      sortable: true,
      render: (val: any) => (
        <span className="text-xs text-gray-400">{val ? new Date(val).toLocaleDateString() : '—'}</span>
      ),
    },
    {
      accessor: 'actions',
      header: '',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row)}
              className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
              title="Edit template"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGenerate(row)}
            className="h-8 w-8 p-0 text-green-500 hover:bg-green-500/10"
            title="Generate plan from template"
          >
            <Play className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemToDelete(row)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Delete template"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [onEdit, onGenerate, canUpdate, canDelete]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped
        searchPlaceholder="Search templates..."
        renderActions={() => (
          canCreate ? (
            <Button onClick={onAdd} size="sm"
              className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
            >
              <Plus className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Add Template</span>
            </Button>
          ) : null
        )}
      />
      
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Visit Plan Template"
        description={`Are you sure you want to delete template "${itemToDelete?.template_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
