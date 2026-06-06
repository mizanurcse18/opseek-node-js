import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getToken, getRefreshToken, getUserDetails } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
  is_forced_login?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: any[];
  isPermissionsLoaded: boolean;
  isAuthError: boolean;
  authErrorMessage: string | null;
  isForcedPasswordChange: boolean;
}

const initialState: AuthState = {
  user: getUserDetails(),
  token: getToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getToken(),
  isLoading: true,
  permissions: [],
  isPermissionsLoaded: false,
  isAuthError: false,
  authErrorMessage: null,
  isForcedPasswordChange: getUserDetails()?.is_forced_login || false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isForcedPasswordChange = !!action.payload.user.is_forced_login;
      state.isLoading = false;
      state.isAuthError = false;
      state.authErrorMessage = null;
    },
    updateTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      setUserDetails(action.payload);
    },
    setPermissions: (state, action: PayloadAction<any[]>) => {
      state.permissions = action.payload;
      state.isPermissionsLoaded = true;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.isAuthError = true;
      state.authErrorMessage = action.payload;
      state.isLoading = false;
    },
    clearAuthError: (state) => {
      state.isAuthError = false;
      state.authErrorMessage = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.permissions = [];
      state.isPermissionsLoaded = false;
      state.isAuthError = false;
      state.authErrorMessage = null;
      state.isForcedPasswordChange = false;
    },
  },
});

export const { 
  setCredentials, 
  updateTokens, 
  setUser,
  setLoading, 
  setPermissions, 
  setAuthError, 
  clearAuthError, 
  logout 
} = authSlice.actions;

export default authSlice.reducer;
