import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import RoleTable from '../components/RoleTable';
import { RoleModal } from '../components/RoleModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface RoleProps {
  isSuperUser?: boolean;
}

export default function Role({ isSuperUser = false }: RoleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSaveRole = () => {
    // When a role is saved successfully in the modal, increment key to refresh table
    setRefreshKey(prev => prev + 1);
  };

  const handleAdd = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
          <p className="text-sm text-text-muted">Manage user roles and permissions for system access.</p>
        </div>
      </div>

      <RoleTable key={refreshKey} onAdd={handleAdd} onEdit={handleEdit} isSuperUser={isSuperUser} />

      {isModalOpen && (
        <RoleModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSave={handleSaveRole}
          initialData={selectedRole}
          isSuperUser={isSuperUser}
        />
      )}
    </div>
  );
}
