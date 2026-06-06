import React from 'react';
import UserLogTrackerTable from '../components/UserLogTrackerTable';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface UserLogTrackerProps {
  isSuperUser?: boolean;
}

export default function UserLogTracker({ isSuperUser = false }: UserLogTrackerProps) {
  const pageTitle = useMenuTitle();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
          <p className="text-sm text-text-muted">Monitor and track user login/logout activity across the system.</p>
        </div>
      </div>

      <UserLogTrackerTable isSuperUser={isSuperUser} />
    </div>
  );
}
