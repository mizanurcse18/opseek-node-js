import React, { useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Loader,
  Circle,
  ChevronLeft,
  Search,
  ChevronFirst
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean; // Mobile toggle
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean; // Desktop collapse
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  id: number;
  name: string;
  path?: string;
  icon: any;
  submenu?: NavItem[];
  isCollapse?: boolean;
  heading?: string;
  disabled?: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { permissions, isPermissionsLoaded } = useSelector((state: RootState) => state.auth);
  const [navItems, setNavItems] = React.useState<NavItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isHovered, setIsHovered] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const location = useLocation();
  const { pathname } = location;

  const isExpanded = isOpen || !isCollapsed || isHovered;

  const handleMouseEnter = () => {
    if (isCollapsed) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  };

  // Build NavItems Tree from Redux Permissions
  React.useEffect(() => {
    if (!isPermissionsLoaded || !permissions) return;

    const buildTree = () => {
      const flatData = [...permissions];
      const itemMap = new Map<number, any>();
      const roots: NavItem[] = [];

      flatData.sort((a: any, b: any) => (a.SequenceNo || 0) - (b.SequenceNo || 0));

      flatData.forEach((item: any) => {
        const IconComp = (Icons as any)[item.Icon] || Circle;
        itemMap.set(item.MenuID, {
          id: item.MenuID,
          name: item.Title,
          path: item.Url || '',
          icon: IconComp,
          isCollapse: item.Type === 'collapse',
          submenu: [],
          ParentID: item.ParentID,
          heading: item.Heading,
          disabled: !!item.IsDisabled
        });
      });

      flatData.forEach((item: any) => {
        const node = itemMap.get(item.MenuID);
        if (item.ParentID === 0) {
          roots.push(node);
        } else {
          const parent = itemMap.get(item.ParentID);
          if (parent) {
            parent.submenu.push(node);
          }
        }
      });

      const transformTree = (items: any[]): NavItem[] => {
        return items.map(item => ({
          ...item,
          submenu: (item.submenu && item.submenu.length > 0) ? transformTree(item.submenu) : undefined
        }));
      };

      setNavItems(transformTree(roots));
      setLoading(false);
    };

    buildTree();
  }, [permissions, isPermissionsLoaded]);
  
  // Keyboard Shortcut Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Items based on Search Term
  const filteredNavItems = useMemo(() => {
    if (!searchTerm) return navItems;

    const filterTree = (items: NavItem[]): NavItem[] => {
      return items
        .map((item): NavItem | null => {
          const subResults = item.submenu ? filterTree(item.submenu) : [];
          const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (matchesSearch || subResults.length > 0) {
            return {
              ...item,
              submenu: subResults.length > 0 ? subResults : undefined
            };
          }
          return null;
        })
        .filter((item): item is NavItem => item !== null);
    };

    return filterTree(navItems);
  }, [navItems, searchTerm]);

  // Collect all registered paths in the sidebar recursively
  const sidebarPaths = useMemo(() => {
    const paths = new Set<string>();
    const collect = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.path) paths.add(item.path);
        if (item.submenu) collect(item.submenu);
      });
    };
    collect(navItems);
    return paths;
  }, [navItems]);

  const matchPath = useCallback(
    (path: string): boolean => {
      if (!path) return false;
      if (path === pathname) return true;
      if (sidebarPaths.has(pathname)) return false;
      return pathname.startsWith(path + '/');
    },
    [pathname, sidebarPaths]
  );

  // Exact Metronic ClassNames from UI Demo1
  const classNames: AccordionMenuClassNames = {
    root: 'lg:ps-1 space-y-0.5',
    group: 'gap-px',
    label: 'uppercase text-[10px] font-black text-sidebar-text-muted pt-6 pb-2 px-6 tracking-[0.12em]',
    separator: '',
    item: 'h-10 hover:bg-sidebar-hover-bg text-sidebar-text-main hover:text-sidebar-hover-text data-[selected=true]:bg-sidebar-active-bg data-[selected=true]:text-sidebar-active-text data-[selected=true]:font-bold rounded-lg mx-2 transition-all duration-200',
    sub: '',
    subTrigger: 'h-10 hover:bg-sidebar-hover-bg text-sidebar-text-main hover:text-sidebar-hover-text data-[selected=true]:bg-sidebar-active-bg data-[selected=true]:text-sidebar-active-text data-[selected=true]:font-bold rounded-lg mx-2 transition-all duration-200',
    subContent: 'py-0',
    indicator: 'text-sidebar-text-muted/90',
  };

  const buildMenu = (items: NavItem[], level = 0): React.JSX.Element[] => {
    return items.map((item) => {
      const isSubLevel = level > 0;
      
      return (
        <React.Fragment key={item.id}>
           {item.heading && level === 0 && (
            <AccordionMenuLabel>{item.heading}</AccordionMenuLabel>
          )}

          {item.submenu && item.submenu.length > 0 ? (
            <AccordionMenuSub key={item.id} value={item.name}>
              <AccordionMenuSubTrigger className={cn(
                "px-4",
                isSubLevel && "ps-12"
              )}>
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <item.icon data-slot="accordion-menu-icon" className="w-[18px] h-[18px] opacity-70" />
                  )}
                  <span data-slot="accordion-menu-title" className={cn(
                    "truncate",
                    isSubLevel ? "text-[13px] font-medium" : "text-sm font-semibold"
                  )}>{item.name}</span>
                </div>
              </AccordionMenuSubTrigger>
              <AccordionMenuSubContent
                type="single"
                collapsible
                parentValue={item.name}
                className={cn("relative")}
              >
                <AccordionMenuGroup>
                  {buildMenu(item.submenu, level + 1)}
                </AccordionMenuGroup>
              </AccordionMenuSubContent>
            </AccordionMenuSub>
          ) : (
            <AccordionMenuItem
              key={item.id}
              value={item.path || ''}
              className={cn(
                "px-4",
                isSubLevel && "ps-10"
              )}
            >
              <Link 
                to={item.path || '#'} 
                className="flex items-center justify-between grow gap-2"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-3 truncate">
                  {item.icon && (
                    <item.icon data-slot="accordion-menu-icon" className="w-[18px] h-[18px] opacity-70" />
                  )}
                  <span data-slot="accordion-menu-title" className={cn(
                    "truncate",
                    isSubLevel ? "text-[13px] font-medium" : "text-sm font-semibold"
                  )}>{item.name}</span>
                </div>
                {item.disabled && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 h-4 uppercase font-bold tracking-tighter opacity-60">Soon</Badge>
                )}
              </Link>
            </AccordionMenuItem>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'sidebar fixed inset-y-0 left-0 z-[50] transform bg-sidebar-bg lg:border-r lg:border-border-theme transition-all duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0',
          isExpanded ? 'w-[280px]' : 'w-[80px] sidebar-collapsed'
        )}
      >
        {/* Sidebar Header - Exactly like UI project */}
        <div className="sidebar-header flex items-center relative justify-between px-6 shrink-0 h-[72px] z-[60]">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            {isExpanded ? (
              <img 
                src="/assets/images/logo/logo.svg" 
                alt="Logo" 
                className="h-8 w-auto object-contain transition-all duration-300 animate-in fade-in"
              />
            ) : (
              <img 
                src="/assets/images/logo/logo.svg" 
                alt="Logo" 
                className="h-8 w-8 object-cover object-left rounded-lg transition-all duration-300 animate-in fade-in"
              />
            )}
          </Link>
          

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-sidebar-text-muted hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className={cn(
          "px-5 py-2 transition-all duration-300",
          !isExpanded ? "opacity-0 invisible h-0 py-0" : "opacity-100 visible h-auto"
        )}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-text-main/50 group-focus-within:text-sidebar-text-main transition-colors" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search menus..." 
              className={cn(
                "w-full rounded-xl py-2.5 pl-9 pr-14 text-[12px] font-medium outline-none transition-all shadow-sm border",
                "bg-sidebar-text-main/5 border-sidebar-text-main/10 text-sidebar-text-main placeholder:text-sidebar-text-main/40",
                "focus:bg-sidebar-text-main/[0.08] focus:border-sidebar-text-main/20 focus:ring-4 focus:ring-sidebar-text-main/5"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1 pr-1">
              <kbd className="px-1.5 py-0.5 rounded-md border border-sidebar-text-main/20 bg-sidebar-text-main/10 text-[8px] font-black text-sidebar-text-main shadow-sm uppercase tracking-tighter backdrop-blur-sm">
                Ctrl
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded-md border border-sidebar-text-main/20 bg-sidebar-text-main/10 text-[8px] font-black text-sidebar-text-main shadow-sm uppercase tracking-tighter backdrop-blur-sm">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto no-scrollbar pb-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="h-5 w-5 animate-spin text-primary" />
                    </div>
                ) : (
                    <AccordionMenu
                        selectedValue={pathname}
                        matchPath={matchPath}
                        type="single"
                        collapsible
                        classNames={classNames}
                    >
                    {buildMenu(filteredNavItems)}
                    </AccordionMenu>
                )}
            </div>
        </div>
        
        {/* Collapse Toggle Button (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex absolute -right-3.5 top-[34px] z-[100] h-7 w-7 items-center justify-center rounded-full border border-border-theme bg-card-bg text-primary-600 shadow-lg transition-all hover:scale-110 active:scale-90",
            isCollapsed && "rotate-180"
          )}
        >
          <ChevronFirst className="h-4 w-4" />
        </button>
      </aside>
    </>
  );
}
