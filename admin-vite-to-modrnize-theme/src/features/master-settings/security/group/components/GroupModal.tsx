import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { MultiSelect, Option } from '@/components/ui/MultiSelect';
import { securityService } from '@/lib/auth/api/security.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Shield, Info, Save, Loader2 } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui-old/Select';
import { companyService } from '@/lib/auth/api/company.service';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  isSuperUser?: boolean;
}

export function GroupModal({ isOpen, onClose, onSave, initialData, isSuperUser = false }: GroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<Option[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const { toast, ToastComponent } = useToast();
  
  const isEditing = !!(initialData?.security_group_id || initialData?.group_id || initialData?.GroupID);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save Group' },
    { button_id: 'btnEdit', button_title: 'Update Group' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;
  const canSave = activeBtn?.visible ?? false;

  const [formData, setFormData] = useState({
    group_id: 0,
    group_name: '',
    description: '',
    row_version: 1,
    company_id: initialData?.company_id || initialData?.CompanyID || '',
    selectedRoleIds: [] as (string | number)[]
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [companies, setCompanies] = useState<{ value: string, label: string }[]>([]);

  const isInitialMount = React.useRef(true);
  
  // Effect 1: Initialize Data and Companies
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (!isOpen) return;

      const groupId = initialData?.security_group_id || initialData?.group_id || initialData?.GroupID;
      
      setLoading(true);
      try {
        // Load companies if superuser
        if (isSuperUser && companies.length === 0) {
          const rawCompanies = await securityService.getAllCompaniesCombo();
          if (isMounted && rawCompanies && Array.isArray(rawCompanies)) {
            const mapped = rawCompanies.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id || '?'}`
            }));
            setCompanies(mapped);
          }
        }

        // If editing, fetch full group details
        if (groupId) {
          const response = await securityService.getGroupById(groupId);
          if (isMounted && response?.data) {
            const groupData = response.data.group || response.data.Master || response.data;
            const groupRulesItems = response.data.group_rules || response.data.Rules || response.data.ChildModels || [];

            setFormData({
              group_id: groupData.group_id || groupData.GroupID || groupId || 0,
              group_name: groupData.group_name || groupData.GroupName || '',
              description: groupData.description || groupData.Description || '',
              row_version: groupData.row_version || groupData.RowVersion || 1,
              company_id: groupData.company_id || groupData.CompanyID || '',
              selectedRoleIds: groupRulesItems.map((c: any) => String(c.SecurityRuleID || c.security_rule_id || ''))
            });
          }
        } else if (isMounted) {
          setFormData({
            group_id: 0,
            group_name: '',
            description: '',
            row_version: 1,
            company_id: '',
            selectedRoleIds: []
          });
          setErrors({});
        }
      } catch (error) {
        if (isMounted) toast(handleApiError(error));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeData();

    return () => { isMounted = false; };
  }, [isOpen, initialData?.security_group_id]);

  // Effect 2: Cascading Rules Fetching
  useEffect(() => {
    let isMounted = true;

    const fetchRules = async () => {
      if (!isOpen) return;

      // If SuperUser and no company selected, clear rules and wait
      if (isSuperUser && !formData.company_id) {
        setRoles([]);
        if (!isInitialMount.current) {
          setFormData(prev => ({ ...prev, selectedRoleIds: [] }));
        }
        return;
      }

      setRolesLoading(true);
      try {
        let ruleList;
        if (isSuperUser && formData.company_id) {
          ruleList = await securityService.getSecurityRulesSuperCombo(formData.company_id);
        } else {
          ruleList = await securityService.getSecurityRulesCombo();
        }

        if (isMounted) {
          const roleOptions = ruleList.map((r: any) => ({
            value: r.value,
            label: r.label
          }));
          setRoles(roleOptions);

          // Clear selection on company change, but NOT on initial load (when editing)
          if (isSuperUser && !isInitialMount.current) {
            setFormData(prev => ({ ...prev, selectedRoleIds: [] }));
          }
        }
      } catch (error) {
        if (isMounted) console.error("Failed to fetch roles:", error);
      } finally {
        if (isMounted) {
          setRolesLoading(false);
          isInitialMount.current = false;
        }
      }
    };

    fetchRules();

    return () => { isMounted = false; };
  }, [isOpen, formData.company_id, isSuperUser]);

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.group_name.trim()) {
      newErrors.group_name = 'Group Name is required';
    }

    if (isSuperUser && !formData.company_id) {
      newErrors.company_id = 'Company selection is required for Super User.';
    }

    if (formData.selectedRoleIds.length === 0) {
      newErrors.selectedRoleIds = 'At least one security rule must be selected';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        group: {
          GroupID: formData.group_id,
          GroupName: formData.group_name,
          group_name: formData.group_name,
          SecurityGroupName: formData.group_name,
          Description: formData.description,
          description: formData.description,
          SecGroupDescription: formData.description,
          RowVersion: formData.row_version,
          row_editor_status: initialData?.security_group_id ? 'updated' : 'inserted',
          ...(isSuperUser && { CompanyID: formData.company_id, company_id: formData.company_id })
        },
        rules: formData.selectedRoleIds.map(id => ({
          SecurityRuleID: id,
          SecurityRuleName: '', // Optional as per example
          SecurityRuleDescription: '', 
          RowVersion: 1,
          row_editor_status: initialData?.security_group_id ? 'updated' : 'inserted'
        }))
      };

      const response = isSuperUser 
        ? await securityService.saveGroupSuper(payload)
        : await securityService.saveGroup(payload);
        
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: `Group ${initialData ? 'updated' : 'created'} successfully!`, status: 'success' });
        setTimeout(() => {
          onSave(response.data);
          onClose();
        }, 800);
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const headerActionButton = activeBtn?.visible && (
    <Button 
      form="group-form"
      type="submit"
      size="sm"
      disabled={isSaving || loading}
      className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-4"
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
      title={isEditing ? 'Edit Security Group' : 'Create Security Group'}
      headerAction={headerActionButton}
      className="max-w-2xl"
    >
      <form id="group-form" onSubmit={handleFormSubmit} className="space-y-6 py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader className="h-8 w-8 text-primary-600" />
            <p className="text-xs font-black uppercase tracking-widest text-text-muted/50">Loading details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              {/* <div className="flex items-center gap-2 pb-2 border-b border-border-theme">
                  <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                     <Info className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Basic Information</h3>
               </div> */}

              <div className="grid grid-cols-1 gap-4">
                {isSuperUser && (
                  <div className="space-y-2">
                    <Label required>Company</Label>
                    <Select
                      options={companies}
                      value={formData.company_id}
                      onChange={(val) => {
                        setFormData({ ...formData, company_id: val });
                        if (errors.company_id) setErrors({ ...errors, company_id: '' });
                      }}
                      placeholder="Select a company"
                      error={!!errors.company_id}
                    />
                    {errors.company_id && <p className="text-[10px] font-bold text-red-500">{errors.company_id}</p>}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label required>Group Name</Label>
                  <Input
                    placeholder="e.g. Administrators"
                    value={formData.group_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, group_name: e.target.value }));
                      if (errors.group_name) setErrors(prev => ({ ...prev, group_name: '' }));
                    }}
                    className={errors.group_name ? "border-red-500 focus:ring-red-100" : ""}
                  />
                  {errors.group_name && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.group_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter group description..."
                  className="h-20"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Role Assignment Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-border-theme">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Assigned Roles</h3>
              </div>

              <div className="space-y-2">
                <Label required>Security Rules</Label>
                <div className="relative">
                  <MultiSelect
                    options={roles}
                    value={formData.selectedRoleIds}
                    disabled={rolesLoading || (isSuperUser && !formData.company_id)}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, selectedRoleIds: val }));
                      if (errors.selectedRoleIds) setErrors(prev => ({ ...prev, selectedRoleIds: '' }));
                    }}
                    placeholder={rolesLoading ? "Loading rules..." : "Click to search and select roles..."}
                    className={errors.selectedRoleIds ? "border-red-500" : ""}
                  />
                  {rolesLoading && (
                    <div className="absolute right-10 top-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                    </div>
                  )}
                </div>
                {errors.selectedRoleIds ? (
                  <p className="text-[10px] font-bold text-red-500 mt-1">{errors.selectedRoleIds}</p>
                ) : (
                  <p className="text-[10px] text-text-muted/50 italic px-1">Selected roles define the collective permissions for this group.</p>
                )}
              </div>
            </div>
          </div>
        )}


      </form>
      {!canSave && !loading && (
        <div className="absolute top-0 right-0 p-4">
           <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 flex items-center gap-2">
              <Shield className="h-3 w-3" /> Read-Only Mode
           </span>
        </div>
      )}
      <ToastComponent />
    </Modal>
  );
}
