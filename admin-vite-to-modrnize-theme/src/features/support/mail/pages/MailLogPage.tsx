import React from 'react';
import MailLogTable from '../components/MailLogTable';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface MailLogPageProps {
  isSuperUser?: boolean;
}

export default function MailLogPage({ isSuperUser = false }: MailLogPageProps) {
  const pageTitle = useMenuTitle();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle || 'Mail Logs'}</h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Monitor email delivery status, retry failed emails, and track history.
          </p>
        </div>
      </div>

      <MailLogTable isSuperUser={isSuperUser} />
    </div>
  );
}
