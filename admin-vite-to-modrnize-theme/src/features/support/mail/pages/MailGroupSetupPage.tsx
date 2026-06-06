import React, { useState } from 'react';
import MailGroupSetupTable from '../components/MailGroupSetupTable';
import { MailGroupSetupModal } from '../components/MailGroupSetupModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface MailGroupSetupPageProps {
  isSuperUser?: boolean;
}

export default function MailGroupSetupPage({ isSuperUser = false }: MailGroupSetupPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const pageTitle = useMenuTitle();

  const handleSave = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = React.useCallback(() => {
    setSelectedGroup(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((group: any) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle || 'Mail Group Setup'}</h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Configure email templates and group settings for automated communications.
          </p>
        </div>
      </div>

      <MailGroupSetupTable
        key={refreshKey}
        onAdd={handleAdd}
        onEdit={handleEdit}
        isSuperUser={isSuperUser}
      />

      <MailGroupSetupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedGroup}
        isSuperUser={isSuperUser}
        onSave={handleSave}
      />
    </div>
  );
}
