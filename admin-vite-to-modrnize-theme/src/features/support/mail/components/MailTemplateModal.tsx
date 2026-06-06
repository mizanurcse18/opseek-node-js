import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MailTemplateForm } from './MailTemplateForm';

interface MailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  groupId?: number;
  isSuperUser?: boolean;
  onSave?: () => void;
}

export function MailTemplateModal({ isOpen, onClose, initialData, groupId, isSuperUser = false, onSave }: MailTemplateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const title = initialData?.templateId || initialData?.template_id ? 'Edit Template' : 'New Template';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="2xl"
      headerAction={
        <Button
          type="submit"
          form="mail-template-form"
          isLoading={isLoading}
          size="sm"
        >
          {initialData?.templateId || initialData?.template_id ? 'Update' : 'Create'}
        </Button>
      }
    >
      <MailTemplateForm
        initialData={initialData}
        groupId={groupId}
        isSuperUser={isSuperUser}
        onSave={onSave}
        onClose={onClose}
        onLoadingChange={setIsLoading}
      />
    </Modal>
  );
}
