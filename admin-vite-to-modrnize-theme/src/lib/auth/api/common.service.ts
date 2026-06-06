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

const createGridParams = (params: Partial<GridRequest>, defaultSort: string = "loged_id", defaultOrder: string = "desc"): GridRequest => ({
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: defaultOrder,
  SearchBy: "",
  SearchType: "",
  Search: "",
  Sort: defaultSort,
  SortName: "",
  SortOrder: "",
  ApprovalFilterData: "",
  Parameters: [],
  menuid: 0,
  ...params
});

export const commonService = {
  getUserLogGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.COMMON.GET_USER_LOG_GRID, createGridParams(params));
    return autoParseRows(response);
  },
  getUserLogGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const response = await apiService.post(MODULE, API_ENDPOINTS.COMMON.GET_USER_LOG_GRID_SUPER, createGridParams(params));
    return autoParseRows(response);
  },
};
