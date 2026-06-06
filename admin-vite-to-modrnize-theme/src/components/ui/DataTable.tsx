import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './Table';
import { Input } from './Input';
import { Loader } from './Loader';
import { useDebounce } from '@/hooks/useDebounce';
import { apiService } from '@/lib/api.service';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ChevronUp, ChevronDown, ChevronsUpDown, RotateCw, X, Search as SearchIcon, Filter, Edit2, Trash2, History } from 'lucide-react';

export interface Column {
  header: string;
  accessor: string;
  searchFieldName?: string; // For backend search mapping (e.g., RoleName instead of security_rule_name)
  render?: (value: any, row: any) => React.ReactNode;
  searchable?: boolean;
  sortable?: boolean;
  searchType?: 'text' | 'select';
  searchOptions?: { value: string | number; label: string }[];
  className?: string;
  visible?: boolean;
}

interface DataTableProps {
  columns: Column[];
  module?: string;
  path?: string;
  fetchDataFn?: (params: any) => Promise<any>;
  initialParams?: Record<string, any>;
  onDataFetched?: (data: any) => void;
  emptyMessage?: string;
  pageSize?: number;
  renderActions?: () => React.ReactNode;
  refreshKey?: number | string;
  showExport?: boolean;
  searchPlaceholder?: string;
  striped?: boolean;
  defaultSortField?: string;
  defaultSortOrder?: 'ASC' | 'DESC';
}

