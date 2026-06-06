import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsForm() {
  const [formData, setFormData] = useState({
    siteName: 'AdminHub',
    supportEmail: 'support@example.com',
    allowRegistration: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Optional: notification of success
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">General Information</h3>
        <p className="text-sm text-gray-500">Update the core details of your application.</p>
        
        <div className="space-y-2 mt-4">
          <label className="text-sm font-medium text-gray-700">Site Name</label>
          <Input 
            required 
            value={formData.siteName}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Support Email</label>
          <Input 
            required 
            type="email"
            value={formData.supportEmail}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input 
            type="checkbox"
            id="allow-reg"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            checked={formData.allowRegistration}
            onChange={(e) => setFormData({ ...formData, allowRegistration: e.target.checked })}
          />
          <label htmlFor="allow-reg" className="text-sm font-medium text-gray-700">Allow new user registrations</label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button type="submit" isLoading={isLoading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
