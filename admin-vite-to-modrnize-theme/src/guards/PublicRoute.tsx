import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { getToken } from '@/lib/auth';

export function PublicRoute() {
  const isAuthenticated = !!getToken(); 
  
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
