import React, { useState, useEffect } from 'react';
import { Building2, Landmark, MapPin, Hash, HelpCircle, Store, Navigation, Phone, Globe, ChevronDown, User, Mail, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui-old/Select';
import { geoService } from '@/lib/auth/api/geo.service';
import { cn } from '@/lib/utils';
import { BdFlag } from './shared';

interface BusinessDetailsFormProps {
  data?: any;
  ownerData?: any;
  onChange?: (data: any) => void;
}

export default function BusinessDetailsForm({ data, ownerData, onChange, config, errors = [] }: BusinessDetailsFormProps & { config?: any, errors?: string[] }) {
  const hasError = (fieldId: string) => errors.includes(fieldId);

  const isFieldVisible = (fieldId: string) => {
    if (!config) return true;
    const field = config.fields.find((f: any) => f.id === fieldId);
    return field ? field.isVisible : true;
  };

  const isFieldRequired = (fieldId: string) => {
    if (!config) return true;
    const field = config.fields.find((f: any) => f.id === fieldId);
    return field ? field.isRequired : true;
  };

  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [thanas, setThanas] = useState<any[]>([]);
  
  const [loadedDistricts, setLoadedDistricts] = useState<Record<string, any[]>>({});
  const [loadedThanas, setLoadedThanas] = useState<Record<string, any[]>>({});

  const [isSameAsOwner, setIsSameAsOwner] = useState(false);
  const [emailError, setEmailError] = useState('');

  const industries = [
    { value: 'tech', label: 'Technology & SaaS' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'services', label: 'Professional Services' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    const loadDivisions = async () => {
      const resp = await geoService.getDivisionCombo();
      if (Array.isArray(resp)) {
        setDivisions(resp.map((d: any) => ({
          value: d.value || d.DivisionID,
          label: d.label || d.DivisionName
        })));
      }
    };
    loadDivisions();
  }, []);

  // Initial load for Districts if Division exists
  useEffect(() => {
    if (data?.outlet?.division_id) {
      loadDistricts(data.outlet.division_id);
    }
  }, [data?.outlet?.division_id]);

  // Initial load for Thanas if District exists
  useEffect(() => {
    if (data?.outlet?.district_id) {
      loadThanas(data.outlet.district_id);
    }
  }, [data?.outlet?.district_id]);

  const loadDistricts = async (divisionId: string | number) => {
    if (!divisionId) return;
    if (loadedDistricts[divisionId]) {
      setDistricts(loadedDistricts[divisionId]);
      return;
    }
    const resp = await geoService.getDistrictByDivision(divisionId);
    if (Array.isArray(resp)) {
      const mapped = resp.map((d: any) => ({
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
    const resp = await geoService.getThanaByDistrict(districtId);
    if (Array.isArray(resp)) {
      const mapped = resp.map((t: any) => ({
        value: t.value || t.ThanaID,
        label: t.label || t.ThanaName
      }));
      setThanas(mapped);
      setLoadedThanas(prev => ({ ...prev, [districtId]: mapped }));
    }
  };

  const updateFields = (updates: { info?: any; outlet?: any; contact?: any }) => {
    const newData = {
      ...data,
      info: { ...data.info, ...updates.info },
      outlet: { ...data.outlet, ...updates.outlet },
      contact: { ...data.contact, ...updates.contact }
    };
    onChange?.(newData);
  };

  const handleSameAsOwnerToggle = () => {
    const newVal = !isSameAsOwner;
    setIsSameAsOwner(newVal);
    if (newVal && ownerData) {
      updateFields({
        contact: {
          name: `${ownerData.first_name} ${ownerData.last_name}`.trim(),
          phone: ownerData.phone,
          email: ownerData.email
        }
      });
    }
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Section 1: Company Info */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Company Details</h2>
            <p className="text-[10px] text-text-muted font-medium">Basic information about your business entity.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {isFieldVisible('business_name') && (
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">
                Legal Business Name {isFieldRequired('business_name') && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative group">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                  placeholder="e.g. Zenith Global Ventures LLC"
                  value={data?.info?.business_name || ''}
                  onChange={(e) => updateFields({ info: { business_name: e.target.value } })}
                />
              </div>
            </div>
          )}

          {isFieldVisible('industry_type') && (
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">
                Industry Type {isFieldRequired('industry_type') && <span className="text-red-500">*</span>}
              </Label>
              <Select 
                options={industries}
                placeholder="Select Industry"
                value={data?.info?.industry_type || ''}
                onChange={(v: any) => updateFields({ info: { industry_type: v } })}
                className="w-full bg-white text-[11px] font-bold shadow-sm"
              />
            </div>
          )}

          {isFieldVisible('bin_number') && (
            <div className="space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">
                BIN Number {isFieldRequired('bin_number') && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative group">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                  placeholder="e.g. 0021-998-XX"
                  value={data?.info?.bin_number || ''}
                  onChange={(e) => updateFields({ info: { bin_number: e.target.value } })}
                />
              </div>
            </div>
          )}

          {isFieldVisible('tin_number') && (
            <div className="space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">
                TIN Number {isFieldRequired('tin_number') && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative group">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                  placeholder="e.g. 123-456-789"
                  value={data?.info?.tin_number || ''}
                  onChange={(e) => updateFields({ info: { tin_number: e.target.value } })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border-theme/50 pt-8" />
      {isFieldVisible('outlet_info') && (
        <>
          <div className="border-t border-border-theme/50 pt-8" />
          <div className="space-y-6">
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
                    value={data?.outlet?.outlet_name || ''}
                    onChange={(e) => updateFields({ outlet: { outlet_name: e.target.value } })}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Division</Label>
                <Select 
                  options={divisions}
                  placeholder="Select Division"
                  value={data?.outlet?.division_id || ''}
                  onChange={(v) => {
                    updateFields({ 
                      outlet: { 
                        division_id: v, 
                        district_id: '', 
                        thana_id: '' 
                      } 
                    });
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
                  disabled={!data?.outlet?.division_id}
                  value={data?.outlet?.district_id || ''}
                  onChange={(v) => {
                    updateFields({ 
                      outlet: { 
                        district_id: v, 
                        thana_id: '' 
                      } 
                    });
                    loadThanas(v);
                  }}
                  className="w-full bg-white text-[11px] font-bold shadow-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Thana / Upazila</Label>
                <Select 
                  options={thanas}
                  placeholder="Select Thana"
                  disabled={!data?.outlet?.district_id}
                  value={data?.outlet?.thana_id || ''}
                  onChange={(v) => updateFields({ outlet: { thana_id: v } })}
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
                    value={data?.outlet?.area_city || ''}
                    onChange={(e) => updateFields({ outlet: { area_city: e.target.value } })}
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
                    value={data?.outlet?.zip_code || ''}
                    onChange={(e) => updateFields({ outlet: { zip_code: e.target.value } })}
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
                    value={data?.outlet?.street_address || ''}
                    onChange={(e) => updateFields({ outlet: { street_address: e.target.value } })}
                  />
                </div>
              </div>

              <div className="md:col-span-4 space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Outlet Contact Number</Label>
                <div className="flex gap-2">
                   <div className="w-24 bg-white border border-border-theme rounded-lg px-3 py-2.5 flex items-center gap-2 cursor-default shrink-0 shadow-sm">
                      <BdFlag />
                      <span className="text-[11px] font-black text-text-main">+88</span>
                   </div>
                   <div className="relative flex-1 group">
                     <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                     <input 
                       className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                       placeholder="1700 000 000"
                       value={data?.outlet?.contact_number || ''}
                       onChange={(e) => updateFields({ outlet: { contact_number: e.target.value } })}
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
                      checked={data?.outlet?.is_main_branch || false}
                      onChange={(e) => updateFields({ outlet: { is_main_branch: e.target.checked } })}
                    />
                    <div className="w-9 h-5 bg-text-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isFieldVisible('contact_person') && (
        <>
          <div className="border-t border-border-theme/50 pt-8" />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Contact Person</h2>
                  <p className="text-[10px] text-text-muted font-medium">Designated representative for business communications.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-3.5 h-3.5 rounded border-border-theme text-primary-600 focus:ring-primary-600"
                  checked={isSameAsOwner}
                  onChange={handleSameAsOwnerToggle}
                />
                <span className="text-[10px] font-bold text-text-muted group-hover:text-text-main transition-colors uppercase tracking-widest">Same as Owner</span>
              </label>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-300", isSameAsOwner && "opacity-50 pointer-events-none")}>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                  <input 
                    className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                    placeholder="e.g. John Doe"
                    value={data?.contact?.name || ''}
                    onChange={(e) => updateFields({ contact: { name: e.target.value } })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Phone Number</Label>
                <div className="flex gap-2">
                   <div className="w-24 bg-white border border-border-theme rounded-lg px-3 py-2.5 flex items-center gap-2 cursor-default shrink-0 shadow-sm">
                      <BdFlag />
                      <span className="text-[11px] font-black text-text-main">+88</span>
                   </div>
                   <div className="relative flex-1 group">
                     <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                     <input 
                       className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
                       placeholder="1700 000 000"
                       value={data?.contact?.phone || ''}
                       onChange={(e) => updateFields({ contact: { phone: e.target.value } })}
                     />
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors",
                    emailError ? "text-red-500" : "text-text-muted group-focus-within:text-primary-600"
                  )} />
                  <input 
                    className={cn(
                      "w-full bg-white border rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none placeholder:text-text-muted/20 shadow-sm transition-all",
                      emailError ? "border-red-500 focus:border-red-500 shadow-red-500/5" : "border-border-theme focus:border-primary-600"
                    )}
                    placeholder="e.g. contact@business.com"
                    value={data?.contact?.email || ''}
                    onChange={(e) => {
                      updateFields({ contact: { email: e.target.value } });
                      validateEmail(e.target.value);
                    }}
                  />
                </div>
                {emailError && (
                  <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1 animate-in slide-in-from-left-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
