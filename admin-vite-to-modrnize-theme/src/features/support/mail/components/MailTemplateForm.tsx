import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui-old/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { HtmlEditor } from '@/components/ui/HtmlEditor';
import { mailTemplateService, MailTemplate, mailGroupSetupService } from '@/lib/mail/api/mail.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { FileText, Mail, Hash } from 'lucide-react';

interface MailTemplateFormProps {
  initialData?: any;
  groupId?: number;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function MailTemplateForm({ initialData, groupId, isSuperUser = false, onSave, onClose, onLoadingChange }: MailTemplateFormProps) {
  const [formData, setFormData] = useState<MailTemplate>({
    templateId: 0,
    groupId: groupId || 0,
    templateName: '',
    subject: '',
    body: '',
    attachmentPath: '',
    priority: 1,
    sensitivity: 0,
    isActive: true,
    seqNo: 0,
  });

  const [groups, setGroups] = useState<{ value: string | number; label: string }[]>([]);
  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (onLoadingChange) onLoadingChange(true);
      try {
        if (!groupId) {
          const groupsResp = await mailGroupSetupService.getAll();
          const groupsList = groupsResp?.data || groupsResp?.rows || [];
          if (isMounted && Array.isArray(groupsList)) {
            setGroups(groupsList.map((g: any) => ({
              value: g.groupId || g.group_id,
              label: g.groupName || g.group_name || `Group #${g.groupId || g.group_id}`,
            })));
          }
        }

        const templateId = initialData?.templateId || initialData?.template_id;
        if (templateId) {
          try {
            const response = await mailTemplateService.getById(templateId);
            if (isMounted && response?.data) {
              const d = response.data;
              setFormData({
                templateId: d.templateId || d.template_id || templateId,
                groupId: d.groupId || d.group_id || groupId || 0,
                templateName: d.templateName || d.template_name || '',
                subject: d.subject || '',
                body: d.body || '',
                attachmentPath: d.attachmentPath || d.attachment_path || '',
                priority: d.priority ?? 1,
                sensitivity: d.sensitivity ?? 0,
                isActive: d.isActive ?? d.is_active ?? true,
                seqNo: d.seqNo ?? d.seq_no ?? 0,
              });
            }
          } catch {
            // ignore
          }
        } else if (initialData && isMounted) {
          setFormData(prev => ({
            ...prev,
            templateName: initialData.templateName || initialData.template_name || '',
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
  }, [initialData, groupId, onLoadingChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateName?.trim()) {
      toast({ title: 'Validation Error', description: 'Template name is required.', status: 'error' });
      return;
    }
    if (!formData.groupId) {
      toast({ title: 'Validation Error', description: 'Group is required.', status: 'error' });
      return;
    }
    if (!formData.subject?.trim()) {
      toast({ title: 'Validation Error', description: 'Subject is required.', status: 'error' });
      return;
    }
    const bodyText = formData.body?.replace(/<[^>]*>/g, '').trim();
    if (!bodyText) {
      toast({ title: 'Validation Error', description: 'Body content is required.', status: 'error' });
      return;
    }

    if (onLoadingChange) onLoadingChange(true);
    try {
      const response = await mailTemplateService.save(formData);
      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Mail template saved successfully.', status: 'success' });
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
      <form id="mail-template-form" onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!groupId && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
                Group <span className="text-red-500 font-bold">*</span>
              </Label>
              <Select
                options={groups}
                value={formData.groupId || null}
                onChange={(val) => setFormData(prev => ({ ...prev, groupId: Number(val) || 0 }))}
                placeholder="Select Group"
                className="w-full shadow-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="templateName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Template Name <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="templateName"
                name="templateName"
                value={formData.templateName}
                onChange={handleChange}
                placeholder="e.g. New User Welcome"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seqNo" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Sequence No</Label>
            <div className="relative group">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                id="seqNo"
                name="seqNo"
                type="number"
                value={formData.seqNo}
                onChange={handleChange}
                placeholder="0"
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
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
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Body (HTML) <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="text-[10px] text-text-muted/60 mb-1.5 ml-1">
              Use <code className="bg-content-bg px-1 rounded text-[9px]">{'{{PlaceholderName}}'}</code> for dynamic values. Supports HTML, images, and CSS styling.
            </div>
            <HtmlEditor
              value={formData.body}
              onChange={(html) => setFormData(prev => ({ ...prev, body: html }))}
              placeholder="Use {PlaceholderName} for dynamic values. e.g. Dear {UserName}, welcome to PayStation!"
              minHeight={350}
            />
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
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              label="Active"
            />
          </div>
        </div>
      </form>
      <ToastComponent />
    </>
  );
}
