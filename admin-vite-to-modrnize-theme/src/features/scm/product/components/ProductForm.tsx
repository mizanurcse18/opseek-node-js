import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { storageService } from '@/lib/auth/api/storage.service';
import { companyService } from '@/lib/auth/api/company.service';
import {
  Product,
  productService,
  categoryService,
  brandService,
  unitService,
  financeCOAService,
  attributeService,
} from '@/lib/scm/api/product.service';
import {
  Package,
  Hash,
  DollarSign,
  Percent,
  BookOpen,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  Eye,
  Trash2,
  Star,
  Plus,
  Loader2,
  GripVertical,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import SortableImage from './SortableImage';
import { cn } from '@/lib/utils';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';


export interface ProductFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Tree view: category comes from the selected tree node. */
  readonlyCategory?: boolean;
  showCompanySelector?: boolean;
  /** Company override when selector is hidden (tree toolbar). */
  companyId?: string;
  formId?: string;
  /** Tree panel: single column below lg; split form + media at lg+ (modal uses xl+). */
  compactLayout?: boolean;
}

type ComboItem = { value: string | number; label: string };

interface ProductImage {
  fileKey: string;
  url: string;
  isPrimary: boolean;
  name: string;
  file?: File;
  filePath?: string;
}

interface AttributeRow {
  value_id?: number;
  attribute_id: string | number;
  attribute_name: string;
  attribute_value: string;
}

