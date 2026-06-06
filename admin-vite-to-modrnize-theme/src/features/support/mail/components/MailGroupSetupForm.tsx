import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { mailGroupSetupService, mailConfigurationService, MailGroupSetup } from '@/lib/mail/api/mail.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Select } from '@/components/ui-old/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { FileText, Mail, MessageSquare } from 'lucide-react';

interface MailGroupSetupFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function MailGroupSetupForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange }: MailGroupSetupFormProps) {
  const [formData, setFormData] = useState<MailGroupSetup>({
    groupId: 0,
    groupName: '',
    configId: 0,
    subject: '',
    body: '',
    attachmentPath: '',
    priority: 1,
    sensitivity: 0,
    reportGenTime: undefined,
    mailGenTime: undefined,
    intervalOn: '',
    intervalValue: 0,
    isFromInterface: false,
  });

  const [configurations, setConfigurations] = useState<{ value: string | number; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      const groupId = initialData?.groupId || initialData?.group_id;
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

        const configResp = await mailConfigurationService.getAll();
        const configList = configResp?.data || configResp?.rows || [];
        if (isMounted && Array.isArray(configList)) {
          setConfigurations(configList.map((c: any) => ({
            value: c.configId || c.config_id,
            label: c.configName || c.config_name || `Config #${c.configId || c.config_id}`,
          })));
        }

        if (groupId) {
          try {
            const response = await mailGroupSetupService.getById(groupId);
            if (isMounted && response?.data) {
              const data = response.data;
              setFormData({
                groupId: data.groupId || data.group_id || groupId,
                groupName: data.groupName || data.group_name || '',
                configId: data.configId || data.config_id || 0,
                subject: data.subject || '',
                body: data.body || '',
                attachmentPath: data.attachmentPath || data.attachment_path || '',
                priority: data.priority ?? 1,
                sensitivity: data.sensitivity ?? 0,
                reportGenTime: data.reportGenTime || data.report_gen_time || undefined,
                mailGenTime: data.mailGenTime || data.mail_gen_time || undefined,
                intervalOn: data.intervalOn || data.interval_on || '',
                intervalValue: data.intervalValue ?? data.interval_value ?? 0,
                isFromInterface: data.isFromInterface ?? data.is_from_interface ?? false,
              });
            }
          } catch (error) {
            console.error('Failed to fetch group details:', error);
          }
        } else if (initialData && isMounted) {
          setFormData(prev => ({
            ...prev,
            groupName: initialData.groupName || initialData.group_name || '',
            configId: initialData.configId || initialData.config_id || 0,
            subject: initialData.subject || '',
            body: initialData.body || '',
          }));
        }
      } finally {
        if (onLoadingChange && isMounted) onLoadingChange(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [initialData, isSuperUser, onLoadingChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.groupName?.trim()) {
      toast({ title: 'Validation Error', description: 'Group name is required.', status: 'error' });
      return;
    }
    if (!formData.configId) {
      toast({ title: 'Validation Error', description: 'Mail configuration is required.', status: 'error' });
      return;
    }
    if (!formData.subject?.trim()) {
      toast({ title: 'Validation Error', description: 'Subject is required.', status: 'error' });
      return;
    }
    if (!formData.body?.trim()) {
      toast({ title: 'Validation Error', description: 'Body is required.', status: 'error' });
      return;
    }

    if (onLoadingChange) onLoadingChange(true);

    try {
      const response = await mailGroupSetupService.save(formData);

      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Mail group saved successfully.', status: 'success' });
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
      <form id="mail-group-form" onSubmit={handleSubmit} className="space-y-6 py-2">
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

          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Group Name <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="groupName"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                placeholder="e.g. Welcome Email"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Mail Configuration <span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              options={configurations}
              value={formData.configId || null}
              onChange={(val) => setFormData(prev => ({ ...prev, configId: Number(val) || 0 }))}
              placeholder="Select Configuration"
              className="w-full shadow-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Subject <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g. Welcome to PayStation, {UserName}!"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="body" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Body <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Use {PlaceholderName} for dynamic values.&#10;e.g. Dear {UserName}, welcome to PayStation!"
                required
                rows={8}
                className="pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Priority</Label>
            <Select
              options={[
                { value: 0, label: 'Low' },
                { value: 1, label: 'Normal' },
                { value: 2, label: 'High' },
                { value: 3, label: 'Urgent' },
              ]}
              value={formData.priority}
              onChange={(val) => setFormData(prev => ({ ...prev, priority: Number(val) || 1 }))}
              className="w-full shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Sensitivity</Label>
            <Select
              options={[
                { value: 0, label: 'Normal' },
                { value: 1, label: 'Personal' },
                { value: 2, label: 'Private' },
                { value: 3, label: 'Confidential' },
              ]}
              value={formData.sensitivity}
              onChange={(val) => setFormData(prev => ({ ...prev, sensitivity: Number(val) || 0 }))}
              className="w-full shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachmentPath" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Attachment Path</Label>
            <Input
              id="attachmentPath"
              name="attachmentPath"
              value={formData.attachmentPath || ''}
              onChange={handleChange}
              placeholder="e.g. /path/to/file.pdf"
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>

          <div className="flex items-end pb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFromInterface"
                checked={formData.isFromInterface}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFromInterface: !!checked }))}
              />
              <Label htmlFor="isFromInterface" className="text-xs font-bold text-text-main cursor-pointer">From Interface</Label>
            </div>
          </div>
        </div>
      </form>
      <ToastComponent />
    </>
  );
}
