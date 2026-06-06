import React, { useState } from 'react';
import WarehouseTable from '../components/WarehouseTable';
import { WarehouseModal } from '../components/WarehouseModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface WarehouseProps {
  isSuperUser?: boolean;
}

export default function Warehouse({ isSuperUser = false }: WarehouseProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSave = React.useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAdd = React.useCallback(() => {
    setSelectedWarehouse(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = React.useCallback((warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setSelectedWarehouse(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle || 'Warehouse Management'}</h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Monitor and manage physical storage locations across the supply chain.
          </p>
        </div>
      </div>

      <WarehouseTable 
        key={refreshKey} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        isSuperUser={isSuperUser}
      />

      <WarehouseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedWarehouse}
        isSuperUser={isSuperUser}
        onSave={handleSave}
      />
    </div>
  );
}
