import React, { useState } from 'react';
import { FolderOpen, Folder, FileText, Plus, ChevronRight, ChevronDown, Settings, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface MailTreeViewProps {
  groups: any[];
  templates: any[];
  selectedNode: { type: 'group' | 'template'; id: number } | null;
  onSelectGroup: (groupId: number) => void;
  onSelectTemplate: (templateId: number) => void;
  onNewGroup: () => void;
}

export function MailTreeView({
  groups,
  templates,
  selectedNode,
  onSelectGroup,
  onSelectTemplate,
  onNewGroup,
}: MailTreeViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const toggleExpand = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const isGroupSelected = (groupId: number) =>
    selectedNode?.type === 'group' && selectedNode.id === groupId;

  const isTemplateSelected = (templateId: number) =>
    selectedNode?.type === 'template' && selectedNode.id === templateId;

  const getGroupTemplates = (groupId: number) =>
    templates.filter(t => (t.groupId || t.group_id) === groupId);

  return (
    <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border-theme">
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
          <Mail className="h-3.5 w-3.5" />
          Mail Groups
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-8 w-8 text-text-muted/30 mx-auto mb-2" />
            <p className="text-xs text-text-muted/50 font-medium">No groups yet</p>
          </div>
        ) : (
          groups.map((group) => {
            const groupId = group.groupId || group.group_id;
            const groupTemplates = getGroupTemplates(groupId);
            const isExpanded = expandedGroups.has(groupId);

            return (
              <div key={groupId}>
                <div
                  onClick={() => {
                    onSelectGroup(groupId);
                    toggleExpand(groupId);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all',
                    isGroupSelected(groupId)
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-text-main hover:bg-content-bg'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{group.groupName || group.group_name}</span>
                  <span className={cn(
                    'ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                    isGroupSelected(groupId)
                      ? 'bg-white/20 text-white'
                      : 'bg-content-bg text-text-muted'
                  )}>
                    {groupTemplates.length}
                  </span>
                </div>

                {isExpanded && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {groupTemplates.length === 0 ? (
                      <div className="px-3 py-2 text-[10px] text-text-muted/40 italic">
                        No templates
                      </div>
                    ) : (
                      groupTemplates.map((template: any) => {
                        const templateId = template.templateId || template.template_id;
                        return (
                          <div
                            key={templateId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplate(templateId);
                            }}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-xs transition-all',
                              isTemplateSelected(templateId)
                                ? 'bg-primary-100 text-primary-700 font-semibold'
                                : 'text-text-muted hover:text-text-main hover:bg-content-bg'
                            )}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{template.templateName || template.template_name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-border-theme">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewGroup}
          className="w-full text-[10px] font-black uppercase tracking-widest gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          New Group
        </Button>
      </div>
    </div>
  );
}
