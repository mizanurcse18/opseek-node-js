import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader, Check, Copy, X, Globe, Layers, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, Option } from '@/components/ui-old/Select';
import { securityService } from '@/lib/auth/api/security.service';
import { cn } from '@/lib/utils';

interface ImportApiPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (paths: any[]) => void;
  currentCompanyId?: string | number;
  currentMenuType?: string;
}

export const ImportApiPathModal: React.FC<ImportApiPathModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentCompanyId,
  currentMenuType = 'admin_template'
}) => {
  const [companies, setCompanies] = useState<Option[]>([]);
  const [menuTypeOptions, setMenuTypeOptions] = useState<Option[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>(currentCompanyId || '');
  const [selectedMenuType, setSelectedMenuType] = useState(currentMenuType);
  const [menus, setMenus] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [previewPaths, setPreviewPaths] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [menuPathCounts, setMenuPathCounts] = useState<Record<number, number>>({});

  // Load companies and menu types
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        securityService.getAllCompaniesCombo(),
        securityService.getSystemVariables(1)
      ]).then(([companiesData, typesData]) => {
        if (Array.isArray(companiesData)) {
          setCompanies(companiesData.map((c: any) => ({
            value: c.value ?? c.id ?? c.company_id ?? '',
            label: c.label ?? c.name ?? c.company_name ?? 'Unknown'
          })));
        }
        if (Array.isArray(typesData)) {
          setMenuTypeOptions(typesData.map((t: any) => ({
            value: t.value ?? t.code ?? '',
            label: t.label ?? t.name ?? 'Unknown'
          })));
        }
      });
    }
  }, [isOpen]);

  // Load menus when company/type changes
  useEffect(() => {
    if (isOpen && selectedCompanyId && selectedMenuType) {
      const fetchMenus = async () => {
        setLoadingMenus(true);
        try {
          const response = await securityService.getMenuData(selectedMenuType, String(selectedCompanyId));
          const data = response?.data;
          let flatArray = [];
          
          if (Array.isArray(data)) flatArray = data;
          else if (data?.Data) flatArray = data.Data;
          else if (data?.data) flatArray = data.data;
          
          setMenus(flatArray || []);
          setMenuPathCounts({}); // Clear old counts

          if (Array.isArray(flatArray)) {
            flatArray.forEach(async (menu: any) => {
              try {
                const pathRes = await securityService.getApiPathMap(menu.menu_id);
                const pathList = pathRes?.data || [];
                if (pathList.length > 0) {
                  setMenuPathCounts(prev => ({
                    ...prev,
                    [menu.menu_id]: pathList.length
                  }));
                }
              } catch (e) {
                console.error(`Failed to fetch path count for menu ${menu.menu_id}`, e);
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch menus for import:', error);
        } finally {
          setLoadingMenus(false);
        }
      };
      fetchMenus();
    }
  }, [isOpen, selectedCompanyId, selectedMenuType]);

  // Load preview paths when menu selection changes
  useEffect(() => {
    if (selectedMenuId) {
      const fetchPaths = async () => {
        setLoadingPaths(true);
        try {
          const response = await securityService.getApiPathMap(selectedMenuId);
          const paths = response?.data || [];
          setPreviewPaths(paths);
          // Auto select all paths by default when menu is clicked
          setSelectedIndices(new Set(paths.map((_path: any, i: number) => i)));
        } catch (error) {
          console.error('Failed to fetch preview paths:', error);
        } finally {
          setLoadingPaths(false);
        }
      };
      fetchPaths();
    } else {
      setPreviewPaths([]);
      setSelectedIndices(new Set());
    }
  }, [selectedMenuId]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMenus = menus.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllSelected = previewPaths.length > 0 && selectedIndices.size === previewPaths.length;
  const isSomeSelected = selectedIndices.size > 0 && selectedIndices.size < previewPaths.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(previewPaths.map((_, i) => i)));
    }
  };

  const handleTogglePath = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleConfirmImport = () => {
    if (selectedIndices.size > 0) {
      const selectedList = previewPaths.filter((_, idx) => selectedIndices.has(idx));
      // Map to fresh records
      const freshPaths = selectedList.map(p => ({
        ...p,
        mapid: 0,
        map_id: 0,
        row_editor_status: 'insert'
      }));
      onImport(freshPaths);
      onClose();
    }
  };

  if (!document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-api-path-modal-title"
        className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[min(96vw,56rem)] flex flex-col max-h-[min(92vh,820px)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="p-1.5 md:p-2 bg-primary-600 rounded-lg shrink-0">
              <Copy className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="import-api-path-modal-title" className="text-sm md:text-lg font-bold text-slate-900 truncate">
                Import API Path Mapping
              </h2>
              <p className="text-[9px] md:text-xs text-slate-500 font-medium uppercase tracking-wider truncate">
                Select source menu to copy paths from
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 shrink-0">
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-50/30 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 shrink-0">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Source Company
            </label>
            <Select 
              options={companies}
              value={selectedCompanyId}
              onChange={(val) => {
                setSelectedCompanyId(val || '');
                setSelectedMenuId(null);
              }}
              placeholder="Select Company..."
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Menu Type
            </label>
            <Select 
              options={menuTypeOptions.length > 0 ? menuTypeOptions : [
                { value: 'admin_template', label: 'Admin Template' },
                { value: 'user_app', label: 'User App' },
                { value: 'agent_app', label: 'Agent App' },
                { value: 'website', label: 'Website' }
              ]}
              value={selectedMenuType}
              onChange={(val) => {
                setSelectedMenuType(val || 'admin_template');
                setSelectedMenuId(null);
              }}
              placeholder="Select Menu Type..."
              className="h-10"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row">
          {/* Menu Selection (Left) */}
          <div className="w-full lg:w-1/2 lg:min-w-0 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col max-h-[min(38vh,300px)] lg:max-h-none shrink-0 lg:shrink">
            <div className="p-4 border-b border-slate-50">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search menus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-100 outline-none"
                  />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {loadingMenus ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
                    <Loader className="h-6 w-6 text-primary-600 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Fetching Menus...</span>
                 </div>
               ) : filteredMenus.length === 0 ? (
                 <div className="text-center py-20 text-slate-400 italic text-sm">
                    No menus found
                 </div>
               ) : (
                 filteredMenus.map(menu => (
                    <button
                      key={menu.menu_id}
                      onClick={() => setSelectedMenuId(menu.menu_id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                        selectedMenuId === menu.menu_id 
                         ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                         : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className={cn(
                           "p-1.5 rounded-lg shrink-0 relative",
                           selectedMenuId === menu.menu_id ? "bg-white/20" : "bg-slate-100"
                         )}>
                            <Globe className="h-3.5 w-3.5" />
                             {menuPathCounts[menu.menu_id] > 0 && (
                                <div className={cn(
                                   "absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[7px] font-black border shadow-sm transition-all duration-300 animate-in zoom-in-50",
                                   selectedMenuId === menu.menu_id
                                     ? "bg-white text-primary-600 border-primary-600"
                                     : "bg-purple-900 text-white border-white"
                                 )}>
                                   {menuPathCounts[menu.menu_id]}
                                </div>
                             )}
                         </div>
                         <div className="text-left overflow-hidden">
                            <p className="text-xs font-bold truncate">{menu.title}</p>
                            <p className={cn(
                              "text-[10px] font-medium truncate",
                              selectedMenuId === menu.menu_id ? "text-white/70" : "text-slate-400"
                            )}>{menu.url || 'No Path'}</p>
                         </div>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        selectedMenuId === menu.menu_id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                      )} />
                    </button>
                 ))
               )}
            </div>
          </div>

          {/* Path Preview (Right) */}
          <div className="w-full lg:w-1/2 lg:min-w-0 bg-slate-50/50 flex flex-col flex-1 min-h-0">
             {/* Dynamic Sub-header for Select All / Selection Summary */}
             <div className="px-4 py-2.5 md:px-6 md:py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/20 select-none shrink-0">
                <div className="flex items-center gap-2">
                   <button
                     disabled={previewPaths.length === 0}
                     onClick={handleToggleAll}
                     className={cn(
                       "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer outline-none focus:ring-2 focus:ring-primary-100",
                       isAllSelected
                         ? "bg-primary-600 border-primary-600 text-white animate-in zoom-in-50 duration-150"
                         : isSomeSelected
                         ? "bg-primary-600/20 border-primary-600 text-primary-600"
                         : "border-slate-300 hover:border-slate-400 bg-white"
                     )}
                   >
                     {isAllSelected && <Check className="h-3 w-3 stroke-[3]" />}
                     {isSomeSelected && <div className="w-2.5 h-[2px] bg-primary-600 rounded-full" />}
                   </button>
                   <span 
                     onClick={() => previewPaths.length > 0 && handleToggleAll()}
                     className={cn(
                       "text-[10px] font-black uppercase tracking-widest cursor-pointer",
                       previewPaths.length > 0 ? "text-slate-500 hover:text-slate-700" : "text-slate-300"
                     )}
                   >
                      Select All Paths
                   </span>
                </div>
                {previewPaths.length > 0 && (
                   <span className="text-[9px] font-black uppercase bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full tracking-widest animate-in fade-in duration-300">
                      {selectedIndices.size} / {previewPaths.length} Selected
                   </span>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
                {loadingPaths ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-50">
                      <Loader className="h-5 w-5 text-primary-600 animate-spin" />
                      <p className="text-[10px] font-bold uppercase text-slate-400">Loading Paths...</p>
                   </div>
                ) : !selectedMenuId ? (
                   <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-slate-300 opacity-50">
                      <Search className="h-12 w-12 mb-3 stroke-[1.5]" />
                      <p className="text-xs font-bold italic uppercase tracking-wider text-center">Select a menu to see its API paths</p>
                   </div>
                ) : previewPaths.length === 0 ? (
                   <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center">
                      <X className="h-8 w-8 text-red-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">No API paths found for this menu.</p>
                   </div>
                ) : (
                   previewPaths.map((path, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleTogglePath(idx)}
                        className={cn(
                          "bg-white p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer select-none group",
                          selectedIndices.has(idx)
                            ? "border-primary-600/70 shadow-sm bg-primary-50/5 animate-in fade-in duration-200"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                         {/* Card Checkbox */}
                         <button
                           onClick={(e) => {
                             e.stopPropagation(); // Avoid double toggle
                             handleTogglePath(idx);
                           }}
                           className={cn(
                             "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer outline-none",
                             selectedIndices.has(idx)
                               ? "bg-primary-600 border-primary-600 text-white animate-in zoom-in-50 duration-150"
                               : "border-slate-200 group-hover:border-slate-300 bg-white"
                           )}
                         >
                            {selectedIndices.has(idx) && <Check className="h-3 w-3 stroke-[3]" />}
                         </button>

                         <div className={cn(
                           "p-1.5 rounded-lg text-[10px] font-black shrink-0",
                           path.action_type === 'api' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                         )}>
                            {path.action_type?.toUpperCase()}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{path.api_path}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{path.module}.{path.controller}</p>
                         </div>
                         {path.button_title && (
                           <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600 shrink-0">
                              {path.button_title}
                           </div>
                         )}
                      </div>
                   ))
                )}
             </div>

          </div>
        </div>

        <div className="px-4 py-3 md:px-6 md:py-4 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 md:gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} className="h-10 px-6 text-xs font-bold text-slate-400 w-full sm:w-auto">Cancel</Button>
          <Button
            onClick={handleConfirmImport}
            disabled={selectedIndices.size === 0 || loadingPaths}
            className="h-10 px-8 bg-primary-600 hover:bg-primary-700 text-xs font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary-600/20 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
          >
            <Check className="h-4 w-4" />
            Import {selectedIndices.size > 0 ? `${selectedIndices.size} Paths` : 'Paths'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
