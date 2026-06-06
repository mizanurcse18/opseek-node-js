import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { useMenu } from './useMenuTitle';
import { apiService } from '@/lib/api.service';

export interface ButtonConfig {
  button_id: string;
  button_title: string;
  visible?: boolean;
}

interface ApiButtonResponse {
  buttons: Array<{
    button_id: string;
    visible: boolean;
    button_title?: string;
  }>;
}

// Simple in-memory cache to store API responses per dynamic URL
const buttonCache: Record<string, ApiButtonResponse> = {};

/**
 * Hook to dynamically manage button visibility and titles based on menu metadata.
 * 
 * @param initialButtons The collection of buttons defined in the UI
 * @returns An object containing the merged buttons list and loading state
 */
export function useMenuButtons(initialButtons: ButtonConfig[]) {
  const menu = useMenu();
  const [apiButtons, setApiButtons] = useState<ApiButtonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const authUser = useSelector((state: RootState) => state.auth.user);

  // const isGlobalAdmin = authUser?.role?.toLowerCase() === 'admin' || authUser?.role?.toLowerCase() === 'super admin' || authUser?.role?.toLowerCase() === 'superadmin';
  const isAdmin = menu?.is_admin === true || menu?.IsAdmin === true || menu?.is_admin === 'true' || menu?.IsAdmin === 'true';
  const menuData = menu?.menu_data || menu?.MenuData;
  // console.log("menuData", menuData, "isAdmin", isAdmin);
  // Parse menu_data and determine if we need an API call
  const config = useMemo(() => {
    if (!menu || !menuData) return null;
    try {
      const parsed = typeof menuData === 'string' ? JSON.parse(menuData) : menuData;
      // If it's an array (common in some backend responses), take the first item
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      console.error('Failed to parse menu_data JSON:', e);
      return null;
    }
  }, [menu, menuData]);

  // Construct the API URL based on the rule: /{module}/{controller}/{api_path}
  const apiUrl = useMemo(() => {
    if (!config || typeof config !== 'object') return null;
    const { module, controller, api_path } = config;
    if (!module || !controller || !api_path) return null;
    // ensure leading slash for path segments
    const cleanController = controller.startsWith('/') ? controller : `/${controller}`;
    const cleanApiPath = api_path.startsWith('/') ? api_path : `/${api_path}`;
    return `${cleanController}${cleanApiPath}`;
  }, [config]);

  useEffect(() => {
    // Reset if we don't need an API call
    if (!apiUrl || !config?.module || (config?.buttons && Array.isArray(config.buttons))) {
      setApiButtons(null);
      return;
    }

    // Check cache first
    const cacheKey = `${config.module}${apiUrl}`;
    if (buttonCache[cacheKey]) {
      setApiButtons(buttonCache[cacheKey]);
      return;
    }

    let isMounted = true;
    const fetchButtons = async () => {
      setIsLoading(true);
      try {
        const response: any = await apiService.get(config.module, apiUrl);
        if (isMounted && response?.data) {
          const data = response.data as ApiButtonResponse;
          buttonCache[cacheKey] = data;
          setApiButtons(data);
        }
      } catch (error) {
        console.error('Failed to fetch dynamic button config:', error);
        if (isMounted) setApiButtons({ buttons: [] }); // Fallback: hide all
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchButtons();
    return () => { isMounted = false; };
  }, [apiUrl, config?.module]);

  // Final Merge Logic
  const buttons = useMemo(() => {
    // 1. Merge UI buttons with available configurations (Embedded or API)
    const apiMap = new Map<string, any>((apiButtons?.buttons || []).map(b => [b.button_id, b]));
    const embeddedMap = new Map<string, any>((config?.buttons || []).map((b: any) => [b.button_id, b]));

    return initialButtons.map(button => {
      const apiCfg = apiMap.get(button.button_id);
      const embeddedCfg = embeddedMap.get(button.button_id);

      // Determine visibility:
      // - Admins: Always true
      // - Embedded: true unless visible: false
      // - API: as provided, default false
      let isVisible = false;
      if (isAdmin) {
        isVisible = true;
      } else if (embeddedCfg) {
        isVisible = embeddedCfg.visible !== false;
      } else if (apiCfg) {
        isVisible = apiCfg.visible ?? false;
      }

      // Determine title: Prefer API, then Embedded, then initial (hardcoded)
      const dynamicTitle = apiCfg?.button_title || embeddedCfg?.button_title || button.button_title;

      return {
        ...button,
        visible: isVisible,
        button_title: dynamicTitle
      };
    });
  }, [initialButtons, isAdmin, apiButtons, config]);

  return {
    buttons,
    isLoading,
    isAdmin
  };
}
