import { useMemo } from 'react';
import { VISIT_STATUS_OPTIONS } from '../types';
import { cn } from '@/lib/utils';
import { MapPin, CheckCircle2, Clock, XCircle, Navigation, Camera } from 'lucide-react';

interface VisitPlanRouteViewProps {
  plan: any;
  onVerify?: (detailId: number) => void;
  onReject?: (detailId: number, reason: string) => void;
  onSubmit?: (detail: any) => void;
  readOnly?: boolean;
}

function StatusDot({ status }: { status: number }) {
  const colors: Record<number, string> = {
    0: 'bg-gray-300',
    1: 'bg-blue-500',
    2: 'bg-red-400',
    3: 'bg-amber-400',
    4: 'bg-purple-500',
    5: 'bg-green-500',
    6: 'bg-rose-500',
  };
  return (
    <div className={cn(
      "w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0",
      colors[status] || 'bg-gray-300'
    )} />
  );
}

function StatusIcon({ status }: { status: number }) {
  if (status >= 5) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 4) return <Clock className="h-4 w-4 text-purple-600" />;
  if (status === 6) return <XCircle className="h-4 w-4 text-rose-600" />;
  if (status === 2) return <XCircle className="h-4 w-4 text-red-400" />;
  return <MapPin className="h-4 w-4 text-primary-500" />;
}

export default function VisitPlanRouteView({ plan, onVerify, onReject, onSubmit, readOnly }: VisitPlanRouteViewProps) {
  const details = plan?.details || [];
  const sortedDetails = useMemo(() =>
    [...details].sort((a: any, b: any) => (a.visit_order || 0) - (b.visit_order || 0)),
  [details]);

  const stats = useMemo(() => {
    const total = sortedDetails.length;
    const pending = sortedDetails.filter((d: any) => d.status === 0 || d.status == null).length;
    const submitted = sortedDetails.filter((d: any) => d.status === 4).length;
    const verified = sortedDetails.filter((d: any) => d.status === 5).length;
    const rejected = sortedDetails.filter((d: any) => d.status === 6).length;
    return { total, pending, submitted, verified, rejected };
  }, [sortedDetails]);

  const statusLabel = (status: number) => {
    const opt = VISIT_STATUS_OPTIONS.find(o => o.value === status);
    return opt?.label || 'Unknown';
  };

  const formatDateTime = (dt: string) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-600 bg-gray-50 border-gray-200' },
          { label: 'Pending', value: stats.pending, color: 'text-gray-500 bg-gray-50 border-gray-200' },
          { label: 'Submitted', value: stats.submitted, color: 'text-purple-600 bg-purple-50 border-purple-200' },
          { label: 'Verified', value: stats.verified, color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-600 bg-rose-50 border-rose-200' },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.color)}>
            <div className="text-lg font-black">{s.value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline Route */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gray-100" />
        <div
          className="absolute left-[23px] top-0 w-0.5 bg-primary-400 transition-all"
          style={{ height: `${(stats.verified + stats.submitted) / Math.max(stats.total, 1) * 100}%` }}
        />

        <div className="space-y-3">
          {sortedDetails.map((detail: any, index: number) => {
            const status = detail.status ?? 0;
            const editable = status === 0 || status == null;
            const canVerify = status === 4;
            const hasCoords = detail.planned_latitude || detail.planned_longitude;
            const hasCheckin = detail.check_in_time;

            return (
              <div key={detail.detail_id || index} className="relative flex gap-4 group">
                {/* Timeline node */}
                <div className="flex flex-col items-center pt-1.5">
                  <StatusDot status={status} />
                </div>

                {/* Card */}
                <div className={cn(
                  "flex-1 rounded-lg border p-4 transition-all",
                  "hover:shadow-md bg-white",
                  editable ? "border-gray-200 hover:border-primary-200" :
                  status === 5 ? "border-green-200 bg-green-50/30" :
                  status === 6 ? "border-rose-200 bg-rose-50/30" :
                  status === 4 ? "border-purple-200 bg-purple-50/30" :
                  "border-gray-200"
                )}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0",
                        "border-2",
                        editable ? "bg-gray-50 border-gray-200 text-gray-400" :
                        "bg-primary-500 border-primary-500 text-white"
                      )}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-text-main block truncate">
                          {detail.location_name || `Stop #${detail.visit_order || index + 1}`}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {detail.visit_date ? new Date(detail.visit_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusIcon status={status} />
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        status === 0 ? 'text-gray-400' :
                        status === 5 ? 'text-green-600' :
                        status === 6 ? 'text-rose-600' :
                        status === 4 ? 'text-purple-600' :
                        'text-gray-600'
                      )}>
                        {statusLabel(status)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                    <div>
                      <span className="font-black uppercase tracking-widest text-text-muted/50">DSR</span>
                      <p className="font-bold text-text-main mt-0.5">#{detail.dsr_user_id}</p>
                    </div>
                    {detail.agent_user_id && (
                      <div>
                        <span className="font-black uppercase tracking-widest text-text-muted/50">Agent</span>
                        <p className="font-bold text-text-main mt-0.5">#{detail.agent_user_id}</p>
                      </div>
                    )}
                    {hasCoords && (
                      <div>
                        <span className="font-black uppercase tracking-widest text-text-muted/50">GPS</span>
                        <p className="font-mono font-medium text-text-muted mt-0.5 truncate">
                          {detail.planned_latitude?.toFixed(4)}, {detail.planned_longitude?.toFixed(4)}
                        </p>
                      </div>
                    )}
                    {hasCheckin && (
                      <div>
                        <span className="font-black uppercase tracking-widest text-text-muted/50">Check-in</span>
                        <p className="font-bold text-text-main mt-0.5">{formatDateTime(detail.check_in_time)}</p>
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  {detail.comments && (
                    <div className="mt-2 text-[10px] text-text-muted italic bg-gray-50 rounded px-2 py-1">
                      "{detail.comments}"
                    </div>
                  )}

                  {/* Images */}
                  {detail.images?.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      <Camera className="h-3 w-3 text-text-muted" />
                      <span className="text-[9px] text-text-muted">{detail.images.length} photo{detail.images.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {!readOnly && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      {editable && onSubmit && (
                        <button
                          onClick={() => onSubmit(detail)}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          <Navigation className="h-3 w-3" /> Submit Visit
                        </button>
                      )}
                      {canVerify && onVerify && (
                        <button
                          onClick={() => onVerify(detail.detail_id)}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-600 hover:text-green-700 transition-colors"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Verify
                        </button>
                      )}
                      {canVerify && onReject && (
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason !== null) onReject(detail.detail_id, reason);
                          }}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-colors"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
