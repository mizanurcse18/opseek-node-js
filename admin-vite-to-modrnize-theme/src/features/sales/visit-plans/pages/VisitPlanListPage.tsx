import { useState, useCallback } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import VisitPlanTable from '../components/VisitPlanTable';
import { VisitPlanModal } from '../components/VisitPlanModal';
import { VisitPlanSubmitModal } from '../components/VisitPlanSubmitModal';
import { visitPlanService } from '../api/visit-plans.api';


interface VisitPlanListPageProps {
  isSuperUser?: boolean;
}

export default function VisitPlanListPage({ isSuperUser = false }: VisitPlanListPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [viewPlan, setViewPlan] = useState<any>(null);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const handleSave = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  }, []);

  const handleActivate = async (planId: number) => {
    try {
      const res = await visitPlanService.activatePlan(planId);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS')) {
        toast({ title: 'Success', description: 'Plan activated.', status: 'success' });
        setRefreshKey(prev => prev + 1);
      } else toast(handleApiError(res));
    } catch (err) { toast(handleApiError(err)); }
  };

  const handleCancel = async (planId: number) => {
    try {
      const res = await visitPlanService.cancelPlan(planId);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS')) {
        toast({ title: 'Success', description: 'Plan cancelled.', status: 'success' });
        setRefreshKey(prev => prev + 1);
      } else toast(handleApiError(res));
    } catch (err) { toast(handleApiError(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Visit Plans'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage DSR visit plans and route scheduling.
          </p>
        </div>
      </div>

      <VisitPlanTable
        key={refreshKey}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={setViewPlan}
        isSuperUser={isSuperUser}
      />

      <VisitPlanModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedPlan}
        onSave={handleSave}
        isSuperUser={isSuperUser}
      />

      <ToastComponent />
    </div>
  );
}
