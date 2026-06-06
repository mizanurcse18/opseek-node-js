import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ThanaForm } from './ThanaForm';
import { Button } from '@/components/ui/Button';
import { Save, Loader2 } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface ThanaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
}

export function ThanaModal({ isOpen, onClose, initialData, isSuperUser = false, onSave }: ThanaModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!initialData;

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save Thana' },
    { button_id: 'btnEdit', button_title: 'Update Thana' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;

  const headerActionButton = activeBtn?.visible && (
    <Button
      form="thana-form"
      type="submit"
      size="sm"
      disabled={isSaving}
      className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-4 whitespace-nowrap"
    >
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest text-white">
        {isSaving ? 'Saving...' : activeBtn.button_title}
      </span>
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Thana Record' : 'Add New Thana'}
      headerAction={headerActionButton}
      className="max-w-lg"
    >
      <div className="py-2">
        <ThanaForm 
          initialData={initialData}
          isSuperUser={isSuperUser}
          onSave={onSave}
          onClose={onClose}
          onLoadingChange={setIsSaving}
        />
      </div>
    </Modal>
  );
}
