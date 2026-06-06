import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DistrictForm } from './DistrictForm';
import { Button } from '@/components/ui/Button';
import { Save, Loader2 } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface DistrictModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
}

export function DistrictModal({ isOpen, onClose, initialData, isSuperUser = false, onSave }: DistrictModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!initialData;

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save District' },
    { button_id: 'btnEdit', button_title: 'Update District' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;

  const headerActionButton = activeBtn?.visible && (
    <Button
      form="district-form"
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
      title={isEditing ? 'Edit District Record' : 'Add New District'}
      headerAction={headerActionButton}
      className="max-w-lg"
    >
      <div className="py-2">
        <DistrictForm 
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
