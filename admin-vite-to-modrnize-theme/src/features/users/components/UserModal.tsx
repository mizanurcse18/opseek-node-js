import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import UserForm from './UserForm';
import { Button } from '@/components/ui/Button';
import { Save, Loader2 } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  roleType?: string;
}

export function UserModal({ isOpen, onClose, initialData, isSuperUser = false, onSave, roleType }: UserModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!initialData;

  // Use permissions handle for header button
  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save User' },
    { button_id: 'btnEdit', button_title: 'Update User' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;

  const headerActionButton = activeBtn?.visible && (
    <Button
      form="user-form"
      type="submit"
      size="sm"
      disabled={isSaving}
      className="bg-[#3b2768] hover:bg-[#2d1e50] flex items-center gap-2 px-4 whitespace-nowrap"
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
      title={isEditing ? 'Edit User Record' : 'Enroll New User'}
      headerAction={headerActionButton}
      className="max-w-xl"
    >
      <div className="py-2">
        <UserForm 
          initialData={initialData}
          isSuperUser={isSuperUser}
          isEditing={isEditing}
          onSave={onSave}
          onClose={onClose}
          onLoadingChange={setIsSaving}
          roleType={roleType}
        />
      </div>
    </Modal>
  );
}
