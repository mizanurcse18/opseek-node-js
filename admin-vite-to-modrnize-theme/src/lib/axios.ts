import axios from 'axios';
import { getToken } from './auth';
import { store } from '@/app/store';
import { setAuthError } from '@/features/auth/authSlice';

let cachedIp: string | null = null;
const getClientIp = async (): Promise<string> => {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedIp = data.ip;
    return cachedIp || '';
  } catch (e) {
    console.error('Failed to fetch client IP', e);
    return '';
  }
};

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000'}${import.meta.env.VITE_API_PREFIX || '/api/v1'}`,
  headers: {
    'Content-Type': 'application/json',
    'X-IMEI': import.meta.env.VITE_X_IMEI || '',
    'device_mac': import.meta.env.VITE_DEVICE_MAC || ''
  },
});

import { encryptRequest, decryptResponse } from './encryption.service';

// Request interceptor to add token and handle encryption
apiClient.interceptors.request.use(
  async (config: any) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const ip = await getClientIp();
    if (ip) {
      config.headers['X-Forwarded-For'] = ip;
    }

    // Handle Client-Side Encryption
    if (config.encrypt) {
      try {
        if (config.data) {
          const encryptedBody = await encryptRequest(config.data);
          config.data = `"${encryptedBody}"`; // Backend expects a quoted string for [FromBody] string
          config.headers['Content-Type'] = 'application/json';
          config.headers['X-Encrypted-Request'] = 'true';
        } else {
          // For GET/DELETE or empty body, we send the session key in a header
          // This allows the server to reuse this key for the response encryption
          const encryptedKeyPacket = await encryptRequest(null);
          config.headers['X-Encrypted-Session-Key'] = encryptedKeyPacket;
          config.headers['X-Encrypted-Request'] = 'true';
          config.headers['X-Encrypted-Response'] = 'true';
        }
      } catch (e) {
        console.error('Encryption failed', e);
        return Promise.reject(e);
      }
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor wrapper to handle decryption and return data directly
apiClient.interceptors.response.use(
  async (response) => {
    const config = response.config as any;
    let data = response.data;

    // Handle Response Decryption
    // The encrypted string might be the direct response body or inside a 'data' property
    let encryptedString = typeof data === 'string' ? data : (data && typeof data.data === 'string' ? data.data : null);

    if (config.encrypt && encryptedString) {
      try {
        data = await decryptResponse(encryptedString);
        console.log('Decrypted Response:', data);
      } catch (e) {
        console.error('Decryption failed', e);
        // If decryption fails, it might be a plain error message or server crash
      }
    }

    // Some APIs return 200 OK but with an error status in the body
    if (data && (data.status_code === 401 || data.response_code === 401 || data.response_code === 'UNAUTHORIZED')) {
      const message = data.message || 'Authorization failed. Please login again.';
      store.dispatch(setAuthError(message));
      return Promise.reject(data);
    }
    return data;
  },
  (error) => {
    // Handle standard HTTP status codes
    if (error.response?.status === 401) {
      const message = error.response.data?.message || 'Unauthorized access. Redirecting to login...';
      store.dispatch(setAuthError(message));
    }
    return Promise.reject(error.response?.data || error);
  }
);
