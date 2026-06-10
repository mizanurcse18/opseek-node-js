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

export interface SalesDetail {
  sales_detail_id?: number;
  product_id: number | string;
  warehouse_id?: number | string;
  quantity: number | string;
  unit_price: number | string;
  vat_amount?: number | string;
  tax_amount?: number | string;
  total_price: number | string;
  cost_price?: number | string;
}

export interface Sales {
  sales_id?: number;
  sales_no?: string;
  customer_id: number | string;
  warehouse_id: number | string;
  sales_date: string;
  total_amount: number | string;
  status: number;
  remarks?: string;
  company_id?: string;
  details?: SalesDetail[];
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'sales_id',
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

export const salesService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.SALES.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.SALES.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.SALES.GET_BY_ID(id)),

  save: async (data: Sales): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.SALES.SAVE, data),

  delete: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.SALES.DELETE(id)),

  getCustomerCombo: async (companyId?: string): Promise<any> => {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return apiService.get(API_MODULES.SCM, `/combo/get-customer-combo${query}`);
  },
};
