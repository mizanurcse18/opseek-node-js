import React, { useState } from 'react';
import DivisionTable from '../components/DivisionTable';
import { DivisionModal } from '../components/DivisionModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface DivisionProps {
  isSuperUser?: boolean;
}

export default function Division({ isSuperUser = false }: DivisionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDivision, setSelectedDivision] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSave = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = React.useCallback(() => {
    setSelectedDivision(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((division: any) => {
    setSelectedDivision(division);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedDivision(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        </div>
      </div>

      <DivisionTable 
        key={refreshKey} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        isSuperUser={isSuperUser}
      />

      <DivisionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedDivision}
        isSuperUser={isSuperUser}
        onSave={handleSave}
      />
    </div>
  );
}
