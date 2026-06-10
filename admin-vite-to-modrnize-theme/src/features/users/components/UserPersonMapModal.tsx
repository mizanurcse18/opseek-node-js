import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { apiService } from '@/lib/api.service';
import { userService } from '@/lib/auth/api/user.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Loader2, UserCheck, UserCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

interface UserPersonMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  user: any;
}

export function UserPersonMapModal({ isOpen, onClose, onSave, user }: UserPersonMapModalProps) {
  const [persons, setPersons] = useState<{ value: string | number; label: string }[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const { toast, ToastComponent } = useToast();

  const userName = user?.user_name || user?.UserName || '';
  const userFullName = user?.full_name || user?.FullName || 'N/A';
  const userId = user?.user_id || user?.UserID;

  useEffect(() => {
    if (isOpen) {
      loadPersons();
      setSelectedPersonId(null);
    }
  }, [isOpen]);

  const loadPersons = async () => {
    setLoadingPersons(true);
    try {
      const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_PERSONS);
      const data = response?.data || response || [];
      if (Array.isArray(data)) {
        setPersons(data.map((p: any) => ({
          value: p.value || p.person_id,
          label: p.label || p.full_name || `Person #${p.value || p.person_id}`
        })));
      }
    } catch (error) {
      console.error('Failed to load persons:', error);
      toast({ title: 'Error', description: 'Failed to load persons list.', status: 'error' });
    } finally {
      setLoadingPersons(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPersonId) {
      toast({ title: 'Validation Error', description: 'Please select a person to map.', status: 'error' });
      return;
    }
    if (!userId) {
      toast({ title: 'Error', description: 'Invalid user data.', status: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await userService.mapUserAndPerson({
        UserID: userId,
        PersonID: Number(selectedPersonId),
      });

      if (response && (response.status_code === 200 || response.response_code === 'OK' || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'User mapped to person successfully!', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Map User to Person"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !selectedPersonId}
              isLoading={isSaving}
              className="bg-[#3b2768] hover:bg-[#2d1e50]"
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Map & Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {/* Selected User Info */}
          <div className="bg-primary-500/5 rounded-lg p-4 border border-primary-500/10">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                <UserCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Selected User</p>
                <p className="text-sm font-bold text-text-main truncate">@{userName}</p>
                <p className="text-xs text-text-muted/70 mt-0.5">{userFullName}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/10 text-primary-700">
                    ID: {userId}
                  </span>
                  {user.user_type_name && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700">
                      {user.user_type_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Person Select */}
          <div className="space-y-2">
            <label className="text-sm font-bold leading-none text-text-main flex items-center gap-2">
              <UserCircle className="h-3.5 w-3.5 text-primary-500" />
              Select Person <span className="text-red-500">*</span>
            </label>
            {loadingPersons ? (
              <div className="flex items-center gap-2 py-3 px-3 rounded-lg border border-border-theme">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                <span className="text-xs text-text-muted">Loading persons...</span>
              </div>
            ) : persons.length === 0 ? (
              <div className="flex items-center gap-2 py-3 px-3 rounded-lg border border-border-theme bg-amber-50/50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-700">No persons found. Create a person record first.</span>
              </div>
            ) : (
              <Select
                options={persons}
                value={selectedPersonId}
                onChange={(val) => setSelectedPersonId(val)}
                placeholder="Search and select a person..."
                isSearchable={true}
                isClearable={true}
              />
            )}
          </div>

          {/* Info note */}
          <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700/80 leading-relaxed">
              This will create or update a <strong>stakeholder</strong> record linking the selected user with the chosen person. The user's PersonID will also be updated.
            </p>
          </div>
        </div>
      </Modal>
      <ToastComponent />
    </>
  );
}
