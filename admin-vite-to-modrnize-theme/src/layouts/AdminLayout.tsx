import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/constants/routes';
import { getToken } from '@/lib/auth';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { setPermissions } from '@/features/auth/authSlice';
import { securityService } from '@/lib/auth/api/security.service';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { ShieldAlert, Palette, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import ThemeDrawer from '@/components/layout/ThemeDrawer';
import { themeService } from '@/lib/theme.service';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dispatch = useDispatch();
  const { 
    isPermissionsLoaded, 
    isAuthenticated: isAuth, 
    isAuthError, 
    authErrorMessage 
  } = useSelector((state: RootState) => state.auth);
  const token = getToken();
  const { toast, ToastComponent } = useToast();

  const [loading, setLoading] = useState(!isPermissionsLoaded);
  const [bootError, setBootError] = useState<string | null>(null);

  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState('default');

  React.useEffect(() => {
    const savedTheme = themeService.loadTheme();
    setCurrentThemeId(savedTheme);
  }, []);

  React.useEffect(() => {
    const bootstrapPermissions = async () => {
      if (!token || isPermissionsLoaded) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setBootError(null);
      try {
        const response = await securityService.getLoginMenus();
        // Handle both PascalCase 'Data' and camelCase 'data', or the response itself if it's an array
        const menuData = response?.data || response?.Data || (Array.isArray(response) ? response : null);
        
        if (menuData && Array.isArray(menuData)) {
          dispatch(setPermissions(menuData));
        } else {
           console.error("[AdminLayout] Invalid menu response structure:", response);
           throw new Error("Invalid menu data received from server.");
        }
      } catch (error: any) {
        console.error("Failed to bootstrap permissions:", error);
        const apiErr = handleApiError(error);
        setBootError(apiErr.description);
        toast(apiErr);
      } finally {
        setLoading(false);
      }
    };

    bootstrapPermissions();
  }, [token, isPermissionsLoaded, dispatch, toast]);

  if (!token && !isAuth) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col gap-4">
        <Loader className="h-10 w-10 text-primary-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Authorizing Session...</p>
      </div>
    );
  }

  const showError = bootError || isAuthError;
  const errorMessage = authErrorMessage || bootError;

  if (showError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-red-50 p-6 text-center">
        <div className="mb-6 h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Authorization Failed</h2>
        <p className="max-w-md text-sm font-medium text-red-600 mb-8">
          {errorMessage}
        </p>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              if (isAuthError) {
                 dispatch({ type: 'auth/clearAuthError' });
              }
              window.location.reload();
            }} 
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-xl shadow-red-900/10"
          >
            Retry Login
          </Button>
          <Button 
            variant="outline" 
            onClick={() => { 
                localStorage.clear(); 
                if (isAuthError) dispatch({ type: 'auth/clearAuthError' });
                window.location.href = ROUTES.LOGIN; 
            }}
            className="border-red-200 text-red-700 hover:bg-red-100 font-black uppercase text-[10px] tracking-widest px-8"
          >
            Logout
          </Button>
        </div>
        <ToastComponent />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full fixed inset-0 overflow-hidden bg-content-bg">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Container */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]"
      )}>
        {/* We use a grid here to strictly control the 3 rows: Header, Content, Footer */}
        <div className="grid grid-rows-[72px_1fr_auto] h-full w-full overflow-hidden">
          {/* Header */}
          <Header 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />

          {/* Main Content Area - Scrollable */}
          <div id="main-scroll-container" className="overflow-y-auto overflow-x-hidden bg-content-bg">
            <main className="pt-4 pb-6 pl-4 pr-12 lg:pt-6 lg:pb-10 lg:pl-6 lg:pr-14 min-h-full flex flex-col">
              <div className="mx-auto max-w-full w-full flex-1">
                <Outlet />
              </div>
            </main>
          </div>
          
          {/* Footer - Strictly at the bottom of the grid */}
          <Footer />
        </div>
      </div>

      {/* Theme Customizer */}
      <div className="fixed right-0 top-1/3 z-50 flex flex-col gap-2 items-end">
        <button
          onClick={() => setThemePanelOpen(!themePanelOpen)}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-l-xl shadow-lg transition-all duration-300",
            "bg-primary hover:bg-primary/90 text-white",
          )}
        >
          {themePanelOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        {themePanelOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setThemeDrawerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-l-xl bg-white border border-slate-200 shadow-lg text-slate-500 hover:text-primary transition-colors"
            >
              <Palette className="h-5 w-5" />
            </button>
            <button 
              className="flex items-center justify-center w-10 h-10 rounded-l-xl bg-white border border-slate-200 shadow-lg text-slate-500 hover:text-primary transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <ThemeDrawer 
        isOpen={themeDrawerOpen}
        onClose={() => setThemeDrawerOpen(false)}
        currentThemeId={currentThemeId}
        onThemeChange={setCurrentThemeId}
      />

      <ToastComponent />
    </div>
  );
}
