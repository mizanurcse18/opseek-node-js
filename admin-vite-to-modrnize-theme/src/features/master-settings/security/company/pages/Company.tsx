import React, { useState } from 'react';
import CompanyTable from '../components/CompanyTable';
import { CompanyModal } from '../components/CompanyModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';

export default function Company() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  const pageTitle = useMenuTitle();

  const handleSaveCompany = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAdd = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company: any) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        </div>
      </div>

      <CompanyTable key={refreshKey} onAdd={handleAdd} onEdit={handleEdit} />

      {isModalOpen && (
        <CompanyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCompany}
          initialData={selectedCompany}
        />
      )}
    </div>
  );
}
