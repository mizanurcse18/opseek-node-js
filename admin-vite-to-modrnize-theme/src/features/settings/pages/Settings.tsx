import React from 'react';
import SettingsForm from '../components/SettingsForm';
import { useMenuTitle } from '@/hooks/useMenuTitle';

export default function Settings() {
  const pageTitle = useMenuTitle();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{pageTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SettingsForm />
      </div>
    </div>
  );
}
