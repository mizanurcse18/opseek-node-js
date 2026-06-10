import React from 'react';
import { Button } from '@/components/ui/Button';
import { Trash2, ClipboardCheck } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { goodsReceiptService } from '@/lib/scm/api/goods-receipt.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface GoodsReceiptTableProps {
  isSuperUser?: boolean;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GoodsReceiptTable({ isSuperUser = false }: GoodsReceiptTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = React.useState(0);

  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnDelete', button_title: 'Delete GRN' },
  ], []));

  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await goodsReceiptService.delete(itemToDelete.grn_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'GRN deleted successfully.', status: 'success' });
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
    isSuperUser ? goodsReceiptService.getGridDataSuper : goodsReceiptService.getGridData,
  [isSuperUser]);

  const columns: Column[] = React.useMemo(() => [
    {
      header: 'SL',
      accessor: 'autogenrownum',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-mono text-[10px] font-bold bg-content-bg px-2 py-1 rounded text-text-main">{row.autogenrownum}</span>
      ),
    },
    {
      header: 'GRN No',
      accessor: 'grn_no',
      searchFieldName: 'grn_no',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <ClipboardCheck className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main text-[11px]">{row.grn_no}</span>
        </div>
      ),
    },
    {
      header: 'PO No',
      accessor: 'po_no',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
    },
    {
      header: 'Date',
      accessor: 'grn_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Supplier',
      accessor: 'supplier_name',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-bold text-text-main">{val || '—'}</span>
      ),
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse_name',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      sortable: true,
      className: 'text-right',
      render: (val: any) => (
        <span className="font-mono font-bold text-[12px] text-text-main">{Number(val ?? 0).toFixed(2)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val: any) => {
        const statusMap: Record<number, { label: string; className: string }> = {
          0: { label: 'Open', className: 'bg-blue-50 text-blue-600 border-blue-100' },
          1: { label: 'Partial', className: 'bg-amber-50 text-amber-600 border-amber-100' },
          2: { label: 'Completed', className: 'bg-green-50 text-green-600 border-green-100' },
        };
        const s = statusMap[val] || { label: 'Unknown', className: 'bg-gray-50 text-gray-600 border-gray-100' };
        return (
          <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border', s.className)}>
            {s.label}
          </span>
        );
      },
    },
    ...(isSuperUser ? [{
      header: 'Company' as string,
      accessor: 'company_id' as string,
      sortable: true,
      render: (val: any) => (
        <span className="text-[10px] font-mono font-bold text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded">{val || '—'}</span>
      ),
    }] : []),
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1">
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
  ], [btnDelete, isSuperUser]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={internalRefreshKey}
        striped
        searchPlaceholder="Search GRNs..."
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete GRN"
        description={`Are you sure you want to delete GRN "${itemToDelete?.grn_no}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
