import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

export interface GridRequest {
  ServerPagination: boolean;
  Limit: number;
  Offset: number;
  Order: string;
  SearchBy: string;
  SearchType: string;
  Search: string;
  Sort: string;
  SortName: string;
  SortOrder: string;
  ApprovalFilterData: string;
  Parameters: any[];
  menuid: number;
}

export interface Product {
  product_id?: number;
  product_name: string;
  product_code?: string;
  category_id: number | string;
  unit_id: number | string;
  brand_id?: number | string | null;
  purchase_price: number | string;
  sales_price: number | string;
  vat_percentage: number | string;
  tax_percentage: number | string;
  image_id?: string;
  product_images?: Array<{ file_key: string; file_path?: string; is_primary: boolean; display_order: number }>;
  description?: string;
  inventory_ledger_id?: number | string | null;
  sales_ledger_id?: number | string | null;
  cost_ledger_id?: number | string | null;
  company_id?: string;
  is_active: boolean;
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'product_id',
  SortName: '',
  SortOrder: '',
  ApprovalFilterData: '',
  Parameters: [],
  menuid: 0,
};

const parseRows = (response: any) => {
  if (response?.data?.rows && typeof response.data.rows === 'string') {
    try { response.data.rows = JSON.parse(response.data.rows); } catch {}
  }
  return response;
};

export const productService = {
  getProductGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.GET_GRID, { ...defaultGrid, ...params })),

  getProductGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getProductById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.GET_BY_ID(id)),

  saveProduct: async (data: Product): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.SAVE, data),

  saveProductWithFiles: async (formData: FormData): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.SAVE_WITH_FILES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  csvUpload: async (file: File, companyId?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (companyId) {
      formData.append('company_id', companyId);
    }
    return apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.CSV_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteProduct: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.DELETE(id)),

  getAllProducts: async (): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PRODUCT.GET_ALL),

  exportCsv: async (): Promise<Blob> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_PREFIX || '/api/v1'}/product/export-csv`,
      { credentials: 'include' }
    );
    return response.blob();
  },
};

export interface Category {
  category_id?: number;
  category_name: string;
  parent_category_id?: number | null;
  inventory_ledger_id?: number | null;
  sales_ledger_id?: number | null;
  cost_ledger_id?: number | null;
  is_active: boolean;
}

export const categoryService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.GET_BY_ID(id)),

  getAll: async (isSuper = false): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.GET_ALL + (isSuper ? '?isSuper=true' : '')),

  getCombo: async (): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.GET_COMBO),

  save: async (data: Category): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.SAVE, data),

  saveSuper: async (data: Category): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.SAVE_SUPER, data),

  delete: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.CATEGORY.DELETE(id)),
};

export const brandService = {
  getCombo: async (): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.BRAND.GET_COMBO),

  save: async (data: { brand_id?: number; brand_name: string; description?: string }): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.BRAND.SAVE, {
      brand_id: data.brand_id ?? 0,
      brand_name: data.brand_name,
      description: data.description ?? '',
    }),
};

export const unitService = {
  getCombo: async (): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.UNIT.GET_COMBO),

  save: async (data: { unit_id?: number; unit_name: string; short_name?: string; is_active?: boolean }): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.UNIT.SAVE, {
      unit_id: data.unit_id ?? 0,
      unit_name: data.unit_name,
      short_name: data.short_name ?? data.unit_name.slice(0, 10),
      is_active: data.is_active ?? true,
    }),
};

/** Normalizes API combo payloads (`{ data: [...] }` or bare array). */
export function parseComboResponse(resp: any): { value: number; label: string }[] {
  const data = resp?.data ?? resp;
  if (!Array.isArray(data)) return [];
  return data.map((c: any) => ({
    value: +(c.value ?? c.account_id ?? c.id),
    label: c.label ?? c.account_name ?? c.name ?? String(c.value ?? ''),
  }));
}

export const financeCOAService = {
  getByType: async (type: 'Asset' | 'Revenue' | 'Expense'): Promise<any> =>
    apiService.get(API_MODULES.FINANCE, API_ENDPOINTS.FINANCE_COA.GET_COMBO(type)),
};

export const attributeService = {
  getCombo: async (): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PRODUCT_ATTRIBUTE.GET_COMBO),
  save: async (data: { attribute_name: string }): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT_ATTRIBUTE.SAVE, data),
  getValues: async (productId: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PRODUCT_ATTRIBUTE.GET_VALUES(productId)),
  saveValues: async (data: any[]): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PRODUCT_ATTRIBUTE.SAVE_VALUES, data),
};
