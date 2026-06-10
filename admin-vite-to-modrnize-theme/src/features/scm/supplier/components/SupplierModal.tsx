import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SupplierForm } from './SupplierForm';
import { Loader } from '@/components/ui/Loader';
import { Save } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
  isSuperUser?: boolean;
}

export function SupplierModal({ isOpen, onClose, onSave, initialData, isSuperUser }: SupplierModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const isEditing = !!(initialData?.supplier_id || initialData?.id);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="lg"
      title={isEditing ? 'Edit Supplier' : 'Create Supplier'}
      headerAction={
        <div className="flex items-center gap-3 pr-2">
          {isSuperUser && (
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded uppercase tracking-[0.15em]">
              Super Admin
            </span>
          )}
          <Button 
            type="submit" 
            form="supplier-form"
            disabled={loading || saving}
            className="bg-[#2e125c] hover:bg-[#3d187a] text-white flex items-center gap-2 py-1.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {saving ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Saving...</span>
              </>
            ) : loading ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Loading...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">
                  {isEditing ? 'Update Supplier' : 'Save Supplier'}
                </span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="relative">
        <div className="absolute -top-10 inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-500/5 pointer-events-none" />
        <SupplierForm
          initialData={initialData}
          isSuperUser={isSuperUser}
          onSave={onSave}
          onClose={onClose}
          onLoadingChange={setLoading}
          onSavingChange={setSaving}
        />
      </div>
    </Modal>
  );
}
