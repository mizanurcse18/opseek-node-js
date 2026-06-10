import React, { useState } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { DataTable } from '@/components/ui/DataTable';
import { Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiService } from '@/lib/api.service';
import { 
  Activity, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  FileCode, 
  HardDrive, 
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RequestLogMonitor() {
  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard.`,
      status: 'success'
    });
  };

  const handleRetry = async (logId: number) => {
    setRetryingId(logId);
    toast({
      title: 'Retrying Request',
      description: 'Attempting to re-dispatch API/file storage request...',
      status: 'info'
    });

    try {
      const res: any = await apiService.post('security', `/request-log/retry/${logId}`);
      if (res && (res.status_code === 200 || res.response_code === 'Success' || res.data === true)) {
        toast({
          title: 'Success!',
          description: res.message || 'API request successfully retried and executed.',
          status: 'success'
        });
        setRefreshKey(prev => prev + 1);
        setSelectedLog(null); // Clear active card details
      } else {
        toast({
          title: 'Retry Failed',
          description: res?.message || 'The retry attempt did not succeed.',
          status: 'error'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'An unexpected error occurred during retry.',
        status: 'error'
      });
    } finally {
      setRetryingId(null);
    }
  };

  const columns: Column[] = [
    {
      header: 'ID',
      accessor: 'request_log_id',
      sortable: true,
      className: 'font-mono text-xs w-16'
    },
    {
      header: 'Action',
      accessor: 'action',
      searchable: true,
      sortable: true,
      render: (val: any) => {
        const isOcr = val?.includes('OCR');
        const isFile = val?.includes('FILE') || val?.includes('STORAGE');
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "font-mono font-bold tracking-tight py-0.5 px-2",
              isOcr && "bg-purple-500/10 text-purple-600 border-purple-200/50 dark:border-purple-800/30",
              isFile && "bg-cyan-500/10 text-cyan-600 border-cyan-200/50 dark:border-cyan-800/30",
              !isOcr && !isFile && "bg-gray-500/10 text-gray-600 border-gray-200/50"
            )}
          >
            {val || 'UNKNOWN'}
          </Badge>
        );
      }
    },
    {
      header: 'Method',
      accessor: 'method',
      render: (val: any) => (
        <span className={cn(
          "font-mono font-black text-[9px] uppercase px-1.5 py-0.5 rounded border",
          val === 'POST' && "bg-blue-50 text-blue-600 border-blue-200/40",
          val === 'GET' && "bg-green-50 text-green-600 border-green-200/40",
          val === 'gRPC' && "bg-pink-50 text-pink-600 border-pink-200/40"
        )}>
          {val || 'POST'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      searchable: true,
      sortable: true,
      render: (val: any) => {
        const isSuccess = val?.toLowerCase() === 'success';
        return (
          <Badge 
            variant={isSuccess ? 'success' : 'danger'} 
            className={cn(
              "gap-1 py-0.5 px-2",
              !isSuccess && "animate-pulse"
            )}
          >
            {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {val || 'Failed'}
          </Badge>
        );
      }
    },
    {
      header: 'HTTP Status',
      accessor: 'http_status',
      sortable: true,
      render: (val: any) => {
        const statusInt = Number(val);
        const isOk = statusInt >= 200 && statusInt < 300;
        return (
          <span className={cn(
            "font-mono font-bold",
            isOk && "text-emerald-600",
            !isOk && statusInt > 0 && "text-red-500",
            statusInt === 0 && "text-text-muted/60"
          )}>
            {val || '-'}
          </span>
        );
      }
    },
    {
      header: 'Date',
      accessor: 'created_date',
      sortable: true,
      render: (val: any) => {
        if (!val) return null;
        const dateObj = new Date(val.endsWith('Z') ? val.slice(0, -1) : val);
        return (
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="font-semibold text-text-main">{dateObj.toLocaleDateString()}</span>
            <span className="text-text-muted">{dateObj.toLocaleTimeString()}</span>
          </div>
        );
      }
    },
    {
      header: 'Details',
      accessor: 'actions',
      render: (_: any, row: any) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedLog(row)}
          className="h-7 text-[10px] font-black uppercase tracking-widest gap-1 text-primary-600 hover:bg-primary-50"
        >
          Inspect
          <ArrowRight className="h-3 w-3" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="h-40 w-40 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-spin-slow" />
              <h2 className="text-2xl font-black tracking-tight">{pageTitle || 'Outgoing API Monitor'}</h2>
            </div>
            <p className="text-sm text-slate-300 max-w-xl">
              Real-time administrative ledger tracing outgoing external APIs (bKash, Nagad, Bank Gateways) and local storage fallbacks with manual retry overrides.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Outgoing Logs List (Glassmorphism card) */}
        <div className="lg:col-span-2 bg-card-bg/60 backdrop-blur-md rounded-2xl border border-border-theme p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border-theme pb-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
              Request Ledger
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              Live Monitoring
            </Badge>
          </div>

          <DataTable 
            columns={columns}
            module="security"
            path="/request-log/all"
            refreshKey={refreshKey}
            striped
            searchPlaceholder="Search logs..."
          />
        </div>

        {/* Right Side: Interactive Side Inspector */}
        <div className="lg:col-span-1 space-y-6">
          {selectedLog ? (
            <div className="bg-card-bg/70 backdrop-blur-lg rounded-2xl border border-border-theme p-5 shadow-xl space-y-6 transition-all duration-300 transform scale-100">
              <div className="flex items-center justify-between border-b border-border-theme pb-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Inspector Panel
                  </div>
                  <h4 className="text-sm font-black text-text-main flex items-center gap-1.5">
                    Log Entry #{selectedLog.request_log_id}
                  </h4>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedLog(null)}
                  className="h-6 w-6 p-0 text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* URL & Method Card */}
              <div className="p-3 bg-content-bg/50 rounded-xl border border-border-theme/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-mono font-black text-[10px] uppercase px-1.5 py-0.5 rounded border shrink-0",
                    selectedLog.method === 'POST' && "bg-blue-50 text-blue-600 border-blue-200/40",
                    selectedLog.method === 'gRPC' && "bg-pink-50 text-pink-600 border-pink-200/40"
                  )}>
                    {selectedLog.method || 'POST'}
                  </span>
                  <Badge variant={selectedLog.status?.toLowerCase() === 'success' ? 'success' : 'danger'}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div className="font-mono text-xs text-text-main break-all leading-relaxed bg-card-bg p-2 rounded border border-border-theme/30">
                  {selectedLog.url}
                </div>
              </div>

              {/* Local File Storage Fallback Alert Block */}
              {selectedLog.local_fallback_path && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <HardDrive className="h-4.5 w-4.5 animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-widest">Local Fallback Active</span>
                  </div>
                  <p className="text-[11px] text-text-main leading-relaxed">
                    gRPC storage was down. Uploaded file successfully cached locally on server disk to prevent data loss:
                  </p>
                  <div className="font-mono text-[10px] bg-white/60 dark:bg-black/20 p-2 rounded border border-amber-500/10 text-amber-800 dark:text-amber-300 break-all select-all">
                    {selectedLog.local_fallback_path}
                  </div>
                </div>
              )}

              {/* Error Message callout */}
              {selectedLog.error_message && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1.5 text-red-600">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Error Trace</span>
                  </div>
                  <div className="text-[11px] font-mono bg-white/40 dark:bg-black/10 p-2 rounded border border-red-200/30 text-red-700 dark:text-red-400 break-all">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              {/* JSON Payload Accordion */}
              <div className="space-y-3.5 text-xs text-text-main">
                {/* Request Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
                      <Terminal className="h-3 w-3" />
                      Request Payload
                    </span>
                    {selectedLog.request_body && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopy(selectedLog.request_body, 'Request Body')}
                        className="h-6 px-2 text-[9px] text-primary-600 gap-1"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        Copy
                      </Button>
                    )}
                  </div>
                  <pre className="p-3 bg-content-bg border border-border-theme rounded-xl overflow-x-auto text-[10px] font-mono text-text-main max-h-40 no-scrollbar">
                    {selectedLog.request_body ? (
                      (() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.request_body), null, 2);
                        } catch {
                          return selectedLog.request_body;
                        }
                      })()
                    ) : (
                      <span className="text-text-muted italic">No request payload</span>
                    )}
                  </pre>
                </div>

                {/* Response Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
                      <FileCode className="h-3 w-3" />
                      Response Payload
                    </span>
                    {selectedLog.response_body && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopy(selectedLog.response_body, 'Response Body')}
                        className="h-6 px-2 text-[9px] text-primary-600 gap-1"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        Copy
                      </Button>
                    )}
                  </div>
                  <pre className="p-3 bg-content-bg border border-border-theme rounded-xl overflow-x-auto text-[10px] font-mono text-text-main max-h-40 no-scrollbar">
                    {selectedLog.response_body ? (
                      (() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.response_body), null, 2);
                        } catch {
                          return selectedLog.response_body;
                        }
                      })()
                    ) : (
                      <span className="text-text-muted italic">No response payload</span>
                    )}
                  </pre>
                </div>
              </div>

              {/* Action Button: RETRY */}
              {selectedLog.status?.toLowerCase() !== 'success' && (
                <div className="pt-2">
                  <Button 
                    variant="primary" 
                    className="w-full h-11 text-xs font-black uppercase tracking-widest gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                    onClick={() => handleRetry(selectedLog.request_log_id)}
                    disabled={retryingId === selectedLog.request_log_id}
                  >
                    <RefreshCw className={cn("h-4 w-4", retryingId === selectedLog.request_log_id && "animate-spin")} />
                    {retryingId === selectedLog.request_log_id ? 'Retrying...' : 'Trigger Manual Retry'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center text-center p-8 bg-card-bg/40 border border-dashed border-border-theme rounded-2xl h-80 text-text-muted/60 space-y-3">
              <Activity className="h-10 w-10 text-text-muted/30" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-main">No Log Selected</p>
                <p className="text-[11px] mt-1 max-w-[200px] leading-relaxed">
                  Select any request entry from the ledger to inspect live payloads, trace details, and trigger manual retries.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastComponent />
    </div>
  );
}
