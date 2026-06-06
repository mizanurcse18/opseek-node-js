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

export interface Supplier {
  supplier_id?: number;
  supplier_code?: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  email?: string;
  is_active?: boolean;
  company_id?: string;
  ledger_id?: number | string;
  username?: string;
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'supplier_id',
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

export const supplierService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.SUPPLIER.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.SUPPLIER.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getSupplier: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.SUPPLIER.GET_BY_ID(id)),

  saveSupplier: async (data: Supplier): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.SUPPLIER.SAVE, data),

  deleteSupplier: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.SUPPLIER.DELETE(id)),

  getCombo: async (companyId?: string): Promise<any> => {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return apiService.get(API_MODULES.SCM, `/combo/get-supplier-combo${query}`);
  },
};
