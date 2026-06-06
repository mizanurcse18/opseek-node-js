import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';
import { GridRequest } from './security.service';

export const userService = {
  getUserGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "user_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.USER.GET_GRID, defaultParams);

    // Auto-parse the 'rows' string if it's a string
    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse user rows JSON string:", e);
      }
    }
    return response;
  },

  getUserGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "user_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.USER.GET_GRID_SUPER, defaultParams);

    // Auto-parse the 'rows' string if it's a string
    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse user rows JSON string:", e);
      }
    }
    return response;
  },

  getUserById: async (id: number | string): Promise<any> => {
    return apiService.getSecure(API_MODULES.AUTH, API_ENDPOINTS.USER.GET_BY_ID(id));
  },
  getUserByIdSuper: async (id: number | string): Promise<any> => {
    return apiService.getSecure(API_MODULES.AUTH, API_ENDPOINTS.USER.GET_BY_ID_SUPER(id));
  },

  saveUser: async (payload: any): Promise<any> => {
    console.log(payload);
    return apiService.postSecure(API_MODULES.AUTH, API_ENDPOINTS.USER.SAVE, payload);
  },

  saveUserSuper: async (payload: any): Promise<any> => {
    console.log(payload);
    return apiService.postSecure(API_MODULES.AUTH, API_ENDPOINTS.USER.CREATE_SUPER, payload);
  },

  changePassword: async (payload: any): Promise<any> => {
    return apiService.postSecure(API_MODULES.AUTH, API_ENDPOINTS.USER.CHANGE_PASSWORD, payload);
  },

  deleteUser: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.USER.DELETE(id));
  },
  getUserTypes: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_USER_TYPES);
  }
};
