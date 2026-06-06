import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, ShoppingCart, FileText } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { purchaseRequisitionService } from '@/lib/scm/api/purchase-requisition.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { PurchaseQuotationCompareModal } from '@/features/scm/purchase-quotation/components/PurchaseQuotationCompareModal';

interface PurchaseRequisitionTableProps {
  onAdd?: () => void;
  onEdit?: (pr: any) => void;
  isSuperUser?: boolean;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PurchaseRequisitionTable({ onAdd, onEdit, isSuperUser = false }: PurchaseRequisitionTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = React.useState(0);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [quotationPrId, setQuotationPrId] = React.useState<string | null>(null);

  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd',             button_title: 'Add Requisition' },
    { button_id: 'btnEdit',            button_title: 'Edit Requisition' },
    { button_id: 'btnDelete',          button_title: 'Delete Requisition' },
    { button_id: 'btnSubmitQuotation', button_title: 'Submit Quotation' },
  ], []));

  const btnAdd             = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit            = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete          = buttons.find(b => b.button_id === 'btnDelete');
  const btnSubmitQuotation = buttons.find(b => b.button_id === 'btnSubmitQuotation');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await purchaseRequisitionService.delete(itemToDelete.requisition_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Requisition deleted successfully.', status: 'success' });
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
    isSuperUser ? purchaseRequisitionService.getGridDataSuper : purchaseRequisitionService.getGridData,
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
      header: 'Req No',
      accessor: 'requisition_no',
      searchFieldName: 'requisition_no',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <ShoppingCart className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main text-[11px]">{row.requisition_no}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'requisition_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-[11px] font-medium text-text-muted">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Warehouse',
      accessor: 'warehouse_name',
      searchFieldName: 'warehouse_name',
      sortable: true,
      searchable: true,
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
          {btnSubmitQuotation?.visible && (
            <Button
              variant="ghost"
              size="sm"
              title={btnSubmitQuotation.button_title}
              onClick={() => {
                setQuotationPrId(String(row.requisition_id));
                setIsQuotationModalOpen(true);
              }}
              className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [onEdit, btnEdit, btnDelete, btnSubmitQuotation, isSuperUser]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={internalRefreshKey}
        striped
        searchPlaceholder="Search requisitions..."
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
        title="Delete Requisition"
        description={`Are you sure you want to delete requisition "${itemToDelete?.requisition_no}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={isDeleting}
      />

      <PurchaseQuotationCompareModal
        isOpen={isQuotationModalOpen}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setQuotationPrId(null);
        }}
        isSuperUser={isSuperUser}
        preselectedPrId={quotationPrId}
      />

      <ToastComponent />
    </>
  );
}
