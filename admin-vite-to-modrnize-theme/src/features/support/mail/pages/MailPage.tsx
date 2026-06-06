import React, { useState, useEffect, useCallback } from 'react';
import { MailTreeView } from '../components/MailTreeView';
import { MailGroupDetail } from '../components/MailGroupDetail';
import { MailTemplateDetail } from '../components/MailTemplateDetail';
import { MailGroupSetupModal } from '../components/MailGroupSetupModal';
import { MailTemplateModal } from '../components/MailTemplateModal';
import { MailConfigurationModal } from '../components/MailConfigurationModal';
import MailConfigurationTable from '../components/MailConfigurationTable';
import { mailGroupSetupService, mailTemplateService } from '@/lib/mail/api/mail.service';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { Mail, FolderOpen, FileText, Settings } from 'lucide-react';

type SelectedNode = { type: 'group'; id: number } | { type: 'template'; id: number } | null;

interface MailPageProps {
  isSuperUser?: boolean;
}

export default function MailPage({ isSuperUser = false }: MailPageProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageTitle = useMenuTitle();
  const [activeTab, setActiveTab] = useState<'groups' | 'configs'>('groups');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsResp, templatesResp] = await Promise.all([
        mailGroupSetupService.getAll(),
        mailTemplateService.getAll(),
      ]);
      const groupsData = groupsResp?.data || groupsResp?.rows || [];
      const templatesData = templatesResp?.data || templatesResp?.rows || [];
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Failed to load mail data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handleSelectGroup = useCallback((groupId: number) => {
    setSelectedNode({ type: 'group', id: groupId });
  }, []);

  const handleSelectTemplate = useCallback((templateId: number) => {
    setSelectedNode({ type: 'template', id: templateId });
  }, []);

  const handleEditGroup = useCallback((group: any) => {
    setEditingGroup(group);
    setShowNewGroupModal(true);
  }, []);

  const handleEditTemplate = useCallback((template: any) => {
    setEditingTemplate(template);
    setShowNewTemplateModal(true);
  }, []);

  const handleNewGroup = useCallback(() => {
    setEditingGroup(null);
    setShowNewGroupModal(true);
  }, []);

  const handleNewTemplateForGroup = useCallback(() => {
    if (selectedNode?.type === 'group') {
      setEditingTemplate(null);
      setShowNewTemplateModal(true);
    }
  }, [selectedNode]);

  const handleModalSave = useCallback(() => {
    setShowNewGroupModal(false);
    setShowNewTemplateModal(false);
    setEditingGroup(null);
    setEditingTemplate(null);
    handleRefresh();
  }, [handleRefresh]);

  const handleNewConfig = useCallback(() => {
    setEditingConfig(null);
    setShowConfigModal(true);
  }, []);

  const handleEditConfig = useCallback((config: any) => {
    setEditingConfig(config);
    setShowConfigModal(true);
  }, []);

  const handleConfigModalSave = useCallback(() => {
    setShowConfigModal(false);
    setEditingConfig(null);
    handleRefresh();
  }, [handleRefresh]);

  const selectedGroup = selectedNode?.type === 'group'
    ? groups.find(g => (g.groupId || g.group_id) === selectedNode.id)
    : null;

  const selectedTemplate = selectedNode?.type === 'template'
    ? templates.find(t => (t.templateId || t.template_id) === selectedNode.id)
    : null;

  const templatesForSelectedGroup = selectedGroup
    ? templates.filter(t => (t.groupId || t.group_id) === (selectedGroup.groupId || selectedGroup.group_id))
    : [];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle || 'Mail Management'}</h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Unified mail configuration, templates, and logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-content-bg rounded-lg p-0.5 border border-border-theme shadow-sm">
            <button
              onClick={() => setActiveTab('groups')}
              className={cn(
                'px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === 'groups'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              )}
            >
              <FolderOpen className="h-3 w-3 inline mr-1.5" />
              Groups & Templates
            </button>
            <button
              onClick={() => setActiveTab('configs')}
              className={cn(
                'px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === 'configs'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              )}
            >
              <Settings className="h-3 w-3 inline mr-1.5" />
              Configurations
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {activeTab === 'groups' ? (
          loading ? (
            <div className="flex items-center justify-center w-full h-64">
              <Loader className="h-8 w-8 text-primary-600" />
            </div>
          ) : (
            <>
              <div className="w-72 shrink-0">
                <MailTreeView
                  groups={groups}
                  templates={templates}
                  selectedNode={selectedNode}
                  onSelectGroup={handleSelectGroup}
                  onSelectTemplate={handleSelectTemplate}
                  onNewGroup={handleNewGroup}
                />
              </div>

              <div className="flex-1 min-w-0">
                {selectedNode?.type === 'group' && selectedGroup ? (
                  <MailGroupDetail
                    group={selectedGroup}
                    templates={templatesForSelectedGroup}
                    isSuperUser={isSuperUser}
                    onEdit={handleEditGroup}
                    onNewTemplate={handleNewTemplateForGroup}
                    onSelectTemplate={handleSelectTemplate}
                    onEditTemplate={handleEditTemplate}
                    onRefresh={handleRefresh}
                  />
                ) : selectedNode?.type === 'template' && selectedTemplate ? (
                  <MailTemplateDetail
                    template={selectedTemplate}
                    isSuperUser={isSuperUser}
                    onEdit={handleEditTemplate}
                    onRefresh={handleRefresh}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted space-y-4">
                    <div className="p-6 rounded-full bg-content-bg">
                      <Mail className="h-16 w-16 text-primary-600/40" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main">Welcome to Mail Management</h3>
                    <p className="text-sm max-w-md text-center">
                      Select a group or template from the tree view to manage your mail configurations, templates, and delivery logs.
                    </p>
                    <div className="flex items-center gap-6 mt-2 text-xs">
                      <span className="flex items-center gap-1.5"><FolderOpen className="h-3.5 w-3.5" /> Groups</span>
                      <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Templates</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          <div className="flex-1">
            <MailConfigurationTable
              key={refreshKey}
              onAdd={handleNewConfig}
              onEdit={handleEditConfig}
              isSuperUser={isSuperUser}
            />
          </div>
        )}
      </div>

      <MailGroupSetupModal
        isOpen={showNewGroupModal}
        onClose={() => { setShowNewGroupModal(false); setEditingGroup(null); }}
        initialData={editingGroup}
        isSuperUser={isSuperUser}
        onSave={handleModalSave}
      />

      <MailTemplateModal
        isOpen={showNewTemplateModal}
        onClose={() => { setShowNewTemplateModal(false); setEditingTemplate(null); }}
        initialData={editingTemplate}
        groupId={selectedNode?.type === 'group' ? selectedNode.id : undefined}
        isSuperUser={isSuperUser}
        onSave={handleModalSave}
      />

      <MailConfigurationModal
        isOpen={showConfigModal}
        onClose={() => { setShowConfigModal(false); setEditingConfig(null); }}
        initialData={editingConfig}
        isSuperUser={isSuperUser}
        onSave={handleConfigModalSave}
      />
    </div>
  );
}
