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

export interface PurchaseQuotationDetail {
  quotation_detail_id?: number;
  requisition_detail_id: number;
  product_id: number | string;
  product_name?: string;
  quantity: number | string;
  unit_price: number | string;
  amount: number | string;
  delivery_time_days?: number | null;
  remarks?: string;
}

export interface PurchaseQuotation {
  quotation_id?: number;
  quotation_no: string;
  requisition_id: number | string;
  supplier_id: number | string;
  supplier_name?: string;
  quotation_date: string;
  valid_until?: string;
  total_amount: number | string;
  status: number;
  remarks?: string;
  company_id?: string;
  details?: PurchaseQuotationDetail[];
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'quotation_id',
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

export const purchaseQuotationService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_QUOTATION.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_QUOTATION.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_QUOTATION.GET_BY_ID(id)),

  getByRequisitionId: async (reqId: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_QUOTATION.GET_BY_REQUISITION(reqId)),

  save: async (data: PurchaseQuotation): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_QUOTATION.SAVE, data),

  delete: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_QUOTATION.DELETE(id)),
};
