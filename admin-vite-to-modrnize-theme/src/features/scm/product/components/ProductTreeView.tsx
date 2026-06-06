import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui-old/Select';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { productService, categoryService } from '@/lib/scm/api/product.service';
import { companyService } from '@/lib/auth/api/company.service';
import { ProductFormHost } from './ProductFormHost';
import { PRODUCT_FORM_ID_TREE } from './productForm.shared';
import { CategoryForm } from '@/features/scm/category/components/CategoryForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Save, RotateCw, Loader, Layers, FolderTree,
  ChevronRight, ChevronDown, Briefcase, Package, Search, X
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
  products: ProductDisplay[];
}

interface ProductDisplay {
  product_id: number;
  product_name: string;
  product_code?: string;
  category_id: number;
  unit_id?: number;
  purchase_price?: number;
  sales_price?: number;
  is_active: boolean;
}

interface ProductTreeViewProps {
  isSuperUser?: boolean;
  onRefreshGrid?: () => void;
}

type DetailMode = 'category' | 'product' | null;

export function ProductTreeView({ isSuperUser = false, onRefreshGrid }: ProductTreeViewProps) {
  const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast, ToastComponent } = useToast();

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const treeSearch = useMemo(() => {
    const categoryMatches = (node: CategoryNode) =>
      node.category_name.toLowerCase().includes(normalizedSearch);

    const productMatches = (product: ProductDisplay) =>
      product.product_name.toLowerCase().includes(normalizedSearch) ||
      (product.product_code?.toLowerCase().includes(normalizedSearch) ?? false);

    const shouldShowNode = (node: CategoryNode): boolean => {
      if (!normalizedSearch) return true;
      if (categoryMatches(node)) return true;
      if (node.products.some(productMatches)) return true;
      return node.children.some(shouldShowNode);
    };

    const getVisibleProducts = (node: CategoryNode): ProductDisplay[] => {
      if (!normalizedSearch || categoryMatches(node)) return node.products;
      return node.products.filter(productMatches);
    };

    const getVisibleChildren = (node: CategoryNode): CategoryNode[] => {
      if (!normalizedSearch || categoryMatches(node)) return node.children;
      return node.children.filter(shouldShowNode);
    };

    const isNodeExpanded = (node: CategoryNode) => {
      if (normalizedSearch) {
        return getVisibleChildren(node).length > 0 || getVisibleProducts(node).length > 0;
      }
      return expandedIds.has(node.category_id);
    };

    const visibleRoots = normalizedSearch
      ? allCategories.filter(shouldShowNode)
      : allCategories;

    return {
      shouldShowNode,
      getVisibleProducts,
      getVisibleChildren,
      isNodeExpanded,
      visibleRoots,
      hasActiveSearch: !!normalizedSearch,
    };
  }, [allCategories, normalizedSearch, expandedIds]);

  useEffect(() => {
    const loadCombos = async () => {
      try {
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
      const [catRes, prodRes] = await Promise.all([
        categoryService.getAll(isSuperUser),
        productService.getAllProducts(),
      ]);
      const data = Array.isArray(catRes) ? catRes : catRes?.data || [];
      const products = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];
      setFlatCategories(data);
      setAllProducts(products);
      setAllCategories(buildTree(data, products));
      setSelectedNode(null);
      setDetailMode(null);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setAllCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flat: any[], products: any[] = []): CategoryNode[] => {
    const map = new Map<number, CategoryNode>();
    flat.forEach((item: any) => {
      map.set(item.category_id, { ...item, children: [], products: [] });
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
    // Attach products to their category
    products.forEach((p: any) => {
      const catId = p.category_id || p.categoryId;
      if (catId && map.has(catId)) {
        map.get(catId)!.products.push({
          product_id: p.product_id || p.productId,
          product_name: p.product_name || p.productName,
          product_code: p.product_code || p.productCode,
          category_id: catId,
          unit_id: p.unit_id || p.unitId,
          purchase_price: p.purchase_price ?? p.purchasePrice,
          sales_price: p.sales_price ?? p.salesPrice,
          is_active: p.is_active ?? p.isActive ?? true,
        });
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

  const handleNodeClick = (node: any) => {
    const flat = flatCategories.find((f: any) => f.category_id === node.category_id);
    setSelectedNode(flat || node);
    setDetailMode('category');
  };

  const handleProductNodeClick = (product: ProductDisplay, parentCategoryName: string) => {
    setSelectedNode({
      _isExistingProduct: true,
      product_id: product.product_id,
      product_name: product.product_name,
      product_code: product.product_code || '',
      category_id: product.category_id,
      unit_id: product.unit_id || 1,
      brand_id: null,
      purchase_price: product.purchase_price ?? '',
      sales_price: product.sales_price ?? '',
      vat_percentage: 0,
      tax_percentage: 0,
      description: '',
      inventory_ledger_id: null,
      sales_ledger_id: null,
      cost_ledger_id: null,
      is_active: product.is_active,
      _parentCategoryName: parentCategoryName,
    });
    setDetailMode('product');
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
      _isNew: true,
    };
    setAllCategories(prev => [...prev, { ...newItem, children: [] }]);
    setSelectedNode(newItem);
    setDetailMode('category');
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
    setDetailMode('category');
  };

  const addProductUnderCategory = (parentId: number) => {
    const parent = flatCategories.find((c: any) => c.category_id === parentId);
    setSelectedNode({
      _isNewProduct: true,
      product_id: 0,
      product_name: '',
      category_id: parentId,
      unit_id: 1,
      brand_id: null,
      purchase_price: '',
      sales_price: '',
      vat_percentage: 0,
      tax_percentage: 0,
      description: '',
      inventory_ledger_id: null,
      sales_ledger_id: null,
      cost_ledger_id: null,
      is_active: true,
      _parentCategoryName: parent?.category_name || '',
    });
    setDetailMode('product');
  };

  const handleCategoryDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await categoryService.delete(itemToDelete.category_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Category deleted.', status: 'success' });
        setItemToDelete(null);
        setSelectedNode(null);
        setDetailMode(null);
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

  const handleProductDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await productService.deleteProduct(itemToDelete.product_id);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Product deleted.', status: 'success' });
        setItemToDelete(null);
        setSelectedNode(null);
        setDetailMode(null);
        onRefreshGrid?.();
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
    if (treeSearch.hasActiveSearch && !treeSearch.shouldShowNode(node)) return null;

    const visibleChildren = treeSearch.getVisibleChildren(node);
    const visibleProducts = treeSearch.getVisibleProducts(node);
    const hasChildren = visibleChildren.length > 0 || visibleProducts.length > 0;
    const isExpanded = treeSearch.isNodeExpanded(node);
    const isSelected = selectedNode?.category_id === node.category_id && !selectedNode?._isNew && !selectedNode?._isNewProduct && !selectedNode?._isExistingProduct && detailMode === 'category';

    return (
      <div key={node.category_id}>
        <div
          className={cn(
            'flex items-center gap-0.5 py-1 px-1.5 rounded-md cursor-pointer transition-all text-[11px] group min-w-0',
            isSelected
              ? 'bg-primary-600 text-white shadow-sm'
              : 'hover:bg-primary-50 text-text-main hover:text-primary-700'
          )}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => handleNodeClick(node)}
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
          <span className="truncate font-semibold flex-1 min-w-0">{node.category_name}</span>
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
          <button
            onClick={(e) => { e.stopPropagation(); addProductUnderCategory(node.category_id); }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-inherit transition-opacity shrink-0"
            title="Add Product"
          >
            <Package className="w-3 h-3" />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {visibleChildren.map(child => renderTreeNode(child, depth + 1))}
            {visibleProducts.map(product => (
              <div
                key={`p-${product.product_id}`}
                className={cn(
                  'flex items-center gap-0.5 py-1 px-1.5 rounded-md cursor-pointer transition-all text-[11px] group min-w-0',
                  selectedNode?.product_id === product.product_id && detailMode === 'product'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:bg-emerald-50 text-text-main hover:text-emerald-700'
                )}
                style={{ paddingLeft: `${8 + (depth + 1) * 14}px` }}
                onClick={() => handleProductNodeClick(product, node.category_name)}
              >
                <span className="w-4 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                </span>
                <span className="truncate font-medium flex-1 min-w-0">{product.product_name}</span>
                {product.product_code && (
                  <span className="hidden sm:inline text-[8px] font-mono text-text-muted/50 mr-1 truncate max-w-[4.5rem] shrink-0">{product.product_code}</span>
                )}
                {!product.is_active && (
                  <span className="text-[8px] font-bold uppercase bg-red-100 text-red-600 px-1 rounded shrink-0">Inactive</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const formInitialData = useMemo(
    () => ({
      ...selectedNode,
      company_id: selectedCompanyId || selectedNode?.company_id || '',
    }),
    [selectedNode, selectedCompanyId]
  );

  const formSelectionKey = useMemo(() => {
    if (!selectedNode) return 'none';
    if (detailMode === 'product') {
      return `product-${selectedNode.product_id ?? 0}-${selectedNode._isNewProduct ? 'new' : 'edit'}`;
    }
    return `category-${selectedNode.category_id ?? 0}-${selectedNode._isNew ? 'new' : 'edit'}`;
  }, [selectedNode, detailMode]);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full min-w-0 max-w-full">
        {/* Tree Column */}
        <div className="lg:col-span-3 flex flex-col gap-3 min-w-0 w-full max-w-sm lg:max-w-none">
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/50 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories or products..."
              className="h-9 pl-9 pr-9 text-[11px] rounded-xl border-border-theme shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-text-main transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
            ) : treeSearch.visibleRoots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-10 w-10 text-text-muted/30 mb-2" />
                <p className="text-[11px] text-text-muted font-medium">No matches found</p>
                <p className="text-[9px] text-text-muted/50 mt-1">Try a different category or product name.</p>
              </div>
            ) : (
              treeSearch.visibleRoots.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Detail Form Column */}
        <div className="lg:col-span-9 min-w-0">
          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden min-h-[400px] min-w-0">
            <div className="px-5 py-3 border-b border-border-theme flex items-center justify-between bg-content-bg/50">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-primary-600">
                {selectedNode
                  ? selectedNode._isNew
                    ? 'New Category'
                    : selectedNode._isNewProduct
                      ? 'New Product'
                      : detailMode === 'product'
                        ? 'Product Details'
                        : 'Category Details'
                  : 'Select a Category'}
              </h2>
              {selectedNode && (
                <div className="flex items-center gap-2">
                  {((selectedNode.category_id > 0 && !selectedNode._isNew) || (selectedNode.product_id > 0 && !selectedNode._isNewProduct)) && (
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
                    onClick={() => {
                      const formId = detailMode === 'product' ? PRODUCT_FORM_ID_TREE : 'product-tree-category-form';
                      document.getElementById(formId)?.requestSubmit();
                    }}
                    disabled={saving}
                    className="h-8 px-4 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
                  >
                    <Save className={cn('h-3.5 w-3.5', saving && 'animate-spin')} />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 lg:p-5 min-w-0 overflow-x-hidden">
              {!selectedNode ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="bg-content-bg p-4 rounded-full mb-4">
                    <FolderTree className="h-8 w-8 text-text-muted/50" />
                  </div>
                  <h3 className="text-text-main font-bold text-sm">Select a Category</h3>
                  <p className="text-[11px] text-text-muted max-w-[200px] mt-1">
                    Pick a category from the tree on the left to view and edit its details.
                  </p>
                </div>
              ) : detailMode === 'product' ? (
                <ProductFormHost
                  key={formSelectionKey}
                  variant="tree"
                  initialData={formInitialData}
                  isSuperUser={isSuperUser}
                  companyId={selectedCompanyId || undefined}
                  onSave={() => { fetchCategories(); onRefreshGrid?.(); }}
                  onClose={() => { setSelectedNode(null); setDetailMode(null); }}
                  onLoadingChange={setSaving}
                />
              ) : (
                <CategoryForm
                  key={formSelectionKey}
                  initialData={formInitialData}
                  isSuperUser={isSuperUser}
                  showCompanySelector={false}
                  externalCompanyId={selectedCompanyId || undefined}
                  formId="product-tree-category-form"
                  onSave={() => { fetchCategories(); onRefreshGrid?.(); }}
                  onClose={() => { setSelectedNode(null); setDetailMode(null); }}
                  onLoadingChange={setSaving}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={itemToDelete?._isNewProduct || itemToDelete?.product_id > 0 ? handleProductDelete : handleCategoryDelete}
        title={itemToDelete?._isNewProduct || itemToDelete?.product_id > 0 ? 'Delete Product' : 'Delete Category'}
        description={`Are you sure you want to delete "${itemToDelete?.product_name || itemToDelete?.category_name}"?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  );
}


