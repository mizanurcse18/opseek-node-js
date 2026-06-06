import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TestSendModal } from './TestSendModal';
import { Edit3, FileText, Send, Eye, EyeOff } from 'lucide-react';

interface MailTemplateDetailProps {
  template: any;
  isSuperUser?: boolean;
  onEdit: (template: any) => void;
  onRefresh: () => void;
}

export function MailTemplateDetail({
  template,
  isSuperUser,
  onEdit,
  onRefresh,
}: MailTemplateDetailProps) {
  const [showTestSend, setShowTestSend] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const isHtml = (template.body || '').includes('<') && (template.body || '').includes('>');

  return (
    <div className="space-y-4">
      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-text-main">
                {template.templateName || template.template_name}
              </h3>
              {(template.isActive ?? template.is_active) !== false ? (
                <Badge variant="success" className="text-[9px]">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px]">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
              <span>Priority: {template.priority ?? 1}</span>
              <span>Sensitivity: {template.sensitivity ?? 0}</span>
              <span>Seq: {template.seqNo ?? template.seq_no ?? 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestSend(true)}
              className="text-[10px] font-black uppercase tracking-widest gap-1.5"
            >
              <Send className="h-3 w-3" />
              Send Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(template)}
              className="text-[10px] font-black uppercase tracking-widest gap-1.5"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </Button>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Subject</span>
            <p className="font-medium text-text-main bg-content-bg/50 rounded-lg p-3 border border-border-theme/50">
              {template.subject}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Body {isHtml && '(HTML)'}
              </span>
              {isHtml && (
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {showRaw ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {showRaw ? 'Preview' : 'Show Raw'}
                </button>
              )}
            </div>
            <div className="bg-content-bg/50 rounded-lg p-3 border border-border-theme/50 max-h-96 overflow-y-auto">
              {isHtml && !showRaw ? (
                <div
                  className="text-text-main [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_a]:text-primary-600 [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-1 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_pre]:bg-content-bg [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs [&_pre]:font-mono"
                  dangerouslySetInnerHTML={{ __html: template.body }}
                />
              ) : (
                <pre className="text-xs text-text-main whitespace-pre-wrap font-sans">
                  {template.body}
                </pre>
              )}
            </div>
          </div>
          {template.attachmentPath || template.attachment_path ? (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Attachment</span>
              <p className="text-xs text-primary-600 font-medium">
                {template.attachmentPath || template.attachment_path}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <TestSendModal
        isOpen={showTestSend}
        onClose={() => setShowTestSend(false)}
        template={template}
      />
    </div>
  );
}
