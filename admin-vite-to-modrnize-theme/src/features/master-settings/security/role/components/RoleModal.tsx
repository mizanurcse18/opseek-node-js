import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui-old/Tabs';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Info,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  Clock,
  FileText,
  Settings,
  HelpCircle,
  Shield,
  Loader,
  Loader2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { securityService } from '@/lib/auth/api/security.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { ApiPermissionModal } from './ApiPermissionModal';
import { Select } from '@/components/ui-old/Select';
import { RoleDynamicForm } from './RoleDynamicForm';


// Types for the permission tree based on backend schema
interface PermissionItem {
  SecurityRulePermissionID: number;
  SecurityRuleID: number;
  MenuID: number;
  Description: string;
  CanRead: boolean;
  CanCreate: boolean;
  CanUpdate: boolean;
  CanDelete: boolean;
  CanReport: boolean;
  ParentID: number;
  Icon: string;
  MenuType: string;
  RowVersion?: number;
  ObjectState?: number;
  children?: PermissionItem[];
  isOpen?: boolean;
}

interface ApiPermission {
  id: number;
  security_rule_id: number;
  menu_id: number;
  api_path_mapid: number;
  module: string;
  controller: string;
  api_path: string;
  button_id: string;
  button_title: string;
  action_type: string;
  has_permission?: boolean; // UI state for selection
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  isSuperUser?: boolean;
}

// INITIAL_PERMISSIONS removed - now dynamic

