import React, { useState } from 'react';
import DistrictTable from '../components/DistrictTable';
import { DistrictModal } from '../components/DistrictModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface DistrictProps {
  isSuperUser?: boolean;
}

export default function District({ isSuperUser = false }: DistrictProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSave = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = React.useCallback(() => {
    setSelectedDistrict(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((district: any) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        </div>
      </div>

      <DistrictTable 
        key={refreshKey} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        isSuperUser={isSuperUser}
      />

      <DistrictModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedDistrict}
        isSuperUser={isSuperUser}
        onSave={handleSave}
      />
    </div>
  );
}
