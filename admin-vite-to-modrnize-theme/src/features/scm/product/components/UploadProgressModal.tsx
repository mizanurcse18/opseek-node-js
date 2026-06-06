import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader2, CheckCircle, XCircle, SkipForward, AlertTriangle, RefreshCw } from 'lucide-react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { cn } from '@/lib/utils';


interface ProgressItem {
  item: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<any>;
  fileName?: string;
}

export default function UploadProgressModal({ isOpen, onClose, onSubmit, fileName }: UploadProgressModalProps) {
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [percent, setPercent] = useState(0);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [status, setStatus] = useState<'connecting' | 'uploading' | 'done' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const connectionRef = useRef<any>(null);
  const submitStartedRef = useRef(false);
  const itemsRef = useRef<ProgressItem[]>([]);
  const apiDoneRef = useRef(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addItem = useCallback((item: ProgressItem) => {
    itemsRef.current = [...itemsRef.current, item];
    setItems(itemsRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCurrent(0);
      setTotal(0);
      setPercent(0);
      setItems([]);
      setStatus('connecting');
      setErrorMessage('');
      submitStartedRef.current = false;
      itemsRef.current = [];
      apiDoneRef.current = false;
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const url = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_PREFIX || '/api/v1'}/auth/hubs/notification`;

    const token = localStorage.getItem('token');
    const signalrUrl = token ? `${url}?access_token=${encodeURIComponent(token)}` : url;

    const connection = new HubConnectionBuilder()
      .withUrl(signalrUrl, { withCredentials: false })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on('SendProgressAsync', (messageJson: string, progressPercent: number) => {
      try {
        const data = JSON.parse(messageJson);
        setCurrent(data.current || 0);
        setTotal(data.total || 0);
        setPercent(progressPercent || 0);
        if (data.item) {
          addItem({ item: data.item, status: data.status || 'created', message: data.message });
        }
        // If API already returned and all items processed, mark done
        if (apiDoneRef.current && data.current >= data.total) {
          setStatus('done');
        }
      } catch {
        // ignore parse errors
      }
    });

    connection.start()
      .then(() => {
        setStatus('uploading');
        if (!submitStartedRef.current) {
          submitStartedRef.current = true;
          onSubmit()
            .then(() => {
              apiDoneRef.current = true;
              // If progress already reached total, mark done; otherwise wait for last messages
              if (itemsRef.current.length > 0) {
                setStatus('done');
              } else {
                // Safety fallback: mark done after 2s even if no progress received
                doneTimerRef.current = setTimeout(() => setStatus('done'), 2000);
              }
            })
            .catch((err: any) => {
              setStatus('error');
              setErrorMessage(err?.message || 'Upload failed');
            });
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Failed to connect to server');
      });

    return () => {
      connection.off('SendProgressAsync');
      connection.stop();
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, [isOpen, onSubmit, addItem]);

  const summary = {
    created: items.filter(i => i.status === 'created').length,
    updated: items.filter(i => i.status === 'updated').length,
    skipped: items.filter(i => i.status === 'skipped').length,
    errors: items.filter(i => i.status === 'error').length,
  };

  return (
    <Modal isOpen={isOpen} onClose={status === 'done' || status === 'error' ? onClose : () => {}} title="CSV Upload Progress" maxWidth="lg">
      <div className="space-y-4">
        {fileName && (
          <p className="text-sm text-text-muted">File: <span className="font-medium text-text-main">{fileName}</span></p>
        )}

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {status === 'connecting' && 'Connecting...'}
              {status === 'uploading' && `Processing ${current} of ${total}`}
              {status === 'done' && 'Completed'}
              {status === 'error' && 'Error'}
            </span>
            <span>{Math.round(percent)}%</span>
          </div>
          <div className="w-full h-2 bg-border-theme rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                status === 'error' ? 'bg-red-500' : 'bg-primary-500'
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Summary when done */}
        {status === 'done' && (
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3.5 w-3.5" /> {summary.created} created</span>
            {summary.updated > 0 && <span className="flex items-center gap-1 text-blue-600"><RefreshCw className="h-3.5 w-3.5" /> {summary.updated} updated</span>}
            <span className="flex items-center gap-1 text-yellow-600"><SkipForward className="h-3.5 w-3.5" /> {summary.skipped} skipped</span>
            {summary.errors > 0 && (
              <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" /> {summary.errors} errors</span>
            )}
          </div>
        )}

        {status === 'error' && errorMessage && (
          <p className="text-xs text-red-500">{errorMessage}</p>
        )}

        {/* Live items list */}
        <div className="max-h-60 overflow-y-auto space-y-1 border border-border-theme rounded-lg p-2">
          {items.length === 0 && status === 'connecting' && (
            <p className="text-xs text-text-muted text-center py-4">Waiting for connection...</p>
          )}
          {items.length === 0 && (status === 'uploading' || status === 'done') && (
            <p className="text-xs text-text-muted text-center py-4">No items processed yet</p>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-surface-bg/50">
              {item.status === 'created' && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
              {item.status === 'updated' && <RefreshCw className="h-3 w-3 text-blue-500 shrink-0" />}
              {item.status === 'skipped' && <SkipForward className="h-3 w-3 text-yellow-500 shrink-0" />}
              {item.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
              <span className="flex-1 truncate">{item.item}</span>
              {item.message && <span className="text-text-muted truncate max-w-[120px]">{item.message}</span>}
            </div>
          ))}
        </div>

        {/* Spinner during upload */}
        {status === 'uploading' && (
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading...
          </div>
        )}
      </div>
    </Modal>
  );
}
