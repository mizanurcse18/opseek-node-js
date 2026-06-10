import { apiService } from '@/lib/api.service';
import { LoginCredentials, AuthResponse, RefreshTokenRequest, ChangeCompanyRequest } from '@/features/auth/types/auth';
import { API_MODULES } from '@/constants/api';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiService.post<AuthResponse>(API_MODULES.AUTH, '/user/login', credentials);
  },
  loginSecure: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiService.postSecure<AuthResponse>(API_MODULES.AUTH, '/user/login', credentials);
  },
  verifyToken: async (): Promise<AuthResponse> => {
    return apiService.get<AuthResponse>(API_MODULES.AUTH, '/user/verify-token');
  },
  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    return apiService.postSecure<AuthResponse>(API_MODULES.AUTH, '/user/refresh-token', data);
  },
  signOut: async (data: RefreshTokenRequest): Promise<any> => {
    return apiService.post<any>(API_MODULES.AUTH, '/user/sign-out', data);
  },
  changeCompany: async (data: ChangeCompanyRequest): Promise<AuthResponse> => {
    return apiService.postSecure<AuthResponse>(API_MODULES.AUTH, '/user/change-company-refresh-token', data);
  }
};