export function ProductForm({
  initialData,
  isSuperUser = false,
  onSave,
  onClose,
  onLoadingChange,
  onSavingChange,
  readonlyCategory = false,
  showCompanySelector = true,
  companyId,
  formId = 'product-form',
  compactLayout = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    product_id: 0,
    product_name: '',
    product_code: '',
    category_id: 0,
    unit_id: 0,
    brand_id: null,
    purchase_price: '',
    sales_price: '',
    vat_percentage: 0,
    tax_percentage: 0,
    image_id: '',
    description: '',
    inventory_ledger_id: null,
    sales_ledger_id: null,
    cost_ledger_id: null,
    company_id: initialData?.company_id ?? '',
    is_active: true,
  });

  const [companies, setCompanies] = useState<ComboItem[]>([]);

  const [categories, setCategories] = useState<ComboItem[]>([]);
  const [brands, setBrands] = useState<ComboItem[]>([]);
  const [units, setUnits] = useState<ComboItem[]>([]);
  const [inventoryCOA, setInventoryCOA] = useState<ComboItem[]>([]);
  const [salesCOA, setSalesCOA] = useState<ComboItem[]>([]);
  const [costCOA, setCostCOA] = useState<ComboItem[]>([]);

  // Multiple Images State
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full-screen Image Viewer State (index into images array for gallery navigation)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Inline Category / Unit / Brand creation
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [showUnitInput, setShowUnitInput] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Product Attributes
  const [attributes, setAttributes] = useState<ComboItem[]>([]);
  const [attrRows, setAttrRows] = useState<AttributeRow[]>([]);
  const [showAttrInput, setShowAttrInput] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [savingAttr, setSavingAttr] = useState(false);

  const { toast, ToastComponent } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Load Dropdowns and Product Details
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (onLoadingChange) onLoadingChange(true);
      try {
        const toCombo = (resp: any): ComboItem[] => {
          const data = resp?.data || resp || [];
          return Array.isArray(data)
            ? data.map((d: any) => ({
                value: d.value ?? d.id ?? d.account_id ?? d.DivisionID ?? d.division_id ?? d.CategoryID ?? d.category_id ?? d.UnitID ?? d.unit_id ?? d.BrandID ?? d.brand_id,
                label: d.label ?? d.name ?? d.account_name ?? d.DivisionName ?? d.division_name ?? d.category_name ?? d.unit_name ?? d.brand_name
              }))
            : [];
        };

        const [cat, br, un, invCOA, salCOA, cstCOA, attrCombo] = await Promise.allSettled([
          categoryService.getCombo(),
          brandService.getCombo(),
          unitService.getCombo(),
          financeCOAService.getByType('Asset'),
          financeCOAService.getByType('Revenue'),
          financeCOAService.getByType('Expense'),
          attributeService.getCombo(),
        ]);

        if (!mounted) return;

        if (cat.status === 'fulfilled') setCategories(toCombo(cat.value));
        if (br.status === 'fulfilled') setBrands(toCombo(br.value));
        if (un.status === 'fulfilled') setUnits(toCombo(un.value));
        if (invCOA.status === 'fulfilled') setInventoryCOA(toCombo(invCOA.value));
        if (salCOA.status === 'fulfilled') setSalesCOA(toCombo(salCOA.value));
        if (cstCOA.status === 'fulfilled') setCostCOA(toCombo(cstCOA.value));
        if (attrCombo.status === 'fulfilled') setAttributes(toCombo(attrCombo.value));

        // Load companies for super user
        if (isSuperUser) {
          const resp = await companyService.getAllCompanies();
          if (mounted && resp && Array.isArray(resp)) {
            const mapped = resp.map((c: any) => ({
              value: c.value || c.id || c.company_id,
              label: c.label || c.company_name || `Company #${c.value || c.id}`,
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
        }

        // Load editing product
        const productId = initialData?.product_id ?? initialData?.id;
        if (productId) {
          const res = await productService.getProductById(productId);
          if (mounted && res?.data) {
            const d = res.data;
            setFormData({
              product_id: d.product_id ?? productId,
              product_name: d.product_name ?? '',
              product_code: d.product_code ?? '',
              category_id: d.category_id ?? '',
              unit_id: d.unit_id ?? '',
              brand_id: d.brand_id ?? null,
              purchase_price: d.purchase_price ?? '',
              sales_price: d.sales_price ?? '',
              vat_percentage: d.vat_percentage ?? 0,
              tax_percentage: d.tax_percentage ?? 0,
              image_id: d.image_id ?? '',
              description: d.description ?? '',
              inventory_ledger_id: d.inventory_ledger_id ?? null,
              sales_ledger_id: d.sales_ledger_id ?? null,
              cost_ledger_id: d.cost_ledger_id ?? null,
              is_active: d.is_active ?? true,
            });

            // Prefer product_image rows; fall back to legacy image_id JSON
            const getFileUrl = (fileKey: string): string =>
              storageService.getDownloadUrl(fileKey);

            const mapKeysToGallery = (images: Array<{ file_key: string; file_path?: string; is_primary: boolean; display_order: number }>) =>
              images.map((img, idx) => ({
                fileKey: img.file_key,
                url: getFileUrl(img.file_key),
                isPrimary: img.is_primary || idx === 0,
                name: `Image_${idx + 1}`,
              }));

            if (d.product_images?.length) {
              const sorted = [...d.product_images].sort(
                (a: { display_order: number }, b: { display_order: number }) =>
                  (a.display_order ?? 0) - (b.display_order ?? 0)
              );
              setImages(mapKeysToGallery(sorted));
            } else if (d.image_id) {
              try {
                let parsedKeys: string[] = [];
                if (d.image_id.startsWith('[') && d.image_id.endsWith(']')) {
                  parsedKeys = JSON.parse(d.image_id);
                } else {
                  parsedKeys = d.image_id.split(',').map((k: string) => k.trim()).filter(Boolean);
                }
                setImages(mapKeysToGallery(parsedKeys));
              } catch {
                setImages(mapKeysToGallery([d.image_id]));
              }
            }

            // Load product attributes
            try {
              const attrRes = await attributeService.getValues(productId);
              if (mounted && attrRes?.data) {
                const vals = Array.isArray(attrRes.data) ? attrRes.data : (attrRes.data?.rows || []);
                setAttrRows(vals.map((v: any) => ({
                  value_id: v.value_id,
                  attribute_id: v.attribute_id,
                  attribute_name: v.attribute_name ?? '',
                  attribute_value: v.attribute_value ?? '',
                })));
              }
            } catch (err) {
              console.error('Failed to load product attributes', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load form details', err);
      } finally {
        if (mounted && onLoadingChange) onLoadingChange(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [initialData, isSuperUser, companyId]);

  // New product in tree view: sync fields when selection changes (no product_id yet).
  useEffect(() => {
    const productId = initialData?.product_id ?? initialData?.id;
    if (productId) return;

    setFormData({
      product_id: 0,
      product_name: initialData?.product_name ?? '',
      product_code: initialData?.product_code ?? '',
      category_id: initialData?.category_id ?? 0,
      unit_id: initialData?.unit_id ?? 0,
      brand_id: initialData?.brand_id ?? null,
      purchase_price: initialData?.purchase_price ?? '',
      sales_price: initialData?.sales_price ?? '',
      vat_percentage: initialData?.vat_percentage ?? 0,
      tax_percentage: initialData?.tax_percentage ?? 0,
      image_id: '',
      description: initialData?.description ?? '',
      inventory_ledger_id: initialData?.inventory_ledger_id ?? null,
      sales_ledger_id: initialData?.sales_ledger_id ?? null,
      cost_ledger_id: initialData?.cost_ledger_id ?? null,
      company_id: companyId ?? initialData?.company_id ?? '',
      is_active: initialData?.is_active ?? true,
    });
    setImages([]);
    setAttrRows([]);
  }, [
    initialData?.product_id,
    initialData?._isNewProduct,
    initialData?.category_id,
    initialData?.product_name,
    companyId,
  ]);

  // Ensure one primary image when gallery changes
  useEffect(() => {
    if (images.length > 0 && !images.some(img => img.isPrimary)) {
      setImages(prev => prev.map((img, idx) => ({ ...img, isPrimary: idx === 0 })));
    }
  }, [images]);

  // Keyboard navigation for gallery preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewIndex === null) return;
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') setPreviewIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : null);
      if (e.key === 'ArrowRight') setPreviewIndex(prev => prev !== null ? (prev + 1) % images.length : null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, images.length]);

  // Image Upload Handler (Stores files locally with previews)
  const handleUploadImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 5) {
      toast({ title: 'Gallery Full', description: 'Maximum 5 product photos allowed.', status: 'warning' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate image format
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload image files only.', status: 'error' });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const tempKey = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newImage: ProductImage = {
      fileKey: tempKey,
      url: localUrl,
      isPrimary: images.length === 0, // auto primary if first image
      name: file.name,
      file: file
    };

    setImages(prev => [...prev, newImage]);
    toast({ title: 'Added to Gallery', description: 'Image preview added. Save product to complete upload.', status: 'info' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Image actions
  const handleSetPrimary = (fileKey: string) => {
    setImages(prev =>
      prev.map(img => ({
        ...img,
        isPrimary: img.fileKey === fileKey
      }))
    );
  };

   const handleRemoveImage = (fileKey: string) => {
     const imgToRemove = images.find(img => img.fileKey === fileKey);
     if (imgToRemove && imgToRemove.url.startsWith('blob:')) {
       URL.revokeObjectURL(imgToRemove.url); // clean up memory
     }
     setImages(prev => prev.filter(img => img.fileKey !== fileKey));
     toast({ title: 'Removed', description: 'Image removed from gallery preview.', status: 'success' });
   };

   const handleDragEnd = (event: any) => {
     const { active, over } = event;
     if (over && active.id !== over.id) {
       setImages(prev => {
         const oldIndex = prev.findIndex(img => img.fileKey === active.id);
         const newIndex = prev.findIndex(img => img.fileKey === over.id);
         return arrayMove(prev, oldIndex, newIndex);
       });
     }
   };

  // Inline Category Creation
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await categoryService.save({ category_name: newCategoryName.trim(), is_active: true });
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        const saved = res.data || res;
        const newId = saved.category_id ?? saved.id ?? saved.value;
        const newItem: ComboItem = { value: newId, label: newCategoryName.trim() };
        setCategories(prev => [...prev, newItem]);
        setFormData(prev => ({ ...prev, category_id: newId }));
        setNewCategoryName('');
        setShowCategoryInput(false);
        toast({ title: 'Created', description: `Category "${newItem.label}" added.`, status: 'success' });
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!newUnitName.trim()) return;
    setSavingUnit(true);
    try {
      const res = await unitService.save({ unit_name: newUnitName.trim() });
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        const saved = res.data || res;
        const newId = saved.unit_id ?? saved.id ?? saved.value;
        const newItem: ComboItem = { value: newId, label: newUnitName.trim() };
        setUnits(prev => [...prev, newItem]);
        setFormData(prev => ({ ...prev, unit_id: newId }));
        setNewUnitName('');
        setShowUnitInput(false);
        toast({ title: 'Created', description: `Unit "${newItem.label}" added.`, status: 'success' });
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSavingUnit(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) return;
    setSavingBrand(true);
    try {
      const res = await brandService.save({ brand_name: newBrandName.trim() });
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        const saved = res.data || res;
        const newId = saved.brand_id ?? saved.id ?? saved.value;
        const newItem: ComboItem = { value: newId, label: newBrandName.trim() };
        setBrands(prev => [...prev, newItem]);
        setFormData(prev => ({ ...prev, brand_id: newId }));
        setNewBrandName('');
        setShowBrandInput(false);
        toast({ title: 'Created', description: `Brand "${newItem.label}" added.`, status: 'success' });
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSavingBrand(false);
    }
  };

  // Inline Attribute Creation
  const handleSaveAttr = async () => {
    if (!newAttrName.trim()) return;
    setSavingAttr(true);
    try {
      const res = await attributeService.save({ attribute_name: newAttrName.trim() });
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        const saved = res.data || res;
        const newId = saved.attribute_id ?? saved.id ?? saved.value;
        const newItem: ComboItem = { value: newId, label: newAttrName.trim() };
        setAttributes(prev => [...prev, newItem]);
        setNewAttrName('');
        setShowAttrInput(false);
        toast({ title: 'Created', description: `Attribute "${newItem.label}" added.`, status: 'success' });
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSavingAttr(false);
    }
  };

  // Add / Remove attribute rows
  const handleAddAttrRow = () => {
    setAttrRows(prev => [...prev, { attribute_id: '', attribute_name: '', attribute_value: '' }]);
  };

  const handleRemoveAttrRow = (idx: number) => {
    setAttrRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAttrRowChange = (idx: number, field: keyof AttributeRow, val: string | number) => {
    setAttrRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'attribute_id') {
        const attr = attributes.find(a => String(a.value) === String(val));
        return { ...row, attribute_id: val, attribute_name: attr?.label || '' };
      }
      return { ...row, [field]: val };
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Product Name is required.', status: 'error' });
      return;
    }
    if (!formData.category_id) {
      toast({ title: 'Validation Error', description: 'Category is required.', status: 'error' });
      return;
    }
    if (!formData.unit_id) {
      toast({ title: 'Validation Error', description: 'Unit is required.', status: 'error' });
      return;
    }

    if (onSavingChange) onSavingChange(true);
    setUploadingImage(true);
    try {
      const sortedImages = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
      const productImages = sortedImages.map((img, idx) => ({
        file_key: img.fileKey,
        is_primary: img.isPrimary,
        display_order: idx,
      }));

      const payload: any = {
        ...formData,
        product_images: productImages,
        purchase_price: Number(formData.purchase_price) || 0,
        sales_price: Number(formData.sales_price) || 0,
        vat_percentage: Number(formData.vat_percentage) || 0,
        tax_percentage: Number(formData.tax_percentage) || 0,
      };
      delete payload.image_id;

      if (isSuperUser || companyId) {
        payload.company_id = companyId ?? formData.company_id;
      }

      const validAttrs = attrRows
        .filter(r => r.attribute_id && r.attribute_value.trim())
        .map(r => ({
          value_id: r.value_id ?? 0,
          attribute_id: Number(r.attribute_id),
          attribute_value: r.attribute_value.trim()
        }));
      payload.attribute_values = validAttrs;

      const formDataPayload = new FormData();
      sortedImages.forEach((img) => {
        if (img.file) {
          formDataPayload.append(img.fileKey, img.file, img.name);
        }
      });
      formDataPayload.append('productJson', JSON.stringify(payload));

      const res = await productService.saveProductWithFiles(formDataPayload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Product details saved securely.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setUploadingImage(false);
      if (onSavingChange) onSavingChange(false);
    }
  };

  const fieldLabel = (text: string, required?: boolean) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/65 ml-1">
      {text}{required && <span className="text-red-500 font-bold"> *</span>}
    </Label>
  );

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} className="py-2 space-y-6 w-full min-w-0 max-w-full">
        <div
          className={cn(
            'grid gap-4 xl:gap-6 items-start w-full min-w-0',
            compactLayout ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 xl:grid-cols-12'
          )}
        >
          {/* Form fields */}
          <div
            className={cn(
              'space-y-4 xl:space-y-6 min-w-0',
              compactLayout ? 'lg:col-span-7 2xl:col-span-8' : 'xl:col-span-7 2xl:col-span-8'
            )}
          >
            
            {/* Cards 1: Basic Information */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary-500/20 transition-all duration-300">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#2e125c]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Basic Information</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Standard product descriptors</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-2">
                  {fieldLabel('Product Name', true)}
                  <div className="relative group">
                    <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2e125c] transition-colors" />
                    <Input
                      id="product_name"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleChange}
                      placeholder="e.g. Premium Rice (50 kg)"
                      required
                      className="h-11 pl-10 text-sm font-semibold border-slate-200 focus:ring-4 focus:ring-primary-500/5 focus:border-[#2e125c] rounded-xl shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  {fieldLabel('Product Code')}
                  <div className="relative group">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#2e125c] transition-colors" />
                    <Input
                      id="product_code"
                      name="product_code"
                      value={formData.product_code ?? ''}
                      onChange={handleChange}
                      placeholder="e.g. PRD-0081"
                      className="h-11 pl-10 text-sm font-semibold border-slate-200 focus:ring-4 focus:ring-primary-500/5 focus:border-[#2e125c] rounded-xl shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  {fieldLabel('Category', true)}
                  {readonlyCategory ? (
                    <div className="h-11 px-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 shadow-sm">
                      {categories.find(c => String(c.value) === String(formData.category_id))?.label || `Category #${formData.category_id}`}
                    </div>
                  ) : showCategoryInput ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="h-11 text-sm font-semibold border-slate-200 rounded-xl flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveCategory())}
                      />
                      <button type="button" onClick={handleSaveCategory} disabled={savingCategory} className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50">
                        {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }} className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      <div className="min-w-0 flex-1">
                        <Select
                          options={categories}
                          value={formData.category_id || null}
                          onChange={(val) => setFormData(prev => ({ ...prev, category_id: Number(val) || 0 }))}
                          placeholder="Select Category"
                          className="w-full min-w-0 h-11 border-slate-200 focus:border-[#2e125c] rounded-xl shadow-sm transition-all"
                        />
                      </div>
                      <button type="button" onClick={() => setShowCategoryInput(true)} title="Create Category" className="h-11 w-11 shrink-0 flex-none rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-[#2e125c] hover:border-[#2e125c] flex items-center justify-center transition-all active:scale-95">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  {fieldLabel('Unit of Measure', true)}
                  {showUnitInput ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="New unit name"
                        className="h-11 text-sm font-semibold border-slate-200 rounded-xl flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveUnit())}
                      />
                      <button type="button" onClick={handleSaveUnit} disabled={savingUnit} className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50">
                        {savingUnit ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => { setShowUnitInput(false); setNewUnitName(''); }} className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      <div className="min-w-0 flex-1">
                        <Select
                          options={units}
                          value={formData.unit_id || null}
                          onChange={(val) => setFormData(prev => ({ ...prev, unit_id: Number(val) || 0 }))}
                          placeholder="Select Unit"
                          className="w-full min-w-0 h-11 border-slate-200 focus:border-[#2e125c] rounded-xl shadow-sm transition-all"
                        />
                      </div>
                      <button type="button" onClick={() => setShowUnitInput(true)} title="Create Unit" className="h-11 w-11 shrink-0 flex-none rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-[#2e125c] hover:border-[#2e125c] flex items-center justify-center transition-all active:scale-95">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  {fieldLabel('Brand')}
                  {showBrandInput ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="New brand name"
                        className="h-11 text-sm font-semibold border-slate-200 rounded-xl flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveBrand())}
                      />
                      <button type="button" onClick={handleSaveBrand} disabled={savingBrand} className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50">
                        {savingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => { setShowBrandInput(false); setNewBrandName(''); }} className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      <div className="min-w-0 flex-1">
                        <Select
                          options={brands}
                          value={formData.brand_id ?? null}
                          onChange={(val) => setFormData(prev => ({ ...prev, brand_id: val ?? null }))}
                          placeholder="Select Brand (optional)"
                          className="w-full min-w-0 h-11 border-slate-200 focus:border-[#2e125c] rounded-xl shadow-sm transition-all"
                        />
                      </div>
                      <button type="button" onClick={() => setShowBrandInput(true)} title="Create Brand" className="h-11 w-11 shrink-0 flex-none rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-[#2e125c] hover:border-[#2e125c] flex items-center justify-center transition-all active:scale-95">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-2">
                  {fieldLabel('Description')}
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description ?? ''}
                    onChange={handleChange}
                    placeholder="Detailed specifications or product notes..."
                    rows={3}
                    className="text-sm font-medium border-slate-200 focus:ring-4 focus:ring-primary-500/5 focus:border-[#2e125c] rounded-xl shadow-sm transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Attributes */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-500/20 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 shrink-0 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Product Attributes</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Color, size, weight and variants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {showAttrInput ? (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0 animate-in slide-in-from-right-2 duration-200">
                      <Input
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        placeholder="Attribute name"
                        className="h-7 text-[10px] w-full min-w-[120px] sm:w-28 border-slate-200 rounded-lg"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveAttr())}
                      />
                      <button type="button" onClick={handleSaveAttr} disabled={savingAttr} className="h-7 w-7 shrink-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-xs disabled:opacity-50">
                        {savingAttr ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      </button>
                      <button type="button" onClick={() => { setShowAttrInput(false); setNewAttrName(''); }} className="h-7 w-7 shrink-0 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowAttrInput(true)} className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-all">
                      <Plus className="w-3 h-3" /> New Attribute
                    </button>
                  )}
                </div>
              </div>

              {attrRows.length > 0 ? (
                <div className="space-y-3">
                  {attrRows.map((row, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 animate-in slide-in-from-top-1 duration-200">
                      <div className="w-full sm:flex-1 min-w-[140px] sm:min-w-[180px]">
                        <Select
                          options={attributes}
                          value={row.attribute_id || null}
                          onChange={(val) => handleAttrRowChange(idx, 'attribute_id', val ?? '')}
                          placeholder="Select attribute"
                          className="w-full h-10 border-slate-200 rounded-xl"
                        />
                      </div>
                      <div className="w-full sm:flex-1 min-w-0">
                        <Input
                          value={row.attribute_value}
                          onChange={(e) => handleAttrRowChange(idx, 'attribute_value', e.target.value)}
                          placeholder="Value (e.g. Red, XL, 8GB)"
                          className="w-full h-10 text-sm font-semibold border-slate-200 rounded-xl"
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveAttrRow(idx)} className="h-10 w-10 shrink-0 flex-none self-end sm:self-auto rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">No attributes added yet</p>
                </div>
              )}

              <button type="button" onClick={handleAddAttrRow} className="w-full border border-dashed border-slate-200 hover:border-amber-400 rounded-xl py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-all group">
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Add Attribute Row
              </button>
            </div>

            {/* Super Admin: Company Context */}
            {isSuperUser && showCompanySelector && (
              <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-amber-600" />
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

            {/* Cards 2: Pricing & Taxes */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-500/20 transition-all duration-300">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Pricing & Taxation</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Purchase, retail and system taxes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
                <div className="space-y-2 col-span-1">
                  {fieldLabel('Purchase Price', true)}
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-600" />
                    <Input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      className="h-10 pl-8 text-xs font-bold font-mono border-slate-200 focus:border-emerald-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-1">
                  {fieldLabel('Sales Price', true)}
                  <div className="relative group">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-600" />
                    <Input
                      id="sales_price"
                      name="sales_price"
                      type="number"
                      step="0.01"
                      value={formData.sales_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      className="h-10 pl-8 text-xs font-bold font-mono border-slate-200 focus:border-emerald-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-1">
                  {fieldLabel('VAT %')}
                  <div className="relative group">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-600" />
                    <Input
                      id="vat_percentage"
                      name="vat_percentage"
                      type="number"
                      step="0.01"
                      value={formData.vat_percentage}
                      onChange={handleChange}
                      placeholder="0"
                      className="h-10 pl-8 text-xs font-bold font-mono border-slate-200 focus:border-emerald-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-1">
                  {fieldLabel('Tax %')}
                  <div className="relative group">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-600" />
                    <Input
                      id="tax_percentage"
                      name="tax_percentage"
                      type="number"
                      step="0.01"
                      value={formData.tax_percentage}
                      onChange={handleChange}
                      placeholder="0"
                      className="h-10 pl-8 text-xs font-bold font-mono border-slate-200 focus:border-emerald-500 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cards 3: Ledger Mapping */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4 hover:border-violet-500/20 transition-all duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Finance Ledger Map</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Overrides category defaults</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-violet-50 px-2 py-0.5 rounded text-[8px] font-black uppercase text-violet-600 tracking-wider">
                  <CheckCircle className="w-2.5 h-2.5" /> Direct GL Post
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 xl:gap-4">
                {/* Inventory Ledger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    {fieldLabel('Inventory Ledger')}
                  </div>
                  <Select
                    options={inventoryCOA}
                    value={formData.inventory_ledger_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, inventory_ledger_id: val ?? null }))}
                    placeholder="Select Asset Head"
                    className="w-full h-10 border-slate-200 focus:border-violet-500 rounded-xl"
                  />
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Debit on GRN · Credit on sale</p>
                </div>

                {/* Sales Ledger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    {fieldLabel('Sales Ledger')}
                  </div>
                  <Select
                    options={salesCOA}
                    value={formData.sales_ledger_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, sales_ledger_id: val ?? null }))}
                    placeholder="Select Revenue Head"
                    className="w-full h-10 border-slate-200 focus:border-violet-500 rounded-xl"
                  />
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Credit on invoice posting</p>
                </div>

                {/* COGS Ledger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    {fieldLabel('COGS Ledger')}
                  </div>
                  <Select
                    options={costCOA}
                    value={formData.cost_ledger_id ?? null}
                    onChange={(val) => setFormData(prev => ({ ...prev, cost_ledger_id: val ?? null }))}
                    placeholder="Select Expense Head"
                    className="w-full h-10 border-slate-200 focus:border-violet-500 rounded-xl"
                  />
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Debit on cost of goods sold</p>
                </div>
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
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Allow transactions in inventory module</span>
              </div>
            </div>

          </div>

          {/* RIGHT 5-COLUMNS: Product Media & Gallery */}
          <div
            className={cn(
              'space-y-4 xl:space-y-6 min-w-0',
              compactLayout ? 'lg:col-span-5 2xl:col-span-4' : 'xl:col-span-5 2xl:col-span-4'
            )}
          >
            
            {/* Gallery Panel */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-5 hover:border-primary-500/20 transition-all duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Product Media</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Upload high-res product photos</p>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  Max 5 Photos
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={handleUploadImageClick}
                className={cn(
                  "border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer transition-all duration-300 outline-none select-none relative overflow-hidden group",
                  uploadingImage && "opacity-60 cursor-not-allowed pointer-events-none"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadingImage}
                />

                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    {uploadingImage ? 'Saving product...' : 'Click to Add Photo'}
                  </p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                    Local preview until save · PNG, JPG, WEBP
                  </p>
                </div>
              </div>

              {/* Gallery Grid */}
              {images.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-black uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3 text-amber-500" /> Star one image to set it as Primary display
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
      <SortableContext items={images.map(img => img.fileKey)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-2 gap-3">
                     {images.map(img => (
                       <SortableImage
                         key={img.fileKey}
                         img={img}
                         onSetPrimary={handleSetPrimary}
                         onRemove={handleRemoveImage}
                          onPreview={(fileKey) => {
                            const idx = images.findIndex(img => img.fileKey === fileKey);
                            if (idx >= 0) setPreviewIndex(idx);
                          }}
                       />
                     ))}
                    </div>
                </SortableContext>
              </DndContext>
              </div>
                ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                  <ImageIcon className="w-8 h-8 opacity-45 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">No images added</p>
                  <p className="text-[8px] font-bold uppercase tracking-tight mt-0.5">Primary image will represent in reports</p>
                </div>
              )}

            </div>

            {/* Premium security details */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-md group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Package className="w-16 h-16 rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-200 mb-1">Image Storage Vault</h4>
                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    Product photos are hosted on an isolated cloud bucket, served securely, and automatically cached for faster loading in POS terminals.
                  </p>
                </div>
              </div>
            </div>

          </div>
          
        </div>
      </form>

      {/* Image Gallery Preview Modal with Navigation */}
      {previewIndex !== null && images[previewIndex] && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setPreviewIndex(null)} />

          <div className="relative z-10 w-full max-w-6xl h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between text-white py-2">
              <div className="flex flex-col">
                <h3 className="text-sm md:text-base font-black uppercase tracking-tight">
                  {images[previewIndex].name}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Image {previewIndex + 1} of {images.length}
                </p>
              </div>
              <button
                onClick={() => setPreviewIndex(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="relative flex-1 bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setPreviewIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : null)}
                    className="absolute left-4 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setPreviewIndex(prev => prev !== null ? (prev + 1) % images.length : null)}
                    className="absolute right-4 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="w-full h-full p-4 flex items-center justify-center">
                <img
                  src={images[previewIndex].url}
                  alt={images[previewIndex].name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Error';
                  }}
                />
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto pb-4 px-4 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={img.fileKey}
                    onClick={() => setPreviewIndex(idx)}
                    className={`w-16 h-16 rounded-xl border-2 transition-all flex-shrink-0 overflow-hidden bg-slate-800 flex items-center justify-center ${
                      previewIndex === idx ? 'border-primary-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ToastComponent />
    </>
  );
}
