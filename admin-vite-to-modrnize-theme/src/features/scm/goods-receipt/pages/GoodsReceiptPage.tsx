import React, { useState, useCallback, useEffect } from 'react';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { companyService } from '@/lib/auth/api/company.service';
import { Select } from '@/components/ui/Select';
import GoodsReceiptTable from '../components/GoodsReceiptTable';

interface GoodsReceiptPageProps {
  isSuperUser?: boolean;
}

export default function GoodsReceiptPage({ isSuperUser = false }: GoodsReceiptPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Goods Received Note'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage goods receipt against purchase orders. Stock and ledger update automatically on completion.
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

      <GoodsReceiptTable key={refreshKey} isSuperUser={isSuperUser} />
    </div>
  );
}
