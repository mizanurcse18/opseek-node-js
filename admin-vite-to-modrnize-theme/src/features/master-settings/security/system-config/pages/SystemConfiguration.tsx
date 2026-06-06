import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  Lock, 
  UserX, 
  Save, 
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Database,
  Building2,
  Filter,
  History,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  Activity
} from 'lucide-react';
import { companyService } from '@/lib/auth/api/company.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { securityService, SystemConfiguration as ISystemConfig } from '@/lib/auth/api/security.service';
import { cn } from '@/lib/utils';

// Helper to format date without timezone shift (+6h issue)
const formatNaiveDate = (dateStr: string, mode: 'date' | 'time' | 'both' = 'both') => {
  if (!dateStr) return '';
  // Strip 'Z' or any offset to treat as naive local time
  const cleanStr = dateStr.split('.')[0].replace('Z', '').replace('T', ' ');
  const date = new Date(cleanStr.replace(/-/g, '/')); // Use / for better cross-browser naive parsing
  
  if (isNaN(date.getTime())) return dateStr;

  if (mode === 'date') return date.toLocaleDateString();
  if (mode === 'time') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

interface SystemConfigurationProps {
  isSuperUser?: boolean;
}

export default function SystemConfiguration({ isSuperUser = false }: SystemConfigurationProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<ISystemConfig>({
    system_configuration_id: 0,
    user_account_locked_duration_in_min: 30,
    user_password_changed_duration_in_days: 90,
    access_failed_count_max: 5,
    is_active: true
  });
  
  const [historyMode, setHistoryMode] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | string | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // New State for Global Settings
  const [activeTab, setActiveTab] = useState<'security' | 'global'>('security');
  const [globalSettings, setGlobalSettings] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [currentGlobal, setCurrentGlobal] = useState<any>({
    setting_id: 0,
    setting_key: '',
    setting_value: '',
    module_name: '',
    description: '',
    is_active: true
  });

  const fetchHistory = async () => {
    if (!config.system_configuration_id || historyList.length > 0) return;
    setLoadingHistory(true);
    try {
      const response = await securityService.getSystemConfigAudit(config.system_configuration_id, 20);
      if (response?.data) {
        let rawData = response.data;
        if (typeof rawData === 'string') {
          try { rawData = JSON.parse(rawData); } catch (e) {}
        }
        
        // Map version pairs to UI structure
        const mappedHistory = Array.isArray(rawData) ? rawData.map((item: any, index: number) => {
          const cv = item.current_version?.data || {};
          const pv = item.previous_version?.data || {};
          
          // Helper to normalize PascalCase to snake_case and ensure numeric values
          const normalize = (d: any) => ({
            user_account_locked_duration_in_min: parseInt(d.UserAccountLockedDurationInMin ?? d.user_account_locked_duration_in_min ?? 0),
            user_password_changed_duration_in_days: parseInt(d.UserPasswordChangedDurationInDays ?? d.user_password_changed_duration_in_days ?? 0),
            access_failed_count_max: parseInt(d.AccessFailedCountMax ?? d.access_failed_count_max ?? 0),
            is_active: d.IsActive === true || d.is_active === true || d.IsActive === 'True'
          });

          return {
            id: index, // Use index or a unique id if available
            updated_at: item.current_version?.updated_at,
            updated_by: item.current_version?.updated_by || 'System',
            data: normalize(cv),
            prev_data: normalize(pv)
          };
        }) : [];

        setHistoryList(mappedHistory);
      }
    } catch (error) {
      console.error("Failed to fetch audit history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedHistory = historyList.find(h => h.id === selectedHistoryId);
  const currentData = historyMode && selectedHistory ? selectedHistory.data : config;
  const oldData = historyMode && selectedHistory ? selectedHistory.prev_data : null;

  const isFieldChanged = (field: keyof ISystemConfig) => {
    if (!historyMode || !oldData || !selectedHistory) return false;
    return (selectedHistory.data as any)[field] !== (oldData as any)[field];
  };

  const handleNextHistory = () => {
    const currentIndex = historyList.findIndex(h => h.id === selectedHistoryId);
    if (currentIndex > 0) {
      setSelectedHistoryId(historyList[currentIndex - 1].id);
    }
  };

  const handlePrevHistory = () => {
    const currentIndex = historyList.findIndex(h => h.id === selectedHistoryId);
    if (currentIndex < historyList.length - 1) {
      setSelectedHistoryId(historyList[currentIndex + 1].id);
    }
  };

  const currentHistoryIndex = historyList.findIndex(h => h.id === selectedHistoryId);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const [companies, setCompanies] = useState<{ value: string, label: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(user?.company_id || '');
  
  const { toast, ToastComponent } = useToast();
  const pageTitle = useMenuTitle();
  
  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnSave', button_title: 'Save Configuration' }
  ], []));

  const btnSave = buttons.find(b => b.button_id === 'btnSave');

  const fetchConfig = async (companyId?: string) => {
    if (!companyId) {
       setLoading(false);
       return;
    }
    setLoading(true);
    try {
      const response = await securityService.getSystemConfiguration(companyId);
      const rawData = response?.data;
      const data = Array.isArray(rawData) ? rawData[0] : rawData;

      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        setConfig({
          ...data,
          company_id: companyId || data.company_id || ''
        });
      } else {
        // Reset to defaults if no config found for company or data is empty
        setConfig({
          system_configuration_id: 0,
          user_account_locked_duration_in_min: 30,
          user_password_changed_duration_in_days: 90,
          access_failed_count_max: 5,
          is_active: true,
          company_id: companyId || ''
        });
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    fetchConfig(companyId);
  };

  const fetchGlobalSettings = async () => {
    setLoadingGlobal(true);
    try {
      const response = await securityService.getAllGlobalSettings();
      if (response?.data) {
        setGlobalSettings(response.data);
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobalSettings();
    }
  }, [activeTab]);

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await securityService.saveGlobalSetting(currentGlobal);
      if (response?.status_code === 200 || response?.response_code === 'SUCCESS') {
        toast({ title: 'Success', description: 'Setting saved successfully', status: 'success' });
        setIsEditingGlobal(false);
        fetchGlobalSettings();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const resp = await companyService.getAllCompanies();
        if (Array.isArray(resp)) {
          setCompanies(resp.map(c => ({
            value: String(c.value || c.id || c.company_id),
            label: String(c.label || c.company_name || c.CompanyName)
          })));
        }
      } catch (e) {
        console.error("Failed to load companies:", e);
      }
    };
    loadCompanies();
    
    // Initial fetch using user's company ID if available
    if (user?.company_id) {
      fetchConfig(user.company_id);
    } else {
      setLoading(false);
    }
  }, [user?.company_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await securityService.saveSystemConfiguration(config);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ 
          title: 'Success', 
          description: response.message || 'Configuration updated successfully.', 
          status: 'success' 
        });
        
        if (response.data) {
           const data = Array.isArray(response.data) ? response.data[0] : response.data;
           if (data) {
             setConfig(data);
           }
        }
        setHistoryList([]); // Force history refresh
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-card-bg/30 rounded-3xl border border-dashed border-border-theme/50">
        <Loader className="h-10 w-10 text-primary-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted animate-pulse">Syncing System Matrix...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-primary-600 rounded-2xl shadow-xl shadow-primary-900/20">
            {activeTab === 'security' ? <Settings2 className="h-6 w-6 text-white" /> : <Activity className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-text-main uppercase">
              {activeTab === 'security' ? (historyMode ? 'Policy Comparison' : (pageTitle || 'System Configuration')) : 'Feature Flags & Defaults'}
            </h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
              {activeTab === 'security' 
                ? (historyMode && selectedHistory 
                  ? `Comparing Live vs Version by ${selectedHistory.updated_by} on ${formatNaiveDate(selectedHistory.updated_at)}` 
                  : 'Core Security & Access Policy Management')
                : 'System-wide feature toggles and dynamic configuration'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex bg-card-bg border border-border-theme p-1 rounded-2xl mr-4 shadow-sm">
             <button
               onClick={() => setActiveTab('security')}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === 'security' ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20" : "text-text-muted hover:text-text-main"
               )}
             >
               Policies
             </button>
             <button
               onClick={() => setActiveTab('global')}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === 'global' ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20" : "text-text-muted hover:text-text-main"
               )}
             >
               Features
             </button>
          </div>

          {activeTab === 'security' && (
            historyMode ? (
              <Button 
                onClick={() => {
                  setHistoryMode(false);
                  setSelectedHistoryId(null);
                }}
                className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-900/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Exit Comparison
              </Button>
            ) : (
              <>
                {isSuperUser && (
                  <div className="flex items-center bg-card-bg border border-border-theme rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-600/20 transition-all">
                    <div className="bg-content-bg/50 px-3 py-2.5 border-r border-border-theme flex items-center">
                      <Filter className="h-3.5 w-3.5 text-text-muted mr-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Company</span>
                    </div>
                    <select 
                      value={selectedCompany}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="h-10 px-4 bg-transparent text-xs font-bold text-text-main outline-none cursor-pointer min-w-[180px]"
                    >
                      {!selectedCompany && <option value="">Select Company</option>}
                      {companies.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => fetchConfig(selectedCompany)}
                  className="h-10 px-4 border-border-theme hover:bg-content-bg transition-all"
                  disabled={isSaving}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isSaving && "animate-spin")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Reload</span>
                </Button>

                <div className="relative group" onMouseEnter={fetchHistory}>
                  <Button 
                    variant="outline" 
                    onClick={fetchHistory}
                    className="h-10 px-4 border-border-theme hover:bg-content-bg transition-all flex items-center gap-2"
                    disabled={isSaving || !config.system_configuration_id}
                  >
                    <History className={cn("h-4 w-4 text-text-muted group-hover:text-primary-600 transition-colors", loadingHistory && "animate-spin")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                  </Button>
                  
                  {/* History Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card-bg border border-border-theme rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                     <div className="px-4 py-3 border-b border-border-theme mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Recent Changes</span>
                     </div>
                     <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                       {loadingHistory ? (
                         <div className="p-8 text-center text-[10px] font-bold text-text-muted uppercase">Loading Logs...</div>
                       ) : historyList.length === 0 ? (
                         <div className="p-8 text-center text-[10px] font-bold text-text-muted uppercase">No History Found</div>
                       ) : (
                         historyList.map(h => (
                           <button
                             key={h.id}
                             onClick={() => {
                               setSelectedHistoryId(h.id);
                               setHistoryMode(true);
                             }}
                             className="w-full text-left p-3 rounded-xl hover:bg-primary-50 group/item transition-all"
                           >
                             <div className="flex justify-between items-start mb-1">
                               <span className="text-[11px] font-black text-text-main group-hover/item:text-primary-700">{h.updated_by}</span>
                               <div className="text-[9px] font-bold text-text-muted text-right leading-tight">
                                 <div>{formatNaiveDate(h.updated_at, 'date')}</div>
                                 <div className="opacity-60">{formatNaiveDate(h.updated_at, 'time')}</div>
                               </div>
                             </div>
                             <div className="text-[9px] font-medium text-text-muted">
                               {h.data.user_account_locked_duration_in_min}m | {h.data.access_failed_count_max} Tries
                             </div>
                           </button>
                         ))
                       )}
                     </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-8 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-900/20"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )
          )}

          {activeTab === 'global' && (
            <Button 
              onClick={() => {
                setCurrentGlobal({ setting_id: 0, setting_key: '', setting_value: '', description: '', is_active: true });
                setIsEditingGlobal(true);
              }}
              className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Feature Key
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'security' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className={cn(
                "bg-card-bg rounded-3xl border shadow-sm overflow-hidden transition-all duration-500",
                historyMode ? "border-amber-500/5 ring-4 ring-amber-500/5" : "border-border-theme"
              )}>
                <div className={cn(
                  "px-8 py-6 border-b flex items-center justify-between",
                  historyMode ? "bg-amber-50/50 border-amber-500/20" : "border-border-theme bg-content-bg/30"
                )}>
                  <div className="flex items-center gap-3">
                    <Shield className={cn("h-5 w-5", historyMode ? "text-amber-600" : "text-primary-600")} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                      {historyMode ? 'Historical Security Audit' : 'Security Policies'}
                    </h3>
                  </div>
                  {historyMode ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                      <History className="h-3 w-3 text-amber-600" />
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Audit Mode</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Guard</span>
                    </div>
                  )}
                </div>
                
                <div className="p-8 space-y-8">
                  {/* Field 1 */}
                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-4 rounded-2xl transition-all",
                    isFieldChanged('user_account_locked_duration_in_min') && "bg-amber-500/5 ring-1 ring-amber-500/20"
                  )}>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                        <Clock className={cn("h-3.5 w-3.5", isFieldChanged('user_account_locked_duration_in_min') ? "text-amber-600" : "text-primary-600")} />
                        Account Lockout Duration
                        {isFieldChanged('user_account_locked_duration_in_min') && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-[8px] rounded-full">CHANGED</span>
                        )}
                      </label>
                      <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                        Time in minutes a user account remains locked after exceeding failed attempts.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <Input 
                          type="number"
                          value={currentData.user_account_locked_duration_in_min}
                          onChange={(e) => !historyMode && setConfig({ ...config, user_account_locked_duration_in_min: parseInt(e.target.value) || 0 })}
                          className="pl-12 h-12 rounded-xl border-border-theme focus:ring-primary-600/20 font-bold text-sm bg-content-bg/20"
                          disabled={historyMode}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-600/40 uppercase">Min</div>
                      </div>
                      {!historyMode && (
                        <div className="flex flex-wrap gap-2">
                          {[15, 30, 60, 120, 240].map(min => (
                            <button
                              key={min}
                              type="button"
                              onClick={() => setConfig({ ...config, user_account_locked_duration_in_min: min })}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                                config.user_account_locked_duration_in_min === min
                                  ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200"
                                  : "bg-card-bg border-border-theme text-text-muted hover:border-primary-600/30 hover:text-primary-600"
                              )}
                            >
                              {min < 60 ? `${min}m` : `${min/60}h`}
                            </button>
                          ))}
                        </div>
                      )}
                      {isFieldChanged('user_account_locked_duration_in_min') && (
                         <div className="text-[10px] font-bold text-amber-700 bg-amber-100/50 p-2 rounded-lg border border-amber-200/50">
                           <span className="opacity-60">Previous Value:</span> <span className="line-through">{oldData?.user_account_locked_duration_in_min}m</span>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Field 2 */}
                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-4 rounded-2xl transition-all",
                    isFieldChanged('user_password_changed_duration_in_days') && "bg-amber-500/5 ring-1 ring-amber-500/20"
                  )}>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                        <RefreshCw className={cn("h-3.5 w-3.5", isFieldChanged('user_password_changed_duration_in_days') ? "text-amber-600" : "text-primary-600")} />
                        Password Rotation Cycle
                        {isFieldChanged('user_password_changed_duration_in_days') && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-[8px] rounded-full">CHANGED</span>
                        )}
                      </label>
                      <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                        Force users to update their credentials after this many days.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded w-fit",
                            isFieldChanged('user_password_changed_duration_in_days') ? "bg-amber-500/10 text-amber-600" : "bg-primary-600/10 text-primary-600"
                          )}>
                            {Math.round(currentData.user_password_changed_duration_in_days / 30)} Months
                          </span>
                          <span className="text-[8px] font-bold text-text-muted mt-1 uppercase">≈ {currentData.user_password_changed_duration_in_days} Days Total</span>
                        </div>
                        <span className="text-[9px] font-bold text-text-muted uppercase">Max: 1 Year</span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <input 
                          type="range"
                          min="1"
                          max="12"
                          step="1"
                          value={currentData.user_password_changed_duration_in_days >= 365 ? 12 : Math.round(currentData.user_password_changed_duration_in_days / 30)}
                          onChange={(e) => {
                            if (historyMode) return;
                            const months = parseInt(e.target.value);
                            const days = months === 12 ? 365 : months * 30;
                            setConfig({ ...config, user_password_changed_duration_in_days: days });
                          }}
                          className={cn(
                            "w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all",
                            historyMode ? "bg-amber-100 accent-amber-500" : "bg-primary-100 accent-primary-600 hover:accent-primary-700"
                          )}
                          disabled={historyMode}
                        />
                      </div>
                      {!historyMode && (
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 3, 6, 12].map(months => {
                            const targetDays = months === 12 ? 365 : months * 30;
                            const isActive = months === 12 
                              ? config.user_password_changed_duration_in_days >= 365 
                              : Math.round(config.user_password_changed_duration_in_days / 30) === months;
                            
                            return (
                              <button
                                key={months}
                                type="button"
                                onClick={() => setConfig({ ...config, user_password_changed_duration_in_days: targetDays })}
                                className={cn(
                                  "py-1 rounded-md text-[9px] font-bold uppercase border transition-all",
                                  isActive
                                    ? "bg-primary-50 border-primary-200 text-primary-700"
                                    : "bg-transparent border-transparent text-text-muted hover:text-primary-600"
                                )}
                              >
                                {months} {months === 1 ? 'Month' : 'Months'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {isFieldChanged('user_password_changed_duration_in_days') && (
                         <div className="text-[10px] font-bold text-amber-700 bg-amber-100/50 p-2 rounded-lg border border-amber-200/50">
                           <span className="opacity-60">Previous Value:</span> <span className="line-through">{Math.round((oldData?.user_password_changed_duration_in_days || 0) / 30)} Months</span>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Field 3 */}
                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-4 rounded-2xl transition-all",
                    isFieldChanged('access_failed_count_max') && "bg-amber-500/5 ring-1 ring-amber-500/20"
                  )}>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                        <UserX className={cn("h-3.5 w-3.5", isFieldChanged('access_failed_count_max') ? "text-amber-600" : "text-primary-600")} />
                        Access Failure Threshold
                        {isFieldChanged('access_failed_count_max') && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-[8px] rounded-full">CHANGED</span>
                        )}
                      </label>
                      <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                        Maximum number of consecutive failed login attempts before locking account.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded",
                          isFieldChanged('access_failed_count_max') ? "bg-amber-500/10 text-amber-600" : "bg-primary-600/10 text-primary-600"
                        )}>
                          {currentData.access_failed_count_max} Attempts
                        </span>
                        <span className="text-[9px] font-bold text-text-muted uppercase">Max: 20</span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <input 
                          type="range"
                          min="1"
                          max="20"
                          value={currentData.access_failed_count_max}
                          onChange={(e) => {
                            if (historyMode) return;
                            setConfig({ ...config, access_failed_count_max: parseInt(e.target.value) });
                          }}
                          className={cn(
                            "w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all",
                            historyMode ? "bg-amber-100 accent-amber-500" : "bg-primary-100 accent-primary-600 hover:accent-primary-700"
                          )}
                          disabled={historyMode}
                        />
                      </div>
                      {!historyMode && (
                        <div className="flex gap-4">
                          {[3, 5, 10].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfig({ ...config, access_failed_count_max: val })}
                              className={cn(
                                "px-3 py-1 rounded-md text-[9px] font-black uppercase border transition-all",
                                config.access_failed_count_max === val
                                  ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                                  : "bg-transparent border-border-theme text-text-muted hover:border-primary-600/30 hover:text-primary-600"
                              )}
                            >
                              {val} Tries
                            </button>
                          ))}
                        </div>
                      )}
                      {isFieldChanged('access_failed_count_max') && (
                         <div className="text-[10px] font-bold text-amber-700 bg-amber-100/50 p-2 rounded-lg border border-amber-200/50">
                           <span className="opacity-60">Previous Value:</span> <span className="line-through">{oldData?.access_failed_count_max} Tries</span>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "pt-8 border-t border-dashed flex items-center justify-between p-4 rounded-2xl transition-all",
                    isFieldChanged('is_active') ? "bg-amber-500/5 border-amber-500/20" : "border-border-theme"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        currentData.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
                        isFieldChanged('is_active') && "ring-2 ring-amber-500/30"
                      )}>
                        {currentData.is_active ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                          Policy Enforcement Status
                          {isFieldChanged('is_active') && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] rounded-full">CHANGED</span>
                          )}
                        </span>
                        <p className="text-[9px] font-bold text-text-muted">
                          {isFieldChanged('is_active') ? `Was previously ${oldData?.is_active ? 'ENABLED' : 'DISABLED'}` : 'Disable to bypass all system configuration checks.'}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={currentData.is_active}
                      onCheckedChange={(val) => !historyMode && setConfig({ ...config, is_active: val })}
                      className={cn("scale-110", historyMode && "opacity-50 cursor-not-allowed")}
                      disabled={historyMode}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Information & Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-border-theme relative overflow-hidden shadow-xl shadow-gray-200/50">
              <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                <Shield className="h-48 w-48 text-primary-900" />
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600/10 rounded-xl">
                    <Info className="h-5 w-5 text-primary-600" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-[0.1em] text-text-main">Policy Summary</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-content-bg/50 rounded-2xl border border-border-theme">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Lockout</span>
                    <span className="text-xs font-black text-text-main">{config.user_account_locked_duration_in_min} Minutes</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-content-bg/50 rounded-2xl border border-border-theme">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Rotation</span>
                    <span className="text-xs font-black text-text-main">{config.user_password_changed_duration_in_days} Days</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-content-bg/50 rounded-2xl border border-border-theme">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Attempts</span>
                    <span className="text-xs font-black text-text-main">{config.access_failed_count_max} Tries</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-border-theme">
                  <p className="text-[10px] font-medium text-text-muted leading-relaxed italic">
                    Changes to these policies are applied globally across all user accounts in the application cluster.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-3xl border border-border-theme p-6 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-primary-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-main">System Metadata</span>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                     <span className="text-text-muted font-bold uppercase tracking-wider">Config ID</span>
                     <span className="font-black text-primary-600">#{config.system_configuration_id || 'NEW'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                     <span className="text-text-muted font-bold uppercase tracking-wider">Engine Status</span>
                     <span className="font-black text-emerald-600 uppercase">Synchronized</span>
                  </div>
                  {(historyMode ? selectedHistory?.updated_at : (config as any).updated_date) && (
                     <div className="pt-3 mt-3 border-t border-dashed border-border-theme space-y-2">
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="text-text-muted font-bold uppercase tracking-wider">Updated By</span>
                          <span className="font-black text-text-main">
                            {historyMode && selectedHistory 
                              ? selectedHistory.updated_by 
                              : ((config as any).updated_by_name || (config as any).updated_by || 'System')}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="text-text-muted font-bold uppercase tracking-wider">Last Modified</span>
                          <span className="font-black text-text-main">
                            {formatNaiveDate(historyMode && selectedHistory ? selectedHistory.updated_at : (config as any).updated_date, 'date')} 
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-[10px]">
                          <span className="text-text-muted font-bold uppercase tracking-wider">Time</span>
                          <span className="font-black text-text-main">
                            {formatNaiveDate(historyMode && selectedHistory ? selectedHistory.updated_at : (config as any).updated_date, 'time')}
                          </span>
                       </div>
                     </div>
                   )}
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* Global Settings Content */
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
           {isEditingGlobal && (
             <div className="bg-card-bg border-2 border-emerald-500/20 rounded-3xl p-8 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                  <Plus className="h-32 w-32 text-emerald-900" />
                </div>
                
                <form onSubmit={handleSaveGlobal} className="relative z-10 space-y-6">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Plus className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Configure Dynamic Feature Flag</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Module / Domain</label>
                        <Input 
                          placeholder="e.g., KYC, Auth"
                          value={currentGlobal.module_name}
                          onChange={e => setCurrentGlobal({ ...currentGlobal, module_name: e.target.value })}
                          className="h-12 bg-content-bg/50 border-border-theme font-bold text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Setting Key</label>
                        <Input 
                          placeholder="e.g., IsKycEditEnabled"
                          value={currentGlobal.setting_key}
                          onChange={e => setCurrentGlobal({ ...currentGlobal, setting_key: e.target.value })}
                          className="h-12 bg-content-bg/50 border-border-theme font-bold text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Value</label>
                        <Input 
                          placeholder="e.g., true"
                          value={currentGlobal.setting_value}
                          onChange={e => setCurrentGlobal({ ...currentGlobal, setting_value: e.target.value })}
                          className="h-12 bg-content-bg/50 border-border-theme font-bold text-xs"
                          required
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Description</label>
                      <Input 
                        placeholder="What does this feature flag control?"
                        value={currentGlobal.description}
                        onChange={e => setCurrentGlobal({ ...currentGlobal, description: e.target.value })}
                        className="h-12 bg-content-bg/50 border-border-theme font-bold text-xs"
                      />
                   </div>

                   <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-3">
                         <Switch 
                           checked={currentGlobal.is_active}
                           onCheckedChange={val => setCurrentGlobal({ ...currentGlobal, is_active: val })}
                         />
                         <span className="text-[10px] font-black uppercase tracking-widest text-text-main">Key Active</span>
                      </div>

                      <div className="flex items-center gap-3">
                         <Button 
                           type="button"
                           variant="ghost" 
                           onClick={() => setIsEditingGlobal(false)}
                           className="text-[10px] font-black uppercase tracking-widest"
                         >
                           Cancel
                         </Button>
                         <Button 
                           type="submit"
                           className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-emerald-900/20"
                           disabled={isSaving}
                         >
                           {isSaving ? 'Processing...' : 'Save Matrix Key'}
                         </Button>
                      </div>
                   </div>
                </form>
             </div>
           )}

           <div className="bg-card-bg rounded-3xl border border-border-theme overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-content-bg/50 border-b border-border-theme">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Module</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Key / Matrix</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Current Value</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {loadingGlobal ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Hydrating Matrix...</span>
                      </td>
                    </tr>
                  ) : globalSettings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">Empty Feature Matrix</div>
                      </td>
                    </tr>
                  ) : (
                    globalSettings.map((s) => (
                      <tr key={s.setting_id} className="hover:bg-content-bg/30 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-[9px] font-black uppercase tracking-widest border border-primary-100">
                            {s.module_name || 'GENERAL'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-text-main group-hover:text-primary-600 transition-colors">{s.setting_key}</span>
                            <span className="text-[9px] font-medium text-text-muted mt-0.5">{s.description || 'No description provided'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="px-2 py-1 bg-content-bg border border-border-theme rounded text-[10px] font-black text-primary-700">
                            {s.setting_value}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                            s.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                          )}>
                            {s.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setCurrentGlobal(s);
                                setIsEditingGlobal(true);
                              }}
                              className="h-8 w-8 p-0 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <ToggleLeft className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           </div>
        </div>
      )}
      
      {/* History Navigation Bar */}
      {historyMode && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
           <div className="bg-card-bg/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl p-2 flex items-center gap-4 min-w-[320px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevHistory}
                disabled={currentHistoryIndex >= historyList.length - 1}
                className="h-10 w-10 rounded-xl hover:bg-amber-500/10 text-amber-600 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex-1 flex flex-col items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                   Version {historyList.length - currentHistoryIndex} of {historyList.length}
                 </span>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="text-[9px] font-bold text-text-muted uppercase">
                     {selectedHistory?.updated_by}
                   </span>
                   <span className="text-[8px] font-medium text-text-muted/60">•</span>
                   <span className="text-[9px] font-bold text-text-muted uppercase">
                     {selectedHistory && formatNaiveDate(selectedHistory.updated_at)}
                   </span>
                 </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextHistory}
                disabled={currentHistoryIndex <= 0}
                className="h-10 w-10 rounded-xl hover:bg-amber-500/10 text-amber-600 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="w-px h-8 bg-amber-500/20 mx-2" />

              <Button
                onClick={() => {
                  setHistoryMode(false);
                  setSelectedHistoryId(null);
                }}
                className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-amber-900/20 transition-all"
              >
                Done
              </Button>
           </div>
        </div>
      )}
      
      <ToastComponent />
    </div>
  );
}
