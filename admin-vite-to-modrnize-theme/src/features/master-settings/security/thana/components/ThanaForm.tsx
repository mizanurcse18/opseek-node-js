import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { geoService } from '@/lib/auth/api/geo.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Select } from '@/components/ui-old/Select';

interface ThanaFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function ThanaForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange }: ThanaFormProps) {
  const [formData, setFormData] = useState({
    ThanaID: 0,
    DistrictID: 0,
    ThanaName: '',
    BanglaThanaName: '',
    CompanyID: ''
  });
  const [districts, setDistricts] = useState<{ value: string | number; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadFormData = async () => {
      if (!isMounted) return;

      const thanaId = initialData?.ThanaID || initialData?.thana_id || initialData?.id;

      // Load Districts for dropdown
      try {
        const fetchFn = isSuperUser ? geoService.getDistrictComboSuper : geoService.getDistrictCombo;
        const distData = await fetchFn();
        if (isMounted && Array.isArray(distData)) {
          setDistricts(distData.map((d: any) => ({
            value: d.value || d.DistrictID || d.district_id,
            label: d.label || d.DistrictName || d.district_name
          })));
        }
      } catch (error) {
        console.error('Failed to load districts for ThanaForm:', error);
      }

      if (isSuperUser) {
        try {
          const compResp = await companyService.getAllCompanies();
          if (isMounted && compResp && Array.isArray(compResp)) {
            setCompanies(compResp.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies for ThanaForm:', error);
        }
      }

      // If editing, fetch full details
      if (thanaId) {
        try {
          const response = await geoService.getThanaById(thanaId);
          if (isMounted && response?.data) {
            const data = response.data.Master || response.data;
            setFormData({
              ThanaID: data.ThanaID || data.thana_id || thanaId,
              DistrictID: data.DistrictID || data.district_id || 0,
              ThanaName: data.ThanaName || data.thana_name || '',
              BanglaThanaName: data.BanglaThanaName || data.bangla_thana_name || '',
              CompanyID: data.CompanyID || data.company_id || ''
            });
          }
        } catch (error) {
          console.error('Failed to fetch thana details:', error);
        }
      } else if (initialData && isMounted) {
        // Fallback to initialData if no fetch needed or failed
        setFormData({
          ThanaID: initialData.ThanaID || initialData.thana_id || 0,
          DistrictID: initialData.DistrictID || initialData.district_id || 0,
          ThanaName: initialData.ThanaName || initialData.thana_name || '',
          BanglaThanaName: initialData.BanglaThanaName || initialData.bangla_thana_name || '',
          CompanyID: initialData.CompanyID || initialData.company_id || ''
        });
      }
    };

    loadFormData();
    return () => { isMounted = false; };
  }, [initialData, isSuperUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'DistrictID' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onLoadingChange) onLoadingChange(true);

    try {
      const response = await geoService.saveThana(formData);
      if (response && (response.status_code === 200 || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Thana saved successfully.', status: 'success' });
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
    <form id="thana-form" onSubmit={handleSubmit} className="space-y-5 py-2">
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
        <Label htmlFor="DistrictID" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">District</Label>
        <Select
          options={districts}
          value={formData.DistrictID || ''}
          onChange={(val) => setFormData(prev => ({ ...prev, DistrictID: Number(val) }))}
          placeholder="Select District"
          required
          className="w-full shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ThanaName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Thana Name (English)</Label>
          <Input
            id="ThanaName"
            name="ThanaName"
            value={formData.ThanaName}
            onChange={handleChange}
            placeholder="e.g. Gulshan"
            required
            className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="BanglaThanaName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Thana Name (Bangla)</Label>
          <Input
            id="BanglaThanaName"
            name="BanglaThanaName"
            value={formData.BanglaThanaName}
            onChange={handleChange}
            placeholder="যেমন: গুলশান"
            className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
          />
        </div>
      </div>
    </form>
  );
}
