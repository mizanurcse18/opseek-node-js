import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { VisitPlanForm } from './VisitPlanForm';
import { Loader } from '@/components/ui/Loader';
import { Save } from 'lucide-react';
import { useState } from 'react';

interface VisitPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initialData?: any;
  isSuperUser?: boolean;
}

export function VisitPlanModal({ isOpen, onClose, onSave, initialData, isSuperUser }: VisitPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!(initialData?.plan_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={isEditing ? 'Edit Visit Plan' : 'Create Visit Plan'}
      headerAction={
        <div className="flex items-center gap-3 pr-2">
          {isSuperUser && (
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded uppercase tracking-[0.15em]">
              Super Admin
            </span>
          )}
          <Button
            type="submit"
            form="visit-plan-form"
            disabled={loading}
            className="bg-[#2e125c] hover:bg-[#3d187a] text-white flex items-center gap-2 py-1.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">
                  {isEditing ? 'Update Plan' : 'Save Plan'}
                </span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="relative">
        <div className="absolute -top-10 inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-500/5 pointer-events-none" />
        <VisitPlanForm
          initialData={initialData}
          isSuperUser={isSuperUser}
          onSave={onSave}
          onClose={onClose}
          onLoadingChange={setLoading}
        />
      </div>
    </Modal>
  );
}
