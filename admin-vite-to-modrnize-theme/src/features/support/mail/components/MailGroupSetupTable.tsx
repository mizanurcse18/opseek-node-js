import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, FileText } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { mailGroupSetupService } from '@/lib/mail/api/mail.service';
import { companyService } from '@/lib/auth/api/company.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface MailGroupSetupTableProps {
  onAdd?: () => void;
  onEdit?: (group: any) => void;
  isSuperUser?: boolean;
}

export default function MailGroupSetupTable({ onAdd, onEdit, isSuperUser = false }: MailGroupSetupTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [companies, setCompanies] = React.useState<{ value: string | number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  React.useEffect(() => {
    if (isSuperUser) {
      const loadCompanies = async () => {
        try {
          const resp = await companyService.getAllCompanies();
          if (resp && Array.isArray(resp)) {
            setCompanies(resp.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies:', error);
        }
      };
      loadCompanies();
    }
  }, [isSuperUser]);

  const fetchDataFn = React.useMemo(() =>
    isSuperUser ? mailGroupSetupService.getGridDataSuper : mailGroupSetupService.getGridData,
  [isSuperUser]);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Group' },
    { button_id: 'btnEdit', button_title: 'Edit Group' },
    { button_id: 'btnDelete', button_title: 'Delete Group' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete.groupId || itemToDelete.group_id;
    setIsDeleting(true);
    try {
      const response = await mailGroupSetupService.delete(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Mail group deleted successfully.', status: 'success' });
        setRefreshKey(prev => prev + 1);
        setItemToDelete(null);
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column[] = React.useMemo(() => [
    {
      header: 'sl',
      accessor: 'autogenrownum',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-mono text-[10px] font-bold bg-content-bg px-2 py-1 rounded text-text-main">{row.autogenrownum || row.groupId || row.group_id}</span>
      )
    },
    {
      header: 'Group Name',
      accessor: 'groupName',
      searchFieldName: 'groupName',
      sortable: true,
      searchable: true,
      className: 'font-bold text-text-main',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <FileText className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main">{row.groupName || row.group_name}</span>
        </div>
      )
    },
    {
      header: 'Subject',
      accessor: 'subject',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-medium text-[11px] max-w-[200px] truncate block">{val || '—'}</span>
    },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => {
        const labels: Record<number, string> = { 0: 'Low', 1: 'Normal', 2: 'High', 3: 'Urgent' };
        const colors: Record<number, string> = { 0: 'bg-gray-50 text-gray-600 border-gray-100', 1: 'bg-blue-50 text-blue-600 border-blue-100', 2: 'bg-amber-50 text-amber-600 border-amber-100', 3: 'bg-red-50 text-red-600 border-red-100' };
        return (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[val as number] || colors[1]}`}>
            {labels[val as number] || 'Normal'}
          </span>
        );
      }
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
              title={btnEdit.button_title}
              onClick={() => onEdit?.(row)}
              className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {btnDelete?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnDelete.button_title}
              onClick={() => setItemToDelete(row)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [onEdit, btnEdit, btnDelete, companies, isSuperUser]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search groups..."
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={onAdd}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
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
        title="Delete Mail Group"
        description="Are you sure you want to delete this mail group? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
