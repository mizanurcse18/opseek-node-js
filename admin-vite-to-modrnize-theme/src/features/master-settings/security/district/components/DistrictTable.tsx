import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Landmark, History, Layout } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { geoService } from '@/lib/auth/api/geo.service';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AuditLogModal } from '@/components/ui/AuditLogModal';
import { AuditLogFormModal } from '@/components/ui/AuditLogFormModal';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { companyService } from '@/lib/auth/api/company.service';

interface DistrictTableProps {
  onAdd?: () => void;
  onEdit?: (district: any) => void;
  isSuperUser?: boolean;
}

export default function DistrictTable({ onAdd, onEdit, isSuperUser = false }: DistrictTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [companies, setCompanies] = React.useState<{ value: string | number; label: string }[]>([]);
  const [auditLogState, setAuditLogState] = React.useState<{ isOpen: boolean; id: string | number; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [auditLogFormState, setAuditLogFormState] = React.useState<{ isOpen: boolean; id: string | number; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

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
          console.error('Failed to load companies for DistrictTable:', error);
        }
      };
      loadCompanies();
    }
  }, [isSuperUser]);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add District' },
    { button_id: 'btnEdit', button_title: 'Edit District' },
    { button_id: 'btnDelete', button_title: 'Delete District' },
    { button_id: 'btnAuditGrid', button_title: 'Grid Audit' },
    { button_id: 'btnAuditForm', button_title: 'Form Audit' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');
  const btnAuditGrid = buttons.find(b => b.button_id === 'btnAuditGrid');
  const btnAuditForm = buttons.find(b => b.button_id === 'btnAuditForm');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete.DistrictID || itemToDelete.district_id;
    setIsDeleting(true);
    try {
      const response = await geoService.deleteDistrict(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'District deleted successfully.', status: 'success' });
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

  const fetchDataFn = React.useMemo(() =>
    isSuperUser ? geoService.getDistrictGridDataSuper : geoService.getDistrictGridData,
    [isSuperUser]);

  const columns: Column[] = React.useMemo(() => [
    {
      header: 'sl',
      accessor: 'autogenrownum',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-mono text-[10px] font-bold bg-content-bg px-2 py-1 rounded text-text-main">{row.autogenrownum}</span>
      )
    },
    {
      header: 'District Code',
      accessor: 'district_code',
      searchFieldName: 'district_code',
      sortable: false,
      searchable: false,
      visible: false,
      className: 'font-bold text-text-main',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-md">
            <Layout className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <span className="font-bold text-text-main">{row.district_code || row.DistrictCode}</span>
        </div>
      )
    },
    {
      header: 'District Name',
      accessor: 'district_name',
      searchFieldName: 'district_name',
      sortable: true,
      searchable: true,
      className: 'font-bold text-text-main',
      render: (_: any, row: any) => (
        <span className="font-bold text-text-main">{row.district_name || row.DistrictName}</span>
      )
    },
    {
      header: 'Division',
      accessor: 'division_name',
      searchFieldName: 'division_name',
      sortable: true,
      searchable: true,
      className: 'text-text-muted',
      render: (_: any, row: any) => (
        <span className="font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
          {row.division_name || row.DivisionName}
        </span>
      )
    },
    {
      header: 'Company',
      accessor: 'company_id',
      searchFieldName: 'company_id',
      sortable: true,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: companies,
      visible: isSuperUser,
      className: 'text-text-muted',
      render: (val: any) => {
        const company = companies.find(c => String(c.value) === String(val));
        return company ? company.label : (val || 'N/A');
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
          {btnAuditGrid?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnAuditGrid.button_title}
              className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
              onClick={() => setAuditLogState({
                isOpen: true,
                id: row.DistrictID || row.district_id,
                name: row.district_name || row.DistrictName
              })}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          {btnAuditForm?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnAuditForm.button_title}
              className="h-8 w-8 p-0 text-primary-500 hover:text-amber-500 hover:bg-amber-500/10"
              onClick={() => setAuditLogFormState({
                isOpen: true,
                id: row.DistrictID || row.district_id,
                name: row.district_name || row.DistrictName
              })}
            >
              <Layout className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [onEdit, btnEdit, btnDelete, btnAuditGrid, btnAuditForm, companies, isSuperUser, setAuditLogState, setAuditLogFormState]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search districts..."
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
        title="Delete District"
        description="Are you sure you want to delete this district? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <AuditLogModal
        isOpen={auditLogState.isOpen}
        onClose={() => setAuditLogState(prev => ({ ...prev, isOpen: false }))}
        entityName="District"
        entityId={auditLogState.id}
      />

      <AuditLogFormModal
        isOpen={auditLogFormState.isOpen}
        onClose={() => setAuditLogFormState(prev => ({ ...prev, isOpen: false }))}
        entityName="District"
        entityId={auditLogFormState.id}
      />

      <ToastComponent />
    </>
  );
}
