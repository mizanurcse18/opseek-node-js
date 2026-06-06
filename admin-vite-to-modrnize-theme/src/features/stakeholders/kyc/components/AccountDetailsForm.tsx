import React, { useState } from 'react';
import { Landmark, CreditCard, Plus, Trash2, CheckCircle2, Wallet, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';

interface AccountDetailsFormProps {
  data?: any;
  onChange?: (data: any) => void;
}

export default function AccountDetailsForm({ data, onChange, config, errors = [] }: AccountDetailsFormProps & { config?: any, errors?: string[] }) {
  const hasError = (fieldId: string) => errors.includes(fieldId);

  const isFieldVisible = (fieldId: string) => {
    if (!config) return true;
    const field = config.fields.find((f: any) => f.id === fieldId);
    return field ? field.isVisible : true;
  };

  const banks = [
    { value: 'dbbl', label: 'Dutch Bangla Bank' },
    { value: 'brac', label: 'BRAC Bank' },
    { value: 'city', label: 'The City Bank' },
    { value: 'ebl', label: 'Eastern Bank (EBL)' },
    { value: 'islami', label: 'Islami Bank Bangladesh' },
    { value: 'scb', label: 'Standard Chartered' },
    { value: 'hsbc', label: 'HSBC' },
    { value: 'other', label: 'Other Bank' },
  ];

  const mfsOperators = [
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'upay', label: 'Upay' },
    { value: 'tap', label: 'TAP' },
  ];

  const [bankEntry, setBankEntry] = useState({
    bank_name: '',
    branch: '',
    account_name: '',
    account_no: '',
    routing_no: '',
    is_default: false
  });

  const [mfsEntry, setMfsEntry] = useState({
    mfs_name: '',
    mobile_number: '',
    is_default: false
  });

  const addBank = () => {
    if (!bankEntry.bank_name || !bankEntry.account_no) return;
    
    // Handle "is_default" logic: if this is default, un-default others
    let newList = data?.bank_accounts || [];
    if (bankEntry.is_default) {
      newList = newList.map((a: any) => ({ ...a, is_default: false }));
    }
    
    newList = [...newList, { ...bankEntry, id: Date.now() }];
    onChange?.({ ...data, bank_accounts: newList });
    setBankEntry({ bank_name: '', branch: '', account_name: '', account_no: '', routing_no: '', is_default: false });
  };

  const removeBank = (id: number) => {
    const newList = data.bank_accounts.filter((a: any) => a.id !== id);
    onChange?.({ ...data, bank_accounts: newList });
  };

  const addMfs = () => {
    if (!mfsEntry.mfs_name || !mfsEntry.mobile_number) return;
    
    let newList = data?.mfs_accounts || [];
    if (mfsEntry.is_default) {
      newList = newList.map((a: any) => ({ ...a, is_default: false }));
    }

    newList = [...newList, { ...mfsEntry, id: Date.now() }];
    onChange?.({ ...data, mfs_accounts: newList });
    setMfsEntry({ mfs_name: '', mobile_number: '', is_default: false });
  };

  const removeMfs = (id: number) => {
    const newList = data.mfs_accounts.filter((a: any) => a.id !== id);
    onChange?.({ ...data, mfs_accounts: newList });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Section 1: Banking Information */}
      {isFieldVisible('bank_accounts') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Banking Information</h2>
                <p className="text-[10px] text-text-muted font-medium">Add one or more settlement bank accounts.</p>
              </div>
            </div>
            <span className="text-[9px] font-black text-primary-600 bg-primary-600/10 px-2 py-1 rounded-full uppercase tracking-widest">
              {data?.bank_accounts?.length || 0} Accounts
            </span>
          </div>

          {/* Bank Entry Form */}
          <div className="bg-content-bg/30 border border-border-theme rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">Bank Name</Label>
                <select 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 appearance-none"
                  value={bankEntry.bank_name}
                  onChange={(e) => setBankEntry(prev => ({ ...prev, bank_name: e.target.value }))}
                >
                  <option value="">Select Bank</option>
                  {banks.map(b => <option key={b.value} value={b.label}>{b.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">Branch</Label>
                <select 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 appearance-none"
                  value={bankEntry.branch}
                  onChange={(e) => setBankEntry(prev => ({ ...prev, branch: e.target.value }))}
                >
                  <option value="">Select Branch</option>
                  <option value="Motijheel">Motijheel</option>
                  <option value="Gulshan">Gulshan</option>
                  <option value="Banani">Banani</option>
                  <option value="Uttara">Uttara</option>
                  <option value="Dhanmondi">Dhanmondi</option>
                  <option value="Mirpur">Mirpur</option>
                  <option value="Agrabad">Agrabad</option>
                  <option value="Laldighirpar">Laldighirpar</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">Account Name</Label>
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600"
                  placeholder="e.g. John Doe"
                  value={bankEntry.account_name}
                  onChange={(e) => setBankEntry(prev => ({ ...prev, account_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">Account No.</Label>
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600"
                  placeholder="0000 0000 0000"
                  value={bankEntry.account_no}
                  onChange={(e) => setBankEntry(prev => ({ ...prev, account_no: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">Routing No.</Label>
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600"
                  placeholder="123456789"
                  value={bankEntry.routing_no}
                  onChange={(e) => setBankEntry(prev => ({ ...prev, routing_no: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3 pt-6">
                <input 
                  type="checkbox" 
                  id="bank-default"
                  className="w-3.5 h-3.5 rounded border-border-theme text-primary-600 focus:ring-primary-600"
                  checked={bankEntry.is_default}
                  onChange={(e) => setBankEntry(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <label htmlFor="bank-default" className="text-[10px] font-bold text-text-muted cursor-pointer">Set as Default</label>
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button 
                  onClick={addBank}
                  className="w-full h-9 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 rounded-lg shadow-md transition-all active:scale-[0.98]"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          </div>

          {/* Bank Table */}
          {data?.bank_accounts?.length > 0 && (
            <div className="overflow-hidden border border-border-theme rounded-xl shadow-sm animate-in slide-in-from-top-2">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-content-bg border-b border-border-theme">
                  <tr>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Bank / Branch</th>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Account Details</th>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Default</th>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme bg-white">
                  {data.bank_accounts.map((acc: any) => (
                    <tr key={acc.id} className="group hover:bg-primary-600/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-text-main">{acc.bank_name}</p>
                        <p className="text-[9px] text-text-muted font-medium">{acc.branch}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-text-main">{acc.account_no}</p>
                        <p className="text-[9px] text-text-muted font-medium">{acc.account_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {acc.is_default ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-border-theme" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => removeBank(acc.id)}
                          className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border-theme/50 pt-8" />

      {/* Section 2: MFS Information */}
      {isFieldVisible('mfs_accounts') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-text-main uppercase tracking-tight">MFS Information</h2>
                <p className="text-[10px] text-text-muted font-medium">Add Nagad, bKash or other mobile wallets.</p>
              </div>
            </div>
            <span className="text-[9px] font-black text-primary-600 bg-primary-600/10 px-2 py-1 rounded-full uppercase tracking-widest">
              {data?.mfs_accounts?.length || 0} Wallets
            </span>
          </div>

          <div className="bg-content-bg/30 border border-border-theme rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">MFS Name</Label>
                <select 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600 appearance-none"
                  value={mfsEntry.mfs_name}
                  onChange={(e) => setMfsEntry(prev => ({ ...prev, mfs_name: e.target.value }))}
                >
                  <option value="">Select Operator</option>
                  {mfsOperators.map(o => <option key={o.value} value={o.label}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest text-text-muted ml-1">Mobile Number</Label>
                <input 
                  className="w-full bg-white border border-border-theme rounded-lg px-3 py-2 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary-600"
                  placeholder="01XXX XXXXXX"
                  value={mfsEntry.mobile_number}
                  onChange={(e) => setMfsEntry(prev => ({ ...prev, mobile_number: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox" 
                  id="mfs-default"
                  className="w-3.5 h-3.5 rounded border-border-theme text-primary-600 focus:ring-primary-600"
                  checked={mfsEntry.is_default}
                  onChange={(e) => setMfsEntry(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <label htmlFor="mfs-default" className="text-[10px] font-bold text-text-muted cursor-pointer">Set as Default</label>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addMfs}
                  className="w-full h-9 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 rounded-lg shadow-md transition-all active:scale-[0.98]"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          </div>

          {data?.mfs_accounts?.length > 0 && (
            <div className="overflow-hidden border border-border-theme rounded-xl shadow-sm animate-in slide-in-from-top-2">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-content-bg border-b border-border-theme">
                  <tr>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">MFS Operator</th>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Mobile Number</th>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Default</th>
                    <th className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme bg-white">
                  {data.mfs_accounts.map((mfs: any) => (
                    <tr key={mfs.id} className="group hover:bg-primary-600/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-text-muted" />
                          <p className="font-bold text-text-main uppercase">{mfs.mfs_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-text-main tracking-widest">{mfs.mobile_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        {mfs.is_default ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-border-theme" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => removeMfs(mfs.id)}
                          className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-text-main uppercase tracking-widest">Payout Security</p>
          <p className="text-[9px] text-text-muted font-medium leading-relaxed">
            Ensure that the account name matches your NID name. Settlements will be automatically directed to the account marked as "Default".
          </p>
        </div>
      </div>
    </div>
  );
}
