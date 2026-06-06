import React, { useState } from 'react';
import MailConfigurationTable from '../components/MailConfigurationTable';
import { MailConfigurationModal } from '../components/MailConfigurationModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface MailConfigurationPageProps {
  isSuperUser?: boolean;
}

export default function MailConfigurationPage({ isSuperUser = false }: MailConfigurationPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const pageTitle = useMenuTitle();

  const handleSave = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = React.useCallback(() => {
    setSelectedConfig(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((config: any) => {
    setSelectedConfig(config);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedConfig(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle || 'Mail Configuration'}</h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage SMTP server configurations for email delivery.
          </p>
        </div>
      </div>

      <MailConfigurationTable
        key={refreshKey}
        onAdd={handleAdd}
        onEdit={handleEdit}
        isSuperUser={isSuperUser}
      />

      <MailConfigurationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedConfig}
        isSuperUser={isSuperUser}
        onSave={handleSave}
      />
    </div>
  );
}
