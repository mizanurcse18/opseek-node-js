import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import SystemVariableTable from '../components/SystemVariableTable';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface SystemVariableProps {
  isSuperUser?: boolean;
}

export default function SystemVariable({ isSuperUser = false }: SystemVariableProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const pageTitle = useMenuTitle();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        </div>
      </div>

      <SystemVariableTable key={refreshKey} onRefresh={handleRefresh} isSuperUser={isSuperUser} />
    </div>
  );
}
