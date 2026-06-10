import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { VisitPlanTemplateForm } from './VisitPlanTemplateForm';
import { visitPlanService } from '../api/visit-plans.api';
import type { VisitPlanTemplate } from '../types';

interface VisitPlanTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: VisitPlanTemplate | null;
  onSave: () => void;
  isSuperUser?: boolean;
}

export function VisitPlanTemplateModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  isSuperUser = false,
}: VisitPlanTemplateModalProps) {
  const [fullTemplate, setFullTemplate] = useState<VisitPlanTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronously reset state on render when modal opens or template changes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevTemplateId, setPrevTemplateId] = useState(initialData?.template_id);

  if (isOpen !== prevIsOpen || initialData?.template_id !== prevTemplateId) {
    setPrevIsOpen(isOpen);
    setPrevTemplateId(initialData?.template_id);
    setFullTemplate(null);
    setLoading(!!isOpen && !!initialData?.template_id && !initialData?.details?.length);
  }

  // When editing, fetch full template data (including details) by ID
  useEffect(() => {
    const templateId = initialData?.template_id;

    if (!isOpen || !templateId) {
      setFullTemplate(null);
      return;
    }

    // If initialData already has details, use it directly
    if (initialData.details?.length) {
      setFullTemplate(initialData as VisitPlanTemplate);
      return;
    }

    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const res = await visitPlanService.getTemplate(templateId);
        // Guard against stale responses (modal closed/reopened for different template)
        if (initialData?.template_id !== templateId) return;

        const data = res?.data || res;
        if (data) {
          setFullTemplate({
            template_id: data.template_id,
            template_name: data.template_name || '',
            dealer_id: data.dealer_id || initialData.dealer_id,
            dealer_business_name: data.dealer_business_name || initialData.dealer_business_name,
            status: data.status ?? initialData.status ?? 0,
            status_name: data.status_name,
            notes: data.notes,
            company_id: data.company_id,
            created_date: data.created_date,
            details: Array.isArray(data.details) ? data.details : [],
          });
        } else {
          setFullTemplate(initialData as VisitPlanTemplate);
        }
      } catch (err) {
        console.error('Failed to load template details', err);
        setFullTemplate(initialData as VisitPlanTemplate);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [isOpen, initialData?.template_id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={initialData ? 'Edit Template' : 'New Template'}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-sm text-gray-500">Loading template...</span>
        </div>
      ) : (
        <VisitPlanTemplateForm
          initialData={fullTemplate || initialData}
          isSuperUser={isSuperUser}
          onSave={onSave}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
