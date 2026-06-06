import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Map, MapPin, Navigation, Home, ChevronDown, AlertCircle } from 'lucide-react';
import { geoService } from '@/lib/auth/api/geo.service';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui-old/Select';
import { Label } from '@/components/ui/Label';
import { BdFlag } from './shared';

interface Address {
  division_id: number | string;
  district_id: number | string;
  thana_id: number | string;
  address_detail: string;
}

export default function BasicInfoForm({ data, ocrData, onChange, config, errors = [] }: { data: any, ocrData?: any, onChange?: (data: any) => void, config?: any, errors?: string[] }) {
  const hasError = (fieldId: string) => errors.includes(fieldId);
  const fieldRefs = React.useRef<Record<string, any>>({});
  const getRef = (fieldId: string) => (el: any) => {
    if (el) fieldRefs.current[fieldId] = el;
  };

  useEffect(() => {
    if (errors.length > 0) {
      const firstErrorField = errors[0];
      if (fieldRefs.current[firstErrorField]) {
        fieldRefs.current[firstErrorField].focus();
      }
    }
  }, [errors]);

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

  const [formData, setFormData] = useState({
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    father_name: data.father_name || '',
    mother_name: data.mother_name || '',
    email: data.email || '',
    phone: data.phone || ''
  });

  const [emailError, setEmailError] = useState('');
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [presentAddress, setPresentAddress] = useState<Address>(data.present_address || {
    division_id: '',
    district_id: '',
    thana_id: '',
    address_detail: ''
  });
  const [permanentAddress, setPermanentAddress] = useState<Address>(data.permanent_address || {
    division_id: '',
    district_id: '',
    thana_id: '',
    address_detail: ''
  });

  const [divisions, setDivisions] = useState<{ value: string | number; label: string }[]>([]);

  // States to hold options for each section
  const [presentDistricts, setPresentDistricts] = useState<any[]>([]);
  const [permanentDistricts, setPermanentDistricts] = useState<any[]>([]);
  const [presentThanas, setPresentThanas] = useState<any[]>([]);
  const [permanentThanas, setPermanentThanas] = useState<any[]>([]);

  // Track loaded data to avoid redundant calls
  const [loadedDistricts, setLoadedDistricts] = useState<Record<string, any[]>>({});
  const [loadedThanas, setLoadedThanas] = useState<Record<string, any[]>>({});

  // Function to update local state and notify parent in one go
  const updateState = (updates: any) => {
    const nextFormData = { ...formData, ...updates.formData };
    const nextPresent = updates.presentAddress || presentAddress;
    const nextPermanent = updates.permanentAddress || permanentAddress;

    if (updates.formData) setFormData(nextFormData);
    if (updates.presentAddress) setPresentAddress(nextPresent);
    if (updates.permanentAddress) setPermanentAddress(nextPermanent);

    onChange?.({
      ...nextFormData,
      present_address: nextPresent,
      permanent_address: nextPermanent
    });
  };

  // State synchronization from parent 'data' prop (Only on heavy updates/mount)
  useEffect(() => {
    if (data) {
      // Check if we actually need to update to avoid loops
      const hasChanged =
        data.first_name !== formData.first_name ||
        data.last_name !== formData.last_name ||
        data.father_name !== formData.father_name ||
        data.mother_name !== formData.mother_name ||
        data.email !== formData.email ||
        data.phone !== formData.phone;

      if (hasChanged) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          father_name: data.father_name || '',
          mother_name: data.mother_name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      }

      if (data.present_address && JSON.stringify(data.present_address) !== JSON.stringify(presentAddress)) {
        setPresentAddress(data.present_address);
      }
      if (data.permanent_address && JSON.stringify(data.permanent_address) !== JSON.stringify(permanentAddress)) {
        setPermanentAddress(data.permanent_address);
      }
    }
  }, [data]);

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

  // 1. Initial load: Only Divisions
  useEffect(() => {
    const loadDivisions = async () => {
      try {
        const resp = await geoService.getDivisionCombo();
        const data = resp?.data || resp;
        if (Array.isArray(data)) {
          setDivisions(data.map((d: any) => ({
            value: d.value || d.DivisionID || d.division_id,
            label: d.label || d.DivisionName || d.division_name
          })));
        }
      } catch (err) {
        console.error("Failed to load divisions", err);
      }
    };
    loadDivisions();
  }, []);

  // 2. Load Districts when Division changes
  const loadDistrictsForDivision = async (divisionId: string | number, setDistricts: (data: any[]) => void) => {
    if (!divisionId) return;

    // Check if we already have it in cache
    if (loadedDistricts[divisionId]) {
      setDistricts(loadedDistricts[divisionId]);
      return;
    }

    try {
      const data = await geoService.getDistrictByDivision(divisionId);
      if (Array.isArray(data)) {
        const mapped = data.map((d: any) => ({
          value: d.value || d.DistrictID || d.district_id,
          label: d.label || d.DistrictName || d.district_name
        }));
        setDistricts(mapped);
        setLoadedDistricts(prev => ({ ...prev, [divisionId]: mapped }));
      }
    } catch (err) {
      console.error("Failed to load districts", err);
    }
  };

  useEffect(() => {
    loadDistrictsForDivision(presentAddress.division_id, setPresentDistricts);
  }, [presentAddress.division_id]);

  useEffect(() => {
    if (isSameAddress) {
      setPermanentDistricts(presentDistricts);
    } else {
      loadDistrictsForDivision(permanentAddress.division_id, setPermanentDistricts);
    }
  }, [permanentAddress.division_id, isSameAddress, presentDistricts]);

  // 3. Load Thanas when District changes
  const loadThanasForDistrict = async (districtId: string | number, setThanas: (data: any[]) => void) => {
    if (!districtId) return;

    if (loadedThanas[districtId]) {
      setThanas(loadedThanas[districtId]);
      return;
    }

    try {
      const data = await geoService.getThanaByDistrict(districtId);
      if (Array.isArray(data)) {
        const mapped = data.map((t: any) => ({
          value: t.value || t.ThanaID || t.thana_id,
          label: t.label || t.ThanaName || t.thana_name
        }));
        setThanas(mapped);
        setLoadedThanas(prev => ({ ...prev, [districtId]: mapped }));
      }
    } catch (err) {
      console.error("Failed to load thanas", err);
    }
  };

  useEffect(() => {
    loadThanasForDistrict(presentAddress.district_id, setPresentThanas);
  }, [presentAddress.district_id]);

  useEffect(() => {
    if (isSameAddress) {
      setPermanentThanas(presentThanas);
    } else {
      loadThanasForDistrict(permanentAddress.district_id, setPermanentThanas);
    }
  }, [permanentAddress.district_id, isSameAddress, presentThanas]);

  const handleSameAddressToggle = () => {
    const newVal = !isSameAddress;
    setIsSameAddress(newVal);
    if (newVal) {
      setPermanentAddress({ ...presentAddress });
      setPermanentDistricts(presentDistricts);
      setPermanentThanas(presentThanas);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Basic Info</h2>
          <p className="text-[12px] text-text-muted font-medium">Verify your profile details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isFieldVisible('first_name') && (
          <InputGroup
            label="First Name"
            placeholder="Arif"
            icon={User}
            value={formData.first_name}
            required={isFieldRequired('first_name')}
            error={hasError('first_name')}
            ref={getRef('first_name')}
            onChange={(v: string) => updateState({ formData: { first_name: v } })}
          />
        )}
        {isFieldVisible('last_name') && (
          <InputGroup
            label="Last Name"
            placeholder="Ahmed"
            icon={User}
            value={formData.last_name}
            required={isFieldRequired('last_name')}
            error={hasError('last_name')}
            ref={getRef('last_name')}
            onChange={(v: string) => updateState({ formData: { last_name: v } })}
          />
        )}

        {isFieldVisible('father_name') && (
          <InputGroup
            label="Father's Name"
            placeholder="Father Name (Auto-filled)"
            icon={User}
            value={formData.father_name}
            required={isFieldRequired('father_name')}
            error={hasError('father_name')}
            ref={getRef('father_name')}
            onChange={(v: string) => updateState({ formData: { father_name: v } })}
          />
        )}

        {isFieldVisible('mother_name') && (
          <InputGroup
            label="Mother's Name"
            placeholder="Mother Name (Auto-filled)"
            icon={User}
            value={formData.mother_name}
            required={isFieldRequired('mother_name')}
            error={hasError('mother_name')}
            ref={getRef('mother_name')}
            onChange={(v: string) => updateState({ formData: { mother_name: v } })}
          />
        )}

        {isFieldVisible('email') && (
          <div className="space-y-2">
            <InputGroup
              label="Email Address"
              placeholder="arif.ahmed@example.com"
              type="email"
              icon={Mail}
              value={formData.email}
              required={isFieldRequired('email')}
              error={hasError('email') || !!emailError}
              ref={getRef('email')}
              onChange={(v: string) => {
                updateState({ formData: { email: v } });
                validateEmail(v);
              }}
            />
            {emailError && (
              <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 ml-1 animate-in slide-in-from-left-1">
                <AlertCircle className="w-3 h-3" />
                {emailError}
              </p>
            )}
          </div>
        )}

        {isFieldVisible('phone') && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-main ml-1">
              Phone Number {isFieldRequired('phone') && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex gap-2">
              <div className="w-28 bg-white border border-border-theme rounded-lg px-3 py-2.5 flex items-center gap-2 cursor-default shrink-0 shadow-sm">
                <BdFlag />
                <span className="text-[13px] font-black text-text-main">+88</span>
              </div>
              <div className="relative flex-1 group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
                <input
                  ref={getRef('phone') as any}
                  className={cn(
                    "w-full bg-white border rounded-lg pl-10 pr-4 py-2.5 text-[13px] font-bold text-text-main focus:outline-none transition-all placeholder:text-text-muted/20 shadow-sm",
                    hasError('phone') ? "border-red-500 focus:border-red-500" : "border-border-theme focus:border-primary-600"
                  )}
                  placeholder="1700 000 000"
                  value={formData.phone}
                  onChange={(e) => updateState({ formData: { phone: e.target.value } })}
                />
              </div>
            </div>
          </div>
        )}

        {isFieldVisible('present_address') && (
          <div className="md:col-span-2 mt-4">
            <h3 className={cn(
              "text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2",
              (hasError('present_address_division_id') || hasError('present_address_district_id') || hasError('present_address_thana_id') || hasError('present_address_detail')) ? "text-red-500" : "text-primary-600"
            )}>
              <div className={cn("w-2 h-2 rounded-full", (hasError('present_address_division_id') || hasError('present_address_district_id') || hasError('present_address_thana_id') || hasError('present_address_detail')) ? "bg-red-500" : "bg-primary-600")} />
              Present Address {isFieldRequired('present_address') && <span className="text-red-500">*</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GeoSelect
                label="Division"
                options={divisions}
                value={presentAddress.division_id}
                error={hasError('present_address_division_id')}
                onChange={(v: any) => updateState({ presentAddress: { ...presentAddress, division_id: v, district_id: '', thana_id: '' } })}
                placeholder="Select Division"
              />
              <GeoSelect
                label="District"
                options={presentDistricts}
                value={presentAddress.district_id}
                error={hasError('present_address_district_id')}
                onChange={(v: any) => updateState({ presentAddress: { ...presentAddress, district_id: v, thana_id: '' } })}
                placeholder="Select District"
                disabled={!presentAddress.division_id}
              />
              <GeoSelect
                label="Thana"
                options={presentThanas}
                value={presentAddress.thana_id}
                error={hasError('present_address_thana_id')}
                onChange={(v: any) => updateState({ presentAddress: { ...presentAddress, thana_id: v } })}
                placeholder="Select Thana"
                disabled={!presentAddress.district_id}
              />
              <div className="md:col-span-3 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-main ml-1">Address Detail</Label>
                <textarea
                  ref={getRef('present_address_detail') as any}
                  value={presentAddress.address_detail}
                  onChange={(e) => updateState({ presentAddress: { ...presentAddress, address_detail: e.target.value } })}
                  rows={2}
                  className={cn(
                    "w-full bg-white border rounded-lg px-4 py-2.5 text-[13px] font-bold text-text-main focus:outline-none transition-all placeholder:text-text-muted/20 shadow-sm resize-none",
                    hasError('present_address_detail') ? "border-red-500 focus:border-red-500" : "border-border-theme focus:border-primary-600"
                  )}
                  placeholder="House #, Road #, Area..."
                />
              </div>
            </div>
          </div>
        )}

        {isFieldVisible('permanent_address') && (
          <div className="md:col-span-2 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-600" />
                Permanent Address {isFieldRequired('permanent_address') && <span className="text-red-500">*</span>}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isSameAddress}
                  onChange={handleSameAddressToggle}
                  className="w-3 h-3 rounded border-border-theme text-primary-600 focus:ring-primary-600/20"
                />
                <span className="text-[11px] font-bold text-text-muted group-hover:text-text-main transition-colors uppercase tracking-widest">Same as present address</span>
              </label>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300", isSameAddress && "opacity-50 pointer-events-none")}>
              <GeoSelect
                label="Division"
                options={divisions}
                value={permanentAddress.division_id}
                onChange={(v: any) => updateState({ permanentAddress: { ...permanentAddress, division_id: v, district_id: '', thana_id: '' } })}
                placeholder="Select Division"
              />
              <GeoSelect
                label="District"
                options={permanentDistricts}
                value={permanentAddress.district_id}
                onChange={(v: any) => updateState({ permanentAddress: { ...permanentAddress, district_id: v, thana_id: '' } })}
                placeholder="Select District"
                disabled={!permanentAddress.division_id}
              />
              <GeoSelect
                label="Thana"
                options={permanentThanas}
                value={permanentAddress.thana_id}
                onChange={(v: any) => updateState({ permanentAddress: { ...permanentAddress, thana_id: v } })}
                placeholder="Select Thana"
                disabled={!permanentAddress.district_id}
              />
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-text-main ml-1">Address Detail</Label>
                  <textarea
                    value={permanentAddress.address_detail}
                    onChange={(e) => updateState({ permanentAddress: { ...permanentAddress, address_detail: e.target.value } })}
                    rows={2}
                    className="w-full bg-white border border-border-theme rounded-lg px-4 py-2.5 text-[13px] font-bold text-text-main focus:outline-none focus:border-primary-600 transition-all placeholder:text-text-muted/20 shadow-sm resize-none"
                    placeholder="House #, Road #, Area..."
                  />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const InputGroup = React.forwardRef(({ label, placeholder, type = 'text', icon: Icon, value, onChange, error, required }: any, ref: any) => {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-text-main ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative group">
        {Icon && <Icon className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors",
          error ? "text-red-500" : "text-text-muted group-focus-within:text-primary-600"
        )} />}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full bg-white border rounded-lg pr-4 py-2.5 text-[13px] font-bold text-text-main focus:outline-none transition-all placeholder:text-text-muted/20 shadow-sm",
            Icon ? "pl-10" : "pl-4",
            error ? "border-red-500 focus:border-red-500 shadow-red-500/5" : "border-border-theme focus:border-primary-600"
          )}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
});

InputGroup.displayName = 'InputGroup';

function GeoSelect({ label, options, value, onChange, placeholder, disabled, error }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-text-main ml-1">{label}</Label>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full bg-white text-[13px] font-bold shadow-sm",
          error && "border-red-500"
        )}
      />
    </div>
  );
}
