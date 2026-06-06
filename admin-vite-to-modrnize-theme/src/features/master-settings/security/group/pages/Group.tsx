import React, { useState } from 'react';
import GroupTable from '../components/GroupTable';
import { GroupModal } from '../components/GroupModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface GroupProps {
  isSuperUser?: boolean;
}

export default function Group({ isSuperUser = false }: GroupProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSaveGroup = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAdd = () => {
    setSelectedGroup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: any) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        </div>
      </div>

      <GroupTable 
        key={refreshKey} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        isSuperUser={isSuperUser} 
      />

      {isModalOpen && (
        <GroupModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSave={handleSaveGroup}
          initialData={selectedGroup}
          isSuperUser={isSuperUser}
        />
      )}
    </div>
  );
}
