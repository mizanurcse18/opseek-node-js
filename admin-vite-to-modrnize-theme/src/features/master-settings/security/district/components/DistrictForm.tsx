import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { geoService } from '@/lib/auth/api/geo.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Select } from '@/components/ui-old/Select';

interface DistrictFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function DistrictForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange }: DistrictFormProps) {
  const [formData, setFormData] = useState({
    DistrictID: 0,
    DistrictCode: '',
    DistrictName: '',
    DivisionID: 0,
    CompanyID: ''
  });
  const [divisions, setDivisions] = useState<{ value: string | number; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadFormData = async () => {
      if (!isMounted) return;
      
      const districtId = initialData?.DistrictID || initialData?.district_id || initialData?.id;

      // Load Divisions for dropdown
      try {
        const fetchFn = isSuperUser ? geoService.getDivisionComboSuper : geoService.getDivisionCombo;
        const divData = await fetchFn();
        if (isMounted && Array.isArray(divData)) {
          setDivisions(divData.map((d: any) => ({
            value: d.value || d.DivisionID || d.division_id,
            label: d.label || d.DivisionName || d.division_name
          })));
        }
      } catch (error) {
        console.error('Failed to load divisions for DistrictForm:', error);
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
          console.error('Failed to load companies for DistrictForm:', error);
        }
      }

      // If editing, fetch full details
      if (districtId) {
        try {
          const response = await geoService.getDistrictById(districtId);
          if (isMounted && response?.data) {
            const data = response.data.Master || response.data;
            setFormData({
              DistrictID: data.DistrictID || data.district_id || districtId,
              DistrictCode: data.DistrictCode || data.district_code || '',
              DistrictName: data.DistrictName || data.district_name || '',
              DivisionID: data.DivisionID || data.division_id || 0,
              CompanyID: data.CompanyID || data.company_id || ''
            });
          }
        } catch (error) {
          console.error('Failed to fetch district details:', error);
        }
      } else if (initialData && isMounted) {
        // Fallback to initialData if no fetch needed or failed
        setFormData({
          DistrictID: initialData.DistrictID || initialData.district_id || 0,
          DistrictCode: initialData.DistrictCode || initialData.district_code || '',
          DistrictName: initialData.DistrictName || initialData.district_name || '',
          DivisionID: initialData.DivisionID || initialData.division_id || 0,
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
      [name]: name === 'DivisionID' ? Number(value) : value 
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onLoadingChange) onLoadingChange(true);

    try {
      const response = await geoService.saveDistrict(formData);
      if (response && (response.status_code === 200 || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'District saved successfully.', status: 'success' });
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
    <form id="district-form" onSubmit={handleSubmit} className="space-y-5 py-2">
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
        <Label htmlFor="DivisionID" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Division</Label>
        <Select
          options={divisions}
          value={formData.DivisionID || ''}
          onChange={(val) => setFormData(prev => ({ ...prev, DivisionID: Number(val) }))}
          placeholder="Select Division"
          required
          className="w-full shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="DistrictCode" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">District Code</Label>
          <Input
            id="DistrictCode"
            name="DistrictCode"
            value={formData.DistrictCode}
            onChange={handleChange}
            placeholder="e.g. 10"
            required
            className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="DistrictName" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">District Name</Label>
          <Input
            id="DistrictName"
            name="DistrictName"
            value={formData.DistrictName}
            onChange={handleChange}
            placeholder="e.g. Dhaka"
            required
            className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
          />
        </div>
      </div>
    </form>
  );
}
