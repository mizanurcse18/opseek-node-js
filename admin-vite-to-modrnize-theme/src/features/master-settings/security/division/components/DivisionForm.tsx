import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { geoService } from '@/lib/auth/api/geo.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Select } from '@/components/ui-old/Select';

interface DivisionFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function DivisionForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange }: DivisionFormProps) {
  const [formData, setFormData] = useState({
    DivisionID: 0,
    DivisionName: '',
    BanglaDivisionName: '',
    CompanyID: ''
  });
  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadFormData = async () => {
      if (!isMounted) return;

      const divisionId = initialData?.DivisionID || initialData?.division_id || initialData?.id;

      if (isSuperUser) {
        try {
          const resp = await companyService.getAllCompanies();
          if (isMounted && resp && Array.isArray(resp)) {
            setCompanies(resp.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies for DivisionForm:', error);
        }
      }

      // If editing, fetch full details
      if (divisionId) {
        try {
          const response = await geoService.getDivisionById(divisionId);
          if (isMounted && response?.data) {
            const data = response.data.Master || response.data;
            setFormData({
              DivisionID: data.DivisionID || data.division_id || divisionId,
              DivisionName: data.DivisionName || data.division_name || '',
              BanglaDivisionName: data.BanglaDivisionName || data.bangla_division_name || '',
              CompanyID: data.CompanyID || data.company_id || ''
            });
          }
        } catch (error) {
          console.error('Failed to fetch division details:', error);
        }
      } else if (initialData && isMounted) {
        // Fallback to initialData if no fetch needed or failed
        setFormData({
          DivisionID: initialData.DivisionID || initialData.division_id || 0,
          DivisionName: initialData.DivisionName || initialData.division_name || '',
          BanglaDivisionName: initialData.BanglaDivisionName || initialData.bangla_division_name || '',
          CompanyID: initialData.CompanyID || initialData.company_id || ''
        });
      }
    };

    loadFormData();
    return () => { isMounted = false; };
  }, [initialData, isSuperUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onLoadingChange) onLoadingChange(true);

    try {
      const response = await geoService.saveDivision(formData);
      if (response && (response.status_code === 200 || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Division saved successfully.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <form id="division-form" onSubmit={handleSubmit} className="space-y-5 py-2">
      {isSuperUser && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Company Context</Label>
          <Select
            options={companies}
            value={formData.CompanyID}
            onChange={(val) => setFormData(prev => ({ ...prev, CompanyID: val?.toString() || '' }))}
            placeholder="Select Company"
            required={isSuperUser}
            className="w-full shadow-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="DivisionName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Division Name (English)</Label>
        <Input
          id="DivisionName"
          name="DivisionName"
          value={formData.DivisionName}
          onChange={handleChange}
          placeholder="e.g. Dhaka"
          required
          className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="BanglaDivisionName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Division Name (Bangla)</Label>
        <Input
          id="BanglaDivisionName"
          name="BanglaDivisionName"
          value={formData.BanglaDivisionName}
          onChange={handleChange}
          placeholder="যেমন: ঢাকা"
          className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
        />
      </div>
    </form>
  );
}
