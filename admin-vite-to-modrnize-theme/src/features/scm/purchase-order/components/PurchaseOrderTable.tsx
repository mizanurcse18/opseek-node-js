import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, FileText, Package } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { purchaseOrderService } from '@/lib/scm/api/purchase-order.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { CreateGRNFromPOModal } from '@/features/scm/goods-receipt/components/CreateGRNFromPOModal';

interface PurchaseOrderTableProps {
  isSuperUser?: boolean;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PurchaseOrderTable({ isSuperUser = false }: PurchaseOrderTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = React.useState(0);
  const [receivePoId, setReceivePoId] = React.useState<number | null>(null);

  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnEdit',      button_title: 'Edit PO' },
    { button_id: 'btnDelete',    button_title: 'Delete PO' },
    { button_id: 'btnReceive',   button_title: 'Receive Goods' },
  ], []));

  const btnEdit    = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete  = buttons.find(b => b.button_id === 'btnDelete');
  const btnReceive = buttons.find(b => b.button_id === 'btnReceive');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await purchaseOrderService.delete(itemToDelete.po_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Purchase Order deleted successfully.', status: 'success' });
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
    isSuperUser ? purchaseOrderService.getGridDataSuper : purchaseOrderService.getGridData,
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
      header: 'PO No',
      accessor: 'po_no',
      searchFieldName: 'po_no',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <FileText className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main text-[11px]">{row.po_no}</span>
        </div>
      ),
    },
    {
      header: 'PQ No',
      accessor: 'quotation_no',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">{val || '—'}</span>
      ),
    },
    {
      header: 'Date',
      accessor: 'po_date',
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
        <span className="font-mono font-bold text-[12px] text-text-main">
          {Number(val ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val: any) => {
        const statusMap: Record<number, { label: string; className: string }> = {
          0: { label: 'Draft', className: 'bg-gray-50 text-gray-600 border-gray-100' },
          1: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-100' },
          2: { label: 'Approved', className: 'bg-green-50 text-green-600 border-green-100' },
          3: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-100' },
          4: { label: 'Completed', className: 'bg-blue-50 text-blue-600 border-blue-100' },
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
        <div className="flex justify-end gap-1">              {btnReceive?.visible && Number(row.status) === 2 && (
            <Button
              variant="ghost"
              size="sm"
              title={btnReceive.button_title}
              onClick={() => setReceivePoId(row.po_id)}
              className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10"
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
          {btnEdit?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnEdit.button_title}
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
  ], [btnReceive, btnEdit, btnDelete, isSuperUser]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={internalRefreshKey}
        striped
        searchPlaceholder="Search purchase orders..."
      />

      <CreateGRNFromPOModal
        isOpen={receivePoId !== null}
        onClose={() => setReceivePoId(null)}
        onSave={() => {
          setInternalRefreshKey(prev => prev + 1);
        }}
        poId={receivePoId}
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Order"
        description={`Are you sure you want to delete PO "${itemToDelete?.po_no}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <ToastComponent />
    </>
  );
}
