import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { financeService } from '@/lib/finance/api/finance.service';
import { companyService } from '@/lib/auth/api/company.service';
import { cn } from '@/lib/utils';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import {
  Plus, Save, RotateCw, Loader, ChevronRight, ChevronDown,
  Building2, Briefcase, Layers, Wallet, BadgeDollarSign, FileSpreadsheet
} from 'lucide-react';

interface CoaNode {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  parent_account_id: number | null;
  level: number;
  is_transactional: boolean;
  company_id?: string;
  children: CoaNode[];
}

interface ChartOfAccountsPageProps {
  isSuperUser?: boolean;
}

export default function ChartOfAccountsPage({ isSuperUser = false }: ChartOfAccountsPageProps) {
  const [allAccounts, setAllAccounts] = useState<CoaNode[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const resp = await companyService.getAllCompanies();
        if (resp && Array.isArray(resp)) {
          const mapped = resp.map((c: any) => ({
            value: String(c.value || c.id || c.company_id),
            label: c.label || c.company_name || `Company #${c.value || c.id}`,
          }));
          setCompanies(mapped);
          if (mapped.length > 0) {
            setSelectedCompanyId(mapped[0].value);
          }
        }
      } catch (err) {
        console.error('Failed to load companies for COA:', err);
      }
    };

    if (isSuperUser) {
      loadCompanies();
    } else {
      // For standard users, load directly
      fetchAccounts(0);
    }
  }, [isSuperUser]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchAccounts(Number(selectedCompanyId));
    }
  }, [selectedCompanyId]);

  const fetchAccounts = async (companyId: number) => {
    setLoading(true);
    try {
      const res = await financeService.getCoa(companyId);
      const data = Array.isArray(res) ? res : res?.data || [];
      setFlatAccounts(data);
      setAllAccounts(buildTree(data));
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to fetch COA', err);
      setAllAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flat: any[]): CoaNode[] => {
    const map = new Map<number, CoaNode>();
    flat.forEach((item: any) => {
      map.set(item.account_id, { ...item, children: [] });
    });
    const roots: CoaNode[] = [];
    flat.forEach((item: any) => {
      const node = map.get(item.account_id);
      if (node) {
        if (!item.parent_account_id) {
          roots.push(node);
        } else {
          const parent = map.get(item.parent_account_id);
          if (parent) {
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        }
      }
    });
    const sortNodes = (nodes: CoaNode[]) => {
      nodes.sort((a, b) => a.account_code.localeCompare(b.account_code));
      nodes.forEach(n => { if (n.children.length > 0) sortNodes(n.children); });
    };
    sortNodes(roots);
    return roots;
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addRootAccount = () => {
    const newItem: any = {
      account_id: 0,
      account_code: '',
      account_name: 'New Account',
      account_type: 'Asset',
      normal_balance: 'Dr',
      parent_account_id: null,
      level: 1,
      is_transactional: true,
      company_id: selectedCompanyId || undefined,
      _isNew: true,
    };
    setAllAccounts(prev => [...prev, { ...newItem, children: [] }]);
    setSelectedNode(newItem);
  };

  const addChildAccount = (parentId: number) => {
    const parentNode = flatAccounts.find(a => a.account_id === parentId);
    if (parentNode?.is_transactional) {
      toast({ title: 'Invalid Operation', description: 'Cannot add sub-accounts under a transactional account.', status: 'error' });
      return;
    }

    const newItem: any = {
      account_id: 0,
      account_code: '',
      account_name: 'New Sub Account',
      account_type: parentNode?.account_type || 'Asset',
      normal_balance: parentNode?.normal_balance || 'Dr',
      parent_account_id: parentId,
      level: (parentNode?.level || 1) + 1,
      is_transactional: true,
      company_id: selectedCompanyId || undefined,
      _isNew: true,
    };

    const addRecursive = (nodes: CoaNode[]): CoaNode[] =>
      nodes.map(node => {
        if (node.account_id === parentId) {
          return { ...node, children: [...node.children, { ...newItem, children: [] }] };
        }
        if (node.children.length > 0) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });

    setAllAccounts(prev => addRecursive(prev));
    setExpandedIds(prev => { const next = new Set(prev); next.add(parentId); return next; });
    setSelectedNode(newItem);
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    if (!selectedNode.account_code?.trim() || !selectedNode.account_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Account Code and Name are required.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        account_id: selectedNode.account_id || 0,
        account_code: selectedNode.account_code.trim(),
        account_name: selectedNode.account_name.trim(),
        account_type: selectedNode.account_type,
        normal_balance: selectedNode.normal_balance,
        parent_account_id: selectedNode.parent_account_id || null,
        level: selectedNode.level || 1,
        is_transactional: selectedNode.is_transactional ?? true,
        company_id: selectedNode.company_id || (selectedCompanyId ? Number(selectedCompanyId) : null)
      };

      const res = await financeService.saveCoa(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Account saved successfully.', status: 'success' });
        setSelectedNode(null);
        await fetchAccounts(Number(selectedCompanyId || 0));
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const renderTreeNode = (node: CoaNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.account_id);
    const isSelected = selectedNode?.account_id === node.account_id && !selectedNode?._isNew;

    return (
      <div key={node.account_id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-all text-[11px] group',
            isSelected
              ? 'bg-primary-600 text-white shadow-sm'
              : 'hover:bg-primary-50 text-text-main hover:text-primary-700'
          )}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => {
            const flat = flatAccounts.find((f: any) => f.account_id === node.account_id);
            setSelectedNode(flat || node);
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.account_id); }}
            className="w-4 h-4 flex items-center justify-center shrink-0"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <span className="w-3.5" />
            )}
          </button>
          <Layers className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-white' : 'text-primary-500')} />
          <span className="font-mono font-bold w-16 text-[10px] truncate shrink-0">{node.account_code}</span>
          <span className="truncate font-semibold flex-1">{node.account_name}</span>
          <span className={cn(
            "text-[8px] font-bold uppercase px-1 rounded shrink-0",
            node.is_transactional ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
          )}>
            {node.is_transactional ? 'TX' : 'GRP'}
          </span>
          {!node.is_transactional && (
            <button
              onClick={(e) => { e.stopPropagation(); addChildAccount(node.account_id); }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-inherit transition-opacity shrink-0"
              title="Add Sub Account"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fieldLabel = (text: string, required?: boolean) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/65 ml-1">
      {text}{required && <span className="text-red-500 font-bold"> *</span>}
    </Label>
  );

  return (
    <div className="space-y-6">
      <ToastComponent />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Chart of Accounts'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Configure accounts ledger structures, category levels, and transactional balances.
          </p>
        </div>
      </div>

      {isSuperUser && companies.length > 0 && (
        <div className="flex items-center gap-3 bg-card-bg px-4 py-2.5 rounded-xl border border-border-theme shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 whitespace-nowrap">
            <Briefcase className="h-3.5 w-3.5" />
            Company:
          </span>
          <Select
            value={selectedCompanyId}
            onValueChange={(val) => setSelectedCompanyId(val || '')}
          >
            <SelectTrigger className="w-[220px]" size="sm">
              <SelectValue placeholder="Select Company..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tree List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-card-bg px-4 py-2 rounded-xl border border-border-theme shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => fetchAccounts(Number(selectedCompanyId || 0))}
                title="Reload"
                className="h-8 w-8 p-0 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 border border-border-theme"
              >
                <RotateCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Ledgers</span>
            </div>
            <Button
              size="sm"
              onClick={addRootAccount}
              className="h-8 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Root
            </Button>
          </div>

          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-3 min-h-[450px] max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-text-muted/50 gap-3">
                <Loader className="h-8 w-8 text-primary-600 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Loading...</span>
              </div>
            ) : allAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Wallet className="h-10 w-10 text-text-muted/30 mb-2" />
                <p className="text-[11px] text-text-muted font-medium">No accounts found</p>
                <p className="text-[9px] text-text-muted/50 mt-1">Add a root account ledger to start.</p>
              </div>
            ) : (
              allAccounts.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Detail Form */}
        <div className="lg:col-span-7">
          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden min-h-[450px]">
            <div className="px-5 py-3 border-b border-border-theme flex items-center justify-between bg-content-bg/50">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-primary-600">
                {selectedNode ? (selectedNode._isNew ? 'New Account' : 'Account Details') : 'Select Account'}
              </h2>
              {selectedNode && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-8 px-4 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
                >
                  <Save className={cn('h-3.5 w-3.5', saving && 'animate-spin')} />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>

            <div className="p-5">
              {selectedNode ? (
                <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {fieldLabel('Account Code', true)}
                      <Input
                        value={selectedNode.account_code || ''}
                        onChange={(e) => setSelectedNode((prev: any) => ({ ...prev, account_code: e.target.value }))}
                        placeholder="e.g. 101001"
                        className="h-11 text-sm font-semibold border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      {fieldLabel('Account Name', true)}
                      <Input
                        value={selectedNode.account_name || ''}
                        onChange={(e) => setSelectedNode((prev: any) => ({ ...prev, account_name: e.target.value }))}
                        placeholder="e.g. Cash in Hand"
                        className="h-11 text-sm font-semibold border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {fieldLabel('Account Type')}
                      <Select
                        value={selectedNode.account_type || 'Asset'}
                        onValueChange={(val) => setSelectedNode((prev: any) => ({ ...prev, account_type: val || 'Asset' }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asset">Asset</SelectItem>
                          <SelectItem value="Liability">Liability</SelectItem>
                          <SelectItem value="Equity">Equity</SelectItem>
                          <SelectItem value="Income">Income</SelectItem>
                          <SelectItem value="Expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      {fieldLabel('Normal Balance')}
                      <Select
                        value={selectedNode.normal_balance || 'Dr'}
                        onValueChange={(val) => setSelectedNode((prev: any) => ({ ...prev, normal_balance: val || 'Dr' }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Balance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr">Debit (Dr)</SelectItem>
                          <SelectItem value="Cr">Credit (Cr)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 px-3 py-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Checkbox
                        checked={selectedNode.is_transactional ?? true}
                        onCheckedChange={(checked) => setSelectedNode((prev: any) => ({ ...prev, is_transactional: !!checked }))}
                      />
                      <div className="flex flex-col">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Transactional (Postable)</Label>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Direct voucher entries allowed</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hierarchy Depth</span>
                      <span className="text-sm font-bold text-slate-800">Level {selectedNode.level || 1}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="bg-content-bg p-4 rounded-full mb-3">
                    <BadgeDollarSign className="h-8 w-8 text-text-muted/50" />
                  </div>
                  <h3 className="text-text-main font-bold text-sm">Select Account Ledger</h3>
                  <p className="text-[11px] text-text-muted max-w-[220px] mt-1">
                    Select a ledger node to review, modify configuration details, or add sub-accounts.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
