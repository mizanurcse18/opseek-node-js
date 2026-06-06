import React, { useState, useCallback, useEffect } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { companyService } from '@/lib/auth/api/company.service';
import { Select } from '@/components/ui-old/Select';
import PurchaseQuotationTable from '../components/PurchaseQuotationTable';
import { PurchaseQuotationModal } from '../components/PurchaseQuotationModal';

interface PurchaseQuotationPageProps {
  isSuperUser?: boolean;
}

export default function PurchaseQuotationPage({ isSuperUser = false }: PurchaseQuotationPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPQ, setSelectedPQ] = useState<any>(null);
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
    setSelectedPQ(null);
    setIsModalOpen(true);
  }, []);
  const handleEdit = useCallback((pq: any) => {
    setSelectedPQ(pq);
    setIsModalOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPQ(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Purchase Quotation'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage supplier quotations for purchase requisitions.
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

      <PurchaseQuotationTable
        key={refreshKey}
        onAdd={handleAdd}
        onEdit={handleEdit}
        isSuperUser={isSuperUser}
      />

      <PurchaseQuotationModal
        isOpen={isModalOpen}
        onClose={handleClose}
        initialData={selectedPQ}
        onSave={handleSave}
        isSuperUser={isSuperUser}
        preselectedCompanyId={isSuperUser ? selectedCompanyId : undefined}
      />
    </div>
  );
}
