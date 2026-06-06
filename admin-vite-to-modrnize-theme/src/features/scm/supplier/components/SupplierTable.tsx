import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Building2 } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { supplierService } from '@/lib/scm/api/supplier.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface SupplierTableProps {
  onAdd?: () => void;
  onEdit?: (supplier: any) => void;
  isSuperUser?: boolean;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SupplierTable({ onAdd, onEdit, isSuperUser = false }: SupplierTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = React.useState(0);

  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd',    button_title: 'Add Supplier' },
    { button_id: 'btnEdit',   button_title: 'Edit Supplier' },
    { button_id: 'btnDelete', button_title: 'Delete Supplier' },
  ], []));

  const btnAdd    = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit   = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await supplierService.deleteSupplier(itemToDelete.supplier_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Supplier deleted successfully.', status: 'success' });
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

  const fetchDataFn = React.useMemo(() =>
    isSuperUser ? supplierService.getGridDataSuper : supplierService.getGridData,
  [isSuperUser]);

  const columns: Column[] = React.useMemo(() => [
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
      header: 'Supplier Code',
      accessor: 'supplier_code',
      searchFieldName: 'supplier_code',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <Building2 className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main text-[11px]">{row.supplier_code}</span>
        </div>
      ),
    },
    {
      header: 'Business Name',
      accessor: 'business_name',
      searchFieldName: 'business_name',
      sortable: true,
      searchable: true,
      render: (val: any) => (
        <span className="text-[11px] font-bold text-text-main">{val || '—'}</span>
      ),
    },
    {
      header: 'Contact Person',
      accessor: 'first_name',
      sortable: true,
      render: (_: any, row: any) => (
        <span className="text-[11px] font-medium text-text-muted">
          {[row.first_name, row.last_name].filter(Boolean).join(' ') || '—'}
        </span>
      ),
    },
    {
      header: 'Mobile',
      accessor: 'mobile',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
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
      ),
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
      ),
    },
  ], [onEdit, btnEdit, btnDelete, isSuperUser]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={internalRefreshKey}
        striped
        searchPlaceholder="Search suppliers..."
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
        title="Delete Supplier"
        description={`Are you sure you want to delete supplier "${itemToDelete?.supplier_code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
