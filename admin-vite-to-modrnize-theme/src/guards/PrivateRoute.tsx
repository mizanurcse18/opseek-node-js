import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { getToken } from '@/lib/auth';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

export function PrivateRoute() {
  const location = useLocation();
  const token = getToken();
  const { isPermissionsLoaded, permissions, isForcedPasswordChange } = useSelector((state: RootState) => state.auth);
  const FORCED_PATH = '/settings/password';

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Handle Forced Password Change restriction
  if (isForcedPasswordChange && location.pathname !== FORCED_PATH) {
    console.warn('Forced password change active. Restricting access.');
    return <Navigate to={FORCED_PATH} replace />;
  }

  // If permissions are loaded, verify if the user has access to this specific route
  if (isPermissionsLoaded) {
    const hasAccess = permissions.some((p: any) => p.Url === location.pathname);
    
    // Allow access to common/dashboard routes or if explicitly permitted
    const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
    const isUnauthorizedPage = location.pathname === ROUTES.UNAUTHORIZED;
    const isKycPage = location.pathname.startsWith('/stakeholders/kyc/');
    
    if (!hasAccess && !isDashboard && !isUnauthorizedPage && !isKycPage) {
      console.warn(`Unauthorized access attempt to: ${location.pathname}`);
      return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
    }
  }

  return <Outlet />;
}