export function RoleModal({ isOpen, onClose, onSave, initialData, isSuperUser = false }: RoleModalProps) {
  const isEditing = !!(initialData?.security_rule_id || initialData?.rule_id || initialData?.RuleID);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [selectedMenuForApi, setSelectedMenuForApi] = useState<{ id: number, name: string } | null>(null);

  const { toast, ToastComponent } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    company_id: initialData?.company_id || initialData?.CompanyID || ''
  });
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [apiPermissions, setApiPermissions] = useState<ApiPermission[]>([]);
  const [originalApiPermissions, setOriginalApiPermissions] = useState<ApiPermission[]>([]);
  const [companies, setCompanies] = useState<{ value: string, label: string }[]>([]);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Save Role' },
    { button_id: 'btnEdit', button_title: 'Update Role' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const activeBtn = isEditing ? btnEdit : btnAdd;

  const buildTree = (flatData: PermissionItem[]): PermissionItem[] => {
    const itemMap = new Map<number, PermissionItem>();
    const roots: PermissionItem[] = [];

    // First pass: initialize the map
    flatData.forEach(item => {
      itemMap.set(item.MenuID, { ...item, children: [], isOpen: false });
    });

    // Second pass: build the tree
    flatData.forEach(item => {
      const node = itemMap.get(item.MenuID);
      if (node) {
        if (item.ParentID === 0 || !itemMap.has(item.ParentID)) {
          roots.push(node);
        } else {
          const parent = itemMap.get(item.ParentID);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          }
        }
      }
    });

    return roots;
  };

  // Effect 1: Initialize Form & Load Companies (runs only on open or rule change)
  useEffect(() => {
    const initializeData = async () => {
      if (!isOpen) return;

      const ruleId = initialData?.security_rule_id || 0;
      setLoading(true);

      try {
        // Fetch Master Rule Details if editing
        if (ruleId > 0) {
          const ruleResponse = await securityService.getSecurityRuleById(ruleId);
          if (ruleResponse?.data) {
            setFormData({
              name: ruleResponse.data.security_rule_name || '',
              description: ruleResponse.data.security_rule_description || '',
              isActive: ruleResponse.data.is_active !== undefined ? ruleResponse.data.is_active : true,
              company_id: ruleResponse.data.company_id || ruleResponse.data.CompanyID || ''
            });
          }
        } else {
          setFormData({ name: '', description: '', isActive: true, company_id: '' });
        }

        if (isSuperUser && companies.length === 0) {
          const rawCompanies = await companyService.getAllCompanies();
          if (rawCompanies && Array.isArray(rawCompanies)) {
            setCompanies(rawCompanies.map((c: any) => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id || '?'}`
            })));
          }
        }
      } catch (error) {
        console.error("Failed to initialize role modal:", error);
        toast({ title: 'Error', description: 'Failed to load role details.', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [initialData?.security_rule_id, isOpen]);

  // Effect 2: Load Permissions (runs on open or when company_id changes for superuser)
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isOpen) return;

      // If superuser hasn't selected a company yet, clear permissions and wait
      if (isSuperUser && !formData.company_id) {
        setPermissions([]);
        return;
      }

      const ruleId = initialData?.security_rule_id || 0;
      setLoading(true);

      try {
        let permResponse;
        if (isSuperUser) {
          permResponse = await securityService.getPermissionListSuper(ruleId, formData.company_id);
        } else {
          permResponse = await securityService.getPermissionList(ruleId);
        }

        if (permResponse?.data) {
          const result = typeof permResponse.data === 'string' ? JSON.parse(permResponse.data) : permResponse.data;

          const menuData = (result.menu_permission_list || []).map((m: any) => ({
            ...m,
            MenuType: m.MenuType || m.menu_type || 'Unknown'
          }));
          const apiData = (result.api_path_permission_list || []).map((p: any) => ({
            ...p,
            has_permission: !!(p.has_permission === true || p.has_permission === 'true' || (typeof p.has_permission === 'object' && Object.keys(p.has_permission || {}).length > 0))
          })).map((p: any) => ({
            ...p,
            has_permission: typeof p.has_permission === 'boolean' ? p.has_permission : false
          }));

          setPermissions(buildTree(menuData));
          setApiPermissions(apiData);
          setOriginalApiPermissions(JSON.parse(JSON.stringify(apiData))); // Store deep copy for comparison
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        toast({ title: 'Error', description: 'Failed to load menu permissions.', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [initialData?.security_rule_id, isOpen, formData.company_id, isSuperUser]);

  const togglePermission = (menuId: number, type: keyof PermissionItem, value: boolean) => {
    const updateRecursive = (items: PermissionItem[]): PermissionItem[] => {
      return items.map(item => {
        if (item.MenuID === menuId) {
          const newItem = {
            ...item,
            [type]: value,
            ObjectState: item.ObjectState === 2 ? 2 : 4 // Maintain Insert state or mark as Modified
          };

          // Cascading permissions to children
          if (newItem.children) {
            const cascadeChildren = (children: PermissionItem[]): PermissionItem[] => {
              return children.map(child => ({
                ...child,
                [type]: value,
                ObjectState: child.ObjectState === 2 ? 2 : 4,
                children: child.children ? cascadeChildren(child.children) : []
              }));
            };
            newItem.children = cascadeChildren(newItem.children);
          }
          return newItem;
        }

        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }

        return item;
      });
    };

    setPermissions(updateRecursive(permissions));
  };

  const toggleGroupOpen = (menuId: number) => {
    const updateRecursive = (items: PermissionItem[]): PermissionItem[] => {
      return items.map(item => {
        if (item.MenuID === menuId) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    setPermissions(updateRecursive(permissions));
  };

  const flattenPermissions = (items: PermissionItem[]): any[] => {
    let flat: any[] = [];
    items.forEach(item => {
      // Map ObjectState to RowEditorStatus string as requested
      const status = item.SecurityRulePermissionID === 0 ? "inserted" : (item.ObjectState === 4 ? "updated" : "unchanged");

      flat.push({
        SecurityRulePermissionID: item.SecurityRulePermissionID,
        SecurityRuleID: item.SecurityRuleID,
        MenuID: item.MenuID,
        Description: item.Description,
        CanRead: item.CanRead,
        CanCreate: item.CanCreate,
        CanUpdate: item.CanUpdate,
        CanDelete: item.CanDelete,
        CanReport: item.CanReport,
        ParentID: item.ParentID,
        Icon: item.Icon,
        RowVersion: item.RowVersion || 1,
        RowEditorStatus: status
      });

      if (item.children && item.children.length > 0) {
        flat = [...flat, ...flattenPermissions(item.children)];
      }
    });
    return flat;
  };

  const handleSave = async () => {

    if (!formData.name.trim()) {
      setActiveTab('basic');
      // Use setTimeout to ensure tab content is rendered before focusing
      setTimeout(() => {
        const input = document.getElementById('role-name-input') as HTMLInputElement;
        if (input) input.reportValidity();
      }, 0);
      return;
    }

    if (isSuperUser && !formData.company_id) {
      toast({ title: 'Error', description: 'Company selection is required for Super User', status: 'error' });
      return;
    }

    const ruleId = initialData?.security_rule_id || 0;

    // Helper for unique key matching
    const getApiId = (p: any) => `${p.menu_id}-${p.api_path_mapid}-${p.button_id}`;

    // Send ALL permissions to the backend. The backend uses the has_permission flag 
    // to determine which items to insert/update/delete.
    const ApiPathPermissionList = apiPermissions
      .map(item => ({
        ...item,
        security_rule_id: ruleId,
        RowEditorStatus: item.id > 0 ? "updated" : "inserted"
      }));

    const payload = {
      Master: {
        SecurityRuleID: ruleId,
        SecurityRuleName: formData.name,
        SecurityRuleDescription: formData.description,
        ApplicationID: 1, // Default App ID
        RowEditorStatus: ruleId === 0 ? "inserted" : "updated",
        ...(isSuperUser && { CompanyID: formData.company_id })
      },
      ChildModels: flattenPermissions(permissions),
      ApiPathPermissionList
    };

    setIsSaving(true);
    try {
      const response = isSuperUser
        ? await securityService.saveSecurityRuleSuper(payload)
        : await securityService.saveSecurityRule(payload);

      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({
          title: 'Success',
          description: response.message || 'Role saved successfully.',
          status: 'success'
        });

        // Wait a brief moment to show toast then notify parent and close
        setTimeout(() => {
          onSave(response.data);
          onClose();
        }, 800);
      } else {
        const error = handleApiError(response);
        toast(error);
      }
    } catch (error: any) {
      toast(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const headerActionButton = activeBtn?.visible && (
    <Button
      onClick={handleSave}
      size="sm"
      disabled={isSaving || loading}
      className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-4 whitespace-nowrap"
    >
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest text-white">
        {isSaving ? 'Saving...' : activeBtn.button_title}
      </span>
    </Button>
  );

  const renderPermissionRow = (item: PermissionItem, depth = 0) => {
    const IconComp = (Icons as any)[item.Icon];

    return (
      <React.Fragment key={item.MenuID}>
        <tr className={cn(
          "border-b border-border-theme hover:bg-content-bg/50 transition-colors group",
          depth > 0 && "bg-content-bg/20"
        )}>
          <td className="py-2.5 pl-4 pr-3">
            <div className="flex items-center" style={{ marginLeft: `${depth * 24}px` }}>
              {item.children && item.children.length > 0 ? (
                <button
                  onClick={() => toggleGroupOpen(item.MenuID)}
                  className="p-1 hover:bg-gray-200 rounded mr-1 transition-colors"
                >
                  {item.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="w-6" />
              )}
              {IconComp && <IconComp className="h-4 w-4 mr-2 text-text-muted group-hover:text-primary-600 transition-colors" />}
              <span className={cn(
                "text-sm capitalize",
                depth === 0 ? "font-bold text-text-main" : "font-medium text-text-main"
              )}>{item.Description}</span>
            </div>
          </td>
          <td className="px-3 py-2 text-center align-middle">
            <div className="flex justify-center items-center h-full">
              <Checkbox
                checked={!!item.CanRead}
                onCheckedChange={(val) => togglePermission(item.MenuID, 'CanRead', val)}
                className="scale-90"
              />
            </div>
          </td>
          <td className="px-3 py-2 text-center align-middle">
            <div className="flex justify-center items-center h-full">
              <div className="relative group/api">
                <button
                  type="button"
                  disabled={!item.CanRead}
                  onClick={() => {
                    if (!item.CanRead) return;
                    setSelectedMenuForApi({ id: item.MenuID, name: item.Description });
                    setApiModalOpen(true);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg border transition-all hover:scale-110 active:scale-95 shadow-sm relative",
                    item.CanRead
                      ? "bg-content-bg hover:bg-primary-50 text-text-muted/50 hover:text-primary-600 border-border-theme"
                      : "bg-content-bg/50 text-gray-200 border-gray-50 cursor-not-allowed grayscale"
                  )}
                  title={(() => {
                    if (!item.CanRead) return "Enable 'View' to manage API access";
                    const selected = apiPermissions.filter(p => p.menu_id === item.MenuID && p.has_permission);
                    if (selected.length > 0) {
                      return `Active: ${selected.map(p => p.button_title || p.action_type).join(', ')}`;
                    }
                    return "Manage API Permissions";
                  })()}
                >
                  <Icons.Link className="h-3.5 w-3.5" />

                  {(() => {
                    const selectedCount = apiPermissions.filter(p => p.menu_id === item.MenuID && p.has_permission).length;
                    if (selectedCount > 0) {
                      return (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[8px] font-black text-white border border-white shadow-sm ring-1 ring-[#3b2768]/20 animate-in zoom-in duration-300">
                          {selectedCount}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>
              </div>
            </div>
          </td>
        </tr>
        {item.children && item.isOpen && item.children.map(child => renderPermissionRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Role" : "Create New Role"}
      headerAction={headerActionButton}
      className="max-w-5xl"
    >
      <div className="min-h-[500px] max-h-[75vh] overflow-y-auto no-scrollbar pr-1 space-y-8 py-2">
        {/* Section 1: Basic Info */}
        <div className="bg-content-bg/30 p-6 rounded-2xl border border-border-theme/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-600">
              <Info className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isSuperUser && (
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-bold text-text-main ml-1 flex items-center gap-1">
                  Company
                  <span className="text-red-500 font-black">*</span>
                </label>
                <Select
                  options={companies}
                  value={formData.company_id}
                  onChange={(val) => setFormData({ ...formData, company_id: val })}
                  placeholder="Select a company"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 flex items-center gap-1">
                Role Name
                <span className="text-red-500 font-black">*</span>
              </label>
              <Input
                id="role-name-input"
                placeholder="Enter role name (e.g. Sales Manager)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1">Description</label>
              <Input
                placeholder="Briefly describe role responsibilities..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Permissions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Menu Permissions</h3>
          </div>

          <div className="rounded-xl border border-border-theme shadow-sm bg-white overflow-x-auto no-scrollbar relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="h-8 w-8 animate-spin text-primary-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Loading Permissions...</span>
                </div>
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-[#f8f9fc] border-b border-border-theme">
                <tr>
                  <th className="py-4 pl-4 pr-3 text-sm font-black text-text-main uppercase tracking-widest w-[60%] min-w-[200px]">Menu List</th>
                  <th className="px-2 py-4 text-center text-[10px] sm:text-xs font-black text-text-main uppercase tracking-widest">View</th>
                  <th className="px-2 py-4 text-center text-[10px] sm:text-xs font-black text-text-main uppercase tracking-widest">API Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groups = permissions.reduce((acc, item) => {
                    const type = item.MenuType || 'General';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(item);
                    return acc;
                  }, {} as Record<string, PermissionItem[]>);

                  const sortedTypes = Object.keys(groups).sort();
                  const formatLabel = (str: string) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                  return sortedTypes.map(type => (
                    <React.Fragment key={type}>
                      <tr className="bg-content-bg/50 border-y border-border-theme/80">
                        <td colSpan={3} className="px-4 py-2">
                          <button
                            onClick={() => setCollapsedSections(prev => ({ ...prev, [type]: !prev[type] }))}
                            className="flex items-center gap-2 group/header w-full focus:outline-none"
                          >
                            <div className={cn(
                              "h-5 w-5 rounded flex items-center justify-center transition-all",
                              collapsedSections[type] ? "bg-gray-200 text-text-muted" : "bg-primary-600/10 text-primary-600"
                            )}>
                              {collapsedSections[type] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
                              {formatLabel(type)}
                            </span>
                            <div className="flex-1 h-[1px] bg-gradient-to-r from-[#3b2768]/10 to-transparent ml-2" />
                          </button>
                        </td>
                      </tr>
                      {!collapsedSections[type] && groups[type].map(item => renderPermissionRow(item))}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ToastComponent />

      {apiModalOpen && selectedMenuForApi && (
        <ApiPermissionModal
          isOpen={apiModalOpen}
          onClose={() => setApiModalOpen(false)}
          menuName={selectedMenuForApi.name}
          initialPermissions={apiPermissions.filter(p => p.menu_id === selectedMenuForApi.id)}
          onApply={(updated) => {
            const otherMenus = apiPermissions.filter(p => p.menu_id !== selectedMenuForApi.id);
            setApiPermissions([...otherMenus, ...updated]);
            setApiModalOpen(false);
          }}
        />
      )}
    </Modal>
  );
}
