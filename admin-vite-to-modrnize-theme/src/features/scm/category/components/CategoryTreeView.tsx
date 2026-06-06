import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui-old/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { categoryService, financeCOAService, parseComboResponse } from '@/lib/scm/api/product.service';
import { companyService } from '@/lib/auth/api/company.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Save, RotateCw, Loader, Layers, FolderTree,
  ChevronRight, ChevronDown, Building2, Wallet, Receipt, BadgeDollarSign, Briefcase
} from 'lucide-react';

interface CategoryNode {
  category_id: number;
  category_name: string;
  parent_category_id: number | null;
  inventory_ledger_id: number | null;
  sales_ledger_id: number | null;
  cost_ledger_id: number | null;
  is_active: boolean;
  company_id?: string;
  children: CategoryNode[];
}

interface CategoryTreeViewProps {
  isSuperUser?: boolean;
}

export function CategoryTreeView({ isSuperUser = false }: CategoryTreeViewProps) {
  const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [parentCategories, setParentCategories] = useState<{ value: number; label: string }[]>([]);
  const [inventoryCOA, setInventoryCOA] = useState<{ value: number; label: string }[]>([]);
  const [salesCOA, setSalesCOA] = useState<{ value: number; label: string }[]>([]);
  const [costCOA, setCostCOA] = useState<{ value: number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    const loadCombos = async () => {
      try {
        const [catCombo, invCOA, salCOA, cstCOA] = await Promise.allSettled([
          categoryService.getCombo(),
          financeCOAService.getByType('Asset'),
          financeCOAService.getByType('Revenue'),
          financeCOAService.getByType('Expense'),
        ]);
        if (catCombo.status === 'fulfilled') setParentCategories(parseComboResponse(catCombo.value));
        if (invCOA.status === 'fulfilled') setInventoryCOA(parseComboResponse(invCOA.value));
        if (salCOA.status === 'fulfilled') setSalesCOA(parseComboResponse(salCOA.value));
        if (cstCOA.status === 'fulfilled') setCostCOA(parseComboResponse(cstCOA.value));
        if (isSuperUser) {
          const resp = await companyService.getAllCompanies();
          if (resp && Array.isArray(resp)) {
            const mapped = resp.map((c: any) => ({
              value: c.value || c.id || c.company_id,
              label: c.label || c.company_name || `Company #${c.value || c.id}`,
            }));
            setCompanies(mapped);
            if (mapped.length > 0) setSelectedCompanyId(mapped[0].value as string);
          }
        }
      } catch (err) {
        console.error('Failed to load combos', err);
      }
    };
    loadCombos();
  }, [isSuperUser]);

  useEffect(() => {
    if (!isSuperUser || selectedCompanyId) {
      fetchCategories();
    }
  }, [selectedCompanyId, isSuperUser]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll(isSuperUser);
      const data = Array.isArray(res) ? res : res?.data || [];
      setFlatCategories(data);
      setAllCategories(buildTree(data));
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setAllCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flat: any[]): CategoryNode[] => {
    const map = new Map<number, CategoryNode>();
    flat.forEach((item: any) => {
      map.set(item.category_id, { ...item, children: [] });
    });
    const roots: CategoryNode[] = [];
    flat.forEach((item: any) => {
      const node = map.get(item.category_id);
      if (node) {
        if (!item.parent_category_id) {
          roots.push(node);
        } else {
          const parent = map.get(item.parent_category_id);
          if (parent) {
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        }
      }
    });
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.category_name.localeCompare(b.category_name));
      nodes.forEach(n => { if (n.children.length > 0) sortNodes(n.children); });
    };
    sortNodes(roots);
    return roots;
  };

  const findNodeById = (nodes: CategoryNode[], id: number): CategoryNode | null => {
    for (const node of nodes) {
      if (node.category_id === id) return node;
      if (node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addRootCategory = async () => {
    setLoading(true);
    const newItem: any = {
      category_id: 0,
      category_name: 'New Category',
      parent_category_id: null,
      inventory_ledger_id: null,
      sales_ledger_id: null,
      cost_ledger_id: null,
      is_active: true,
      company_id: selectedCompanyId || undefined,
    };
    setAllCategories(prev => [...prev, { ...newItem, children: [] }]);
    setSelectedNode({ ...newItem, _isNew: true });
    setLoading(false);
  };

  const addChildCategory = (parentId: number) => {
    const newItem: any = {
      category_id: 0,
      category_name: 'New Sub Category',
      parent_category_id: parentId,
      inventory_ledger_id: null,
      sales_ledger_id: null,
      cost_ledger_id: null,
      is_active: true,
      company_id: selectedCompanyId || undefined,
      _isNew: true,
    };

    const addRecursive = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.map(node => {
        if (node.category_id === parentId) {
          return { ...node, children: [...node.children, { ...newItem, children: [] }] };
        }
        if (node.children.length > 0) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });

    setAllCategories(prev => addRecursive(prev));
    setExpandedIds(prev => { const next = new Set(prev); next.add(parentId); return next; });
    setSelectedNode(newItem);
  };

  const handleSave = async () => {
    if (!selectedNode) {
      toast({ title: 'No Selection', description: 'Select a category to save.', status: 'error' });
      return;
    }
    if (!selectedNode.category_name?.trim()) {
      toast({ title: 'Validation Error', description: 'Category Name is required.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        category_id: selectedNode.category_id || 0,
        category_name: selectedNode.category_name.trim(),
        parent_category_id: selectedNode.parent_category_id || null,
        inventory_ledger_id: selectedNode.inventory_ledger_id || null,
        sales_ledger_id: selectedNode.sales_ledger_id || null,
        cost_ledger_id: selectedNode.cost_ledger_id || null,
        is_active: selectedNode.is_active ?? true,
      };
      if (isSuperUser && selectedNode.company_id) {
        payload.company_id = selectedNode.company_id;
      }

      const saveFn = isSuperUser ? categoryService.saveSuper : categoryService.save;
      const res = await saveFn(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Category saved successfully.', status: 'success' });
        setSelectedNode(null);
        await fetchCategories();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await categoryService.delete(itemToDelete.category_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Category deleted.', status: 'success' });
        setItemToDelete(null);
        setSelectedNode(null);
        await fetchCategories();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const renderTreeNode = (node: CategoryNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.category_id);
    const isSelected = selectedNode?.category_id === node.category_id && !selectedNode?._isNew;

    return (
      <div key={node.category_id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-all text-[11px] group',
            isSelected
              ? 'bg-primary-600 text-white shadow-sm'
              : 'hover:bg-primary-50 text-text-main hover:text-primary-700'
          )}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => {
            const flat = flatCategories.find((f: any) => f.category_id === node.category_id);
            setSelectedNode(flat || node);
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.category_id); }}
            className="w-4 h-4 flex items-center justify-center shrink-0"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <span className="w-3.5" />
            )}
          </button>
          <Layers className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-white' : 'text-primary-500')} />
          <span className="truncate font-semibold flex-1">{node.category_name}</span>
          {!node.is_active && (
            <span className="text-[8px] font-bold uppercase bg-red-100 text-red-600 px-1 rounded shrink-0">Inactive</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); addChildCategory(node.category_id); }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-inherit transition-opacity shrink-0"
            title="Add Sub Category"
          >
            <Plus className="w-3 h-3" />
          </button>
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
    <>
      <ToastComponent />

      {isSuperUser && companies.length > 0 && (
        <div className="flex items-center gap-3 bg-card-bg px-4 py-2.5 rounded-xl border border-border-theme shadow-sm mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 whitespace-nowrap">
            <Briefcase className="h-3.5 w-3.5" />
            Company:
          </span>
          <Select
            options={companies}
            value={selectedCompanyId}
            onChange={(val) => setSelectedCompanyId(val?.toString() || '')}
            placeholder="Select Company..."
            className="w-[220px]"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tree Column */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-card-bg px-4 py-2 rounded-xl border border-border-theme shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={fetchCategories}
                title="Reload"
                className="h-8 w-8 p-0 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 border border-border-theme"
              >
                <RotateCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Categories</span>
            </div>
            <Button
              size="sm"
              onClick={addRootCategory}
              className="h-8 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Root
            </Button>
          </div>

          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-3 min-h-[400px] max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted/50 gap-3">
                <Loader className="h-8 w-8 text-primary-600 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Loading...</span>
              </div>
            ) : allCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderTree className="h-10 w-10 text-text-muted/30 mb-2" />
                <p className="text-[11px] text-text-muted font-medium">No categories found</p>
                <p className="text-[9px] text-text-muted/50 mt-1">Add a root category to get started.</p>
              </div>
            ) : (
              allCategories.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Detail Form Column */}
        <div className="lg:col-span-8">
          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden min-h-[400px]">
            <div className="px-5 py-3 border-b border-border-theme flex items-center justify-between bg-content-bg/50">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-primary-600">
                {selectedNode ? (selectedNode._isNew ? 'New Category' : 'Category Details') : 'Select a Category'}
              </h2>
              {selectedNode && (
                <div className="flex items-center gap-2">
                  {selectedNode.category_id > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setItemToDelete(selectedNode)}
                      className="h-8 px-3 text-red-500 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-8 px-4 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
                  >
                    <Save className={cn('h-3.5 w-3.5', saving && 'animate-spin')} />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-5">
              {selectedNode ? (
                <div className="space-y-6">
                  {/* Company (superuser) */}
                  {isSuperUser && (
                    <div className="space-y-2">
                      {fieldLabel('Company')}
                      <Select
                        options={companies}
                        value={selectedNode.company_id || null}
                        onChange={(val) => setSelectedNode((prev: any) => ({ ...prev, company_id: val?.toString() || '' }))}
                        placeholder="Select Company"
                        className="w-full shadow-sm"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Basic Info */}
                    <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Layers className="w-4 h-4 text-[#2e125c]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Category Information</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {fieldLabel('Category Name', true)}
                          <Input
                            value={selectedNode.category_name || ''}
                            onChange={(e) => setSelectedNode((prev: any) => ({ ...prev, category_name: e.target.value }))}
                            placeholder="Category name"
                            className="h-11 text-sm font-semibold border-slate-200 rounded-xl shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel('Parent Category')}
                          {selectedNode._isNew && selectedNode.parent_category_id ? (
                            <div className="h-11 px-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 shadow-sm">
                              {flatCategories.find((c: any) => c.category_id === selectedNode.parent_category_id)?.category_name || 'Parent'}
                            </div>
                          ) : (
                            <Select
                              options={parentCategories.filter(c => c.value !== selectedNode.category_id)}
                              value={selectedNode.parent_category_id ?? null}
                              onChange={(val) => setSelectedNode((prev: any) => ({ ...prev, parent_category_id: val ?? null }))}
                              placeholder="No Parent (Top Level)"
                              className="w-full shadow-sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <Checkbox
                            checked={selectedNode.is_active ?? true}
                            onCheckedChange={(checked) => setSelectedNode((prev: any) => ({ ...prev, is_active: !!checked }))}
                          />
                          <div className="flex flex-col select-none">
                            <Label className="text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer">Active Status</Label>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Category available for use</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Ledger Mapping */}
                    <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Ledger Mapping</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {fieldLabel('Inventory Ledger (Asset)')}
                          <Select
                            options={inventoryCOA}
                            value={selectedNode.inventory_ledger_id ?? null}
                            onChange={(val) => setSelectedNode((prev: any) => ({ ...prev, inventory_ledger_id: val ?? null }))}
                            placeholder="Select Asset Head"
                            className="w-full shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel('Sales Ledger (Revenue)')}
                          <Select
                            options={salesCOA}
                            value={selectedNode.sales_ledger_id ?? null}
                            onChange={(val) => setSelectedNode((prev: any) => ({ ...prev, sales_ledger_id: val ?? null }))}
                            placeholder="Select Revenue Head"
                            className="w-full shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          {fieldLabel('Cost Ledger (Expense)')}
                          <Select
                            options={costCOA}
                            value={selectedNode.cost_ledger_id ?? null}
                            onChange={(val) => setSelectedNode((prev: any) => ({ ...prev, cost_ledger_id: val ?? null }))}
                            placeholder="Select Expense Head"
                            className="w-full shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="bg-content-bg p-4 rounded-full mb-4">
                    <FolderTree className="h-8 w-8 text-text-muted/50" />
                  </div>
                  <h3 className="text-text-main font-bold text-sm">Select a Category</h3>
                  <p className="text-[11px] text-text-muted max-w-[200px] mt-1">
                    Pick a category from the tree on the left to view and edit its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${itemToDelete?.category_name}"?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}
