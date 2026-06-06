import React, { useState, useEffect, useRef } from 'react';
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
  Cpu
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { kycService } from '@/lib/auth/api/kyc.service';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui-old/Select';
import { userService } from '@/lib/auth/api/user.service';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { securityService } from '@/lib/auth/api/security.service';

const SECTIONS = [
  { id: 'NID', title: 'NID Scan', icon: IdCard, fields: ['nid_number', 'front_image', 'back_image'], hasOcr: true },
  { id: 'BasicInfo', title: 'Basic Information', icon: User, fields: ['first_name', 'last_name', 'father_name', 'mother_name', 'date_of_birth', 'email', 'phone', 'present_address', 'permanent_address'] },
  { id: 'Documents', title: 'Additional Documents', icon: Upload, fields: ['trade', 'passport', 'license', 'other'] },
  { id: 'Business', title: 'Business Details', icon: Building2, fields: ['business_name', 'industry_type', 'bin_number', 'tin_number', 'outlet_info'] },
  { id: 'Accounts', title: 'Financial Accounts', icon: Wallet, fields: ['bank_accounts', 'mfs_accounts'] }
];


export default function KycWorkflowDesigner() {
  const [selectedUserType, setSelectedUserType] = useState<number>(3);
  const [userTypes, setUserTypes] = useState<{ value: string | number, label: string }[]>([]);
  const [securityGroups, setSecurityGroups] = useState<{ value: string | number, label: string }[]>([]);
  const [config, setConfig] = useState<any>({
    sections: SECTIONS.map((s, idx) => ({ 
      id: s.id, 
      isVisible: true, 
      sequence: idx + 1,
      enableOcr: s.hasOcr ? true : undefined,
      fields: s.fields.map(f => ({ id: f, isVisible: true, isRequired: true }))
    })),
    allowedSecurityGroups: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, ToastComponent } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>('NID');

  useEffect(() => {
    fetchUserTypes();
    fetchSecurityGroups();
  }, []);

  const loadIdRef = useRef(0);

  useEffect(() => {
    if (selectedUserType) {
      loadConfig();
    }
  }, [selectedUserType]);

  const fetchSecurityGroups = async () => {
    try {
      const resp = await securityService.getSecurityGroupsCombo();
      if (resp && Array.isArray(resp)) {
        setSecurityGroups(resp.map((g: any) => ({
          value: g.value || g.id || g.security_group_id,
          label: g.label || g.name || g.group_name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch security groups:', error);
    }
  };

  const fetchUserTypes = async () => {
    try {
      const resp = await userService.getUserTypes();
      const data = resp?.data || resp;
      if (data && Array.isArray(data)) {
        setUserTypes(data.map((t: any) => ({
          value: t.value || t.id,
          label: t.label || t.name
        })));
        // Set first one as default if not already set
        if (data.length > 0 && !selectedUserType) {
          setSelectedUserType(Number(data[0].value || data[0].id));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user types:', error);
    }
  };

  const loadConfig = async () => {
    const loadId = ++loadIdRef.current;
    setIsLoading(true);
    try {
      const response = await kycService.getWorkflowConfig(selectedUserType);
      // Ignore stale responses if a newer load was started
      if (loadId !== loadIdRef.current) return;
      
      // Merge logic: Ensure all master sections and fields exist in the config
      const mergedSections = SECTIONS.map((master, idx) => {
        const existingSection = response?.data?.sections?.find((s: any) => s.id === master.id);
        
        return {
          id: master.id,
          isVisible: existingSection ? existingSection.isVisible : true,
          sequence: existingSection ? existingSection.sequence : idx + 1,
          enableOcr: master.hasOcr ? (existingSection?.enableOcr !== false) : undefined,
          fields: master.fields.map(f => {
            const existingField = existingSection?.fields?.find((ef: any) => ef.id === f);
            return {
              id: f,
              isVisible: existingField ? existingField.isVisible : true,
              isRequired: existingField ? existingField.isRequired : true
            };
          })
        };
      });

      setConfig({
        ...response?.data,
        sections: mergedSections,
        requireDealerMapping: response?.data?.requireDealerMapping ?? false,
        allowedSecurityGroups: response?.data?.allowedSecurityGroups || []
      });
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await kycService.saveWorkflowConfig(selectedUserType, config);
      toast({ title: 'Success', description: 'KYC workflow updated successfully.', status: 'success' });
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

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/20 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">KYC Workflow Designer</h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Custom permissions per user role</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <Select
              options={userTypes}
              value={selectedUserType}
              onChange={(val) => setSelectedUserType(Number(val))}
              className="min-w-[200px] border-none shadow-none focus:ring-0 font-bold"
            />
            <Button 
              onClick={handleSave} 
              disabled={isSaving || isLoading}
              className="bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-[11px] px-6 h-10 rounded-xl shadow-lg shadow-primary-600/10 active:scale-95 transition-all flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="h-64 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading configuration...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Global Settings / Relationship Mapping */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Layout className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Relationship Mapping</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hierarchy & Parent Association Rules</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Require Dealer Selection</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Force parent mapping during onboarding</p>
                    </div>
                    <Switch 
                      checked={!!config?.requireDealerMapping}
                      onCheckedChange={(val) => {
                        setConfig((prev: any) => ({
                          ...prev,
                          requireDealerMapping: val
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Security Group Mapping */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Allowed Security Groups</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cascade rules inside user enrollment form</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full max-w-md z-20 relative">
                    <MultiSelect
                      options={securityGroups}
                      value={config?.allowedSecurityGroups || []}
                      onChange={(val) => {
                        setConfig((prev: any) => ({
                          ...prev,
                          allowedSecurityGroups: val
                        }));
                      }}
                      placeholder="Select allowed security groups..."
                      className="w-full relative z-30"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
              {config?.sections?.map((section: any, idx: number) => {
                const master = SECTIONS.find(s => s.id === section.id);
                if (!master) return null;
                const isExpanded = expandedSection === section.id;

                return (
                  <div 
                    key={section.id}
                    className={cn(
                      "bg-white border rounded-3xl transition-all duration-300 overflow-hidden",
                      section.isVisible ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60 grayscale-[0.5]"
                    )}
                  >
                    {/* Section Header */}
                    <div className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          section.isVisible ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-300"
                        )}>
                          <master.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{master.title}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step {idx + 1}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <Button
                          variant="ghost"
                          onClick={() => toggleSection(section.id)}
                          className={cn(
                            "h-10 px-3 flex items-center gap-2 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest",
                            section.isVisible ? "text-primary-600 hover:bg-primary-50" : "text-slate-300 hover:bg-slate-100"
                          )}
                        >
                          {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          {section.isVisible ? 'Enabled' : 'Disabled'}
                        </Button>
                        <div className="w-[1px] h-6 bg-slate-100" />
                        <Button
                          variant="ghost"
                          onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                          className="h-10 w-10 p-0 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                      </div>

                    </div>

                    {/* Section Detail (Fields) */}
                    {isExpanded && (
                      <div className="border-t border-slate-50 bg-slate-50/30 p-8 animate-in slide-in-from-top-2 duration-300">
                        {/* Section Global Settings (e.g. OCR) */}
                        {master.hasOcr && (
                          <div className="mb-8 p-4 bg-primary-600/5 border border-primary-600/10 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                <Cpu className={cn("w-5 h-5", section.enableOcr ? "text-primary-600" : "text-slate-300")} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">OCR Engine Protection</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Automatic data extraction from scans</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn("text-[10px] font-black uppercase tracking-widest", section.enableOcr ? "text-primary-600" : "text-slate-400")}>
                                {section.enableOcr ? 'Engine Active' : 'Engine Disabled'}
                              </span>
                              <Switch 
                                checked={section.enableOcr !== false}
                                onCheckedChange={(val) => {
                                  setConfig((prev: any) => ({
                                    ...prev,
                                    sections: prev.sections.map((s: any) => 
                                      s.id === section.id ? { ...s, enableOcr: val } : s
                                    )
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          {section?.fields?.map((field: any) => (
                            <div 
                              key={field.id}
                              className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:border-primary-600/20 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-primary-400 transition-colors" />
                                <span className="text-xs font-bold text-slate-700 capitalize">{field.id.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Show</span>
                                  <input 
                                    type="checkbox"
                                    checked={field.isVisible}
                                    onChange={() => toggleField(section.id, field.id, 'isVisible')}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-600/20"
                                  />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Req</span>
                                  <input 
                                    type="checkbox"
                                    checked={field.isRequired}
                                    onChange={() => toggleField(section.id, field.id, 'isRequired')}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500/20"
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
          </div>
        )}
      </div>

        {/* Info Card */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield className="w-24 h-24 rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Dynamic Workflow Protection</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-2xl">
                This configuration affects only the selected user type. Changes are applied instantly to all new and draft KYC applications. 
                Field-level requirements will trigger client-side validation automatically.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="text-xl font-black text-white">5</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Steps</div>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div className="flex flex-col items-center">
                <div className="text-xl font-black text-white">24</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fields</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastComponent />
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  );
}
