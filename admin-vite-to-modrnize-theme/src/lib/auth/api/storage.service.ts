import { apiService } from '../../api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

const MODULE = API_MODULES.STORAGE;

export const storageService = {
  getDownloadUrl: (fileKey: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7000';
    const prefix = import.meta.env.VITE_API_PREFIX ?? '/api/v1';
    return `${baseUrl}${prefix}${MODULE}${API_ENDPOINTS.STORAGE.DOWNLOAD(fileKey)}`;
  },

  uploadFile: async (data: {
    FileName: string;
    FileData: string; // Base64
    BucketName?: string;
    TableName?: string;
    ReferenceID?: number;
    IsPrivate?: boolean;
  }): Promise<any> => {
    return apiService.post(MODULE, API_ENDPOINTS.STORAGE.UPLOAD, data);
  },

  deleteFile: async (fileKey: string): Promise<any> => {
    return apiService.delete(MODULE, API_ENDPOINTS.STORAGE.DELETE(fileKey));
  }
};
