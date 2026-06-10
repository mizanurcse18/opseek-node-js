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

export interface Warehouse {
  warehouse_id?: number;
  warehouse_name: string;
  location?: string;
  division_id?: number | string;
  district_id?: number | string;
  thana_id?: number | string;
  is_active: boolean;
  company_id?: string;
}

export const warehouseService = {
  getWarehouseGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "warehouse_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.SCM, API_ENDPOINTS.WAREHOUSE.GET_GRID, defaultParams);

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse warehouse rows JSON string:", e);
      }
    }

    return response;
  },

  getWarehouseGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "warehouse_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.SCM, API_ENDPOINTS.WAREHOUSE.GET_GRID_SUPER, defaultParams);

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse warehouse rows (super) JSON string:", e);
      }
    }

    return response;
  },

  getWarehouseById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.SCM, API_ENDPOINTS.WAREHOUSE.GET_BY_ID(id));
  },

  saveWarehouse: async (data: Warehouse): Promise<any> => {
    return apiService.post(API_MODULES.SCM, API_ENDPOINTS.WAREHOUSE.SAVE, data);
  },

  saveWarehouseSuper: async (data: Warehouse): Promise<any> => {
    return apiService.post(API_MODULES.SCM, API_ENDPOINTS.WAREHOUSE.SAVE_SUPER, data);
  },

  deleteWarehouse: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.SCM, API_ENDPOINTS.WAREHOUSE.DELETE(id));
  },

  getWarehouseCombo: async (isSuper = false): Promise<{ value: number; label: string }[]> => {
    const params: GridRequest = {
      ServerPagination: true, Limit: 99999, Offset: 0, Order: 'asc',
      SearchBy: '', SearchType: '', Search: '', Sort: 'warehouse_id',
      SortName: '', SortOrder: '', ApprovalFilterData: '', Parameters: [], menuid: 0,
    };
    const endpoint = isSuper ? API_ENDPOINTS.WAREHOUSE.GET_GRID_SUPER : API_ENDPOINTS.WAREHOUSE.GET_GRID;
    const res: any = await apiService.post(API_MODULES.SCM, endpoint, params);
    const rows = res?.data?.rows ?? res?.data ?? [];
    const list = Array.isArray(rows) ? rows : [];
    return list.map((w: any) => ({ value: w.warehouse_id ?? w.id, label: w.warehouse_name ?? '' }));
  },
};
