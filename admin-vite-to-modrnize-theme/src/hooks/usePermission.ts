import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

export interface Permission {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canReport: boolean;
  isAuthorized: boolean;
}

/**
 * Custom hook to get permissions for the current active route or a specific path.
 * 
 * @param path Optional specific path to check permissions for. Defaults to current location.
 * @returns An object containing boolean flags for each permission type.
 */
export function usePermission(path?: string): Permission {
  const location = useLocation();
  const currentPath = path || location.pathname;
  const { permissions } = useSelector((state: RootState) => state.auth);

  // Find the permission entry for the current path
  // We match based on the Url field in the menu data
  const menuPermission = permissions?.find((p: any) => p.Url === currentPath);

  if (!menuPermission) {
    return {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canReport: false,
      isAuthorized: false,
    };
  }

  return {
    canRead: menuPermission.CanRead === true || menuPermission.CanRead === 1,
    canCreate: menuPermission.CanCreate === true || menuPermission.CanCreate === 1,
    canUpdate: menuPermission.CanUpdate === true || menuPermission.CanUpdate === 1,
    canDelete: menuPermission.CanDelete === true || menuPermission.CanDelete === 1,
    canReport: menuPermission.CanReport === true || menuPermission.CanReport === 1,
    isAuthorized: true,
  };
}
