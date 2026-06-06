import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Warehouse, History } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { warehouseService } from '@/lib/scm/api/warehouse.service';
import { companyService } from '@/lib/auth/api/company.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface WarehouseTableProps {
  onAdd?: () => void;
  onEdit?: (warehouse: any) => void;
  isSuperUser?: boolean;
}

export default function WarehouseTable({ onAdd, onEdit, isSuperUser = false }: WarehouseTableProps) {
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
              value: c.value || c.id || c.company_id,
              label: c.label || c.company_name || `Company #${c.value || c.id}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies for WarehouseTable:', error);
        }
      };
      loadCompanies();
    }
  }, [isSuperUser]);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Warehouse' },
    { button_id: 'btnEdit', button_title: 'Edit Warehouse' },
    { button_id: 'btnDelete', button_title: 'Delete Warehouse' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete.warehouse_id;
    setIsDeleting(true);
    try {
      const response = await warehouseService.deleteWarehouse(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Warehouse deleted successfully.', status: 'success' });
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
    isSuperUser ? warehouseService.getWarehouseGridDataSuper : warehouseService.getWarehouseGridData,
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
      header: 'Warehouse Name',
      accessor: 'warehouse_name',
      searchFieldName: 'warehouse_name',
      sortable: true,
      searchable: true,
      className: 'font-bold text-text-main',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <Warehouse className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main">{row.warehouse_name}</span>
        </div>
      )
    },
    {
      header: 'District',
      accessor: 'district_name',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-medium text-[11px]">{val || '—'}</span>
    },
    {
      header: 'Thana',
      accessor: 'thana_name',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-medium text-[11px]">{val || '—'}</span>
    },
    {
      header: 'Street Address',
      accessor: 'location',
      searchFieldName: 'location',
      sortable: true,
      searchable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-medium text-[11px]">{val || '—'}</span>
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
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (val: any) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
          val ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
        )}>
          {val ? 'Active' : 'Inactive'}
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
        searchPlaceholder="Search warehouses..."
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
        title="Delete Warehouse"
        description="Are you sure you want to delete this warehouse? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}

// Utility function to merge class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
