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

export interface GoodsReceiptDetail {
  grn_detail_id?: number;
  po_detail_id: number;
  product_id: number | string;
  product_name?: string;
  quantity_ordered: number | string;
  quantity_received: number | string;
  unit_price: number | string;
  total_price: number | string;
}

export interface GoodsReceipt {
  grn_id?: number;
  grn_no?: string;
  po_id: number | string;
  po_no?: string;
  supplier_id: number | string;
  supplier_name?: string;
  warehouse_id: number | string;
  warehouse_name?: string;
  grn_date: string;
  invoice_no?: string;
  invoice_date?: string;
  total_amount: number | string;
  status: number;
  remarks?: string;
  company_id?: string;
  details?: GoodsReceiptDetail[];
}

const defaultGrid: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'desc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'grn_id',
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

export const goodsReceiptService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.GOODS_RECEIPT.GET_GRID, { ...defaultGrid, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SCM, API_ENDPOINTS.GOODS_RECEIPT.GET_GRID_SUPER, { ...defaultGrid, ...params })),

  getById: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.GOODS_RECEIPT.GET_BY_ID(id)),

  save: async (data: GoodsReceipt): Promise<any> =>
    apiService.post(API_MODULES.SCM, API_ENDPOINTS.GOODS_RECEIPT.SAVE, data),

  delete: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SCM, API_ENDPOINTS.GOODS_RECEIPT.DELETE(id)),
};
