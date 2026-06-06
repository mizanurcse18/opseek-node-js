import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.charAt(0).toLowerCase() + key.slice(1).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

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

export interface MailConfiguration {
  configId?: number;
  configName: string;
  host: string;
  port: number;
  userName: string;
  password?: string;
  displayName: string;
  isActive: boolean;
  enableSsl: boolean;
  timeout: number;
  sleepTime: number;
  seqNo: number;
}

export interface MailGroupSetup {
  groupId?: number;
  groupName: string;
  configId: number;
  subject: string;
  body: string;
  attachmentPath?: string;
  priority: number;
  sensitivity: number;
  reportGenTime?: string;
  mailGenTime?: string;
  intervalOn?: string;
  intervalValue?: number;
  isFromInterface: boolean;
}

export interface MailLog {
  logId?: number;
  groupId: number;
  recipientEmail: string;
  payloadJson?: string;
  status: number;
  attemptCount: number;
  lastError?: string;
  sentDate?: string;
  completedDate?: string;
  createdBy?: string;
  createdDate?: string;
}

export const mailConfigurationService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true, Limit: 10, Offset: 0, Order: 'asc',
      SearchBy: '', SearchType: '', Search: '', Sort: 'config_id',
      SortName: '', SortOrder: '', ApprovalFilterData: '', Parameters: [], menuid: 0,
      ...params
    };
    const response: any = await apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.GET_GRID, toSnakeCase(defaultParams));
    return response;
  },

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true, Limit: 10, Offset: 0, Order: 'asc',
      SearchBy: '', SearchType: '', Search: '', Sort: 'config_id',
      SortName: '', SortOrder: '', ApprovalFilterData: '', Parameters: [], menuid: 0,
      ...params
    };
    const response: any = await apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.GET_GRID_SUPER, toSnakeCase(defaultParams));
    return response;
  },

  getById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.GET_BY_ID(id));
  },

  getActive: async (): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.GET_ACTIVE);
  },

  getAll: async (): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.GET_ALL);
  },

  save: async (data: MailConfiguration): Promise<any> => {
    return apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.SAVE, toSnakeCase(data));
  },

  delete: async (id: number | string): Promise<any> => {
    return apiService.delete(API_MODULES.MAIL, API_ENDPOINTS.MAIL_CONFIGURATION.DELETE(id));
  },
};

export const mailGroupSetupService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true, Limit: 10, Offset: 0, Order: 'asc',
      SearchBy: '', SearchType: '', Search: '', Sort: 'group_id',
      SortName: '', SortOrder: '', ApprovalFilterData: '', Parameters: [], menuid: 0,
      ...params
    };
    const response: any = await apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.GET_GRID, toSnakeCase(defaultParams));
    return response;
  },

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true, Limit: 10, Offset: 0, Order: 'asc',
      SearchBy: '', SearchType: '', Search: '', Sort: 'group_id',
      SortName: '', SortOrder: '', ApprovalFilterData: '', Parameters: [], menuid: 0,
      ...params
    };
    const response: any = await apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.GET_GRID_SUPER, toSnakeCase(defaultParams));
    return response;
  },

  getById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.GET_BY_ID(id));
  },

  getByName: async (name: string): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.GET_BY_NAME(name));
  },

  getAll: async (): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.GET_ALL);
  },

  save: async (data: MailGroupSetup): Promise<any> => {
    return apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.SAVE, toSnakeCase(data));
  },

  delete: async (id: number | string): Promise<any> => {
    return apiService.delete(API_MODULES.MAIL, API_ENDPOINTS.MAIL_GROUP_SETUP.DELETE(id));
  },
};

export interface MailTemplate {
  templateId?: number;
  groupId: number;
  templateName: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  priority: number;
  sensitivity: number;
  isActive: boolean;
  seqNo: number;
}

export interface SendTestMailRequest {
  templateId: number;
  configId?: number | null;
  recipientEmail: string;
  placeholdersJson?: string | null;
}

export const mailTemplateService = {
  save: async (data: MailTemplate): Promise<any> => {
    return apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_TEMPLATE.SAVE, toSnakeCase(data));
  },

  getById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_TEMPLATE.GET_BY_ID(id));
  },

  getByGroupId: async (groupId: number | string): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_TEMPLATE.GET_BY_GROUP(groupId));
  },

  getAll: async (): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_TEMPLATE.GET_ALL);
  },

  delete: async (id: number | string): Promise<any> => {
    return apiService.delete(API_MODULES.MAIL, API_ENDPOINTS.MAIL_TEMPLATE.DELETE(id));
  },

  sendTestMail: async (data: {
    templateId: number;
    configId?: number | null;
    recipientEmail: string;
    placeholdersJson?: string | null;
  }): Promise<any> => {
    return apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_TEMPLATE.SEND_TEST, toSnakeCase(data));
  },
};

export const mailLogService = {
  getGridData: async (params: Partial<GridRequest>): Promise<any> => {
    const defaultParams: GridRequest = {
      ServerPagination: true, Limit: 10, Offset: 0, Order: 'asc',
      SearchBy: '', SearchType: '', Search: '', Sort: 'log_id',
      SortName: '', SortOrder: '', ApprovalFilterData: '', Parameters: [], menuid: 0,
      ...params
    };
    const response: any = await apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_LOG.GET_GRID, toSnakeCase(defaultParams));
    return response;
  },

  getById: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.MAIL, API_ENDPOINTS.MAIL_LOG.GET_BY_ID(id));
  },

  enqueue: async (data: { groupId: number; to: string; placeholders?: any }): Promise<any> => {
    return apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_LOG.ENQUEUE, toSnakeCase(data));
  },

  retry: async (id: number | string): Promise<any> => {
    return apiService.post(API_MODULES.MAIL, API_ENDPOINTS.MAIL_LOG.RETRY(id), {});
  },
};
