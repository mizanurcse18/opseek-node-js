import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui-old/Select';

import { mailConfigurationService, mailTemplateService } from '@/lib/mail/api/mail.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Send, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface TestSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
}

export function TestSendModal({ isOpen, onClose, template }: TestSendModalProps) {
  const [configs, setConfigs] = useState<{ value: string | number; label: string }[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail('');
      setSelectedConfigId(null);
      setSent(false);
      setError('');
      loadConfigs();
    }
  }, [isOpen]);

  const loadConfigs = async () => {
    try {
      const resp = await mailConfigurationService.getGridData({});
      const data = resp?.data || resp?.rows || [];
      if (Array.isArray(data)) {
        setConfigs(data.map((c: any) => ({
          value: c.configId || c.config_id,
          label: c.configName || c.config_name || `Config #${c.configId || c.config_id}`,
        })));
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!recipientEmail?.trim()) {
      toast({ title: 'Validation Error', description: 'Recipient email is required.', status: 'error' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast({ title: 'Validation Error', description: 'Please enter a valid email address.', status: 'error' });
      return;
    }

    const templateId = template.templateId || template.template_id;

    setSending(true);
    setError('');

    try {
      const response = await mailTemplateService.sendTestMail({
        templateId,
        configId: selectedConfigId,
        recipientEmail: recipientEmail.trim(),
        placeholdersJson: null,
      });

      if (response?.response_code === 'SEND_SUCCESS' || response?.status_code === 200) {
        setSent(true);
        toast({ title: 'Success', description: 'Test email sent successfully!', status: 'success' });
      } else {
        const errMsg = response?.message || response?.error || 'Failed to send test email';
        setError(errMsg);
        toast(handleApiError(response));
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to send test email';
      setError(errMsg);
      toast(handleApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Send Test Email"
      headerAction={
        !sent && (
          <Button
            onClick={handleSend}
            disabled={sending}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Send Test</span>
              </>
            )}
          </Button>
        )
      }
    >
      <div className="py-2 space-y-5">
        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-green-50">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-text-main">Email Sent!</h3>
            <p className="text-sm text-text-muted text-center max-w-sm">
              Test email has been sent to <strong className="text-text-main">{recipientEmail}</strong>.
              Please check the inbox (and spam folder).
            </p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-content-bg/50 rounded-lg p-3 border border-border-theme/50">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary-600" />
                <span className="font-medium text-text-main">
                  {template.templateName || template.template_name}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 ml-6">
                Subject: {template.subject}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
                  SMTP Configuration <span className="text-text-muted/30">(optional — leave empty for active config)</span>
                </Label>
                <Select
                  options={configs}
                  value={selectedConfigId}
                  onChange={(val) => setSelectedConfigId(val ? Number(val) : null)}
                  placeholder="Use active configuration"
                  className="w-full shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
                  Recipient Email <span className="text-red-500 font-bold">*</span>
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                    className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
      <ToastComponent />
    </Modal>
  );
}
