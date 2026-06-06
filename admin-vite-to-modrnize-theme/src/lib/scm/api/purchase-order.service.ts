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

export interface PurchaseOrderDetail {
  po_detail_id?: number;
  product_id: number | string;
  warehouse_id?: number | string;
  quantity: number | string;
  unit_price: number | string;
  vat_amount?: number | string;
  tax_amount?: number | string;
  total_price: number | string;
}

export interface PurchaseOrder {
  po_id?: number;
  po_no?: string;
  quotation_id: number | string;
  supplier_id: number | string;
  warehouse_id: number | string;
  po_date: string;
  total_amount: number | string;
  status: number;
  remarks?: string;
  company_id?: string;
  details?: PurchaseOrderDetail[];
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'po_id',
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

export const purchaseOrderService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_ORDER.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_ORDER.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_ORDER.GET_BY_ID(id)),

  getByQuotationId: async (qId: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_ORDER.GET_BY_QUOTATION(qId)),

  save: async (data: PurchaseOrder): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_ORDER.SAVE, data),

  delete: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_ORDER.DELETE(id)),
};
