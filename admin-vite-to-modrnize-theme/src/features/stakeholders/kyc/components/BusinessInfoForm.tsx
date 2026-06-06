import React from 'react';
import { Building2, Landmark, MapPin, Hash, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui-old/Select';

interface BusinessInfoFormProps {
  data?: any;
  onChange?: (data: any) => void;
}

export default function BusinessInfoForm({ data, onChange }: BusinessInfoFormProps) {
  const industries = [
    { value: 'tech', label: 'Technology & SaaS' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'services', label: 'Professional Services' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Company Details</h2>
          <p className="text-[10px] text-text-muted font-medium">Ensure this matches your official registration documents exactly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Legal Business Name</Label>
          <div className="relative group">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <input 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
              placeholder="e.g. Zenith Global Ventures LLC"
              value={data?.business_name || ''}
              onChange={(e) => onChange?.({ business_name: e.target.value })}
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Industry Type</Label>
          <Select 
            options={industries}
            placeholder="Select Industry"
            value={data?.industry_type || ''}
            onChange={(v) => onChange?.({ industry_type: v })}
            className="w-full bg-white text-[11px] font-bold shadow-sm"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Registered Address</Label>
          <div className="relative group">
            <MapPin className="absolute left-3.5 top-3 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <textarea 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm resize-none"
              rows={3}
              placeholder="Street address, City, State, ZIP"
              value={data?.registered_address || ''}
              onChange={(e) => onChange?.({ registered_address: e.target.value })}
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="text-[8px] font-black uppercase tracking-widest text-text-main ml-1">Tax ID (TIN)</Label>
          <div className="relative group">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary-600 transition-colors" />
            <input 
              className="w-full bg-white border border-border-theme rounded-lg pl-10 pr-10 py-2.5 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 placeholder:text-text-muted/20 shadow-sm"
              placeholder="XX-XXXXXXX"
              value={data?.tax_id || ''}
              onChange={(e) => onChange?.({ tax_id: e.target.value })}
            />
            <HelpCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted/40 cursor-help hover:text-primary-600 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
