import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Building2, Shield, Upload, X, ImageIcon, Info, Star, Save, Loader2 } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui-old/Select';
import { Option } from '@/components/ui/Select';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export function CompanyModal({ isOpen, onClose, onSave, initialData }: CompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rawParentOptions, setRawParentOptions] = useState<any[]>([]);
  const { toast, ToastComponent } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!(initialData?.id || initialData?.company_id || initialData?.CompanyID);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save Company' },
    { button_id: 'btnEdit', button_title: 'Update Company' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;
  const canSave = activeBtn?.visible ?? false;

  const [formData, setFormData] = useState({
    id: '',
    company_name: '',
    address: '',
    tin: '',
    bin: '',
    is_default: false,
    vat_reg_no: '',
    irc_no: '',
    company_logo: '',
    short_code: '',
    license_code: '',
    seq_no: '',
    row_version: 1,
    parent_id: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 1. Fetch parent company options once when modal opens
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const fetchParentOptions = async () => {
      try {
        const response: any = await companyService.getParentCompanies();
        const data = response?.data || response;
        if (isMounted && Array.isArray(data)) {
          setRawParentOptions(data);
        }
      } catch (error) {
        console.error("Failed to fetch parent company options:", error);
      }
    };

    fetchParentOptions();
    return () => { isMounted = false; };
  }, [isOpen]);

  // 2. Fetch specific company details only when editing a different company
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const companyId = initialData?.id || initialData?.company_id || initialData?.CompanyID;

    const fetchCompanyDetails = async () => {
      if (!companyId) {
        // Reset for new company
        setFormData({
          id: '',
          company_name: '',
          address: '',
          tin: '',
          bin: '',
          is_default: false,
          vat_reg_no: '',
          irc_no: '',
          company_logo: '',
          short_code: '',
          license_code: '',
          seq_no: '',
          row_version: 1,
          parent_id: '',
        });
        setLogoFile(null);
        setLogoPreview('');
        setErrors({});
        return;
      }

      setLoading(true);
      try {
        const response = await companyService.getCompanyById(companyId);
        if (isMounted && response?.data) {
          const d = response.data.company || response.data.Master || response.data;
          setFormData({
            id: String(d.id || d.company_id || d.CompanyID || companyId || ''),
            company_name: d.company_name || d.CompanyName || '',
            address: d.address || d.Address || '',
            tin: d.tin || d.TIN || '',
            bin: d.bin || d.BIN || '',
            is_default: !!(d.is_default || d.IsDefault),
            vat_reg_no: d.vat_reg_no || d.VATRegNo || '',
            irc_no: d.irc_no || d.IRCNo || '',
            company_logo: d.company_logo || d.CompanyLogo || '',
            short_code: d.short_code || d.ShortCode || '',
            license_code: d.license_code || d.LicenseCode || '',
            seq_no: String(d.seq_no || d.SeqNo || ''),
            row_version: d.row_version || d.RowVersion || 1,
            parent_id: String(d.parent_id || d.ParentID || ''),
          });
          if (d.company_logo) setLogoPreview(d.company_logo);
        }
      } catch (error) {
        toast(handleApiError(error));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCompanyDetails();
    return () => { isMounted = false; };
  }, [isOpen, initialData?.id, initialData?.company_id, initialData?.CompanyID]);

  // 3. Dynamically filter parent options to exclude the current company
  const parentOptions = React.useMemo(() => {
    return rawParentOptions
      .filter(c => {
        const val = String(c.value || c.company_id || c.CompanyID || c.id || '');
        return val !== String(formData.id);
      })
      .map(c => ({
        value: c.value || c.id || c.company_id || c.CompanyID,
        label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id || '?'}`,
      }));
  }, [rawParentOptions, formData.id]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, company_logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const set = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.company_name.trim()) newErrors.company_name = 'Company Name is required';
    if (!formData.id.trim()) {
      newErrors.id = 'Company ID is required';
    } else if (/\s/.test(formData.id)) {
      newErrors.id = 'Company ID cannot contain spaces';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      // Build logo value: use base64 preview if new file selected, else existing URL
      const logoValue = logoPreview || formData.company_logo || '';

      const payload = {
        id: formData.id,
        CompanyName: formData.company_name,
        Address: formData.address,
        TIN: formData.tin,
        BIN: formData.bin,
        IsDefault: formData.is_default,
        VATRegNo: formData.vat_reg_no,
        IRCNo: formData.irc_no,
        CompanyLogo: logoValue,
        ShortCode: formData.short_code,
        LicenseCode: formData.license_code,
        SeqNo: formData.seq_no ? Number(formData.seq_no) : null,
        RowVersion: formData.row_version,
        parent_id: formData.parent_id || null,
        row_editor_status: isEditing ? 'updated' : 'inserted',
      };

      const response = await companyService.saveCompany(payload);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: `Company ${isEditing ? 'updated' : 'created'} successfully!`, status: 'success' });
        setTimeout(() => {
          onSave(response.data);
          onClose();
        }, 800);
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const headerActionButton = activeBtn?.visible && (
    <Button 
      form="company-form"
      type="submit"
      size="sm"
      disabled={isSaving || loading}
      className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-4"
    >
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest text-white">
        {isSaving ? 'Saving...' : activeBtn.button_title}
      </span>
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Company' : 'Register New Company'}
      headerAction={headerActionButton}
      className="max-w-3xl"
    >
      <form id="company-form" onSubmit={handleFormSubmit} className="space-y-6 py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader className="h-8 w-8 text-primary-600" />
            <p className="text-xs font-black uppercase tracking-widest text-text-muted/50">Loading details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">

            {/* ── General Information ─────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border-theme">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">General Information</h3>
              </div>

              {/* Company Name & Company ID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Company Name</Label>
                  <Input
                    placeholder="e.g. Financial Architect Global Ltd."
                    value={formData.company_name}
                    onChange={e => set('company_name', e.target.value)}
                    className={errors.company_name ? 'border-red-500 focus:ring-red-100' : ''}
                  />
                  {errors.company_name && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.company_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label required>Company ID</Label>
                  <Input
                    placeholder="e.g. COMP001"
                    value={formData.id}
                    onChange={e => {
                      const val = e.target.value.replace(/\s/g, ''); // prevent spaces
                      set('id', val);
                    }}
                    className={errors.id ? 'border-red-500 focus:ring-red-100' : ''}
                    disabled={isEditing}
                  />
                  {errors.id && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent Company</Label>
                  <Select
                    options={parentOptions}
                    value={formData.parent_id}
                    onChange={val => set('parent_id', val)}
                    placeholder="Select Parent Company..."
                    isClearable
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Code</Label>
                  <Input
                    placeholder="e.g. FAGL-01"
                    value={formData.short_code}
                    onChange={e => set('short_code', e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label>Company Address</Label>
                <Textarea
                  placeholder="Suite 405, Maritime Plaza, Financial District..."
                  className="h-20"
                  value={formData.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>
            </div>

            {/* ── Compliance & Tax Details ─────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border-theme">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Compliance &amp; Tax Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TIN (Tax Identification Number)</Label>
                  <Input
                    placeholder="12-3456789"
                    value={formData.tin}
                    onChange={e => set('tin', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>BIN (Business ID Number)</Label>
                  <Input
                    placeholder="00129384-B"
                    value={formData.bin}
                    onChange={e => set('bin', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT Registration No</Label>
                  <Input
                    placeholder="VAT-987-654-321"
                    value={formData.vat_reg_no}
                    onChange={e => set('vat_reg_no', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IRC No</Label>
                  <Input
                    placeholder="IRC-LX-990"
                    value={formData.irc_no}
                    onChange={e => set('irc_no', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>License Code</Label>
                  <Input
                    placeholder="LIC-ADMIN-2024"
                    value={formData.license_code}
                    onChange={e => set('license_code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sequence No</Label>
                  <Input
                    placeholder="1000"
                    type="number"
                    value={formData.seq_no}
                    onChange={e => set('seq_no', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Brand Identity + Status ──────────────────────── */}
            <div className="grid grid-cols-2 gap-6">

              {/* Brand Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-theme">
                  <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Brand Identity</h3>
                </div>

                {/* Logo Upload */}
                {!logoPreview ? (
                  <div
                    className="border-2 border-dashed border-border-theme rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-text-muted/50" />
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Upload Company Logo</p>
                    <p className="text-[10px] text-text-muted/50">SVG, PNG, JPG (max. 800×400px)</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-border-theme overflow-hidden flex items-center justify-center bg-content-bg" style={{ minHeight: 100 }}>
                    <img src={logoPreview} alt="Company Logo" className="max-h-24 max-w-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-card-bg border border-border-theme shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {logoFile && (
                  <div className="flex items-center gap-2 text-[11px] text-text-muted bg-content-bg border border-border-theme rounded-lg px-3 py-2">
                    <ImageIcon className="h-3.5 w-3.5 text-text-muted/50 shrink-0" />
                    <span className="truncate font-medium">{logoFile.name}</span>
                    <span className="ml-auto shrink-0 text-text-muted/50">{(logoFile.size / 1024).toFixed(0)} KB · Ready to upload</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              {/* Status & Versioning */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-theme">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Star className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Status &amp; Versioning</h3>
                </div>

                {/* Set as Default toggle */}
                <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-content-bg border border-border-theme">
                  <div>
                    <p className="text-[12px] font-bold text-gray-800">Set as Default</p>
                    <p className="text-[10px] text-text-muted/50">Primary entity for operations</p>
                  </div>
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(val) => set('is_default', val)}
                  />
                </div>

                {/* Row Version */}
                <div className="space-y-2">
                  <Label>Row Version</Label>
                  <Input
                    value={formData.row_version}
                    readOnly
                    className="bg-content-bg font-mono text-[11px] text-text-muted cursor-not-allowed"
                  />
                  <p className="text-[10px] text-text-muted/50 italic px-1">System generated concurrency token.</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </form>

      {!canSave && !loading && (
        <div className="absolute top-0 right-0 p-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 flex items-center gap-2">
            <Shield className="h-3 w-3" /> Read-Only Mode
          </span>
        </div>
      )}
      <ToastComponent />
    </Modal>
  );
}
