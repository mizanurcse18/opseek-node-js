import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, QrCode, User, Image as ImageIcon, Lock, LogOut, Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ROUTES } from '@/constants/routes';
import { clearTokens, getRefreshToken, getToken, isSuperAdmin } from '@/lib/auth';
import { authService } from '@/lib/auth/api/auth.service';
import { logout } from '@/features/auth/authSlice';
import { CompanySwitchModal } from '@/features/auth/components/CompanySwitchModal';
import { Maximize, Minimize, Type } from 'lucide-react';
import { themeService } from '@/lib/theme.service';
import { cn } from '@/lib/utils';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isCompanySwitchOpen, setIsCompanySwitchOpen] = useState(false);
  const isAdmin = isSuperAdmin();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('admin_font_size');
    return saved ? parseInt(saved) : 100;
  });
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && 
        !(document as any).webkitFullscreenElement && 
        !(document as any).msFullscreenElement) {
      const element = document.documentElement as any;
      if (element.requestFullscreen) element.requestFullscreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
      else if (element.msRequestFullscreen) element.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  };

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(!!(document.fullscreenElement || 
                        (document as any).webkitFullscreenElement || 
                        (document as any).msFullscreenElement));
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState);
    document.addEventListener('msfullscreenchange', syncFullscreenState);
    
    // Also watch for F11 key to keep UI in sync
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        // We can't prevent F11 but we can sync the state after a short delay
        setTimeout(syncFullscreenState, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
      document.removeEventListener('msfullscreenchange', syncFullscreenState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    themeService.applyFontSize(size);
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 10);
      }
    };

    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const fontSizeOptions = [70, 80, 90, 100, 110, 120, 130];
  return (
    <>
    <header className={cn(
      "sticky top-0 z-[40] flex h-[72px] flex-shrink-0 bg-header-bg transition-all duration-300",
      isScrolled ? "shadow-sm" : "shadow-none"
    )}>
      <div className={cn(
        "flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8 text-text-main transition-all duration-300",
        isScrolled ? "border-b border-border-theme" : "border-b-transparent"
      )}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-header-icon hover:opacity-80 focus:outline-none lg:hidden p-2 rounded-full hover:bg-header-icon-hover transition-colors"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 justify-end items-center gap-2 sm:gap-4">
          {/* Font Size Selection */}
          <div className="relative" ref={fontDropdownRef}>
            <button 
              onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
              className={cn(
                "p-2 rounded-full transition-all duration-200 hover:bg-header-icon-hover flex items-center justify-center",
                isFontDropdownOpen ? "bg-header-icon-active text-header-icon" : "text-header-icon"
              )}
              title="Font Size"
            >
              <Type className="h-5 w-5" />
            </button>

            {isFontDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-card-bg shadow-2xl ring-1 ring-black/5 z-[100] p-5 border border-border-theme animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-6">
                  <Type className="h-4 w-4 text-primary-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-text-main">UI Scaling</span>
                  <span className="ml-auto text-[10px] font-black bg-primary-500 text-white px-1.5 py-0.5 rounded">{fontSize}%</span>
                </div>
                
                <div className="relative pt-1 px-1">
                  <div className="flex justify-between mb-4">
                    {fontSizeOptions.map((size) => (
                      <div key={size} className="flex flex-col items-center">
                        <div 
                          className={cn(
                            "w-1 h-1 rounded-full mb-2 transition-colors",
                            fontSize === size ? "bg-primary-600" : "bg-border-theme"
                          )} 
                        />
                        <span className={cn(
                          "text-[10px] font-bold transition-colors",
                          fontSize === size ? "text-primary-600" : "text-text-muted/60"
                        )}>
                          {size}%
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <input
                    type="range"
                    min="70"
                    max="130"
                    step="10"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-border-theme flex justify-center">
                  <button 
                    onClick={() => handleFontSizeChange(100)}
                    className="text-[10px] font-bold text-primary-600 hover:underline"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Switch Company (superadmin only) */}
          {isAdmin && (
            <button 
              onClick={() => setIsCompanySwitchOpen(true)}
              className="p-2 text-header-icon transition-all duration-200 rounded-full hover:bg-header-icon-hover relative group"
              title="Switch Company"
            >
              <Building2 className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-1 ring-white">
                <span className="sr-only">Switch company</span>
              </span>
            </button>
          )}

          {/* Full Screen Toggle */}
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-header-icon transition-all duration-200 rounded-full hover:bg-header-icon-hover"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>

          <button className="relative p-2 text-header-icon transition-colors hover:bg-header-icon-hover rounded-full">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
              1
            </span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
            >
              <img
                className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="User avatar"
              />
              <svg 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className={`text-header-icon transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card-bg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100] animate-in fade-in zoom-in-95 duration-200 py-2 border border-border-theme">
                <button className="flex w-full items-center px-4 py-2.5 text-sm text-text-main hover:bg-content-bg transition-colors">
                  <QrCode className="mr-3 h-4 w-4 text-text-muted" />
                  <span className="font-medium">QR Code</span>
                </button>
                <button className="flex w-full items-center px-4 py-2.5 text-sm text-text-main hover:bg-content-bg transition-colors bg-content-bg/50">
                  <User className="mr-3 h-4 w-4 text-text-muted" />
                  <span className="font-medium">Edit profile Picture</span>
                </button>
                <button className="flex w-full items-center px-4 py-2.5 text-sm text-text-main hover:bg-content-bg transition-colors">
                  <ImageIcon className="mr-3 h-4 w-4 text-text-muted" />
                  <span className="font-medium">Edit Marchant Logo</span>
                </button>
                
                <div className="my-1 border-t border-gray-100"></div>
                
                <button 
                  onClick={() => {
                    navigate('/settings/password');
                    setIsDropdownOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-text-main hover:bg-content-bg transition-colors"
                >
                  <Lock className="mr-3 h-4 w-4 text-text-muted" />
                  <span className="font-medium">Change Password</span>
                </button>
                <button 
                  disabled={!isDropdownOpen}
                  onClick={async () => {
                    const refreshToken = getRefreshToken();
                    try {
                      if (refreshToken) {
                        await authService.signOut({ RefreshToken: refreshToken });
                      }
                    } catch (error) {
                      console.error('Sign-out error:', error);
                    } finally {
                      clearTokens();
                      dispatch(logout());
                      setIsDropdownOpen(false);
                      navigate(ROUTES.LOGIN);
                    }
                  }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-500" />
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <CompanySwitchModal
      isOpen={isCompanySwitchOpen}
      onClose={() => setIsCompanySwitchOpen(false)}
    />
    </>
  );
}
