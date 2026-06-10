import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';
import { GridRequest } from './security.service';

const MODULE = API_MODULES.AUTH;

const autoParseRows = (response: any) => {
  if (response?.data?.rows && typeof response.data.rows === 'string') {
    try {
      response.data.rows = JSON.parse(response.data.rows);
    } catch (e) {
      console.error("Failed to parse rows JSON string:", e);
    }
  }
  return response;
};

const cache: Record<string, any> = {};

export const geoService = {
  // --- Division ---
  getDivisionGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.DIVISION.GET_GRID, params);
    return autoParseRows(response);
  },
  getDivisionGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.DIVISION.GET_GRID_SUPER, params);
    return autoParseRows(response);
  },
  getDivisionById: async (id: number | string): Promise<any> => {
    return apiService.get(MODULE, API_ENDPOINTS.DIVISION.GET_BY_ID(id));
  },
  saveDivision: async (payload: any): Promise<any> => {
    return apiService.post(MODULE, API_ENDPOINTS.DIVISION.SAVE, payload);
  },
  deleteDivision: async (id: number | string): Promise<any> => {
    return apiService.get(MODULE, API_ENDPOINTS.DIVISION.DELETE(id));
  },
  getDivisionCombo: async (): Promise<any> => {
    if (cache['divisions']) return cache['divisions'];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_DIVISIONS);
    const data = response?.data || [];
    cache['divisions'] = data;
    return data;
  },
  getDivisionComboSuper: async (): Promise<any> => {
    if (cache['divisions_super']) return cache['divisions_super'];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_DIVISIONS_SUPER);
    const data = response?.data || [];
    cache['divisions_super'] = data;
    return data;
  },

  // --- District ---
  getDistrictGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.DISTRICT.GET_GRID, params);
    return autoParseRows(response);
  },
  getDistrictGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.DISTRICT.GET_GRID_SUPER, params);
    return autoParseRows(response);
  },
  getDistrictById: async (id: number | string): Promise<any> => {
    return apiService.get(MODULE, API_ENDPOINTS.DISTRICT.GET_BY_ID(id));
  },
  saveDistrict: async (payload: any): Promise<any> => {
    return apiService.post(MODULE, API_ENDPOINTS.DISTRICT.SAVE, payload);
  },
  deleteDistrict: async (id: number | string): Promise<any> => {
    return apiService.get(MODULE, API_ENDPOINTS.DIVISION.DELETE(id));
  },
  getDistrictCombo: async (): Promise<any> => {
    if (cache['districts_all']) return cache['districts_all'];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_DISTRICTS);
    const data = response?.data || [];
    cache['districts_all'] = data;
    return data;
  },
  getDistrictComboSuper: async (): Promise<any> => {
    if (cache['districts_super']) return cache['districts_super'];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_DISTRICTS_SUPER);
    const data = response?.data || [];
    cache['districts_super'] = data;
    return data;
  },
  getDistrictByDivision: async (divisionId: string | number): Promise<any> => {
    const key = `districts_${divisionId}`;
    if (cache[key]) return cache[key];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_DISTRICTS_BY_DIVISION(divisionId));
    const data = response?.data || [];
    cache[key] = data;
    return data;
  },

  // --- Thana ---
  getThanaGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.THANA.GET_GRID, params);
    return autoParseRows(response);
  },
  getThanaGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.THANA.GET_GRID_SUPER, params);
    return autoParseRows(response);
  },
  getThanaById: async (id: number | string): Promise<any> => {
    return apiService.get(MODULE, API_ENDPOINTS.THANA.GET_BY_ID(id));
  },
  saveThana: async (payload: any): Promise<any> => {
    return apiService.post(MODULE, API_ENDPOINTS.THANA.SAVE, payload);
  },
  deleteThana: async (id: number | string): Promise<any> => {
    return apiService.get(MODULE, API_ENDPOINTS.THANA.DELETE(id));
  },
  getThanaCombo: async (): Promise<any> => {
    if (cache['thanas_all']) return cache['thanas_all'];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_THANAS);
    const data = response?.data || [];
    cache['thanas_all'] = data;
    return data;
  },
  getThanaComboSuper: async (): Promise<any> => {
    if (cache['thanas_super']) return cache['thanas_super'];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_THANAS_SUPER);
    const data = response?.data || [];
    cache['thanas_super'] = data;
    return data;
  },
  getThanaByDistrict: async (districtId: string | number): Promise<any> => {
    const key = `thanas_${districtId}`;
    if (cache[key]) return cache[key];
    const response: any = await apiService.get(MODULE, API_ENDPOINTS.COMBO.GET_THANAS_BY_DISTRICT(districtId));
    const data = response?.data || [];
    cache[key] = data;
    return data;
  },
};
