import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Package } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { productService } from '@/lib/scm/api/product.service';
import { storageService } from '@/lib/auth/api/storage.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface ProductTableProps {
  refreshKey?: number;
  onAdd?: () => void;
  onEdit?: (product: any) => void;
  isSuperUser?: boolean;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProductTable({ refreshKey = 0, onAdd, onEdit, isSuperUser = false }: ProductTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = React.useState(0);

  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd',    button_title: 'Add Product' },
    { button_id: 'btnEdit',   button_title: 'Edit Product' },
    { button_id: 'btnDelete', button_title: 'Delete Product' },
  ], []));

  const btnAdd    = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit   = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await productService.deleteProduct(itemToDelete.product_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Product deleted successfully.', status: 'success' });
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
    isSuperUser ? productService.getProductGridDataSuper : productService.getProductGridData,
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
      header: 'Product',
      accessor: 'product_name',
      searchFieldName: 'product_name',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => {
        let imageUrl = '';
        if (row.image_id) {
          try {
            let parsedKeys: string[] = [];
            if (row.image_id.startsWith('[') && row.image_id.endsWith(']')) {
              parsedKeys = JSON.parse(row.image_id);
            } else {
              parsedKeys = row.image_id.split(',').map((k: string) => k.trim()).filter(Boolean);
            }
            if (parsedKeys.length > 0) {
              imageUrl = storageService.getDownloadUrl(parsedKeys[0]);
            }
          } catch (e) {
            imageUrl = storageService.getDownloadUrl(row.image_id);
          }
        }

        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50/70 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={row.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    // Convert back to icon on error
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="h-3.5 w-3.5 text-primary-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>';
                    }
                  }}
                />
              ) : (
                <Package className="h-3.5 w-3.5 text-primary-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-text-main text-[11px] leading-tight uppercase">{row.product_name}</p>
              {row.product_code && (
                <p className="text-[9px] text-text-muted font-mono mt-0.5">{row.product_code}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Category',
      accessor: 'category_name',
      searchFieldName: 'category_name',
      sortable: true,
      searchable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full">
          {val || '—'}
        </span>
      ),
    },
    {
      header: 'Unit',
      accessor: 'unit_name',
      searchFieldName: 'unit_name',
      sortable: true,
      searchable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
    },
    {
      header: 'Brand',
      accessor: 'brand_name',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
    },
    {
      header: 'Purchase Price',
      accessor: 'purchase_price',
      sortable: true,
      className: 'text-right',
      render: (val: any) => (
        <span className="font-mono font-bold text-[12px] text-text-main">
          {Number(val ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Sales Price',
      accessor: 'sales_price',
      sortable: true,
      className: 'text-right',
      render: (val: any) => (
        <span className="font-mono font-bold text-[12px] text-emerald-600">
          {Number(val ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'VAT %',
      accessor: 'vat_percentage',
      sortable: true,
      className: 'text-right',
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{Number(val ?? 0).toFixed(2)}%</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (val: any) => (
        <span className={cn(
          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
          val ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100',
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
        refreshKey={refreshKey + internalRefreshKey}
        striped
        searchPlaceholder="Search products..."
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
        title="Delete Product"
        description={`Are you sure you want to delete "${itemToDelete?.product_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