export function DataTable({ 
  columns, 
  module = "", 
  path = "", 
  fetchDataFn,
  initialParams = {}, 
  onDataFetched,
  emptyMessage = "No data found.",
  pageSize = 10,
  renderActions,
  refreshKey = 0,
  showExport = false,
  searchPlaceholder = "Search...",
  striped = false,
  defaultSortField,
  defaultSortOrder = 'ASC'
}: DataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search states
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [mobileSearchTarget, setMobileSearchTarget] = useState<string>("all");
  const [mobileSearchValue, setMobileSearchValue] = useState<string>("");
  
  const debouncedSearchValues = useDebounce(searchValues, 500);
  const debouncedMobileSearchValue = useDebounce(mobileSearchValue, 500);

  // Sorting states
  const [sortField, setSortField] = useState<string | null>(defaultSortField || null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | null>(defaultSortField ? defaultSortOrder : null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);

  // Stabilize onDataFetched with a ref to prevent dependency loops
  const onDataFetchedRef = React.useRef(onDataFetched);
  useEffect(() => {
    onDataFetchedRef.current = onDataFetched;
  }, [onDataFetched]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Keep original offset calculation as per user's preference
      const offset = page - 1;
      
      // Identify searchable columns and their names
      const searchableCols = columns.filter(col => col.searchable);
      
      // Construct SearchBy: "Field1$Field2$Field3" (No trailing $)
      const searchByStr = searchableCols
        .map(col => col.searchFieldName || col.accessor)
        .join('$');
      
      let searchStr = "";
      
      // Integrate mobile search if active, otherwise use desktop search
      if (debouncedMobileSearchValue) {
        searchStr = searchableCols
          .map(col => {
            if (mobileSearchTarget === "all" || mobileSearchTarget === col.accessor) {
              return debouncedMobileSearchValue;
            }
            return "";
          })
          .join('$');
      } else {
        // Construct Positional Search string: "Val1$Val2$Val3"
        searchStr = searchableCols
          .map(col => debouncedSearchValues[col.accessor] || "")
          .join('$');
      }

      const params: any = {
        ...initialParams,
        ServerPagination: true,
        Limit: internalPageSize,
        Offset: offset,
        Search: searchStr,
        SearchBy: searchByStr,
        SearchType: "",
        Sort: sortField || "",
        Order: sortOrder?.toLowerCase() || "asc",
        menuid: initialParams.menuid || 0,
        ApprovalFilterData: initialParams.ApprovalFilterData || "",
        SortName: "",
        SortOrder: "",
        Parameters: initialParams.Parameters || [],
      };

      let response;
      if (fetchDataFn) {
        response = await fetchDataFn(params);
      } else if (path) {
        response = await apiService.get<any>(module, path, { params });
      } else {
        setLoading(false);
        return;
      }
      
      if (response && (response.status_code === 200 || response.response_code === 'OK' || response.response_code === 'Success')) {
        // Handle different data structures
        const result = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.rows || response.data?.list || response.data?.items || response.data?.Data || []);
        
        setData(result);
        setTotalCount(response.data?.total || response.data?.totalCount || response.data?.TotalRows || result.length || 0);
        
        if (onDataFetchedRef.current) onDataFetchedRef.current(response.data);
      } else {
        setError(response?.message || "Failed to fetch data");
      }
    } catch (err: any) {
      console.error("DataTable fetch error:", err);
      setError(err?.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [module, path, fetchDataFn, JSON.stringify(debouncedSearchValues), debouncedMobileSearchValue, mobileSearchTarget, page, sortField, sortOrder, JSON.stringify(initialParams), internalPageSize, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / internalPageSize) || 1;

  const handleSearchChange = (accessor: string, value: string) => {
    setSearchValues(prev => ({
      ...prev,
      [accessor]: value
    }));
    setMobileSearchValue(""); // Clear mobile search if desktop search used
    setPage(1);
  };

  const handleMobileSearchChange = (value: string) => {
    setMobileSearchValue(value);
    setSearchValues({}); // Clear desktop search if mobile search used
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setInternalPageSize(newSize);
    setPage(1);
  };

  const handleSort = (column: Column) => {
    if (!column.sortable) return;

    if (sortField === column.accessor) {
      if (sortOrder === 'ASC') setSortOrder('DESC');
      else if (sortOrder === 'DESC') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(column.accessor);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const renderSortIcon = (column: Column) => {
    if (!column.sortable) return null;
    if (sortField !== column.accessor) return <ChevronsUpDown className="ml-2 h-4 w-4 text-text-muted/40" />;
    if (sortOrder === 'ASC') return <ChevronUp className="ml-2 h-4 w-4 text-primary-600" />;
    return <ChevronDown className="ml-2 h-4 w-4 text-primary-600" />;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Header (Mobile Only) */}
      <div className="flex md:hidden flex-col gap-2 bg-card-bg p-3 rounded-xl border border-border-theme shadow-sm">
        <div className="flex items-center gap-2 bg-content-bg rounded-lg px-3 py-1.5 border border-border-theme">
          <SearchIcon className="h-4 w-4 text-text-muted" />
          <select 
            value={mobileSearchTarget}
            onChange={(e) => setMobileSearchTarget(e.target.value)}
            className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-transparent outline-none border-r border-border-theme pr-2 mr-2 cursor-pointer"
          >
            <option value="all">All Fields</option>
            {columns.filter(c => c.searchable).map(col => (
              <option key={col.accessor} value={col.accessor}>{col.header}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={mobileSearchValue}
            onChange={(e) => handleMobileSearchChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs font-medium placeholder:text-text-muted/50 text-text-main"
          />
          {mobileSearchValue && (
            <button onClick={() => handleMobileSearchChange("")}>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Toolbar */}
      <div className="flex items-center justify-between bg-card-bg px-3 py-1.5 rounded-xl border border-border-theme shadow-sm">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchData()}
            disabled={loading}
            title="Reload Grid"
            className="h-7 w-7 p-0 rounded-lg text-text-muted hover:text-primary-600 hover:bg-primary-50 transition-all border border-border-theme"
          >
            <RotateCw className={cn("h-3 w-3", loading && "animate-spin")} />
          </Button>
          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Grid toolbar</span>
        </div>
        
        <div className="flex items-center gap-3">
          {showExport && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[9px] font-black uppercase tracking-widest gap-2 bg-card-bg border-border-theme hover:bg-content-bg hidden sm:flex text-text-main"
            >
              <ChevronDown className="h-3 w-3" />
              Export
            </Button>
          )}
          {renderActions && renderActions()}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border-theme bg-card-bg shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[800px] relative border-collapse">
            <TableHeader className="sticky top-0 bg-card-bg z-10 shadow-sm">
              <TableRow className="bg-content-bg border-b-2 border-border-theme h-10">
                {columns.filter(c => c.visible !== false).map((col) => (
                  <TableHead 
                    key={col.accessor} 
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest text-text-main py-2 px-3",
                      col.sortable && "cursor-pointer select-none hover:bg-content-bg transition-colors"
                    )}
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {renderSortIcon(col)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
              
              <TableRow className="bg-card-bg border-b border-border-theme">
                {columns.filter(c => c.visible !== false).map((col) => (
                  <TableHead key={`search-${col.accessor}`} className="py-1.5 px-3 h-auto">
                    {col.searchable ? (
                      <div className="relative">
                        {col.searchType === 'select' ? (
                          <select
                            value={searchValues[col.accessor] || ''}
                            onChange={(e) => handleSearchChange(col.accessor, e.target.value)}
                            className="h-6 w-full text-[9px] font-bold bg-content-bg/50 border border-border-theme rounded-md focus:ring-primary-500/20 focus:border-primary-500 focus:bg-card-bg transition-all px-1 outline-none cursor-pointer text-text-main"
                          >
                            <option value="">All</option>
                            {col.searchOptions?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchValues[col.accessor] || ''}
                                onChange={(e) => handleSearchChange(col.accessor, e.target.value)}
                                className={cn(
                                  "h-6 text-[9px] bg-content-bg/50 border-border-theme focus:ring-primary-500/20 focus:border-primary-500 focus:bg-card-bg transition-all pl-2 text-text-main",
                                  searchValues[col.accessor] ? "pr-6" : ""
                                )}
                            />
                            {searchValues[col.accessor] && (
                              <button
                                type="button"
                                onClick={() => handleSearchChange(col.accessor, '')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-muted hover:text-text-main hover:bg-content-bg transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(c => c.visible !== false).length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader className="h-6 w-6 text-primary-600" />
                      <span className="text-[9px] text-text-muted font-bold font-mono tracking-widest uppercase animate-pulse">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(c => c.visible !== false).length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-red-500">
                      <span className="text-[9px] font-bold uppercase tracking-widest border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg">
                        Error: {error}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(c => c.visible !== false).length} className="h-32 text-center text-text-muted/60 font-medium italic text-[11px]">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow 
                    key={row.id || row.security_rule_id || index} 
                    className={cn(
                      "hover:bg-content-bg/50 transition-colors border-b border-border-theme last:border-b-0 text-text-main",
                      striped && index % 2 === 1 && "bg-content-bg/30"
                    )}
                  >
                    {columns.filter(c => c.visible !== false).map((col) => (
                      <TableCell key={`${index}-${col.accessor}`} className={cn("px-3 py-1.5 text-[11px] font-medium text-text-main", col.className)}>
                        {col.render 
                          ? col.render(row[col.accessor], row) 
                          : row[col.accessor]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden flex flex-col gap-4">
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center bg-card-bg rounded-xl border border-border-theme shadow-sm gap-3">
            <Loader className="h-6 w-6 text-primary-600" />
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest animate-pulse">Loading...</span>
          </div>
        ) : error ? (
          <div className="h-32 flex items-center justify-center bg-red-50 rounded-xl border border-red-100 p-4">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">Error: {error}</span>
          </div>
        ) : data.length === 0 ? (
          <div className="h-32 flex items-center justify-center bg-card-bg rounded-xl border border-border-theme shadow-sm italic text-text-muted text-sm">
            {emptyMessage}
          </div>
        ) : (
          data.map((row, index) => (
            <div key={row.id || row.security_rule_id || index} className="bg-card-bg rounded-2xl border border-border-theme shadow-lg shadow-black/5 overflow-hidden flex flex-col transition-all active:scale-[0.98]">
              {/* Card Header */}
              <div className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 uppercase">
                  {(columns.find(c => c.visible !== false)?.accessor && row[columns.find(c => c.visible !== false)!.accessor]?.toString().charAt(0)) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-black text-primary-600 truncate leading-tight">
                      {row[columns.find(c => c.visible !== false)?.accessor || ''] || 'N/A'}
                    </h3>
                    <div className="shrink-0">
                      <span className="text-[9px] font-bold text-text-muted bg-content-bg px-2 py-0.5 rounded-full border border-border-theme uppercase">
                        #{row.id || row.security_rule_id || row.group_id || row.ThanaID || row.DistrictID || index + 1}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-text-muted mt-0.5 flex items-center gap-1">
                    <Filter className="h-2.5 w-2.5" />
                    {columns[1]?.header || 'Detail'}: {row[columns[1]?.accessor] || '-'}
                  </p>
                </div>
              </div>

              {/* Card Body Grid */}
              <div className="px-4 py-3 bg-content-bg/50 grid grid-cols-2 gap-y-3 gap-x-4 border-y border-border-theme/50 text-text-main">
                {columns.filter(c => c.visible !== false).slice(2).map((col) => {
                  if (col.header === 'Actions' || col.accessor === 'actions') return null;
                  return (
                    <div key={col.accessor} className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{col.header}</span>
                      <div className="text-[10px] font-bold text-text-main truncate">
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Footer */}
              {columns.find(c => c.header === 'Actions' || c.accessor === 'actions') && (
                <div className="px-4 py-2 flex items-center justify-end gap-2 bg-card-bg">
                  {columns.find(c => c.header === 'Actions' || c.accessor === 'actions')?.render?.(null, row)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 bg-card-bg md:bg-transparent rounded-xl border md:border-0 border-border-theme shadow-sm md:shadow-none">
          <div className="flex items-center gap-3">
            <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Showing <span className="text-primary-600">{data.length}</span> of <span className="text-primary-600">{totalCount}</span> entries
            </div>
            
            <div className="flex items-center gap-2 border-l border-border-theme pl-3 hidden sm:flex">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Limit</span>
              <select 
                value={internalPageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-content-bg border border-border-theme text-text-main text-[9px] font-black rounded-md focus:ring-primary-500 focus:border-primary-500 block p-0.5 px-1 outline-none cursor-pointer transition-all hover:bg-card-bg"
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 sm:h-7 px-4 sm:px-3 text-[9px] font-black uppercase tracking-tighter shadow-sm"
            >
              Prev
            </Button>
            
            <div className="flex items-center gap-1 px-3 min-w-[70px] justify-center">
              <span className="text-[10px] font-black text-primary-600">{page}</span>
              <span className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest mx-0.5">/</span>
              <span className="text-[10px] font-black text-text-main">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 sm:h-7 px-4 sm:px-3 text-[9px] font-black uppercase tracking-tighter shadow-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
