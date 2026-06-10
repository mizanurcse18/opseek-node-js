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

export interface SystemConfiguration {
  system_configuration_id: number;
  user_account_locked_duration_in_min: number;
  user_password_changed_duration_in_days: number;
  access_failed_count_max: number;
  is_active: boolean;
  company_id?: string;
}

export const securityService = {
  getRoleGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "security_rule_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.GET_GRID, defaultParams);

    // Auto-parse the 'rows' string if it's a string
    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse rows JSON string:", e);
      }
    }

    return response;
  },

  getRoleGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "security_rule_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.GET_GRID_SUPER, defaultParams);

    // Auto-parse the 'rows' string if it's a string
    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse super rows JSON string:", e);
      }
    }

    return response;
  },

  getMenuData: async (menuType?: string, companyId?: string): Promise<any> => {
    // Determine the correct endpoint based on provided filters
    let endpoint: string = API_ENDPOINTS.MENU.GET_ALL;

    if (menuType && companyId) {
      endpoint = API_ENDPOINTS.MENU.GET_BY_TYPE_AND_COMPANY(menuType, companyId);
    } else if (menuType) {
      endpoint = API_ENDPOINTS.MENU.GET_BY_TYPE(menuType);
    }

    const response: any = await apiService.get(API_MODULES.AUTH, endpoint);

    // Auto-parse the 'data' string if the backend returns it as a JSON string
    if (response?.data?.data && typeof response.data.data === 'string') {
      try {
        response.data.data = JSON.parse(response.data.data);
      } catch (e) {
        console.error("Failed to parse menu data JSON string:", e);
      }
    }

    return response;
  },

  saveMenu: async (menuData: any[]): Promise<any> => {
    // The backend expects a single item object per save request
    const results = [];
    for (const item of menuData) {
      if (!item.row_editor_status) {
        item.row_editor_status = (Number(item.menu_id) || 0) > 0 ? 'update' : 'insert';
      }
      const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.MENU.SAVE, item);
      results.push(response);
    }
    return results;
  },

  reorderMenu: async (items: { menu_id: number; parent_id: number; sequence_no: number }[]): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.MENU.REORDER, { orderList: items });
  },

  deleteMenu: async (items: { menu_id: number; parent_id: number; sequence_no: number }[]): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.MENU.DELETE, { orderList: items });
  },

  getLastMenuId: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.MENU.GET_LAST_ID);
  },

  getApiPathMap: async (menuId: number): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.MENU.GET_API_PATH(menuId));

    // Auto-parse the 'data' string if it's a JSON string
    if (response?.data && typeof response.data === 'string' && response.data !== '[]') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error("Failed to parse API Path Map JSON string:", e);
      }
    } else if (response?.data === '[]') {
      response.data = [];
    }

    return response;
  },

  getPermissionList: async (ruleId: number | string): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.GET_PERMISSIONS(ruleId));

    // Auto-parse the 'data' string if it's a JSON string
    if (response?.data && typeof response.data === 'string' && response.data !== '[]') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error("Failed to parse Permission List JSON string:", e);
      }
    } else if (response?.data === '[]') {
      response.data = [];
    }

    return response;
  },

  getPermissionListSuper: async (ruleId: number | string, companyId: string): Promise<any> => {
    // Explicitly calling the super permissions endpoint function
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.GET_PERMISSIONS_SUPER(ruleId, companyId));

    // Auto-parse the 'data' string if it's a JSON string
    if (response?.data && typeof response.data === 'string' && response.data !== '[]') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error("Failed to parse Permission List JSON string:", e);
      }
    } else if (response?.data === '[]') {
      response.data = [];
    }

    return response;
  },

  getSecurityRuleById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.GET_BY_ID(id));
  },

  saveSecurityRule: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.SAVE, payload);
  },

  saveSecurityRuleSuper: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.SAVE_SUPER, payload);
  },

  getLoginMenus: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.MENU.GET_LOGIN_MENUS);

    // Auto-parse the 'data' string if it's a JSON string
    if (response?.data && typeof response.data === 'string' && response.data !== '[]') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error("Failed to parse Login Menus JSON string:", e);
      }
    } else if (response?.data === '[]') {
      response.data = [];
    }

    return response;
  },

  // --- Group Methods ---
  getGroupGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "security_group_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_GROUP.GET_GRID, defaultParams);

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse group rows JSON string:", e);
      }
    }
    return response;
  },

  getGroupGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true,
      Limit: 10,
      Offset: 0,
      Order: "asc",
      SearchBy: "",
      SearchType: "",
      Search: "",
      Sort: "security_group_id",
      SortName: "",
      SortOrder: "",
      ApprovalFilterData: "",
      Parameters: [],
      menuid: 0,
      ...params
    };

    const response: any = await apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_GROUP.GET_GRID_SUPER, defaultParams);

    if (response?.data?.rows && typeof response.data.rows === 'string') {
      try {
        response.data.rows = JSON.parse(response.data.rows);
      } catch (e) {
        console.error("Failed to parse super group rows JSON string:", e);
      }
    }
    return response;
  },

  getGroupById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_GROUP.GET_BY_ID(id));
  },

  saveGroup: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_GROUP.SAVE, payload);
  },

  saveGroupSuper: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_GROUP.SAVE_SUPER, payload);
  },

  deleteGroup: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_GROUP.DELETE(id));
  },

  deleteSecurityRule: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_RULE.DELETE(id));
  },

  getSecurityRulesCombo: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_RULES);
    return response?.data || [];
  },

  getSecurityRulesSuperCombo: async (companyId: string): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_RULES_SUPER(companyId));
    let rawData = response?.data;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
       return rawData.data ?? rawData.Data ?? rawData.rows ?? [];
    }
    return [];
  },

  getSecurityGroupsCombo: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_GROUPS);
    return response?.data || [];
  },

  getSecurityGroupsSuperCombo: async (companyId: string): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_GROUPS_SUPER(companyId));
    let rawData = response?.data;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
      return rawData.data ?? rawData.Data ?? rawData.rows ?? [];
    }
    return [];
  },

  getDefaultMenus: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_DEFAULT_MENUS);
    let rawData = response?.data;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
      return rawData.data ?? rawData.Data ?? rawData.rows ?? [];
    }
    return [];
  },

  getDefaultMenusSuperCombo: async (companyId: string): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_DEFAULT_MENUS_SUPER(companyId));
    let rawData = response?.data;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
      return rawData.data ?? rawData.Data ?? rawData.rows ?? [];
    }
    return [];
  },

  getRoleList: async (): Promise<any> => {
    const params: Partial<GridRequest> = {
      ServerPagination: false,
      Limit: 1000,
      Sort: "security_rule_name"
    };
    const response = await securityService.getRoleGridData(params);
    return response?.data?.rows || [];
  },

  getSystemVariables: async (typeId: string | number): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_SYSTEM_VARIABLES(String(typeId)));
    let rawData = response?.data;

    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }

    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
      return rawData.data ?? rawData.Data ?? rawData.rows ?? rawData.DataList ?? [];
    }
    return [];
  },

  getAllCompaniesCombo: async (): Promise<any> => {
    const response: any = await apiService.get(API_MODULES.AUTH, API_ENDPOINTS.COMBO.GET_ALL_COMPANIES);
    let rawData = response?.data;

    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }

    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
      return rawData.data ?? rawData.Data ?? rawData.rows ?? rawData.DataList ?? [];
    }
    return [];
  },

  getSystemConfiguration: async (companyId: string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_CONFIGURATION.GET(companyId));
  },

  saveSystemConfiguration: async (data: SystemConfiguration): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SYSTEM_CONFIGURATION.SAVE, data);
  },
  
  getSystemConfigAudit: async (id: number | string, dataSize?: number): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.AUDIT_LOG.GET_SYSTEM_CONFIG(id, dataSize));
  },

  // --- Cache Management ---
  getCacheSummary: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_CACHE.SUMMARY);
  },

  getCacheList: async (entityType: string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_CACHE.LIST(entityType));
  },

  getCacheById: async (entityType: string, id: string | number): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_CACHE.GET_BY_ID(entityType, id));
  },

  clearCache: async (entityType: string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_CACHE.CLEAR(entityType));
  },

  evictCacheItem: async (entityType: string, id: string | number): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_CACHE.EVICT(entityType, id));
  },

  reloadCache: async (entityType: string): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.SECURITY_CACHE.RELOAD(entityType), {});
  },

  // --- Global & User Settings ---
  getAllGlobalSettings: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.GLOBAL_SETTING.ALL);
  },

  saveGlobalSetting: async (data: any): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.GLOBAL_SETTING.SAVE, data);
  },

  getUserSetting: async (userId: number, key: string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.USER_SETTING.GET(userId, key));
  },

  saveUserSetting: async (userId: number, key: string, value: string): Promise<any> => {
    return apiService.postSecure<any>(API_MODULES.AUTH, '/user-setting/save', { userId, key, value });
  },

  copyMenus: async (request: CopyMenuRequest): Promise<any> => {
    return apiService.post(API_MODULES.AUTH, API_ENDPOINTS.MENU.COPY, request);
  },

  checkMenuUsage: async (menuId: number): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, `/menu/check-usage/${menuId}`);
  }
};

export interface CopyMenuRequest {
  SourceCompanyId: string;
  TargetCompanyId: string;
  MenuType: string;
  SelectedMenuIds: number[];
}
