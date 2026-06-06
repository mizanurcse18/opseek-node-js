import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Trash2, 
  Activity, 
  Layers, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileJson,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { securityService } from '@/lib/auth/api/security.service';
import { cn } from '@/lib/utils';
import { useMenuTitle } from '@/hooks/useMenuTitle';

interface CacheSummary {
  EntityType: string;
  IsLoaded: boolean;
  ItemCount: number;
  Statistics: {
    Hits: number;
    Misses: number;
    CurrentItems: number;
    Evictions: number;
    HitRatio: number;
  };
  Diagnostics: {
    EntityType: string;
    CacheServiceType: string;
    IsRedisCache: boolean;
    IsInMemoryCache: boolean;
    IsHybridCache: boolean;
  };
}

interface CacheItem {
  Id: string;
  CacheKey: string;
  InCache: boolean;
  Data: any;
}

export default function CacheManagement({ isSuperUser = false }: { isSuperUser?: boolean }) {
  const { pageTitle } = useMenuTitle();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [summaries, setSummaries] = useState<CacheSummary[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [displayProperty, setDisplayProperty] = useState<string>('');
  const [cacheList, setCacheList] = useState<CacheItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CacheItem | null>(null);

  const fetchSummary = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await securityService.getCacheSummary();
      if (response?.data) {
        setSummaries(response.data);
        if (response.data.length > 0 && !selectedEntity) {
          setSelectedEntity(response.data[0].EntityType);
        }
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchList = async (entity: string) => {
    if (!entity) return;
    setLoadingList(true);
    try {
      const response = await securityService.getCacheList(entity);
      // Backend might return data property or direct array depending on implementation
      const listData = response?.data || (Array.isArray(response) ? response : []);
      setCacheList(listData);
    } catch (error) {
      toast(handleApiError(error));
      setCacheList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleReloadCache = async (entity: string) => {
    setIsReloading(true);
    try {
      await securityService.reloadCache(entity);
      toast({ title: 'Success', description: `${entity} cache reloaded from database`, status: 'success' });
      await fetchSummary(false);
      fetchList(entity);
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsReloading(false);
    }
  };

  const handleClearCache = async (entity: string) => {
    if (!window.confirm(`Are you sure you want to wipe all cache for ${entity}?`)) return;
    try {
      await securityService.clearCache(entity);
      toast({ title: 'Success', description: `${entity} cache wiped`, status: 'success' });
      await fetchSummary(false);
      fetchList(entity);
    } catch (error) {
      toast(handleApiError(error));
    }
  };

  const handleEvictItem = async (entity: string, id: string) => {
    try {
      await securityService.evictCacheItem(entity, id);
      toast({ title: 'Success', description: 'Item evicted from cache', status: 'success' });
      fetchList(entity);
    } catch (error) {
      toast(handleApiError(error));
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      fetchList(selectedEntity);
      setSelectedItem(null);
      setSearchQuery('');
    }
  }, [selectedEntity]);

  const filteredList = cacheList.filter(item => 
    item.CacheKey?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.Id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSummary = summaries.find(s => s.EntityType === selectedEntity);

  const availableProperties = React.useMemo(() => {
    if (cacheList.length > 0 && cacheList[0].Data) {
      return Object.keys(cacheList[0].Data).filter(key => 
        typeof cacheList[0].Data[key] !== 'object' && key !== 'ObjectState'
      );
    }
    return [];
  }, [cacheList]);

  useEffect(() => {
    if (availableProperties.length > 0 && !displayProperty) {
      const bestDefault = availableProperties.find(p => 
        ['UserName', 'Title', 'Name', 'Description', 'CompanyID'].includes(p)
      ) || availableProperties[0];
      setDisplayProperty(bestDefault);
    }
  }, [availableProperties]);

  if (loading) return <Loader variant="page" />;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50/30">
      {/* Sidebar: Entity List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
               <Database className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Cache Nodes</h2>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Security & Master Nodes</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => fetchSummary(true)}
            className="w-full h-10 border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2 text-indigo-600" />
            Refresh Global Stats
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {summaries.map((s) => (
            <button
              key={s.EntityType}
              onClick={() => setSelectedEntity(s.EntityType)}
              className={cn(
                "w-full group flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                selectedEntity === s.EntityType 
                  ? "bg-indigo-50 border border-indigo-100 shadow-sm" 
                  : "hover:bg-slate-100/50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                  selectedEntity === s.EntityType ? "bg-indigo-600 text-white scale-110 shadow-md" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm"
                )}>
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className={cn(
                    "text-xs font-black uppercase tracking-wide",
                    selectedEntity === s.EntityType ? "text-indigo-900" : "text-slate-600"
                  )}>
                    {s.EntityType}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{s.ItemCount} Records</span>
                </div>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                selectedEntity === s.EntityType ? "text-indigo-600 translate-x-1" : "text-slate-300 group-hover:text-slate-400"
              )} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black uppercase tracking-widest text-slate-900">{selectedEntity} Management</h1>
            {selectedSummary && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 animate-in zoom-in-50 duration-500">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{selectedSummary.Diagnostics.IsRedisCache ? 'Redis Cluster Active' : 'Memory Sync Active'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             {availableProperties.length > 0 && (
               <div className="flex items-center gap-2 mr-2">
                 <span className="text-[9px] font-black uppercase text-slate-400">View</span>
                 <select 
                    value={displayProperty}
                    onChange={(e) => setDisplayProperty(e.target.value)}
                    className="h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1em_1em] bg-[right_0.5rem_center] bg-no-repeat"
                 >
                   {availableProperties.map(p => (
                     <option key={p} value={p}>{p}</option>
                   ))}
                 </select>
               </div>
             )}
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder="Filter keys or IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-80 rounded-xl border-slate-200 focus:ring-indigo-500/10 text-xs font-medium bg-slate-50 focus:bg-white transition-all"
                />
             </div>
             <Button 
               variant="outline"
               onClick={() => handleReloadCache(selectedEntity)}
               disabled={isReloading}
               className="h-10 px-5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm"
             >
               <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isReloading && "animate-spin")} />
               Reload Data
             </Button>
             <Button 
               variant="ghost"
               onClick={() => handleClearCache(selectedEntity)}
               className="h-10 px-5 text-rose-600 hover:bg-rose-50 rounded-xl font-black uppercase tracking-widest text-[10px]"
             >
               <Trash2 className="h-3.5 w-3.5 mr-2" />
               Wipe All
             </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Data Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
             <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                {loadingList ? (
                  <div className="p-32 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                       <Database className="h-12 w-12 text-indigo-100" />
                       <RefreshCw className="h-6 w-6 text-indigo-500 absolute -bottom-1 -right-1 animate-spin" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Node memory...</span>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="p-32 text-center">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-sm font-black uppercase text-slate-900 mb-1">Zero Results Detected</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching cached records found for {selectedEntity}</p>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleReloadCache(selectedEntity)}
                      className="mt-6 text-indigo-600 hover:bg-indigo-50"
                    >
                      Attempt Node Reload
                    </Button>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">Cache Key / Identifier</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredList.map((item) => (
                        <tr 
                          key={item.Id} 
                          className={cn(
                            "group transition-all duration-300",
                            selectedItem?.Id === item.Id ? "bg-indigo-50/50" : "hover:bg-slate-50/30"
                          )}
                        >
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                <ListIcon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">{item.CacheKey}</span>
                                  {displayProperty && item.Data?.[displayProperty] !== undefined && (
                                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-md shadow-sm animate-in fade-in zoom-in duration-300">
                                      {String(item.Data[displayProperty])}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">ID: {item.Id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                             {item.InCache ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Live in Cache
                                </div>
                             ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase">
                                  <AlertCircle className="h-3 w-3" />
                                  Pending Sync
                                </div>
                             )}
                          </td>
                          <td className="px-8 py-4">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedItem(item)}
                                  className={cn(
                                    "h-8 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                                    selectedItem?.Id === item.Id ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-indigo-600 hover:bg-indigo-50"
                                  )}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  Inspect
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEvictItem(selectedEntity, item.Id)}
                                  className="h-8 px-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
          </div>

          {/* Right Panel: Data Inspector & Stats */}
          <div className="w-[480px] border-l border-slate-200 bg-white flex flex-col shrink-0">
             <div className="p-8 border-b border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                      <Activity className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Node Metrics</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Category Analytics</p>
                    </div>
                  </div>
                </div>

                {selectedSummary ? (
                   <div className="grid grid-cols-2 gap-3">
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                         <Zap className="h-12 w-12 text-emerald-500 absolute -right-3 -bottom-3 opacity-10 group-hover:scale-125 transition-transform" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hit Ratio</span>
                         <span className="text-2xl font-black text-slate-900">{Math.round(selectedSummary.Statistics.HitRatio * 100)}%</span>
                      </div>
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                         <LayoutGrid className="h-12 w-12 text-indigo-500 absolute -right-3 -bottom-3 opacity-10 group-hover:scale-125 transition-transform" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Active Node Items</span>
                         <span className="text-2xl font-black text-slate-900">{selectedSummary.ItemCount}</span>
                      </div>
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                         <RefreshCw className="h-12 w-12 text-amber-500 absolute -right-3 -bottom-3 opacity-10 group-hover:rotate-45 transition-transform" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Miss Rate</span>
                         <span className="text-2xl font-black text-slate-900">{selectedSummary.Statistics.Misses}</span>
                      </div>
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                         <Trash2 className="h-12 w-12 text-rose-500 absolute -right-3 -bottom-3 opacity-10 group-hover:scale-125 transition-transform" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Auto Evictions</span>
                         <span className="text-2xl font-black text-slate-900">{selectedSummary.Statistics.Evictions}</span>
                      </div>
                   </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Select a node to view metrics</p>
                  </div>
                )}
             </div>

             <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-3">
                     <FileJson className="h-4 w-4 text-slate-400" />
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live Memory Inspector</h4>
                   </div>
                   {selectedItem && (
                     <Button 
                       variant="ghost" 
                       onClick={() => setSelectedItem(null)}
                       className="h-6 text-[9px] font-black uppercase text-slate-400 hover:text-rose-600"
                     >
                       Clear
                     </Button>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                   {selectedItem ? (
                     <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                           <div className="flex items-center gap-2 mb-2">
                             <HardDrive className="h-3 w-3 text-indigo-500" />
                             <span className="text-[9px] font-black text-slate-400 uppercase">Active Key Hash</span>
                           </div>
                           <span className="text-xs font-bold text-slate-900 break-all font-mono">{selectedItem.CacheKey}</span>
                        </div>

                        <div className="relative group">
                           <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                           <div className="relative bg-slate-900 p-6 rounded-2xl overflow-hidden shadow-2xl">
                              <pre className="text-[11px] text-indigo-300 font-mono leading-relaxed overflow-x-auto custom-scrollbar">
                                {JSON.stringify(selectedItem.Data, null, 2)}
                              </pre>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40">
                        <div className="p-8 bg-white rounded-full shadow-inner">
                           <FileJson className="h-12 w-12" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[200px]">
                          Select a record to inspect live memory
                        </p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
