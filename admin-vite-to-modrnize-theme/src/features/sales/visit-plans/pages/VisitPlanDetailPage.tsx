import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { visitPlanService } from '../api/visit-plans.api';
import VisitPlanRouteView from '../components/VisitPlanRouteView';
import { VisitPlanSubmitModal } from '../components/VisitPlanSubmitModal';
import { ArrowLeft, Play, XCircle, CheckCircle2, MapPin } from 'lucide-react';
import { PLAN_STATUS_OPTIONS, PLAN_TYPE_OPTIONS } from '../types';

export default function VisitPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitDetail, setSubmitDetail] = useState<any>(null);
  const { toast, ToastComponent } = useToast();

  const loadPlan = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const res = await visitPlanService.getPlan(planId);
      setPlan(res?.data || res);
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlan(); }, [planId]);

  const handleActivate = async () => {
    const res = await visitPlanService.activatePlan(planId!);
    if (res?.status_code === 200 || res?.response_code === 'SUCCESS') {
      toast({ title: 'Success', description: 'Plan activated.', status: 'success' });
      loadPlan();
    } else toast(handleApiError(res));
  };

  const handleComplete = async () => {
    const res = await visitPlanService.completePlan(planId!);
    if (res?.status_code === 200 || res?.response_code === 'SUCCESS') {
      toast({ title: 'Success', description: 'Plan completed.', status: 'success' });
      loadPlan();
    } else toast(handleApiError(res));
  };

  const handleCancel = async () => {
    const res = await visitPlanService.cancelPlan(planId!);
    if (res?.status_code === 200 || res?.response_code === 'SUCCESS') {
      toast({ title: 'Success', description: 'Plan cancelled.', status: 'success' });
      loadPlan();
    } else toast(handleApiError(res));
  };

  const handleVerify = async (detailId: number) => {
    const res = await visitPlanService.verifyVisit(detailId);
    if (res?.status_code === 200 || res?.response_code === 'SUCCESS') {
      toast({ title: 'Success', description: 'Visit verified.', status: 'success' });
      loadPlan();
    } else toast(handleApiError(res));
  };

  const handleReject = async (detailId: number, reason?: string) => {
    const res = await visitPlanService.rejectVisit(detailId, reason);
    if (res?.status_code === 200 || res?.response_code === 'SUCCESS') {
      toast({ title: 'Success', description: 'Visit rejected.', status: 'success' });
      loadPlan();
    } else toast(handleApiError(res));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-16">
        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-main">Plan not found</h3>
        <Button onClick={() => navigate('/sales/visit-plans')} className="mt-4" variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to plans
        </Button>
      </div>
    );
  }

  const statusOpt = PLAN_STATUS_OPTIONS.find(o => o.value === plan.status);
  const planTypeOpt = PLAN_TYPE_OPTIONS.find(o => o.value === plan.plan_type);
  const isDraft = plan.status === 0 || plan.status === '0';
  const isActive = plan.status === 1 || plan.status === '1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sales/visit-plans')}
            className="h-9 w-9 p-0 mt-0.5">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text-main">{plan.plan_name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusOpt?.color || ''}`}>
                {statusOpt?.label || 'Unknown'}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border text-violet-600 bg-violet-50 border-violet-100">
                {planTypeOpt?.label || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {plan.dealer_business_name || `Dealer #${plan.dealer_id}`} —{' '}
              {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '—'} to {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button onClick={handleActivate} size="sm"
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3">
              <Play className="h-3 w-3" /> Activate
            </Button>
          )}
          {isActive && (
            <Button onClick={handleComplete} size="sm"
              className="h-8 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3">
              <CheckCircle2 className="h-3 w-3" /> Complete
            </Button>
          )}
          {(isDraft || isActive) && (
            <Button onClick={handleCancel} size="sm" variant="outline"
              className="h-8 text-red-600 border-red-200 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3">
              <XCircle className="h-3 w-3" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Route View */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <VisitPlanRouteView
          plan={plan}
          onSubmit={setSubmitDetail}
          onVerify={handleVerify}                  onReject={(id: number, reason?: string) => handleReject(id, reason)}
        />
      </div>

      {/* Submit Modal */}
      {submitDetail && (
        <VisitPlanSubmitModal
          detail={submitDetail}
          onClose={() => setSubmitDetail(null)}
          onSuccess={loadPlan}
        />
      )}

      <ToastComponent />
    </div>
  );
}
