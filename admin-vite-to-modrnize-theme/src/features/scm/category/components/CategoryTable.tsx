import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Layers, FolderTree } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { categoryService } from '@/lib/scm/api/product.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface CategoryTableProps {
  refreshKey?: number;
  onAdd?: () => void;
  onEdit?: (category: any) => void;
  isSuperUser?: boolean;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CategoryTable({ refreshKey = 0, onAdd, onEdit, isSuperUser = false }: CategoryTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = React.useState(0);
  const [categoryMap, setCategoryMap] = React.useState<Map<number, string>>(new Map());

  // Fetch all categories for parent name lookup
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getAll();
        const data = Array.isArray(res) ? res : res?.data || [];
        const map = new Map<number, string>();
        data.forEach((cat: any) => {
          map.set(cat.category_id, cat.category_name);
        });
        setCategoryMap(map);
      } catch (err) {
        console.error('Failed to load categories for parent lookup', err);
      }
    };
    loadCategories();
  }, [refreshKey, internalRefreshKey]);

  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd',    button_title: 'Add Category' },
    { button_id: 'btnEdit',   button_title: 'Edit Category' },
    { button_id: 'btnDelete', button_title: 'Delete Category' },
  ], []));

  const btnAdd    = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit   = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await categoryService.delete(itemToDelete.category_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Category deleted successfully.', status: 'success' });
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
    isSuperUser ? categoryService.getGridDataSuper : categoryService.getGridData,
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
      header: 'Category Name',
      accessor: 'category_name',
      searchFieldName: 'category_name',
      sortable: true,
      searchable: true,
      render: (val: any, row: any) => (
        <div className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:border-primary-300 transition-all">
            <Layers className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <div className="min-w-0">
            <p 
              className="font-bold text-text-main text-[11px] leading-tight uppercase truncate max-w-[200px] group-hover:text-primary-600 transition-colors cursor-pointer"
              title={row.category_name}
            >
              {row.category_name}
            </p>
            <p className="text-[9px] text-text-muted/60 font-mono mt-0.5">
              ID: #{row.category_id}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Parent Category',
      accessor: 'parent_category_id',
      sortable: true,
      render: (val: any, row: any) => {
        if (val == null) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-text-muted/60 bg-surface-secondary/50 px-2.5 py-1 rounded-full border border-border-theme/50">
              <FolderTree className="h-3 w-3" />
              Root Level
            </span>
          );
        }
        const parentName = categoryMap.get(val);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-text-main truncate max-w-[150px]">
              {parentName || 'Unknown'}
            </span>
            <span className="text-[9px] font-mono text-text-muted/50">
              ID: #{val}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (val: any) => (
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border',
          val 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50 shadow-sm shadow-emerald-100' 
            : 'bg-red-50 text-red-600 border-red-200/50 shadow-sm shadow-red-100',
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            val ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
          )} />
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
  ], [onEdit, btnEdit, btnDelete, isSuperUser, categoryMap]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey + internalRefreshKey}
        striped
        searchPlaceholder="Search by category name..."
        emptyMessage="No categories found. Click 'Add Category' to create one."
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
        title="Delete Category"
        description={`Are you sure you want to delete "${itemToDelete?.category_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
