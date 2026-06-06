import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { 
  Save, 
  Trash2, 
  Plus, 
  RotateCw, 
  Check, 
  X, 
  AlertCircle,
  Database,
  Layers,
  Search,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Filter,
  Copy,
  SaveAll,
  CheckCheck
} from 'lucide-react';
import { systemVariableService, SystemVariable } from '@/lib/auth/api/system-variable.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/ui/Loader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AlertTriangle } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface SystemVariableTableProps {
  onRefresh?: () => void;
  isSuperUser?: boolean;
}

export default function SystemVariableTable({ onRefresh, isSuperUser = false }: SystemVariableTableProps) {
  const [data, setData] = useState<SystemVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | string | null>(null);
  const [companies, setCompanies] = useState<{ value: string, label: string }[]>([]);
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Row' },
    { button_id: 'btnEdit', button_title: 'Save Change' },
    { button_id: 'btnDelete', button_title: 'Delete Row' },
    { button_id: 'btnCopy', button_title: 'Copy as New Row' },
    { button_id: 'btnBulkSave', button_title: 'Bulk Save' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');
  const btnCopy = buttons.find(b => b.button_id === 'btnCopy');
  const btnBulkSave = buttons.find(b => b.button_id === 'btnBulkSave');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'type_name' | 'name'>('type_name');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<SystemVariable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isBulkSaveDialogOpen, setIsBulkSaveDialogOpen] = useState(false);

  const fetchVariables = async () => {
    setLoading(true);
    try {
      const fetchFn = isSuperUser 
        ? systemVariableService.getSystemVariablesSuper 
        : systemVariableService.getSystemVariables;

      const searchByArr = [];
      const searchArr = [];

      if (searchQuery) {
        searchByArr.push(searchBy);
        searchArr.push(searchQuery);
      }

      if (isSuperUser && selectedCompany) {
        searchByArr.push('company_id');
        searchArr.push(selectedCompany);
      }

      const resp = await fetchFn({
        ServerPagination: true,
        Limit: pageSize,
        Offset: (currentPage - 1) * pageSize,
        Search: searchArr.join('$'),
        SearchBy: searchByArr.join('$'),
        ApprovalFilterData: "Active"
      });
      if (resp?.data?.rows) {
        setData(resp.data.rows);
        setTotalRows(resp.data.TotalRows || resp.data.rows.length);
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariables();

    if (isSuperUser) {
      const loadCompanies = async () => {
        try {
          const rawCompanies = await companyService.getAllCompanies();
          if (rawCompanies && Array.isArray(rawCompanies)) {
            setCompanies(rawCompanies.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id || '?'}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies for SystemVariableTable:', error);
        }
      };
      loadCompanies();
    }
  }, [currentPage, pageSize, isSuperUser]);

  const handleAddRow = () => {
    // Determine a safe temporary ID (0 for first, -1, -2 etc for subsequent new rows)
    const newId = data.some(r => r.id === 0) 
      ? Math.min(0, ...data.map(r => r.id)) - 1 
      : 0;

    const newRow: SystemVariable = {
      id: newId,
      type_id: 0,
      type_name: '',
      code: '',
      name: '',
      numeric_value: 0,
      sequence: 0,
      is_system_generated: false,
      is_inactive: false,
      company_id: '',
      row_editor_status: 'inserted'
    };
    setData([newRow, ...data]);
  };

  const handleCopyRow = (sourceRow: any) => {
    // Generate new unique temp ID for React keys and UI tracking
    const newId = data.some(r => r.id === 0) 
      ? Math.min(0, ...data.map(r => r.id)) - 1 
      : 0;

    // Destructure to ensure we strip the original ID and all metadata
    const { 
      id: _originalId, 
      created_date, 
      updated_date, 
      created_at, 
      updated_at, 
      created_by, 
      updated_by,
      row_editor_status: _oldStatus,
      ...cleanData 
    } = sourceRow;

    const newRow: SystemVariable = {
      ...cleanData,
      id: newId,
      row_editor_status: 'inserted'
    };
    
    // Add to the top of the grid and select it
    setData([newRow, ...data]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    toast({ 
      title: 'Row Copied', 
      description: 'A new draft row has been created from the selected record.',
      status: 'info'
    });
  };

  const handleChange = (id: number, field: keyof SystemVariable, value: any) => {
    setData(prev => prev.map(row => {
      if (row.id === id) {
        // Handle numeric fields allowing empty string during typing
        let processedValue = value;
        if (['type_id', 'numeric_value', 'sequence'].includes(field)) {
          if (value === '') {
            processedValue = ''; // Allow empty while typing
          } else {
            processedValue = field === 'numeric_value' ? parseFloat(value) : parseInt(value);
            if (isNaN(processedValue)) processedValue = '';
          }
        }

        return { 
          ...row, 
          [field]: processedValue,
          row_editor_status: row.row_editor_status === 'inserted' ? 'inserted' : 'updated'
        };
      }
      return row;
    }));
  };

  const handleSave = async (row: SystemVariable) => {
    setSavingId(row.id);
    try {
      const payload = {
        ...row,
        // Ensure numeric fields are numbers (not empty strings) before sending
        type_id: Number(row.type_id) || 0,
        numeric_value: Number(row.numeric_value) || 0,
        sequence: Number(row.sequence) || 0,
        id: row.row_editor_status === 'inserted' ? 0 : row.id,
        row_editor_status: row.row_editor_status || 'updated',
        ...(isSuperUser && { CompanyID: row.company_id })
      };
      
      const response = isSuperUser 
         ? await systemVariableService.saveSystemVariableSuper(payload)
         : await systemVariableService.saveSystemVariable(payload);
         
      if (response && (response.status_code === 200 || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'System variable saved successfully.', status: 'success' });
        fetchVariables(); // Refresh to get proper IDs and state
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkSave = async () => {
    const dirtyRows = data.filter(r => r.row_editor_status);
    if (dirtyRows.length === 0) return;
    setIsBulkSaveDialogOpen(true);
  };

  const handleConfirmBulkSave = async () => {
    const dirtyRows = data.filter(r => r.row_editor_status);
    if (dirtyRows.length === 0) return;

    setIsBulkSaveDialogOpen(false);
    setIsBulkSaving(true);
    try {
      const savePromises = dirtyRows.map(row => {
        const payload = {
          ...row,
          // Ensure numeric fields are numbers (not empty strings) before sending
          type_id: Number(row.type_id) || 0,
          numeric_value: Number(row.numeric_value) || 0,
          sequence: Number(row.sequence) || 0,
          id: row.row_editor_status === 'inserted' ? 0 : row.id,
          row_editor_status: row.row_editor_status || 'updated',
          ...(isSuperUser && { CompanyID: row.company_id })
        };
        return isSuperUser 
           ? systemVariableService.saveSystemVariableSuper(payload)
           : systemVariableService.saveSystemVariable(payload);
      });

      const results = await Promise.all(savePromises);
      const failures = results.filter(r => !(r?.status_code === 200 || r?.response_code === 'SAVE_SUCCESS'));

      if (failures.length === 0) {
        toast({ title: 'Success', description: `Successfully saved ${dirtyRows.length} records.`, status: 'success' });
        fetchVariables();
      } else {
        toast({ 
          title: 'Partial Success', 
          description: `Saved some records, but ${failures.length} failed.`, 
          status: 'warning' 
        });
        fetchVariables();
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleDelete = async (row: SystemVariable) => {
    if (row.row_editor_status === 'inserted') {
      setData(prev => prev.filter(r => r.id !== row.id));
      return;
    }

    setRowToDelete(row);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;

    setIsDeleting(true);
    try {
      const resp = await systemVariableService.deleteSystemVariable(rowToDelete.id);
      if (resp && (resp.status_code === 200 || resp.response_code === 'Success')) {
        toast({ title: 'Success', description: 'System variable deleted.', status: 'success' });
        setIsDeleteDialogOpen(false);
        fetchVariables();
      } else {
        toast(handleApiError(resp));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsDeleting(false);
      setRowToDelete(null);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card-bg rounded-2xl border border-border-theme shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl animate-pulse"></div>
          <Loader className="h-10 w-10 text-primary-600 relative z-10" />
        </div>
        <p className="mt-4 text-sm font-medium text-text-muted uppercase tracking-widest animate-pulse">Initializing Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600/10 rounded-lg">
            <Database className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Configuration Matrix</h3>
            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Inline Database Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSuperUser && (
            <div className="flex items-center border border-border-theme rounded-lg overflow-hidden bg-card-bg hover:border-primary-600/30 transition-all">
              <div className="bg-content-bg/50 px-3 py-2 border-r border-border-theme flex items-center">
                <Filter className="h-3 w-3 text-text-muted/50 mr-2" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">Company</span>
              </div>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setCurrentPage(1);
                  // Trigger fetch immediately on change
                  setTimeout(fetchVariables, 0);
                }}
                className="h-9 px-3 bg-transparent text-xs font-bold text-text-main outline-none cursor-pointer min-w-[150px]"
              >
                <option value="">All Companies</option>
                {companies.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Enhanced Search Bar */}
          <div className="flex items-center bg-card-bg border border-border-theme rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-600/20 focus-within:border-primary-600/50 transition-all">
            <div className="flex items-center pl-3 pr-2 border-r border-border-theme bg-content-bg/50">
              <Filter className="h-3.5 w-3.5 text-text-muted/50 mr-2" />
              <select 
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value as any)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-tight text-text-muted focus:outline-none cursor-pointer"
              >
                <option value="type_name">Type</option>
                <option value="name">Desc</option>
              </select>
            </div>
            <div className="relative flex items-center min-w-[200px]">
              <Input 
                placeholder={`Search by ${searchBy === 'type_name' ? 'Type Name' : 'Description'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVariables()}
                className="h-9 border-0 focus-visible:ring-0 text-xs px-3 bg-transparent"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); fetchVariables(); }}
                  className="absolute right-2 text-gray-300 hover:text-text-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button 
              size="sm"
              onClick={fetchVariables}
              className="h-9 rounded-none border-0 bg-primary-50 text-primary-600 hover:bg-primary-100 px-3"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchVariables}
            className="h-9 px-3 border-border-theme bg-card-bg hover:bg-primary-600/10 hover:text-primary-600 hover:border-primary-600/30 transition-all group"
          >
            <RotateCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          {btnAdd?.visible && (
            <Button 
              onClick={handleAddRow}
              size="sm"
              className="h-9 px-4 bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-200 transition-all font-bold uppercase tracking-widest text-[10px]"
            >
              <Plus className="h-4 w-4 mr-2" /> {btnAdd.button_title}
            </Button>
          )}

          {btnBulkSave?.visible && data.some(r => r.row_editor_status) && (
            <Button 
              onClick={handleBulkSave}
              disabled={isBulkSaving}
              size="sm"
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all font-bold uppercase tracking-widest text-[10px]"
            >
              {isBulkSaving ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SaveAll className="h-4 w-4 mr-2" />
              )}
              {btnBulkSave.button_title} ({data.filter(r => r.row_editor_status).length})
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card-bg rounded-2xl border border-border-theme shadow-xl shadow-gray-200/5 hidden-dark overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-content-bg/80 backdrop-blur-sm sticky top-0 z-20 border-b border-border-theme">
              <TableRow>
                {isSuperUser && (
                  <TableHead className="w-[120px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Company</TableHead>
                )}
                <TableHead className="w-[80px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Type ID</TableHead>
                <TableHead className="w-[120px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Type Name</TableHead>
                <TableHead className="w-[120px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Code</TableHead>
                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Description</TableHead>
                <TableHead className="w-[100px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Value</TableHead>
                <TableHead className="w-[80px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Seq</TableHead>
                <TableHead className="w-[100px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Generated</TableHead>
                <TableHead className="w-[100px] py-4 text-[10px] font-black uppercase tracking-widest text-text-main">Inactive</TableHead>
                <TableHead className="w-[100px] py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-main">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={row.id}
                  className={cn(
                    "hover:bg-primary-600/5 transition-colors border-b border-border-theme",
                    row.row_editor_status === 'inserted' && "bg-emerald-500/10",
                    row.row_editor_status === 'updated' && "bg-amber-500/10",
                    !row.row_editor_status && index % 2 === 1 && "bg-content-bg/50"
                  )}
                >
                  {isSuperUser && (
                    <TableCell className="p-2">
                       <select
                         value={row.company_id}
                         onChange={(e) => handleChange(row.id, 'company_id', e.target.value)}
                         className="flex h-8 w-full items-center justify-between rounded-md border border-border-theme bg-content-bg px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                       >
                         <option value="">Select Company</option>
                         {companies.map((c) => (
                           <option key={c.value} value={c.value}>{c.label}</option>
                         ))}
                       </select>
                    </TableCell>
                  )}
                  <TableCell className="p-2">
                    <Input 
                      type="number"
                      value={row.type_id}
                      onChange={(e) => handleChange(row.id, 'type_id', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs font-medium border-border-theme text-center bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input 
                      value={row.type_name}
                      onChange={(e) => handleChange(row.id, 'type_name', e.target.value)}
                      className="h-8 text-xs font-medium border-border-theme bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input 
                      value={row.code}
                      onChange={(e) => handleChange(row.id, 'code', e.target.value)}
                      className="h-8 text-xs font-bold border-border-theme focus:bg-content-bg bg-content-bg/30 text-text-main"
                      placeholder="CODE"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input 
                      value={row.name}
                      onChange={(rowId) => handleChange(row.id, 'name', rowId.target.value)}
                      className="h-8 text-xs font-medium border-border-theme focus:bg-content-bg bg-content-bg/30 text-text-main"
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input 
                      type="number"
                      value={row.numeric_value}
                      onChange={(e) => handleChange(row.id, 'numeric_value', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-bold text-primary-600 border-border-theme bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input 
                      type="number"
                      value={row.sequence}
                      onChange={(e) => handleChange(row.id, 'sequence', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs font-medium border-border-theme text-center bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center">
                      <Switch 
                        checked={row.is_system_generated}
                        onCheckedChange={(val) => handleChange(row.id, 'is_system_generated', val)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center">
                      <Switch 
                        checked={row.is_inactive}
                        onCheckedChange={(val) => handleChange(row.id, 'is_inactive', val)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      {btnEdit?.visible && row.row_editor_status ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSave(row)}
                          disabled={savingId === row.id}
                          className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                          title={btnEdit.button_title}
                        >
                          {savingId === row.id ? (
                            <RotateCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                      
                      {btnCopy?.visible && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyRow(row)}
                          className="h-8 w-8 p-0 text-primary-500 hover:bg-primary-600/10 hover:text-primary-600"
                          title={btnCopy.button_title}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}

                      {btnDelete?.visible && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(row)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          title={btnDelete.button_title}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center bg-content-bg/50">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                      <Layers className="h-10 w-10 text-text-muted/50" />
                      <p className="text-sm font-bold uppercase tracking-widest text-text-muted">No variables found</p>
                      <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-2 text-[10px] font-black uppercase tracking-widest">
                        Initialize Matrix
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-4">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-content-bg px-3 py-1.5 rounded-full border border-border-theme">
            Showing <span className="text-primary-600 font-black">{data.length}</span> of <span className="text-primary-600 font-black">{totalRows}</span> variables
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest">Limit</span>
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-card-bg border border-border-theme text-text-main text-[10px] font-black rounded-lg focus:ring-primary-600/20 focus:border-primary-600/50 block p-1.5 outline-none cursor-pointer transition-all hover:border-primary-600/30"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-border-theme disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" /> Prev
          </Button>
          
          <div className="flex items-center gap-2 px-6 min-w-[100px] justify-center bg-primary-50/50 rounded-lg border border-primary-100 py-1.5">
            <span className="text-[11px] font-black text-primary-700">{currentPage}</span>
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mx-1">/</span>
            <span className="text-[11px] font-black text-text-muted">{Math.ceil(totalRows / pageSize) || 1}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(totalRows / pageSize) || loading}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-border-theme disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={btnDelete?.button_title || "Delete System Variable"}
        description="Are you sure you want to delete this configuration? This action cannot be undone."
        confirmLabel={btnDelete?.button_title || "Delete"}
        confirmVariant="danger"
        loading={isDeleting}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        details={rowToDelete ? [
          { label: 'Code', value: rowToDelete.code },
          { label: 'Description', value: rowToDelete.name }
        ] : []}
      />

      <ConfirmDialog 
        isOpen={isBulkSaveDialogOpen}
        onClose={() => setIsBulkSaveDialogOpen(false)}
        onConfirm={handleConfirmBulkSave}
        title={btnBulkSave?.button_title || "Bulk Save Changes"}
        description={`You are about to save ${data.filter(r => r.row_editor_status).length} pending changes.`}
        confirmLabel={btnBulkSave?.button_title || "Save All"}
        confirmVariant="primary"
        icon={<SaveAll className="h-5 w-5 text-primary-600" />}
        infoMessage="This will update all new and modified rows in the database simultaneously."
      />

      <ToastComponent />
    </div>
  );
}
