import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { WarehouseForm } from './WarehouseForm';
import { Loader } from '@/components/ui/Loader';
import { Save } from 'lucide-react';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
  isSuperUser?: boolean;
}

export function WarehouseModal({ isOpen, onClose, onSave, initialData, isSuperUser }: WarehouseModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const isEditing = !!(initialData?.warehouse_id || initialData?.id);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="lg"
      title={isEditing ? 'Edit Warehouse' : 'Create Warehouse'}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          {isSuperUser && (
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded uppercase tracking-[0.15em] mr-auto">
              Super Admin
            </span>
          )}
          <Button 
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading || saving}
            className="text-xs font-bold py-2 px-4 rounded-lg border-border-theme hover:bg-primary-500/5 transition-all text-text-main"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="warehouse-form"
            disabled={loading || saving}
            className="bg-[#2e125c] hover:bg-[#3d187a] text-white flex items-center gap-2 py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all"
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
                  {isEditing ? 'Update Warehouse' : 'Save Warehouse'}
                </span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="relative">
        <div className="absolute -top-10 inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-500/5 pointer-events-none" />
        <WarehouseForm
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
