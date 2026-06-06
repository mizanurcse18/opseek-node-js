import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { mailConfigurationService, MailConfiguration } from '@/lib/mail/api/mail.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui-old/Select';
import { Settings, Globe, User, Lock, Activity } from 'lucide-react';

interface MailConfigurationFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function MailConfigurationForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange }: MailConfigurationFormProps) {
  const [formData, setFormData] = useState<MailConfiguration>({
    configId: 0,
    configName: '',
    host: '',
    port: 587,
    userName: '',
    password: '',
    displayName: '',
    isActive: true,
    enableSsl: true,
    timeout: 30,
    sleepTime: 5,
    seqNo: 0,
  });

  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      const configId = initialData?.configId || initialData?.config_id;
      if (onLoadingChange) onLoadingChange(true);

      try {
        if (isSuperUser) {
          try {
            const resp = await companyService.getAllCompanies();
            if (isMounted && resp && Array.isArray(resp)) {
              setCompanies(resp.map(c => ({
                value: c.value || c.id || c.company_id || c.CompanyID,
                label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`
              })));
            }
          } catch (error) {
            console.error('Failed to load companies:', error);
          }
        }

        if (configId) {
          try {
            const response = await mailConfigurationService.getById(configId);
            if (isMounted && response?.data) {
              const data = response.data;
              setFormData({
                configId: data.configId || data.config_id || configId,
                configName: data.configName || data.config_name || '',
                host: data.host || '',
                port: data.port || 587,
                userName: data.userName || data.user_name || '',
                password: '',
                displayName: data.displayName || data.display_name || '',
                isActive: data.isActive ?? data.is_active ?? true,
                enableSsl: data.enableSsl ?? data.enable_ssl ?? true,
                timeout: data.timeout || 30,
                sleepTime: data.sleepTime || data.sleep_time || 5,
                seqNo: data.seqNo || data.seq_no || 0,
              });
            }
          } catch (error) {
            console.error('Failed to fetch configuration details:', error);
          }
        } else if (initialData && isMounted) {
          setFormData(prev => ({
            ...prev,
            configName: initialData.configName || initialData.config_name || '',
            host: initialData.host || '',
            port: initialData.port || 587,
            userName: initialData.userName || initialData.user_name || '',
            displayName: initialData.displayName || initialData.display_name || '',
          }));
        }
      } finally {
        if (onLoadingChange && isMounted) onLoadingChange(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [initialData, isSuperUser, onLoadingChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'port' || name === 'timeout' || name === 'sleepTime' || name === 'seqNo' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.configName?.trim()) {
      toast({ title: 'Validation Error', description: 'Configuration name is required.', status: 'error' });
      return;
    }
    if (!formData.host?.trim()) {
      toast({ title: 'Validation Error', description: 'SMTP host is required.', status: 'error' });
      return;
    }
    if (!formData.port) {
      toast({ title: 'Validation Error', description: 'SMTP port is required.', status: 'error' });
      return;
    }
    if (!formData.userName?.trim()) {
      toast({ title: 'Validation Error', description: 'Username is required.', status: 'error' });
      return;
    }

    if (onLoadingChange) onLoadingChange(true);

    try {
      const response = await mailConfigurationService.save(formData);

      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Mail configuration saved successfully.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <>
      <form id="mail-config-form" onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSuperUser && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
                Company Context <span className="text-red-500 font-bold">*</span>
              </Label>
              <Select
                options={companies}
                value={null}
                onChange={() => {}}
                placeholder="Select Company"
                className="w-full shadow-sm"
              />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="configName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Configuration Name <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <Settings className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="configName"
                name="configName"
                value={formData.configName}
                onChange={handleChange}
                placeholder="e.g. Primary SMTP"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="host" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              SMTP Host <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="e.g. smtp.gmail.com"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="port" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              SMTP Port <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                placeholder="587"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Username <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="e.g. admin@example.com"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Password {!formData.configId ? <span className="text-red-500 font-bold">*</span> : null}
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder={formData.configId ? 'Leave blank to keep current' : 'Enter SMTP password'}
                required={!formData.configId}
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Display Name</Label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="e.g. PayStation Mail"
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Timeout (seconds)</Label>
            <Input
              id="timeout"
              name="timeout"
              type="number"
              value={formData.timeout}
              onChange={handleChange}
              placeholder="30"
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sleepTime" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Sleep Time (seconds)</Label>
            <Input
              id="sleepTime"
              name="sleepTime"
              type="number"
              value={formData.sleepTime}
              onChange={handleChange}
              placeholder="5"
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seqNo" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Sequence No</Label>
            <Input
              id="seqNo"
              name="seqNo"
              type="number"
              value={formData.seqNo}
              onChange={handleChange}
              placeholder="0"
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>

          <div className="flex items-end gap-6 pb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive" className="text-xs font-bold text-text-main cursor-pointer">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="enableSsl"
                checked={formData.enableSsl}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableSsl: !!checked }))}
              />
              <Label htmlFor="enableSsl" className="text-xs font-bold text-text-main cursor-pointer">Enable SSL</Label>
            </div>
          </div>
        </div>
      </form>
      <ToastComponent />
    </>
  );
}
