import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MailConfigurationSection } from './MailConfigurationSection';
import { MailLogSection } from './MailLogSection';
import { Edit3, Plus, FileText, Trash2, Settings, Activity } from 'lucide-react';

interface MailGroupDetailProps {
  group: any;
  templates: any[];
  isSuperUser?: boolean;
  onEdit: (group: any) => void;
  onNewTemplate: () => void;
  onSelectTemplate: (templateId: number) => void;
  onEditTemplate: (template: any) => void;
  onRefresh: () => void;
}

export function MailGroupDetail({
  group,
  templates,
  isSuperUser,
  onEdit,
  onNewTemplate,
  onSelectTemplate,
  onEditTemplate,
  onRefresh,
}: MailGroupDetailProps) {
  const groupId = group.groupId || group.group_id;
  const configId = group.configId || group.config_id;

  return (
    <div className="space-y-4">
      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-text-main">
                {group.groupName || group.group_name}
              </h3>
              {(group.isActive ?? group.is_active) !== false && (
                <Badge variant="success" className="text-[9px]">Active</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
              <span>Priority: {group.priority ?? 1}</span>
              <span>Sensitivity: {group.sensitivity ?? 0}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(group)}
            className="text-[10px] font-black uppercase tracking-widest gap-1.5"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Subject</span>
            <p className="font-medium text-text-main">{group.subject}</p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Body Preview</span>
            <p className="text-text-muted text-xs line-clamp-3 whitespace-pre-wrap">{group.body}</p>
          </div>
        </div>
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" />
            Mail Configuration
          </h4>
        </div>
        <MailConfigurationSection configId={configId} />
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Templates ({templates.length})
          </h4>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewTemplate}
            className="text-[10px] font-black uppercase tracking-widest gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <p className="text-xs text-text-muted/50 italic py-3 text-center">
            No templates yet. Click "New Template" to create one.
          </p>
        ) : (
          <div className="space-y-1">
            {templates.map((template: any) => {
              const templateId = template.templateId || template.template_id;
              return (
                <div
                  key={templateId}
                  onClick={() => onSelectTemplate(templateId)}
                  className="flex items-center justify-between p-3 rounded-lg bg-content-bg/50 hover:bg-content-bg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-primary-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">
                        {template.templateName || template.template_name}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {template.subject}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTemplate(template);
                    }}
                    className="shrink-0"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-5">
        <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5" />
          Recent Logs
        </h4>
        <MailLogSection groupId={groupId} />
      </div>
    </div>
  );
}
