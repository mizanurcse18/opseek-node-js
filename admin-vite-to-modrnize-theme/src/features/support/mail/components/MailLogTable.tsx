import React from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Eye, RotateCcw, MailCheck, MailX, Clock, Send } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { mailLogService } from '@/lib/mail/api/mail.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui-old/Select';
import { Badge } from '@/components/ui/Badge';

const STATUS_LABELS: Record<number, string> = {
  0: 'Queued',
  1: 'Sending',
  2: 'Sent',
  3: 'Failed',
};

const STATUS_COLORS: Record<number, string> = {
  0: 'bg-blue-50 text-blue-600 border-blue-100',
  1: 'bg-amber-50 text-amber-600 border-amber-100',
  2: 'bg-green-50 text-green-600 border-green-100',
  3: 'bg-red-50 text-red-600 border-red-100',
};

interface MailLogTableProps {
  isSuperUser?: boolean;
}

export default function MailLogTable({ isSuperUser = false }: MailLogTableProps) {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<number | null>(null);
  const [selectedLog, setSelectedLog] = React.useState<any>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [retrying, setRetrying] = React.useState<number | null>(null);

  const { toast, ToastComponent } = useToast();

  const handleRetry = async (id: number) => {
    setRetrying(id);
    try {
      const response = await mailLogService.retry(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Email queued for retry.', status: 'success' });
        setRefreshKey(prev => prev + 1);
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setRetrying(null);
    }
  };

  const viewDetail = (log: any) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const fetchDataFn = React.useCallback(async (params: any) => {
    const gridParams: any = { ...params };
    if (statusFilter !== null) {
      gridParams.ApprovalFilterData = JSON.stringify({ status: statusFilter });
    }
    return mailLogService.getGridData(gridParams);
  }, [statusFilter]);

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
      header: 'Recipient',
      accessor: 'recipient_email',
      searchFieldName: 'recipient_email',
      sortable: true,
      searchable: true,
      className: 'font-bold text-text-main',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-50 rounded-md">
            <MailCheck className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="font-bold text-text-main">{row.recipient_email}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1 ${STATUS_COLORS[val as number] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
          {val === 0 && <Clock className="h-2.5 w-2.5" />}
          {val === 1 && <Send className="h-2.5 w-2.5" />}
          {val === 2 && <MailCheck className="h-2.5 w-2.5" />}
          {val === 3 && <MailX className="h-2.5 w-2.5" />}
          {STATUS_LABELS[val as number] || 'Unknown'}
        </span>
      )
    },
    {
      header: 'Attempts',
      accessor: 'attempt_count',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-mono text-[11px]">{val || 0}</span>
    },
    {
      header: 'Error',
      accessor: 'last_error',
      sortable: false,
      className: 'text-text-muted',
      render: (val: any) => (
        <span className="font-medium text-[11px] max-w-[200px] truncate block text-red-500" title={val || ''}>
          {val || '—'}
        </span>
      )
    },
    {
      header: 'Created',
      accessor: 'created_date',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-medium text-[11px]">{val ? new Date(val).toLocaleString() : '—'}</span>
    },
    {
      header: 'Sent',
      accessor: 'sent_date',
      sortable: true,
      className: 'text-text-muted',
      render: (val: any) => <span className="font-medium text-[11px]">{val ? new Date(val).toLocaleString() : '—'}</span>
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="View Details"
            onClick={() => viewDetail(row)}
            className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-500/10"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {(row.status === 3) && (
            <Button
              variant="ghost"
              size="sm"
              title="Retry"
              onClick={() => handleRetry(row.log_id)}
              disabled={retrying === row.log_id}
              className="h-8 w-8 p-0 text-green-500 hover:bg-green-500/10"
            >
              <RotateCcw className={`h-4 w-4 ${retrying === row.log_id ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      )
    }
  ], [retrying]);

  return (
    <>
      <DataTable
        columns={columns}
        fetchDataFn={fetchDataFn}
        refreshKey={refreshKey}
        striped={true}
        searchPlaceholder="Search by email..."
        renderActions={() => (
          <div className="flex items-center gap-3">
            <div className="w-40">
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: '0', label: 'Queued' },
                  { value: '1', label: 'Sending' },
                  { value: '2', label: 'Sent' },
                  { value: '3', label: 'Failed' },
                ]}
                value={statusFilter !== null ? String(statusFilter) : ''}
                onChange={(val) => setStatusFilter(val !== '' ? Number(val) : null)}
                placeholder="Filter by status"
                className="w-full"
              />
            </div>
            <Button
              onClick={() => setRefreshKey(prev => prev + 1)}
              size="sm"
              variant="outline"
              className="h-7 flex items-center gap-2 px-3"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Refresh</span>
            </Button>
          </div>
        )}
      />

      <Modal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedLog(null); }}
        maxWidth="md"
        title="Email Log Detail"
      >
        {selectedLog && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Log ID</Label>
                <p className="text-sm font-medium text-text-main">{selectedLog.log_id}</p>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Status</Label>
                <p>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1 ${STATUS_COLORS[selectedLog.status as number] || ''}`}>
                    {STATUS_LABELS[selectedLog.status as number] || 'Unknown'}
                  </span>
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Recipient</Label>
                <p className="text-sm font-medium text-text-main">{selectedLog.recipient_email}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Payload</Label>
                <pre className="text-xs bg-content-bg p-3 rounded-lg overflow-x-auto max-h-32 mt-1">
                  {selectedLog.payload_json ? JSON.stringify(JSON.parse(selectedLog.payload_json), null, 2) : '—'}
                </pre>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Attempts</Label>
                <p className="text-sm font-medium text-text-main">{selectedLog.attempt_count || 0}</p>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Created</Label>
                <p className="text-sm font-medium text-text-main">{selectedLog.created_date ? new Date(selectedLog.created_date).toLocaleString() : '—'}</p>
              </div>
              {selectedLog.sent_date && (
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Sent</Label>
                  <p className="text-sm font-medium text-text-main">{new Date(selectedLog.sent_date).toLocaleString()}</p>
                </div>
              )}
              {selectedLog.last_error && (
                <div className="col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Last Error</Label>
                  <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg mt-1">{selectedLog.last_error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ToastComponent />
    </>
  );
}

function Label({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className={className}>{children}</label>;
}
