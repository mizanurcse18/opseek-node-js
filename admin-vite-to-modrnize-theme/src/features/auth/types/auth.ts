export interface LoginCredentials {
  username?: string;
  email?: string;
  password?: string;
}

export interface AuthResponseData {
  user?: string;
  user_name?: string;
  user_id?: number;
  role?: string;
  is_admin?: boolean;
  token: string;
  refresh_token: string;
  company_id?: string;
  CompanyID?: string;
  default_menu_path?: string;
  is_forced_login?: boolean;
}

export interface RefreshTokenRequest {
  RefreshToken: string;
}

export interface AuthResponse {
  data: AuthResponseData;
  message: string;
  response_code: string;
  status_code: number;
}
