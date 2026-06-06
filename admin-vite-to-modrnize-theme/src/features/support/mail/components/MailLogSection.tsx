import React, { useEffect, useState } from 'react';
import { mailLogService } from '@/lib/mail/api/mail.service';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Mail, Clock, AlertCircle, CheckCircle, Send, XCircle } from 'lucide-react';

interface MailLogSectionProps {
  groupId: number;
}

const STATUS_MAP: Record<number, { label: string; variant: 'warning' | 'info' | 'success' | 'danger'; icon: React.ReactNode }> = {
  0: { label: 'Queued', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
  1: { label: 'Sending', variant: 'info', icon: <Send className="h-3 w-3" /> },
  2: { label: 'Sent', variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
  3: { label: 'Failed', variant: 'danger', icon: <XCircle className="h-3 w-3" /> },
};

export function MailLogSection({ groupId }: MailLogSectionProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await mailLogService.getGridData({
          Limit: 5, Offset: 0,
          ApprovalFilterData: JSON.stringify({ groupId }),
        });
        if (mounted) {
          const rows = resp?.data?.rows || resp?.data || [];
          setLogs(Array.isArray(rows) ? rows.slice(0, 5) : []);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted py-2">
        <Loader className="h-3 w-3" />
        Loading logs...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-xs text-text-muted/50 italic py-2">
        No recent logs for this group
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {logs.map((log: any) => {
        const status = STATUS_MAP[log.status] || STATUS_MAP[0];
        return (
          <div key={log.log_id} className="flex items-center justify-between text-[10px] py-1.5 px-2 rounded-lg bg-content-bg/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-text-muted shrink-0">{status.icon}</span>
              <span className="truncate text-text-main font-medium">
                {log.recipient_email || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={status.variant} className="text-[8px] px-1.5 py-0">
                {status.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
