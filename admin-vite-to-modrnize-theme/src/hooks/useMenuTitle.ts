import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

export interface MenuItem {
  menu_id: number;
  title: string;
  url: string;
  parent_id: number;
  children?: MenuItem[];
  [key: string]: any; // Allow for custom permission-related columns
}

/**
 * Hook to get the full menu object for the current route
 * Allows retrieving permission-related columns or other metadata.
 * 
 * @param pathOrDefault Optional path to search or default title
 * @returns The matched MenuItem object or null
 */
export function useMenu(pathOrDefault?: string): MenuItem | null {
  const location = useLocation();
  const permissions = useSelector((state: RootState) => state.auth.permissions);

  const matchedMenu = useMemo(() => {
    // If pathOrDefault starts with '/', treat it as a path to search
    const isPath = pathOrDefault && pathOrDefault.startsWith('/');
    const pathname = isPath ? pathOrDefault : location.pathname;

    if (!permissions || permissions.length === 0) {
      return null;
    }

    // Helper to flatten the tree while preserving all original properties
    const flatten = (items: any[]): any[] => {
      let result: any[] = [];
      items.forEach(item => {
        const children = item.children || item.submenu || [];
        // Create matching-normalized copy but preserve original item fields
        const flatItem = {
          ...item,
          // Add internal normalized properties for easier matching logic
          _title: item.title || item.Title || item.name || '',
          _url: (item.url || item.Url || item.path || '').replace(/\/$/, '') || '/'
        };

        result.push(flatItem);
        if (children.length > 0) {
          result.push(...flatten(children));
        }
      });
      return result;
    };

    const flatMenus = flatten(permissions);
    // console.log(flatMenus);
    const searchPath = pathname.replace(/\/$/, '') || '/';

    // 1. Try exact match first (normalized)
    const exactMatch = flatMenus.find(m => m._url.toLowerCase() === searchPath.toLowerCase());
    if (exactMatch) return exactMatch;

    // 2. Try partial match (current path starts with menu path)
    // Sort by URL length descending to get the most specific parent first
    const parentMatches = flatMenus
      .filter(m => {
        const menuPath = m._url;
        return menuPath && menuPath !== '/' && searchPath.toLowerCase().startsWith(menuPath.toLowerCase() + '/');
      })
      .sort((a, b) => (b._url.length || 0) - (a._url.length || 0));

    if (parentMatches.length > 0) return parentMatches[0];

    return null;
  }, [location.pathname, permissions, pathOrDefault]);

  return matchedMenu;
}

/**
 * Hook to get the current page title from the menu
 * Falls back to pathOrDefault if not found and not a path.
 */
export function useMenuTitle(pathOrDefault?: string): string {
  const menu = useMenu(pathOrDefault);
  const isPath = pathOrDefault && pathOrDefault.startsWith('/');
  const defaultTitle = isPath ? '' : pathOrDefault;

  if (menu) {
    // Check all common title property variations
    return menu.title || menu.Title || menu.name || menu._title || '';
  }

  return defaultTitle || '';
}
