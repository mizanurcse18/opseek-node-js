import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

export const notificationService = {
  getNotificationCountAndList: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_COUNT_AND_LIST);
  },

  getNotificationList: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_LIST);
  },

  getNotificationCountAndListForNFA: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_COUNT_AND_LIST_NFA);
  },

  getNotificationListForNFA: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_LIST_NFA);
  },

  getNotificationListForNotification: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_LIST_FOR_NOTIFICATION);
  },

  getAPTypeList: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_AP_TYPE_LIST);
  },

  getNotificationByAPType: async (id: number | string): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, API_ENDPOINTS.NOTIFICATION.GET_BY_AP_TYPE(id));
  }
};
