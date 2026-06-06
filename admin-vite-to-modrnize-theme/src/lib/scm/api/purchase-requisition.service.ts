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

export interface PurchaseRequisitionDetail {
  requisition_detail_id?: number;
  product_id: number | string;
  product_name?: string;
  description?: string;
  uom: number | string;
  unit_name?: string;
  quantity: number | string;
  price?: number | string | null;
  amount?: number | string | null;
  remarks?: string;
}

export interface PurchaseRequisition {
  requisition_id?: number;
  requisition_no: string;
  requisition_date: string;
  warehouse_id: number | string;
  warehouse_name?: string;
  status: number;
  total_amount: number | string;
  remarks?: string;
  company_id?: string;
  details?: PurchaseRequisitionDetail[];
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'requisition_id',
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

export const purchaseRequisitionService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_REQUISITION.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_REQUISITION.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_REQUISITION.GET_BY_ID(id)),

  save: async (data: PurchaseRequisition): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_REQUISITION.SAVE, data),

  delete: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.PURCHASE_REQUISITION.DELETE(id)),
};
