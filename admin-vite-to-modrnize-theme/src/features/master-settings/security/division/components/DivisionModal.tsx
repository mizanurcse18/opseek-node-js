import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DivisionForm } from './DivisionForm';
import { Button } from '@/components/ui/Button';
import { Save, Loader2 } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface DivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
}

export function DivisionModal({ isOpen, onClose, initialData, isSuperUser = false, onSave }: DivisionModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!initialData;

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save Division' },
    { button_id: 'btnEdit', button_title: 'Update Division' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;

  const headerActionButton = activeBtn?.visible && (
    <Button
      form="division-form"
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
      title={isEditing ? 'Edit Division Record' : 'Add New Division'}
      headerAction={headerActionButton}
      className="max-w-lg"
    >
      <div className="py-2">
        <DivisionForm 
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
