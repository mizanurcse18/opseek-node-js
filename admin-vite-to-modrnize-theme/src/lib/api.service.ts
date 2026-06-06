import { apiClient } from './axios';

export const apiService = {
  get: <T>(module: string, path: string, config?: any) => apiClient.get<any, T>(`${module}${path}`, config),
  getSecure: <T>(module: string, path: string, config?: any) => 
    apiClient.get<any, T>(`${module}${path}`, { ...config, encrypt: true }),
  
  post: <T>(module: string, path: string, data?: any, config?: any) => apiClient.post<any, T>(`${module}${path}`, data, config),
  postSecure: <T>(module: string, path: string, data?: any, config?: any) => 
    apiClient.post<any, T>(`${module}${path}`, data, { ...config, encrypt: true }),
  
  put: <T>(module: string, path: string, data?: any, config?: any) => apiClient.put<any, T>(`${module}${path}`, data, config),
  putSecure: <T>(module: string, path: string, data?: any, config?: any) => 
    apiClient.put<any, T>(`${module}${path}`, data, { ...config, encrypt: true }),
  
  delete: <T>(module: string, path: string, config?: any) => apiClient.delete<any, T>(`${module}${path}`, config),
  deleteSecure: <T>(module: string, path: string, config?: any) => 
    apiClient.delete<any, T>(`${module}${path}`, { ...config, encrypt: true }),
};
