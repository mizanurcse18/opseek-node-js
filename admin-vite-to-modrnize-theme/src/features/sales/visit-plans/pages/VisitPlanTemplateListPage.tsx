import { useState, useCallback } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import VisitPlanTemplateTable from '../components/VisitPlanTemplateTable';
import { VisitPlanTemplateModal } from '../components/VisitPlanTemplateModal';
import { GeneratePlanModal } from '../components/GeneratePlanModal';
import { CalendarDays } from 'lucide-react';

interface VisitPlanTemplateListPageProps {
  isSuperUser?: boolean;
}

export default function VisitPlanTemplateListPage({ isSuperUser = false }: VisitPlanTemplateListPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [generateTemplate, setGenerateTemplate] = useState<any>(null);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const handleSave = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((template: any) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  }, []);

  const handleGenerateClose = useCallback(() => {
    setGenerateTemplate(null);
  }, []);

  const handleGenerateSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Visit Plan Templates'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Define weekly recurring visit schedules
          </p>
        </div>
      </div>

      <VisitPlanTemplateTable
        key={refreshKey}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onGenerate={setGenerateTemplate}
        isSuperUser={isSuperUser}
      />

      <VisitPlanTemplateModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedTemplate}
        onSave={handleSave}
        isSuperUser={isSuperUser}
      />

      {generateTemplate && (
        <GeneratePlanModal
          template={generateTemplate}
          onClose={handleGenerateClose}
          onSuccess={handleGenerateSuccess}
        />
      )}

      <ToastComponent />
    </div>
  );
}
