import { apiService } from '../../api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

const MODULE = API_MODULES.STORAGE;

export const storageService = {
  getDownloadUrl: (fileKey: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';
    const prefix = import.meta.env.VITE_API_PREFIX || '/api/v1';
    return `${baseUrl}${prefix}${MODULE}${API_ENDPOINTS.STORAGE.DOWNLOAD(fileKey)}`;
  },

  deleteFile: async (fileKey: string): Promise<any> => {
    return apiService.delete(MODULE, API_ENDPOINTS.STORAGE.DELETE(fileKey));
  }
};
