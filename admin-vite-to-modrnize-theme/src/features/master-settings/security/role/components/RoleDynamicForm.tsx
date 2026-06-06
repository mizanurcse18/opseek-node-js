import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Save, 
  Shield, 
  IdCard, 
  User, 
  Building2, 
  Wallet, 
  Upload, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Layout,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { kycService } from '@/lib/auth/api/kyc.service';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui-old/Select';
import { userService } from '@/lib/auth/api/user.service';

const SECTIONS = [
  { id: 'NID', title: 'NID Scan', icon: IdCard, fields: ['nid_number', 'front_image', 'back_image'], hasOcr: true },
  { id: 'BasicInfo', title: 'Basic Information', icon: User, fields: ['first_name', 'last_name', 'father_name', 'mother_name', 'email', 'phone', 'present_address', 'permanent_address'] },
  { id: 'Documents', title: 'Additional Documents', icon: Upload, fields: ['trade_license', 'passport', 'other_docs'] },
  { id: 'Business', title: 'Business Details', icon: Building2, fields: ['business_name', 'industry_type', 'bin_number', 'tin_number', 'outlet_info'] },
  { id: 'Accounts', title: 'Financial Accounts', icon: Wallet, fields: ['bank_accounts', 'mfs_accounts'] }
];

interface RoleDynamicFormProps {
  roleId: number;
  roleName: string;
}

export function RoleDynamicForm({ roleId, roleName }: RoleDynamicFormProps) {
  const [config, setConfig] = useState<any>({
    sections: SECTIONS.map((s, idx) => ({ 
      id: s.id, 
      isVisible: true, 
      sequence: idx + 1,
      enableOcr: s.hasOcr ? true : undefined,
      fields: s.fields.map(f => ({ id: f, isVisible: true, isRequired: true }))
    }))
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, ToastComponent } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>('NID');
  const [selectedRoleId, setSelectedRoleId] = useState<number>(roleId);
  const [userTypes, setUserTypes] = useState<{ value: string | number, label: string }[]>([]);

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const fetchUserTypes = async () => {
    try {
      const resp = await userService.getUserTypes();
      const data = resp?.data || resp;
      if (data && Array.isArray(data)) {
        const options = data.map((t: any) => ({
          value: Number(t.value || t.id || t.security_rule_id),
          label: t.label || t.name || t.rule_name
        }));
        setUserTypes(options);
        if (roleId === 0 && options.length > 0) {
          setSelectedRoleId(options[0].value);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user types:', error);
    }
  };

  useEffect(() => {
    if (selectedRoleId) {
      loadConfig();
    }
  }, [selectedRoleId]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await kycService.getWorkflowConfig(selectedRoleId);
      if (response && response.data && Array.isArray(response.data.sections)) {
        setConfig(response.data);
      } else {
        // Reset to default
        setConfig({
          sections: SECTIONS.map((s, idx) => ({ 
            id: s.id, 
            isVisible: true, 
            sequence: idx + 1,
            fields: s.fields.map(f => ({ id: f, isVisible: true, isRequired: true }))
          }))
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await kycService.saveWorkflowConfig(selectedRoleId, config);
      toast({ title: 'Success', description: 'Dynamic form configuration updated.', status: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save configuration.', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setConfig((prev: any) => ({
      ...prev,
      sections: (prev.sections || []).map((s: any) => 
        s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
      )
    }));
  };

  const toggleField = (sectionId: string, fieldId: string, property: 'isVisible' | 'isRequired') => {
    setConfig((prev: any) => ({
      ...prev,
      sections: (prev.sections || []).map((s: any) => 
        s.id === sectionId ? {
          ...s,
          fields: (s.fields || []).map((f: any) => 
            f.id === fieldId ? { ...f, [property]: !f[property] } : f
          )
        } : s
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between bg-content-bg/30 p-4 rounded-2xl border border-border-theme/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight">
              {roleId === 0 ? 'Workflow Designer' : `Form Designer: ${roleName}`}
            </h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Configure dynamic fields for this role</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {roleId === 0 && (
            <Select 
              options={userTypes}
              value={selectedRoleId}
              onChange={(val) => setSelectedRoleId(Number(val))}
              className="min-w-[200px] h-9 text-[10px]"
            />
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-[10px] px-4 h-9 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Config
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {config?.sections?.map((section: any, idx: number) => {
          const master = SECTIONS.find(s => s.id === section.id);
          if (!master) return null;
          const isExpanded = expandedSection === section.id;

          return (
            <div 
              key={section.id}
              className={cn(
                "bg-card-bg border rounded-2xl transition-all duration-300 overflow-hidden",
                section.isVisible ? "border-border-theme shadow-sm" : "border-border-theme/30 opacity-60 grayscale-[0.5]"
              )}
            >
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    section.isVisible ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-300"
                  )}>
                    <master.icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-tight">{master.title}</h3>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Section {idx + 1}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-black uppercase text-text-muted/50 tracking-tighter">Visible</span>
                    <input 
                      type="checkbox"
                      checked={section.isVisible}
                      onChange={() => toggleSection(section.id)}
                      className="w-3.5 h-3.5 rounded border-border-theme text-primary-600 focus:ring-primary-600/20"
                    />
                  </div>
                  <div className="h-8 w-[1px] bg-border-theme/50 mx-1" />
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className="h-8 w-8 p-0 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border-theme/50 bg-content-bg/20 p-5 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section?.fields?.map((field: any) => (
                      <div 
                        key={field.id}
                        className="bg-card-bg border border-border-theme/50 p-3 rounded-xl flex items-center justify-between group hover:border-primary-600/20 hover:shadow-sm transition-all"
                      >
                        <span className="text-[10px] font-bold text-text-main capitalize">{field.id.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[7px] font-black uppercase text-text-muted/40 tracking-tighter">Show</span>
                            <input 
                              type="checkbox"
                              checked={field.isVisible}
                              onChange={() => toggleField(section.id, field.id, 'isVisible')}
                              className="w-3 h-3 rounded border-border-theme text-primary-600 focus:ring-primary-600/20"
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[7px] font-black uppercase text-text-muted/40 tracking-tighter">Req</span>
                            <input 
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={() => toggleField(section.id, field.id, 'isRequired')}
                              className="w-3 h-3 rounded border-border-theme text-emerald-500 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ToastComponent />
    </div>
  );
}
