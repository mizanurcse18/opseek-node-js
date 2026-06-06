import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui-old/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { categoryService, financeCOAService, parseComboResponse } from '@/lib/scm/api/product.service';
import { companyService } from '@/lib/auth/api/company.service';
import { Layers, Building2, FolderTree, Wallet, Receipt, BadgeDollarSign } from 'lucide-react';

interface CategoryFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
  /** Allows external save buttons (modal header, tree panel). */
  formId?: string;
  /** When false, company is taken from `externalCompanyId` (e.g. tree view toolbar). */
  showCompanySelector?: boolean;
  externalCompanyId?: string;
}

export function CategoryForm({
  initialData,
  isSuperUser = false,
  onSave,
  onClose,
  onLoadingChange,
  formId = 'category-form',
  showCompanySelector,
  externalCompanyId,
}: CategoryFormProps) {
  const showCompany = showCompanySelector ?? isSuperUser;
  const [formData, setFormData] = useState({
    category_id: 0,
    category_name: '',
    parent_category_id: null as number | null,
    inventory_ledger_id: null as number | null,
    sales_ledger_id: null as number | null,
    cost_ledger_id: null as number | null,
    company_id: '',
    is_active: true,
  });

  const [parentCategories, setParentCategories] = useState<{ value: number; label: string }[]>([]);
  const [inventoryCOA, setInventoryCOA] = useState<{ value: number; label: string }[]>([]);
  const [salesCOA, setSalesCOA] = useState<{ value: number; label: string }[]>([]);
  const [costCOA, setCostCOA] = useState<{ value: number; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [catCombo, invCOA, salCOA, cstCOA] = await Promise.allSettled([
          categoryService.getCombo(),
          financeCOAService.getByType('Asset'),
          financeCOAService.getByType('Revenue'),
          financeCOAService.getByType('Expense'),
        ]);

        if (isMounted) {
          if (catCombo.status === 'fulfilled') setParentCategories(parseComboResponse(catCombo.value));
          if (invCOA.status === 'fulfilled') setInventoryCOA(parseComboResponse(invCOA.value));
          if (salCOA.status === 'fulfilled') setSalesCOA(parseComboResponse(salCOA.value));
          if (cstCOA.status === 'fulfilled') setCostCOA(parseComboResponse(cstCOA.value));
        }

        if (isSuperUser) {
          const resp = await companyService.getAllCompanies();
          if (isMounted && resp && Array.isArray(resp)) {
            setCompanies(resp.map((c: any) => ({
              value: c.value || c.id || c.company_id,
              label: c.label || c.company_name || `Company #${c.value || c.id}`,
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load combo data', err);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [isSuperUser]);

  useEffect(() => {
    const categoryId = initialData?.category_id ?? initialData?.id;
    if (categoryId) {
      const load = async () => {
        try {
          const res = await categoryService.getById(categoryId);
          if (res?.data) {
            const d = res.data;
            setFormData({
              category_id: d.category_id ?? categoryId,
              category_name: d.category_name ?? '',
              parent_category_id: d.parent_category_id ?? null,
              inventory_ledger_id: d.inventory_ledger_id ?? null,
              sales_ledger_id: d.sales_ledger_id ?? null,
              cost_ledger_id: d.cost_ledger_id ?? null,
              company_id: d.company_id ?? externalCompanyId ?? '',
              is_active: d.is_active ?? true,
            });
          }
        } catch (err) {
          console.error('Failed to load category', err);
        }
      };
      load();
      return;
    }

    if (initialData) {
      setFormData({
        category_id: 0,
        category_name: initialData.category_name ?? '',
        parent_category_id: initialData.parent_category_id ?? null,
        inventory_ledger_id: initialData.inventory_ledger_id ?? null,
        sales_ledger_id: initialData.sales_ledger_id ?? null,
        cost_ledger_id: initialData.cost_ledger_id ?? null,
        company_id: externalCompanyId ?? initialData.company_id ?? '',
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData, externalCompanyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Category Name is required.', status: 'error' });
      return;
    }

    if (onLoadingChange) onLoadingChange(true);
    try {
      const payload: any = {
        category_name: formData.category_name.trim(),
        parent_category_id: formData.parent_category_id || null,
        inventory_ledger_id: formData.inventory_ledger_id || null,
        sales_ledger_id: formData.sales_ledger_id || null,
        cost_ledger_id: formData.cost_ledger_id || null,
        is_active: formData.is_active,
        category_id: formData.category_id,
      };
      if (isSuperUser) {
        payload.company_id = showCompany
          ? formData.company_id
          : (externalCompanyId || formData.company_id);
      }

      const saveFn = isSuperUser ? categoryService.saveSuper : categoryService.save;
      const res = await saveFn(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Category saved successfully.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const fieldLabel = (text: string, required?: boolean) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/65 ml-1">
      {text}{required && <span className="text-red-500 font-bold"> *</span>}
    </Label>
  );

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} className="py-2 space-y-6">
        {/* Company Context - Super User Only */}
        {showCompany && (
          <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Company Context</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Super admin company selection</p>
              </div>
            </div>
            <div className="space-y-2">
              {fieldLabel('Company', true)}
              <Select
                options={companies}
                value={formData.company_id || null}
                onChange={(val) => setFormData(prev => ({ ...prev, company_id: val?.toString() || '' }))}
                placeholder="Select Company"
                className="w-full shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Two-column grid for Category Info + Ledger Mapping */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-300">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#2e125c]" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Category Information</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Basic details for the category</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category Name */}
              <div className="space-y-2">
                {fieldLabel('Category Name', true)}
                <Input
                  id="category_name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  placeholder="e.g. Electronics, Grocery, Clothing"
                  required
                  className="h-11 text-sm font-semibold border-slate-200 focus:ring-4 focus:ring-primary-500/5 focus:border-[#2e125c] rounded-xl shadow-sm transition-all"
                />
              </div>

              {/* Parent Category */}
              <div className="space-y-2">
                {fieldLabel('Parent Category')}
                <div className="relative">
                  <FolderTree className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none z-10" />
                  <Select
                    options={parentCategories.filter(c => c.value !== formData.category_id)}
                    value={formData.parent_category_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, parent_category_id: val ?? null }))}
                    placeholder="No Parent (Top Level)"
                    className="w-full pl-10 shadow-sm"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2 px-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                />
                <div className="flex flex-col select-none">
                  <Label htmlFor="is_active" className="text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer">Active Status</Label>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Category is available for use in products</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Mapping Card */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Ledger Mapping</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                  Default finance ledgers for products in this category
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Inventory Ledger */}
              <div className="space-y-2">
                {fieldLabel('Inventory Ledger (Asset)')}
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none z-10" />
                  <Select
                    options={inventoryCOA}
                    value={formData.inventory_ledger_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, inventory_ledger_id: val ?? null }))}
                    placeholder="Select Asset Head"
                    className="w-full pl-10 shadow-sm"
                  />
                </div>
              </div>

              {/* Sales Ledger */}
              <div className="space-y-2">
                {fieldLabel('Sales Ledger (Revenue)')}
                <div className="relative">
                  <Receipt className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none z-10" />
                  <Select
                    options={salesCOA}
                    value={formData.sales_ledger_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, sales_ledger_id: val ?? null }))}
                    placeholder="Select Revenue Head"
                    className="w-full pl-10 shadow-sm"
                  />
                </div>
              </div>

              {/* Cost Ledger */}
              <div className="space-y-2">
                {fieldLabel('Cost Ledger (Expense)')}
                <div className="relative">
                  <BadgeDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 pointer-events-none z-10" />
                  <Select
                    options={costCOA}
                    value={formData.cost_ledger_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, cost_ledger_id: val ?? null }))}
                    placeholder="Select Expense Head"
                    className="w-full pl-10 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ToastComponent />
    </>
  );
}
