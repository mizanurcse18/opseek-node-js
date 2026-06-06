import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import UserTable from '../components/UserTable';
import { UserModal } from '../components/UserModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

interface UserListProps {
  isSuperUser?: boolean;
}

export default function UserList({ isSuperUser: isSuperUserProp = false }: UserListProps) {
  const { roleType } = useParams<{ roleType?: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Dynamically resolve page title from menu mapping, falls back to friendly role title
  const fallbackTitle = roleType 
    ? `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Management` 
    : (isSuperUserProp ? 'Super User Management' : 'Access Users');
  const pageTitle = useMenuTitle(fallbackTitle);
  const authUser = useSelector((state: RootState) => state.auth.user);
  
  // Use the prop from the router to determine if we are in Super User View
  const isSuperUser = isSuperUserProp;

  const handleSaveUser = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle}
          </h2>
        </div>
      </div>

      <UserTable 
        key={`${refreshKey}-${roleType}`} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        isSuperUser={isSuperUser}
        roleType={roleType}
      />

      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSave={handleSaveUser}
          initialData={selectedUser}
          isSuperUser={isSuperUser}
          roleType={roleType}
        />
      )}
    </div>
  );
}
