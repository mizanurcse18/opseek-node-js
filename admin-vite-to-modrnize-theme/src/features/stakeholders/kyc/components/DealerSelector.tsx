import React, { useState, useEffect } from 'react';
import { Building2, Search, CheckCircle2, User, ChevronDown } from 'lucide-react';
import { kycService } from '@/lib/auth/api/kyc.service';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Select } from '@/components/ui-old/Select';

interface DealerSelectorProps {
  onSelect: (dealerId: string | number, dealerName: string) => void;
  selectedId?: string | number;
  viewMode?: 'list' | 'dropdown';
}

export default function DealerSelector({ onSelect, selectedId, viewMode = 'list' }: DealerSelectorProps) {
  const [dealers, setDealers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setIsLoading(true);
      const response = await kycService.getDealers();
      const data = response.data || response;
      if (Array.isArray(data)) {
        setDealers(data);
      }
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDealer = dealers.find(d => String(d.value || d.id) === String(selectedId));

  const filteredDealers = dealers.filter(d => 
    (d.label || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.value || d.id || '').toString().includes(searchTerm)
  );

  const options = dealers.map(d => ({
    value: d.value || d.id,
    label: `${d.label || d.name} (ID: ${d.value || d.id})`
  }));

  if (viewMode === 'dropdown') {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase">Parent Dealer Mapping</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Select your managing business entity</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-6 flex items-center justify-center gap-3">
              <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Loading Network...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Select
                options={options}
                value={selectedId || null}
                onChange={(val) => {
                  const dealer = dealers.find(d => String(d.value || d.id) === String(val));
                  if (dealer) onSelect(val!, dealer.label || dealer.name);
                }}
                placeholder="Search and select a dealer..."
                className="w-full"
                isSearchable={true}
              />

              {selectedDealer && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-center gap-3 animate-in zoom-in-95 duration-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest leading-none mb-1">Mapped Partner</span>
                    <span className="text-[11px] font-black text-slate-900 uppercase truncate">
                      {selectedDealer.label || selectedDealer.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT LIST VIEW
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Parent Dealer</h2>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Map this DSR to a registered business entity</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
        <input 
          type="text"
          placeholder="Search by dealer name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-premium">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fetching registered dealers...</p>
          </div>
        ) : filteredDealers.length > 0 ? (
          filteredDealers.map((dealer) => {
            const id = dealer.value || dealer.id;
            const name = dealer.label || dealer.name;
            const isSelected = selectedId?.toString() === id?.toString();

            return (
              <button
                key={id}
                onClick={() => onSelect(id, name)}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all relative group",
                  isSelected 
                    ? "bg-primary-600 border-primary-600 shadow-lg shadow-primary-600/20" 
                    : "bg-white border-slate-200 hover:border-primary-400 hover:shadow-md"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600"
                  )}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-xs font-black uppercase tracking-tight truncate",
                      isSelected ? "text-white" : "text-slate-900"
                    )}>
                      {name}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isSelected ? "text-white/60" : "text-slate-400"
                    )}>
                      ID: {id}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No dealers found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
