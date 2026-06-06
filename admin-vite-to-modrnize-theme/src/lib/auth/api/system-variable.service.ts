import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';
import { GridRequest } from './security.service';

export interface SystemVariable {
  id: number;
  type_id: number;
  type_name: string;
  code: string;
  name: string;
  numeric_value: number;
  sequence: number;
  is_system_generated: boolean;
  is_inactive: boolean;
  company_id: string;
  row_editor_status?: 'inserted' | 'updated';
}

export const systemVariableService = {
  getSystemVariables: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 50,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "Active",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_VARIABLE.GET_GRID, defaultParams);

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse system variable rows JSON string:", e);
      }
    }
    return response;
  },

  getSystemVariablesSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 50,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "Active",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_VARIABLE.GET_GRID_SUPER, defaultParams);

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse system variable super rows JSON string:", e);
      }
    }
    return response;
  },

  saveSystemVariable: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_VARIABLE.SAVE, payload);
  },

  saveSystemVariableSuper: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_VARIABLE.SAVE_SUPER, payload);
  },

  deleteSystemVariable: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_VARIABLE.DELETE(id));
  }
};
