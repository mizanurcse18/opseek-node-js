import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { warehouseService, Warehouse } from '@/lib/scm/api/warehouse.service';
import { companyService } from '@/lib/auth/api/company.service';
import { geoService } from '@/lib/auth/api/geo.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Select } from '@/components/ui-old/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { MapPin, Globe, Navigation, Home } from 'lucide-react';

interface WarehouseFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

export function WarehouseForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange, onSavingChange }: WarehouseFormProps) {
  const [formData, setFormData] = useState<Warehouse>({
    warehouse_id: 0,
    warehouse_name: '',
    location: '',
    division_id: '',
    district_id: '',
    thana_id: '',
    is_active: true,
    company_id: ''
  });

  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);
  const [divisions, setDivisions] = useState<{ value: string | number; label: string }[]>([]);
  const [districts, setDistricts] = useState<{ value: string | number; label: string }[]>([]);
  const [thanas, setThanas] = useState<{ value: string | number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      const warehouseId = initialData?.warehouse_id || initialData?.id;
      if (onLoadingChange) onLoadingChange(true);

      try {
        // Load Companies if SuperUser
        if (isSuperUser) {
          try {
            const resp = await companyService.getAllCompanies();
            if (isMounted && resp && Array.isArray(resp)) {
              const mapped = resp.map(c => ({
                value: c.value || c.id || c.company_id,
                label: c.label || c.company_name || `Company #${c.value || c.id}`
              }));
              setCompanies(mapped);
              // Auto-select first company if none is set
              if (mapped.length > 0) {
                setFormData(prev => {
                  if (!prev.company_id) {
                    return { ...prev, company_id: String(mapped[0].value) };
                  }
                  return prev;
                });
              }
            }
          } catch (error) {
            console.error('Failed to load companies:', error);
          }
        }

        // Load Divisions
        try {
          const resp = await geoService.getDivisionCombo();
          const data = resp?.data || resp;
          if (isMounted && Array.isArray(data)) {
            setDivisions(data.map((d: any) => ({
              value: d.value || d.DivisionID || d.division_id,
              label: d.label || d.DivisionName || d.division_name
            })));
          }
        } catch (error) {
          console.error('Failed to load divisions:', error);
        }

        // Load Warehouse Details if editing
        if (warehouseId) {
          try {
            const response = await warehouseService.getWarehouseById(warehouseId);
            if (isMounted && response?.data) {
              const data = response.data;
              setFormData({
                warehouse_id: data.warehouse_id || warehouseId,
                warehouse_name: data.warehouse_name || '',
                location: data.location || '',
                division_id: data.division_id || '',
                district_id: data.district_id || '',
                thana_id: data.thana_id || '',
                is_active: data.is_active ?? true,
                company_id: data.company_id || ''
              });
            }
          } catch (error) {
            console.error('Failed to fetch warehouse details:', error);
          }
        } else if (initialData && isMounted) {
          setFormData({
            warehouse_id: initialData.warehouse_id || 0,
            warehouse_name: initialData.warehouse_name || '',
            location: initialData.location || '',
            division_id: initialData.division_id || '',
            district_id: initialData.district_id || '',
            thana_id: initialData.thana_id || '',
            is_active: initialData.is_active ?? true,
            company_id: initialData.company_id || ''
          });
        }
      } finally {
        if (onLoadingChange && isMounted) onLoadingChange(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [initialData, isSuperUser]);

  // Load Districts when Division changes
  useEffect(() => {
    if (!formData.division_id) {
      setDistricts([]);
      return;
    }

    const loadDistricts = async () => {
      try {
        const data = await geoService.getDistrictByDivision(formData.division_id!);
        if (Array.isArray(data)) {
          setDistricts(data.map((d: any) => ({
            value: d.value || d.DistrictID || d.district_id,
            label: d.label || d.DistrictName || d.district_name
          })));
        }
      } catch (error) {
        console.error('Failed to load districts:', error);
      }
    };

    loadDistricts();
  }, [formData.division_id]);

  // Load Thanas when District changes
  useEffect(() => {
    if (!formData.district_id) {
      setThanas([]);
      return;
    }

    const loadThanas = async () => {
      try {
        const data = await geoService.getThanaByDistrict(formData.district_id!);
        if (Array.isArray(data)) {
          setThanas(data.map((t: any) => ({
            value: t.value || t.ThanaID || t.thana_id,
            label: t.label || t.ThanaName || t.thana_name
          })));
        }
      } catch (error) {
        console.error('Failed to load thanas:', error);
      }
    };

    loadThanas();
  }, [formData.district_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (isSuperUser && !formData.company_id) {
      toast({ title: 'Validation Error', description: 'Company Context is required.', status: 'error' });
      return;
    }
    if (!formData.warehouse_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Warehouse Name is required.', status: 'error' });
      return;
    }
    if (!formData.division_id) {
      toast({ title: 'Validation Error', description: 'Division is required.', status: 'error' });
      return;
    }
    if (!formData.district_id) {
      toast({ title: 'Validation Error', description: 'District is required.', status: 'error' });
      return;
    }
    if (!formData.thana_id) {
      toast({ title: 'Validation Error', description: 'Thana is required.', status: 'error' });
      return;
    }

    if (onSavingChange) onSavingChange(true);

    try {
      const saveFn = isSuperUser ? warehouseService.saveWarehouseSuper : warehouseService.saveWarehouse;
      const response = await saveFn(formData);
      
      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Warehouse saved successfully.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  };

  return (
    <>
    <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-6 py-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isSuperUser && (
          <div className="space-y-2 md:col-span-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Company Context <span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              options={companies}
              value={formData.company_id ?? null}
              onChange={(val) => setFormData(prev => ({ ...prev, company_id: val?.toString() || '' }))}
              placeholder="Select Company"
              required={isSuperUser}
              className="w-full shadow-sm"
            />
          </div>
        )}

        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="warehouse_name" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            Warehouse Name <span className="text-red-500 font-bold">*</span>
          </Label>
          <div className="relative group">
            <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              id="warehouse_name"
              name="warehouse_name"
              value={formData.warehouse_name}
              onChange={handleChange}
              placeholder="e.g. Main Hub"
              required
              className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            Division <span className="text-red-500 font-bold">*</span>
          </Label>
          <Select
            options={divisions}
            value={formData.division_id ?? null}
            onChange={(val) => setFormData(prev => ({ ...prev, division_id: val || '', district_id: '', thana_id: '' }))}
            placeholder="Select Division"
            className="w-full shadow-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            District <span className="text-red-500 font-bold">*</span>
          </Label>
          <Select
            options={districts}
            value={formData.district_id ?? null}
            onChange={(val) => setFormData(prev => ({ ...prev, district_id: val || '', thana_id: '' }))}
            placeholder="Select District"
            disabled={!formData.division_id}
            className="w-full shadow-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            Thana <span className="text-red-500 font-bold">*</span>
          </Label>
          <Select
            options={thanas}
            value={formData.thana_id ?? null}
            onChange={(val) => setFormData(prev => ({ ...prev, thana_id: val || '' }))}
            placeholder="Select Thana"
            disabled={!formData.district_id}
            className="w-full shadow-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Street Address</Label>
          <div className="relative group">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Plot 42, Block C"
              className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
        />
        <Label htmlFor="is_active" className="text-xs font-bold text-text-main cursor-pointer">Active Status</Label>
      </div>
    </form>
    <ToastComponent />
    </>
  );
}
