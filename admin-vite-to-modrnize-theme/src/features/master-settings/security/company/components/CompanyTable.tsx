import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Building2, Star } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { companyService } from '@/lib/auth/api/company.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface CompanyTableProps {
  onAdd?: () => void;
  onEdit?: (company: any) => void;
}

export default function CompanyTable({ onAdd, onEdit }: CompanyTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { toast, ToastComponent } = useToast();
  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Company' },
    { button_id: 'btnEdit', button_title: 'Edit Company' },
    { button_id: 'btnDelete', button_title: 'Delete Company' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete.company_id || itemToDelete.CompanyID;
    if (!id) {
      toast({ title: 'Error', description: 'Could not identify company ID for deletion.', status: 'error' });
      setItemToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await companyService.deleteCompany(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Company deleted successfully.', status: 'success' });
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
      header: 'Company Name',
      accessor: 'company_name',
      searchFieldName: 'company_name',
      searchable: true,
      sortable: true,
      className: 'font-bold text-text-main',
      render: (name, row) => (
        <div className="flex items-center gap-2">
          {row.company_logo ? (
            <img src={row.company_logo} alt={name} className="h-6 w-6 rounded object-contain border border-border-theme" />
          ) : (
            <div className="h-6 w-6 rounded bg-primary-50 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-primary-500" />
            </div>
          )}
          <span>{name}</span>
          {Number(row.is_default) === 1 ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
              <Star className="h-2.5 w-2.5" /> Default
            </span>
          ) : null}
        </div>
      )
    },
    {
      header: 'Short Code',
      accessor: 'short_code',
      searchFieldName: 'short_code',
      searchable: true,
      sortable: true,
      render: (val) => val
        ? <span className="font-mono text-[11px] bg-content-bg text-text-main px-1.5 py-0.5 rounded">{val}</span>
        : <span className="text-text-muted/50 italic text-[11px]">—</span>
    },
    {
      header: 'TIN',
      accessor: 'tin',
      searchFieldName: 'tin',
      searchable: true,
      sortable: true,
      className: 'text-text-muted text-[12px]'
    },
    {
      header: 'BIN',
      accessor: 'bin',
      searchFieldName: 'bin',
      searchable: true,
      sortable: true,
      className: 'text-text-muted text-[12px]'
    },
    {
      header: 'VAT Reg No',
      accessor: 'vat_reg_no',
      searchFieldName: 'vat_reg_no',
      searchable: true,
      sortable: true,
      className: 'text-text-muted text-[12px]'
    },
    {
      header: 'Actions',
      accessor: 'company_id',
      className: 'text-right',
      render: (id, row) => (
        <div className="flex justify-end gap-1">
          {btnEdit?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnEdit.button_title}
              className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
              onClick={() => onEdit?.(row)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}

          {btnDelete?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnDelete.button_title}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setItemToDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [onEdit, btnEdit, btnDelete]);

  return (
    <>
      <DataTable
        key={refreshKey}
        columns={columns}
        fetchDataFn={companyService.getCompanyGridData}
        emptyMessage="No companies found."
        pageSize={10}
        striped={true}
        renderActions={() => (
          btnAdd?.visible && (
            <Button onClick={onAdd} size="sm" className="h-9 px-4 font-black uppercase tracking-widest text-[10px] bg-primary-600 hover:bg-primary-700">
              <Plus className="mr-2 h-3.5 w-3.5" /> {btnAdd.button_title}
            </Button>
          )
        )}
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={btnDelete?.button_title || "Delete Company"}
        description="Are you sure you want to delete this company? This action cannot be undone."
        loading={isDeleting}
        confirmVariant="danger"
        confirmLabel={btnDelete?.button_title || "Delete Company"}
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
        details={[
          { label: 'Company Name', value: itemToDelete?.company_name || '' },
          { label: 'Short Code', value: itemToDelete?.short_code || '—' }
        ]}
      />

      <ToastComponent />
    </>
  );
}
