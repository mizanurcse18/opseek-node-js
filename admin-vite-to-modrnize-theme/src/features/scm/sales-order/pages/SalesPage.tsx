import React, { useState, useCallback, useEffect } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { companyService } from '@/lib/auth/api/company.service';
import { Select } from '@/components/ui/Select';
import SalesTable from '../components/SalesTable';
import { SalesModal } from '../components/SalesModal';

interface SalesPageProps {
  isSuperUser?: boolean;
}

export default function SalesPage({ isSuperUser = false }: SalesPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  const pageTitle = useMenuTitle();

  useEffect(() => {
    if (isSuperUser) {
      companyService.getAllCompanies().then(res => {
        setCompanies(Array.isArray(res) ? res : []);
      });
    }
  }, [isSuperUser]);

  const handleSave = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  const handleAdd = useCallback(() => {
    setSelectedSale(null);
    setIsModalOpen(true);
  }, []);
  const handleEdit = useCallback((sale: any) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSale(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Sales Order'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Create and manage customer sales orders.
          </p>
        </div>
        {isSuperUser && companies.length > 0 && (
          <Select
            options={[{ value: '', label: 'All Companies' }, ...companies.map((c: any) => ({ value: c.value ?? c.id ?? c.company_id, label: c.label ?? c.name ?? c.company_name }))]}
            value={selectedCompanyId}
            onChange={(val) => setSelectedCompanyId(val?.toString() ?? '')}
            placeholder="All Companies"
            isSearchable={false}
            isClearable={false}
            className="w-40"
          />
        )}
      </div>

      <SalesTable
        key={refreshKey}
        onAdd={handleAdd}
        onEdit={handleEdit}
        isSuperUser={isSuperUser}
      />

      <SalesModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedSale}
        onSave={handleSave}
        isSuperUser={isSuperUser}
        preselectedCompanyId={isSuperUser ? selectedCompanyId : undefined}
      />
    </div>
  );
}
