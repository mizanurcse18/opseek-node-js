import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supplierService, Supplier } from '@/lib/scm/api/supplier.service';
import { companyService } from '@/lib/auth/api/company.service';
import { financeCOAService } from '@/lib/scm/api/product.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn, validateEmail } from '@/lib/utils';
import { Building2, User, Phone, Mail, BookOpen, AlertCircle } from 'lucide-react';

interface SupplierFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

export function SupplierForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange, onSavingChange }: SupplierFormProps) {
  const [formData, setFormData] = useState<Supplier>({
    supplier_id: 0,
    person_id: 0,
    supplier_code: '',
    business_name: '',
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    is_active: true,
    company_id: '',
    ledger_id: '',
  });

  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);
  const [ledgerCOA, setLedgerCOA] = useState<{ value: string | number; label: string }[]>([]);
  const [emailError, setEmailError] = useState('');

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      const supplierId = initialData?.supplier_id || initialData?.id;
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

        // Load Accounting Ledger COA combo
        try {
          const ledgerResp = await financeCOAService.getByType('Liability');
          if (isMounted) {
            const data = ledgerResp?.data ?? ledgerResp ?? [];
            if (Array.isArray(data)) {
              setLedgerCOA(data.map((c: any) => ({
                value: c.value ?? c.account_id ?? c.id,
                label: c.label ?? c.account_name ?? c.name ?? String(c.value ?? '')
              })));
            }
          }
        } catch (error) {
          console.error('Failed to load ledger COA:', error);
        }

        // Load Supplier Details if editing
        if (supplierId) {
          try {
            const response = await supplierService.getSupplier(supplierId);
            if (isMounted && response?.data) {
              const data = response.data;
              setFormData({
                supplier_id: data.supplier_id || supplierId,
                person_id: data.person_id || 0,
                supplier_code: data.supplier_code || '',
                business_name: data.business_name || '',
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                mobile: data.mobile || '',
                email: data.email || '',
                is_active: data.is_active ?? true,
                company_id: data.company_id || '',
                ledger_id: data.ledger_id || '',
              });
              // Perform initial email validation if email exists
              if (data.email && isMounted) {
                if (!validateEmail(data.email)) {
                  setEmailError('Please enter a valid email address');
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch supplier details:', error);
          }
        } else if (initialData && isMounted) {
          setFormData({
            supplier_id: initialData.supplier_id || 0,
            person_id: initialData.person_id || 0,
            supplier_code: initialData.supplier_code || '',
            business_name: initialData.business_name || '',
            first_name: initialData.first_name || '',
            last_name: initialData.last_name || '',
            mobile: initialData.mobile || '',
            email: initialData.email || '',
            is_active: initialData.is_active ?? true,
            company_id: initialData.company_id || '',
            ledger_id: initialData.ledger_id || '',
          });
          if (initialData.email && !validateEmail(initialData.email)) {
            setEmailError('Please enter a valid email address');
          }
        }
      } finally {
        if (onLoadingChange && isMounted) onLoadingChange(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [initialData, isSuperUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (isSuperUser && !formData.company_id) {
      toast({ title: 'Validation Error', description: 'Company Context is required.', status: 'error' });
      return;
    }
    if (!formData.business_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Business Name is required.', status: 'error' });
      return;
    }
    if (!formData.first_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Contact First Name is required.', status: 'error' });
      return;
    }
    if (!formData.mobile?.trim()) {
      toast({ title: 'Validation Error', description: 'Mobile number is required.', status: 'error' });
      return;
    }
    if (formData.email && !validateEmail(formData.email)) {
      toast({ title: 'Validation Error', description: 'Please enter a valid email address.', status: 'error' });
      return;
    }

    if (onSavingChange) onSavingChange(true);

    try {
      const response = await supplierService.saveSupplier(formData);

      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Supplier saved successfully.', status: 'success' });
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
    <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isSuperUser && (
          <div className="space-y-2 md:col-span-2">
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

        {/* Business Information */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Business Information</span>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            Business Name <span className="text-red-500 font-bold">*</span>
          </Label>
          <div className="relative group">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. ABC Traders"
              required
              className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Contact Person */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 mb-1 mt-2">
            <User className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Contact Person</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            First Name <span className="text-red-500 font-bold">*</span>
          </Label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="e.g. John"
              required
              className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Last Name</Label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="e.g. Doe"
              className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
            Mobile <span className="text-red-500 font-bold">*</span>
          </Label>
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="e.g. 01712345678"
              required
              className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
            <Input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. john@example.com"
              type="email"
              className={cn(
                "h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all",
                emailError && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
              )}
            />
          </div>
          {emailError && (
            <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 ml-1 mt-1 animate-in slide-in-from-left-1">
              <AlertCircle className="w-3 h-3" />
              {emailError}
            </p>
          )}
        </div>
      </div>

      {/* Accounts Payable Ledger Mapping */}
      <div className="space-y-2 pt-2 border-t border-border-theme">
        <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
          Accounts Payable Ledger
        </Label>
        <div className="relative group">
          <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
          <Select
            options={ledgerCOA}
            value={formData.ledger_id ?? null}
            onChange={(val) => setFormData(prev => ({ ...prev, ledger_id: val ?? '' }))}
            placeholder="Select AP Ledger (optional)"
            className="w-full shadow-sm"
          />
        </div>
        <p className="text-[9px] font-medium text-text-muted/50 ml-1 italic">
          Finance ledger for accounts payable tracking against this supplier.
        </p>
      </div>

      <div className="flex items-center gap-2 px-1 pt-2 border-t border-border-theme">
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
