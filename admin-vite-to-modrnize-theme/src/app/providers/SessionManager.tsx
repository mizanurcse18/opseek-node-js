import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '@/lib/auth/api/auth.service';
import { getToken, getRefreshToken, setTokens, clearTokens, setUserDetails } from '@/lib/auth';
import { updateTokens, logout, setLoading, setUser } from '@/features/auth/authSlice';

export function SessionManager({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const hasStarted = useRef(false);

  useEffect(() => {
    // Prevent multiple calls in development (StrictMode) or during re-renders
    if (hasStarted.current) return;
    hasStarted.current = true;

    const verifySession = async () => {
      const token = getToken();
      const refreshToken = getRefreshToken();

      if (!token) {
        dispatch(setLoading(false));
        return;
      }

      try {
        // Step 1: Verify current token (GET)
        const response = await authService.verifyToken();

        if (response && response.status_code === 200) {
          const token = getToken();
          const refreshToken = getRefreshToken();
          // Token is valid, ensure Redux state matches
          dispatch(updateTokens({ token: token || '', refreshToken: refreshToken || '' }));
          
          if (response.data) {
            dispatch(setUser({
              id: response.data.user_id?.toString() || '1',
              name: response.data.user_name || response.data.user || '',
              email: response.data.user_name || response.data.user || '',
              role: response.data.role || 'admin',
              company_id: response.data.company_id || response.data.CompanyID || ''
            }));
          }
          console.log('Session verified successfully.');
        } else {
          // If not 200, we proceed to refresh
          throw new Error('Verification failed - not 200');
        }
      } catch (error) {
        console.warn('Token verification failed, attempting refresh...', error);

        // Step 2: Attempt refresh (POST)
        if (refreshToken) {
          try {
            const refreshResponse = await authService.refreshToken({ RefreshToken: refreshToken });

            // User specifically asked to check response_code === 'OK'
            if (refreshResponse && refreshResponse.response_code === 'OK') {
              const newToken = refreshResponse.data.token;
              const newRefreshToken = refreshResponse.data.refresh_token;

              if (newToken && newRefreshToken) {
                setTokens(newToken, newRefreshToken);
                dispatch(updateTokens({
                  token: newToken,
                  refreshToken: newRefreshToken
                }));

                dispatch(setUser({
                  id: refreshResponse.data.user_id?.toString() || '1',
                  name: refreshResponse.data.user_name || refreshResponse.data.user || '',
                  email: refreshResponse.data.user_name || refreshResponse.data.user || '',
                  role: refreshResponse.data.role || 'admin',
                  company_id: refreshResponse.data.company_id || refreshResponse.data.CompanyID || ''
                }));
                console.log('Session refreshed successfully.');
              }
            } else {
              throw new Error('Refresh failed - response_code not OK');
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
            clearTokens();
            dispatch(logout());
          }
        } else {
          clearTokens();
          dispatch(logout());
        }
      } finally {
        dispatch(setLoading(false));
      }
    };

    verifySession();
  }, [dispatch]);

  return <>{children}</>;
}
