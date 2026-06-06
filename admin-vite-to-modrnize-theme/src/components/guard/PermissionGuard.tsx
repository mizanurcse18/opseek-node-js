import React from 'react';
import { usePermission, Permission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  /**
   * The permission type to check (e.g., 'canCreate', 'canUpdate')
   */
  permission: keyof Omit<Permission, 'isAuthorized'>;
  /**
   * Content to render if the user has permission
   */
  children: React.ReactNode;
  /**
   * Optional fallback content if the user doesn't have permission
   */
  fallback?: React.ReactNode;
}

/**
 * Reusable wrapper to conditionally render UI elements based on user permissions.
 * Useful for hiding buttons, tabs, or entire sections.
 * 
 * Example:
 * <PermissionGuard permission="canCreate">
 *    <Button>Add New</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const permissions = usePermission();

  if (permissions[permission]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
