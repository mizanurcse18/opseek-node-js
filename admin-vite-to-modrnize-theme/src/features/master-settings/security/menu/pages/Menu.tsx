import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Save, RotateCw, Loader, Trash2, Layers, Briefcase, Copy } from 'lucide-react';
import { handleApiError } from '@/lib/error-handler';
import { Button } from '@/components/ui/Button';
import { Select, Option } from '@/components/ui-old/Select';
import { cn } from '@/lib/utils';
import { securityService } from '@/lib/auth/api/security.service';
import { useToast } from '@/components/ui/Toast';
import MenuTree, { MenuItem } from '../components/MenuTree';
import MenuItemForm, { MenuItemFormHandle } from '../components/MenuItemForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { CopyMenuModal } from '../components/CopyMenuModal';

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTypeOptions, setMenuTypeOptions] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  
  const [selectedMenuType, setSelectedMenuType] = useState('admin_template');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>('');
  
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Synchronizing Tree...');
  const [dataLoading, setDataLoading] = useState(true); // Loading for combo data
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const { toast, ToastComponent } = useToast();
  const formRef = useRef<MenuItemFormHandle>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
  // Persistence Key
  const persistenceKey = `menu_expanded_ids_${selectedMenuType}_${selectedCompanyId}`;

  // Clear persistence on initial page load/refresh
  useEffect(() => {
    // We only want to clear it once when the component first mounts for the session
    // This handles "refresh or redirected" case
    localStorage.removeItem(persistenceKey);
    setExpandedIds(new Set());
  }, []);

  // Load persistence (when switching companies/menu types)
  useEffect(() => {
    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExpandedIds(new Set(parsed));
        }
      } catch (e) {
        setExpandedIds(new Set());
      }
    }
  }, [persistenceKey]);

  // Save persistence
  useEffect(() => {
    if (expandedIds.size >= 0) {
      localStorage.setItem(persistenceKey, JSON.stringify(Array.from(expandedIds)));
    }
  }, [expandedIds, persistenceKey]);
  const pageTitle = useMenuTitle();
  
  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAddRoot', button_title: 'Add Root' },
    { button_id: 'btnFinalize', button_title: 'Finalize Menu' }
  ], []));

  const btnAddRoot = buttons.find(b => b.button_id === 'btnAddRoot');
  const btnFinalize = buttons.find(b => b.button_id === 'btnFinalize');

  // Load initial combo data (Menu Types & Companies)
  useEffect(() => {
    const fetchInitialData = async () => {
      setDataLoading(true);
      try {
        const [typesData, companiesData] = await Promise.all([
          securityService.getSystemVariables(1),
          securityService.getAllCompaniesCombo()
        ]);

        if (Array.isArray(typesData)) {
          setMenuTypeOptions(typesData.map((t: any) => ({
            value: t.value ?? t.code ?? '',
            label: t.label ?? t.name ?? 'Unknown'
          })));
        }

        if (Array.isArray(companiesData)) {
          const mappedCompanies = companiesData.map((c: any) => ({
            value: c.value ?? c.id ?? c.company_id ?? '',
            label: c.label ?? c.name ?? c.company_name ?? 'Unknown'
          }));
          setCompanies(mappedCompanies);

          // Default to the first company if none selected
          if (mappedCompanies.length > 0) {
            const firstCompanyId = mappedCompanies[0].value;
            setSelectedCompanyId(firstCompanyId);
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial dropdown data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    // Only fetch menu data if we have both menu type AND company selection
    if (!dataLoading && selectedMenuType && selectedCompanyId) {
      fetchMenuData();
    }
  }, [selectedMenuType, selectedCompanyId, dataLoading]);

  const buildTree = (flatData: MenuItem[]): MenuItem[] => {
    const itemMap = new Map<number, MenuItem>();
    const roots: MenuItem[] = [];

    // First pass: initialize the map
    flatData.forEach(item => {
      itemMap.set(item.menu_id, { ...item, children: [] });
    });

    // Second pass: build the tree
    flatData.forEach(item => {
      const node = itemMap.get(item.menu_id);
      if (node) {
        if (item.parent_id === 0) {
          roots.push(node);
        } else {
          const parent = itemMap.get(item.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        }
      }
    });

    const sortTree = (items: MenuItem[]) => {
      items.sort((a, b) => (a.sequence_no || 0) - (b.sequence_no || 0));
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortTree(item.children);
        }
      });
    };

    sortTree(roots);
    return roots;
  };

  const fetchMenuData = async () => {
    setLoading(true);
    setLoadingText('Synchronizing Tree...');
    setSelectedItem(null); 
    try {
      const response = await securityService.getMenuData(
        selectedMenuType, 
        selectedCompanyId ? String(selectedCompanyId) : undefined
      );

      const rawData = response?.data;
      let flatArray: any[] | null = null;
      let parsedData = rawData;

      if (typeof rawData === 'string') {
        try { parsedData = JSON.parse(rawData); } catch (e) { }
      } else if (rawData && typeof rawData === 'object' && typeof rawData.data === 'string') {
        try { parsedData.data = JSON.parse(rawData.data); } catch (e) { }
      } else if (rawData && typeof rawData === 'object' && typeof rawData.Data === 'string') {
        try { parsedData.Data = JSON.parse(rawData.Data); } catch (e) { }
      }

      if (Array.isArray(parsedData)) {
        flatArray = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        if (Array.isArray(parsedData.Data)) flatArray = parsedData.Data;
        else if (Array.isArray(parsedData.data)) flatArray = parsedData.data;
        else if (Array.isArray(parsedData.rows)) flatArray = parsedData.rows;
      }

      if (flatArray && flatArray.length > 0) {
        const cleanedArray: MenuItem[] = flatArray
          .map(item => ({
            menu_id: Number(item.menu_id) || 0,
            parent_id: Number(item.parent_id) || 0,
            application_id: Number(item.application_id) || 1,
            id: item.id ?? `menu-${Date.now()}-${Math.random()}`,
            title: item.title ?? 'Unknown',
            translate: item.translate ?? '',
            type: item.type ?? 'item',
            icon: item.icon ?? 'Circle',
            url: item.url ?? '',
            target: item.target ?? '_self',
            is_visible: item.is_visible ?? false,
            sequence_no: Number(item.sequence_no) || 0,
            row_version: item.row_version ?? '',
            row_editor_status: item.row_editor_status ?? '',
            menu_type: item.menu_type ?? selectedMenuType,
            company_id: item.company_id ?? selectedCompanyId,
            is_used: item.is_used === true || item.is_used === 'true' || item.is_used === 1,
            apiPathMaps: (item.apiPathMaps ?? item.api_path_map ?? []).map((map: any) => ({
              ...map,
              menu_id: Number(map.menu_id) || 0,
              row_editor_status: map.row_editor_status || 'update'
            }))
          }));

        const nestedTree = buildTree(cleanedArray);
        setMenuItems(nestedTree);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedItem) {
      toast({ title: 'No Item Selected', description: 'Please select a menu item to save.', status: 'error' });
      return;
    }

    const isValid = await formRef.current?.validate();
    if (!isValid) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', status: 'error' });
      return;
    }

    const formData = formRef.current?.getFormData();
    if (!formData) return;

    setSaving(true);
    try {
      const dbItem: any = { ...formData };
      delete dbItem.children;

      dbItem.auth = dbItem.auth || 'admin,user';
      dbItem.badge = dbItem.badge || '';
      dbItem.parameters = dbItem.parameters || '';
      dbItem.exact = dbItem.exact !== undefined ? dbItem.exact : true;
      dbItem.row_editor_status = (Number(dbItem.menu_id) || 0) > 0 ? 'update' : 'insert';

      await securityService.saveMenu([dbItem]);

      toast({
        title: 'Menu Saved Successfully',
        description: `"${formData.title}" has been saved.`,
        status: 'success'
      });

      setSelectedItem(null);
      await fetchMenuData();
    } catch (error) {
      console.error('Failed to save menu:', error);
      const { title, description, status } = handleApiError(error);
      toast({ title, description, status: status as any });
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (reorderData: { menu_id: number; parent_id: number; sequence_no: number }[]) => {
    try {
      await securityService.reorderMenu(reorderData);
      toast({ title: 'Menu Reordered', description: 'The menu order has been updated.', status: 'success' });
    } catch (error) {
      console.error('Failed to reorder menu:', error);
      toast(handleApiError(error));
      await fetchMenuData();
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const getRecursiveDeleteList = (item: MenuItem): any[] => {
      const list = [{ menu_id: item.menu_id, parent_id: item.parent_id, sequence_no: item.sequence_no }];
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => { list.push(...getRecursiveDeleteList(child)); });
      }
      return list;
    };

    setDeleting(true);
    try {
      await securityService.deleteMenu(getRecursiveDeleteList(itemToDelete));
      toast({ title: 'Menu Item Deleted', description: `"${itemToDelete.title}" removed.`, status: 'success' });
      setItemToDelete(null);
      if (selectedItem?.id === itemToDelete.id) setSelectedItem(null);
      await fetchMenuData();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      toast(handleApiError(error));
    } finally {
      setDeleting(false);
    }
  };

  const addRootItem = async () => {
    setLoading(true);
    setLoadingText('Generating ID...');
    let nextId = 0;
    try {
      const response = await securityService.getLastMenuId();
      nextId = (Number(response?.data) || 0) + 1;
    } catch (error) {
      console.error('Failed to fetch last menu id:', error);
      nextId = Date.now();
    } finally {
      setLoading(false);
    }

    const newItem: MenuItem = {
      menu_id: Number(nextId),
      parent_id: 0,
      application_id: 1,
      id: `new-${nextId}`,
      title: 'New Root Item',
      translate: 'New Root Item',
      type: 'item',
      icon: 'Circle',
      url: '',
      target: '_self',
      is_visible: true,
      sequence_no: menuItems.length + 1,
      menu_type: selectedMenuType,
      company_id: selectedCompanyId,
      children: [],
      row_editor_status: 'insert',
      apiPathMaps: []
    };
    setMenuItems([...menuItems, newItem]);
    setSelectedItem(newItem);
  };

  const addChildItem = async (parentId: string) => {
    let parentMenuId = 0;
    const findParent = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.id === parentId) {
          parentMenuId = item.menu_id;
          return;
        }
        if (item.children) findParent(item.children);
      }
    };
    findParent(menuItems);

    setLoading(true);
    setLoadingText('Generating ID...');
    let nextId = 0;
    try {
      const response = await securityService.getLastMenuId();
      nextId = (Number(response?.data) || 0) + 1;
    } catch (error) {
      console.error('Failed to fetch last menu id:', error);
      nextId = Date.now();
    } finally {
      setLoading(false);
    }

    const newItem: MenuItem = {
      menu_id: Number(nextId),
      parent_id: Number(parentMenuId),
      application_id: 1,
      id: `new-${nextId}`,
      title: 'New Sub-menu',
      translate: 'New Sub-menu',
      type: 'item',
      icon: 'Circle',
      url: '',
      target: '_self',
      is_visible: true,
      sequence_no: 1,
      menu_type: selectedMenuType,
      company_id: selectedCompanyId,
      children: [],
      row_editor_status: 'insert',
      apiPathMaps: []
    };

    const addRecursive = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), { ...newItem, sequence_no: (item.children?.length || 0) + 1 }]
          };
        }
        if (item.children) return { ...item, children: addRecursive(item.children) };
        return item;
      });
    };

    setMenuItems(addRecursive(menuItems));
    setSelectedItem(newItem);
    
    // Ensure the parent is expanded (use numeric menu_id)
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add(parentMenuId);
      return next;
    });
  };

  const handleToggleExpand = (id: string) => {
    // Find the item to get its menu_id
    const findMenuId = (items: MenuItem[]): number | null => {
      for (const item of items) {
        if (item.id === id) return item.menu_id;
        if (item.children) {
          const res = findMenuId(item.children);
          if (res) return res;
        }
      }
      return null;
    };

    const mId = findMenuId(menuItems);
    if (!mId) return;

    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(mId)) next.delete(mId);
      else next.add(mId);
      return next;
    });
  };
  
  const handleEnsureExpanded = (menuId: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add(menuId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <ToastComponent />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text-main tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary-600" />
            {pageTitle}
          </h1>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-card-bg p-2 px-4 rounded-xl border border-border-theme shadow-sm">
          {/* Company Filter */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 whitespace-nowrap">
              <Briefcase className="h-3.5 w-3.5" />
              Company:
            </span>
            <Select 
              options={companies}
              value={selectedCompanyId}
              onChange={(val) => setSelectedCompanyId(val || '')}
              placeholder="Select Company..."
              className="w-[200px]"
            />
          </div>

          <div className="w-[1px] h-8 bg-content-bg hidden md:block" />

          {/* Menu Type Filter */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 whitespace-nowrap">
              <Layers className="h-3.5 w-3.5" />
              Menu Type:
            </span>
            <select 
              value={selectedMenuType}
              onChange={(e) => setSelectedMenuType(e.target.value)}
              className="h-[42px] min-w-[160px] text-[11px] font-bold px-3 rounded-lg border border-border-theme bg-content-bg focus:ring-2 focus:ring-primary-100 outline-none cursor-pointer hover:bg-content-bg transition-colors"
            >
              {menuTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              {menuTypeOptions.length === 0 && (
                <>
                  <option value="admin_template">Admin Template</option>
                  <option value="user_app">User App</option>
                  <option value="agent_app">Agent App</option>
                  <option value="website">Website</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Left Column: Menu Tree */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-card-bg px-4 py-2 rounded-xl border border-border-theme shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={fetchMenuData}
                title="Reload Menu"
                className="h-8 w-8 p-0 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-border-theme"
              >
                <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Menu Tree</span>
            </div>
            
            {btnAddRoot?.visible && (
              <Button
                size="sm"
                onClick={addRootItem}
                className="h-8 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                {btnAddRoot.button_title}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCopyModalOpen(true)}
              className="h-8 border-primary-600/20 text-primary-600 bg-primary-600/5 hover:bg-primary-600/10 text-[10px] font-black uppercase tracking-widest gap-2 ml-2"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Menus
            </Button>
          </div>

          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-4 min-h-[500px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-32 text-text-muted/50 gap-3">
                <Loader className="h-8 w-8 text-primary-600 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">{loadingText}</span>
              </div>
            ) : (
              <MenuTree
                items={menuItems}
                onItemsChange={setMenuItems}
                onSelect={setSelectedItem}
                onAddChild={addChildItem}
                onReorder={handleReorder}
                onDelete={setItemToDelete}
                selectedId={selectedItem?.id}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
                onEnsureExpanded={handleEnsureExpanded}
              />
            )}
          </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden min-h-[500px] sticky top-20">
            <div className="px-5 py-3 border-b border-border-theme flex items-center justify-between bg-content-bg/50">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                  Configuration
                </h2>
                {selectedItem && (
                  <>
                    {btnAddRoot?.visible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addChildItem(selectedItem.id)}
                        className="h-7 px-2 sm:px-3 border border-primary-600/20 text-primary-600 bg-primary-600/10 hover:bg-primary-600/20 text-[9px] font-black uppercase tracking-widest gap-1.5 flex-shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline">Add Sub-menu</span>
                        <span className="sm:hidden">Sub</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              {btnFinalize?.visible && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="h-8 px-3 sm:px-6 bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm flex-shrink-0"
                >
                  <Save className={cn("h-3.5 w-3.5", saving && "animate-spin")} />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : btnFinalize.button_title}</span>
                </Button>
              )}
            </div>

            <div className="p-6">
              {selectedItem ? (
                <MenuItemForm
                  ref={formRef}
                  item={selectedItem}
                  menuTypeOptions={menuTypeOptions}
                  onCancel={() => setSelectedItem(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="bg-content-bg p-4 rounded-full mb-4">
                    <Settings className="h-8 w-8 text-text-muted/50" />
                  </div>
                  <h3 className="text-text-main font-bold text-sm">Select an Item</h3>
                  <p className="text-[11px] text-text-muted max-w-[200px] mt-1">
                    Pick a menu item from the tree on the left to customize its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description="Are you sure you want to delete this menu item? This action cannot be undone."
        loading={deleting}
        confirmVariant="danger"
        confirmLabel="Delete Item"
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
        details={[
          { label: 'Item Name', value: itemToDelete?.title || '' },
          { label: 'Item Type', value: itemToDelete?.type || '' },
          { label: 'URL Path', value: itemToDelete?.url || 'None' }
        ]}
        infoMessage={itemToDelete?.children && itemToDelete.children.length > 0
          ? "Warning: This item has sub-menus. Deleting it may also remove or orphan its children."
          : "This item will be permanently removed from the system navigation."}
        infoType={itemToDelete?.children && itemToDelete.children.length > 0 ? "warning" : "info"}
      />

      <CopyMenuModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        targetCompanyId={selectedCompanyId}
        menuType={selectedMenuType}
        onSuccess={fetchMenuData}
        toast={toast}
      />
    </div>
  );
}
