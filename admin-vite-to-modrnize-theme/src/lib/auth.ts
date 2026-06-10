import CryptoJS from 'crypto-js';

const SECRET_KEY = 'P@yPlu$S3cr3tK3y2026!'; // A secret key for AES encryption

export const setTokens = (token: string, refreshToken: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('refresh_token', refreshToken);
};

export const getToken = () => localStorage.getItem('token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('is_admin');
  clearUserDetails();
};

/**
 * Returns true if the current logged-in user is a superadmin.
 * Reads from the stored user details (set during login), not from JWT decoding.
 */
export const isSuperAdmin = (): boolean => {
  const user = getUserDetails();
  return !!user?.is_admin;
};

export const setUserDetails = (user: any) => {
  try {
    const jsonStr = JSON.stringify(user);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
    localStorage.setItem('user_details', encrypted);
  } catch (error) {
    console.error('Failed to encrypt user details', error);
  }
};

export const getUserDetails = () => {
  const encrypted = localStorage.getItem('user_details');
  if (encrypted) {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('Failed to decrypt user details', e);
      return null;
    }
  }
  return null;
};

export const clearUserDetails = () => {
  localStorage.removeItem('user_details');
};
