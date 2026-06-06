import React, { useState } from 'react';
import ThanaTable from '../components/ThanaTable';
import { ThanaModal } from '../components/ThanaModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface ThanaProps {
  isSuperUser?: boolean;
}

export default function Thana({ isSuperUser = false }: ThanaProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedThana, setSelectedThana] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSave = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = React.useCallback(() => {
    setSelectedThana(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((thana: any) => {
    setSelectedThana(thana);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedThana(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        </div>
      </div>

      <ThanaTable 
        key={refreshKey} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        isSuperUser={isSuperUser}
      />

      <ThanaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedThana}
        isSuperUser={isSuperUser}
        onSave={handleSave}
      />
    </div>
  );
}
