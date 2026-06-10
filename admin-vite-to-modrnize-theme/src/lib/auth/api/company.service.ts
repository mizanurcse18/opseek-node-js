import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';
import type { GridRequest } from './security.service';

export const companyService = {
  getCompanyGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: params.Order || 'asc',
      SearchBy: '',
      SearchType: '',
      Search: '',
      Sort: params.Sort || 'id',
      SortName: '',
      SortOrder: '',
      ApprovalFilterData: '',
      Parameters: [],
      menuid: 0,
      ...params,
    };

    const response: any = await apiService.post(
      API_MODULES.AUTH,
      API_ENDPOINTS.COMPANY.GET_GRID,
      defaultParams
    );

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error('Failed to parse company rows JSON string:', e);
      }
    }

    return response;
  },

  getCompanyById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMPANY.GET_BY_ID(id));
  },

  saveCompany: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.COMPANY.SAVE, payload);
  },

  deleteCompany: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMPANY.DELETE(id));
  },

  getCompanyCombo: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_COMPANIES);
    return response?.data || [];
  },

  getParentCompanies: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_PARENT_COMPANIES);
    return response?.data || [];
  },

  getAllCompanies: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_ALL_COMPANIES);
    return response?.data || [];
  },
};

