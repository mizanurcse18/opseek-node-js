import React, { useState, useEffect } from 'react';
import { Store, MapPin, Navigation, Phone, Globe, ChevronDown, CheckCircle2, Hash } from 'lucide-react';
import { geoService } from '@/lib/auth/api/geo.service';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui-old/Select';
import { Label } from '@/components/ui/Label';

interface BusinessOutletFormProps {
  data?: any;
  onChange?: (data: any) => void;
}

export default function BusinessOutletForm({ data, onChange }: BusinessOutletFormProps) {
  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [thanas, setThanas] = useState<any[]>([]);
  
  // Cache for cascading
  const [loadedDistricts, setLoadedDistricts] = useState<Record<string, any[]>>({});
  const [loadedThanas, setLoadedThanas] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const loadDivisions = async () => {
      const data = await geoService.getDivisionCombo();
      if (Array.isArray(data)) {
        setDivisions(data.map((d: any) => ({
          value: d.value || d.DivisionID,
          label: d.label || d.DivisionName
        })));
      }
    };
    loadDivisions();
  }, []);

  const loadDistricts = async (divisionId: string | number) => {
    if (!divisionId) return;
    if (loadedDistricts[divisionId]) {
      setDistricts(loadedDistricts[divisionId]);
      return;
    }
    const data = await geoService.getDistrictByDivision(divisionId);
    if (Array.isArray(data)) {
      const mapped = data.map((d: any) => ({
        value: d.value || d.DistrictID,
        label: d.label || d.DistrictName
      }));
      setDistricts(mapped);
      setLoadedDistricts(prev => ({ ...prev, [divisionId]: mapped }));
    }
  };

  const loadThanas = async (districtId: string | number) => {
    if (!districtId) return;
    if (loadedThanas[districtId]) {
      setThanas(loadedThanas[districtId]);
      return;
    }
    const data = await geoService.getThanaByDistrict(districtId);
    if (Array.isArray(data)) {
      const mapped = data.map((t: any) => ({
        value: t.value || t.ThanaID,
        label: t.label || t.ThanaName
      }));
      setThanas(mapped);
      setLoadedThanas(prev => ({ ...prev, [districtId]: mapped }));
    }
  };

  const updateField = (field: string, value: any) => {
    onChange?.({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Outlet Information</h2>
          <p className="text-[10px] text-text-muted font-medium">Physical location details of your primary business outlet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="md:col-span-4 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Outlet Name</Label>
          <div className="relative group">
            <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <input 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
              placeholder="e.g. Downtown Central Hub"
              value={data?.outlet_name || ''}
              onChange={(e) => updateField('outlet_name', e.target.value)}
            />
          </div>
        </div>

        {/* Geo Row 1 */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Division</Label>
          <Select 
            options={divisions}
            placeholder="Select Division"
            value={data?.division_id || ''}
            onChange={(v) => {
              updateField('division_id', v);
              updateField('district_id', '');
              updateField('thana_id', '');
              loadDistricts(v);
            }}
            className="w-full bg-white text-[11px] font-bold shadow-sm"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">District</Label>
          <Select 
            options={districts}
            placeholder="Select District"
            disabled={!data?.division_id}
            value={data?.district_id || ''}
            onChange={(v) => {
              updateField('district_id', v);
              updateField('thana_id', '');
              loadThanas(v);
            }}
            className="w-full bg-white text-[11px] font-bold shadow-sm"
          />
        </div>

        {/* Geo Row 2 */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Thana / Upazila</Label>
          <Select 
            options={thanas}
            placeholder="Select Thana"
            disabled={!data?.district_id}
            value={data?.thana_id || ''}
            onChange={(v) => updateField('thana_id', v)}
            className="w-full bg-white text-[11px] font-bold shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Area / City</Label>
          <div className="relative group">
            <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <input 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
              placeholder="e.g. Sector"
              value={data?.area_city || ''}
              onChange={(e) => updateField('area_city', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Zip Code</Label>
          <div className="relative group">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <input 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
              placeholder="XXXX"
              value={data?.zip_code || ''}
              onChange={(e) => updateField('zip_code', e.target.value)}
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Full Street Address</Label>
          <div className="relative group">
            <MapPin className="absolute left-3.5 top-3 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <textarea 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm resize-none"
              rows={2}
              placeholder="Building name, Street number, Area"
              value={data?.street_address || ''}
              onChange={(e) => updateField('street_address', e.target.value)}
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Outlet Contact Number</Label>
          <div className="flex gap-2">
             <div className="w-16 bg-white border border-border-theme rounded-lg flex items-center justify-center text-[11px] font-black text-text-main shadow-sm">+880</div>
             <div className="relative flex-1 group">
               <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
               <input 
                 className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                 placeholder="1700 000 000"
                 value={data?.contact_number || ''}
                 onChange={(e) => updateField('contact_number', e.target.value)}
               />
             </div>
          </div>
        </div>

        <div className="md:col-span-4 mt-2">
          <div className="bg-primary-600/5 border border-primary-600/10 rounded-xl p-4 flex items-center justify-between group transition-all hover:bg-primary-600/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-primary-600/20 flex items-center justify-center text-primary-600 shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-main uppercase tracking-widest">Main Branch</p>
                <p className="text-[9px] text-text-muted font-medium">Set this as your primary operating location.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={data?.is_main_branch || false}
                onChange={(e) => updateField('is_main_branch', e.target.checked)}
              />
              <div className="w-9 h-5 bg-text-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
