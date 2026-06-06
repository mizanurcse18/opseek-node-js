import React, { useState, useEffect } from 'react';
import { Copy, X, Loader, Search, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, Option } from '@/components/ui/Select';
import { securityService } from '@/lib/auth/api/security.service';
import { cn } from '@/lib/utils';

interface MenuItem {
  menu_id: number;
  parent_id: number;
  title: string;
  children?: MenuItem[];
}

interface CopyMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCompanyId: string | number;
  menuType: string;
  onSuccess: () => void;
  toast: any;
}

export const CopyMenuModal: React.FC<CopyMenuModalProps> = ({
  isOpen,
  onClose,
  targetCompanyId,
  menuType,
  onSuccess,
  toast
}) => {
  const [companies, setCompanies] = useState<Option[]>([]);
  const [selectedSourceCompanyId, setSelectedSourceCompanyId] = useState<string>('');
  const [sourceMenus, setSourceMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    } else {
      // Reset state on close
      setSelectedSourceCompanyId('');
      setSourceMenus([]);
      setSelectedMenuIds(new Set());
      setExpandedIds(new Set());
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    try {
      const data = await securityService.getAllCompaniesCombo();
      const mapped = data.map((c: any) => ({
        value: String(c.value ?? c.id ?? c.company_id ?? ''),
        label: c.label ?? c.name ?? c.company_name ?? 'Unknown'
      })).filter((c: any) => String(c.value) !== String(targetCompanyId));
      setCompanies(mapped);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchSourceMenus = async (companyId: string) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await securityService.getMenuData(menuType, companyId);
      const rawData = res?.data?.data || res?.data || [];
      const flatData = Array.isArray(rawData) ? rawData : [];
      
      const normalized = flatData.map((m: any) => ({
        menu_id: Number(m.menu_id),
        parent_id: Number(m.parent_id),
        title: m.title || 'Unknown'
      }));

      setSourceMenus(buildTree(normalized));
    } catch (error) {
      console.error('Failed to fetch source menus:', error);
      toast({ title: 'Error', description: 'Failed to load source menus.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (flat: any[]): MenuItem[] => {
    const map = new Map<number, MenuItem>();
    const roots: MenuItem[] = [];
    flat.forEach(m => map.set(m.menu_id, { ...m, children: [] }));
    flat.forEach(m => {
      const node = map.get(m.menu_id);
      if (m.parent_id === 0) roots.push(node!);
      else {
        const parent = map.get(m.parent_id);
        if (parent) parent.children?.push(node!);
        else roots.push(node!);
      }
    });
    return roots;
  };

  const toggleSelection = (menuId: number, children: MenuItem[] = []) => {
    setSelectedMenuIds(prev => {
      const next = new Set(prev);
      const isSelecting = !next.has(menuId);
      
      const processRecursive = (id: number, subItems: MenuItem[], select: boolean) => {
        if (select) next.add(id);
        else next.delete(id);
        subItems.forEach(child => processRecursive(child.menu_id, child.children || [], select));
      };

      processRecursive(menuId, children, isSelecting);
      return next;
    });
  };

  const toggleExpand = (menuId: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  };

  const handleCopy = async () => {
    if (selectedMenuIds.size === 0) {
      toast({ title: 'Warning', description: 'Please select at least one menu to copy.', status: 'warning' });
      return;
    }

    setCopying(true);
    try {
      await securityService.copyMenus({
        SourceCompanyId: selectedSourceCompanyId,
        TargetCompanyId: String(targetCompanyId),
        MenuType: menuType,
        SelectedMenuIds: Array.from(selectedMenuIds)
      });

      toast({ title: 'Success', description: 'Menus copied successfully.', status: 'success' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Copy failed:', error);
      toast({ title: 'Error', description: 'Failed to copy menus.', status: 'error' });
    } finally {
      setCopying(false);
    }
  };

  if (!isOpen) return null;

  const renderTree = (items: MenuItem[], level = 0) => {
    return items.map(item => {
      const isExpanded = expandedIds.has(item.menu_id);
      const isSelected = selectedMenuIds.has(item.menu_id);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.menu_id} className="flex flex-col">
          <div 
            className={cn(
              "flex items-center py-1.5 px-2 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors group",
              isSelected && "bg-primary-50/50"
            )}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            <div 
              className="w-5 h-5 flex items-center justify-center mr-1 text-slate-400 hover:text-primary-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpand(item.menu_id);
              }}
            >
              {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </div>
            
            <div 
              className="flex-1 flex items-center gap-2"
              onClick={() => toggleSelection(item.menu_id, item.children)}
            >
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                isSelected ? "bg-primary-600 border-primary-600 text-white" : "border-slate-300 bg-white"
              )}>
                {isSelected && <CheckCircle2 size={10} />}
              </div>
              <span className={cn(
                "text-[11px] font-bold tracking-tight",
                isSelected ? "text-primary-700" : "text-slate-600"
              )}>
                {item.title}
              </span>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="flex flex-col">
              {renderTree(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <Copy size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Copy Menus</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Clone structure from another company</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-hidden">
          {/* Company Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary-600 ml-1">Source Company</label>
            <Select
              options={companies}
              value={selectedSourceCompanyId}
              onChange={(val) => {
                setSelectedSourceCompanyId(val ? String(val) : '');
                fetchSourceMenus(val ? String(val) : '');
              }}
              placeholder="Select company to copy from..."
              className="w-full"
            />
          </div>

          {/* Menu Selection List */}
          <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary-600">Select Menus</label>
              {sourceMenus.length > 0 && (
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedMenuIds.size} selected
                </span>
              )}
            </div>
            
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-y-auto p-2 min-h-[200px] no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 gap-3">
                  <Loader className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Fetching Menus...</span>
                </div>
              ) : selectedSourceCompanyId ? (
                sourceMenus.length > 0 ? (
                  renderTree(sourceMenus)
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 opacity-60">
                    <Search className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No menus found in this company</span>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 opacity-60">
                  <Copy className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Select a company first</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={copying || loading || !selectedSourceCompanyId || selectedMenuIds.size === 0}
            className="bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-primary-600/20 gap-2"
          >
            {copying ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            {copying ? 'Copying...' : 'Copy Selected Menus'}
          </Button>
        </div>
      </div>
    </div>
  );
};
