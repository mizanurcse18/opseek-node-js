import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Type, 
  Link as LinkIcon, 
  Search, 
  Eye,
  EyeOff,
  Layout,
  ExternalLink,
  Layers,
  Hash,
  Globe,
  LucideIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  RotateCcw,
  Loader,
  Download,
  Upload
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { securityService } from '@/lib/auth/api/security.service';
import { SuggestInput } from '@/components/ui/SuggestInput';
import { getUniqueValues, ACTION_TYPE_DEFAULTS, COMMON_MODULES } from '@/lib/suggestion-utils';

import { MenuItem } from './MenuTree';
import { Option } from '@/components/ui-old/Select';

const ICON_SELECTION = [
  'LayoutDashboard', 'Users', 'Shield', 'Settings', 'Settings2', 'Sliders', 'Building2', 'Database',
  'Map', 'Landmark', 'MapPin', 'FileText', 'ClipboardList', 'List',
  'PlusCircle', 'PlusSquare', 'Plus', 'History', 'Key', 'Lock',
  'BarChart2', 'PieChart', 'Home', 'Link', 'ExternalLink', 'Send',
  'Briefcase', 'Package', 'ShoppingBag', 'UserCheck', 'Menu', 'Globe', 'Zap',
  'Smartphone', 'Wallet', 'Banknote', 'CreditCard', 'ArrowRightLeft', 'Activity',
  'Fingerprint', 'Monitor', 'Cpu', 'HardDrive', 'Factory', 'Truck', 'Warehouse', 'Scale',
  'Calculator', 'BookOpen', 'ClipboardCheck', 'GitMerge', 'Network', 'FileClock',
  'Bell', 'BellRing', 'BellOff', 'AlarmClock', 'Timer', 'Clock', 'Calendar', 'CalendarPlus',
  'CalendarCheck', 'CalendarDays', 'CalendarX', 'CalendarRange', 'CalendarClock',
  'MessageCircle', 'MessageSquare', 'MessagesSquare', 'Chat', 'CommentText', 'Mail', 'MailPlus',
  'MailOpen', 'Inbox', 'SendHorizonal', 'Reply', 'ReplyAll', 'Forward',
  'Search', 'ZoomIn', 'ZoomOut', 'Filter', 'SlidersHorizontal', 'ToggleLeft', 'ToggleRight',
  'Sun', 'Moon', 'Cloud', 'CloudSun', 'CloudMoon', 'CloudRain', 'CloudSnow', 'CloudLightning',
  'Eye', 'EyeOff', 'Ear', 'EarOff', 'Scan', 'ScanFace', 'ScanLine', 'QrCode', 'Barcode',
  'Printer', 'Upload', 'Download', 'Image', 'Camera', 'Video', 'Music', 'Mic', 'Volume',
  'Volume1', 'Volume2', 'VolumeX', 'Headphones', 'Radio', 'Disc', 'Film', 'Clapperboard',
  'Book', 'BookMarked', 'BookPlus', 'Library', 'Notebook', 'NotebookPen', 'NotebookTabs',
  'StickyNote', 'Pen', 'PenLine', 'Pencil', 'Eraser', 'Highlighter', 'Paintbrush', 'Palette',
  'SwatchBook', 'Wand', 'SprayCan', 'Spline', 'Scissors', 'Ruler', 'Compass', 'Target',
  'Crosshair', 'Swords', 'ShieldCheck', 'ShieldOff', 'ShieldPlus', 'ShieldQuestion',
  'Award', 'Medal', 'Trophy', 'Star', 'Heart', 'ThumbsUp', 'ThumbsDown', 'Flag', 'FlagOff',
  'Bookmark', 'BookmarkPlus', 'BookmarkMinus', 'BookmarkCheck', 'Tag', 'Tags', 'PriceTag',
  'BadgeCheck', 'BadgeInfo', 'BadgeAlert', 'BadgeX', 'BadgePlus', 'BadgeMinus',
  'Check', 'CheckCircle', 'CheckSquare', 'X', 'XCircle', 'XSquare', 'Minus', 'MinusCircle',
  'AlertCircle', 'AlertTriangle', 'AlertOctagon', 'Info', 'HelpCircle', 'Question',
  'Trash', 'Trash2', 'TrashX', 'Delete', 'Undo', 'Redo', 'RotateCcw', 'RotateCw',
  'RefreshCcw', 'RefreshCw', 'Sync', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ArrowUpDown', 'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
  'ChevronsUpDown', 'ChevronsLeftRight', 'Move', 'Maximize', 'Minimize', 'Expand', 'Collapse',
  'Grid', 'Grid2x2', 'Grid3x3', 'Rows', 'Columns', 'Table', 'Tablets', 'AppWindow',
  'Window', 'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom', 'Sidebar', 'SidebarClose',
  'SidebarOpen', 'Dock', 'ScreenShare', 'Share', 'Share2', 'Copy', 'CopyCheck', 'CopyPlus',
  'CopyMinus', 'CopyX', 'Clipboard', 'ClipboardPlus', 'ClipboardMinus', 'ClipboardX',
  'ClipboardCopy', 'ClipboardCheck', 'ClipboardPaste', 'ClipboardEdit',
];

import { ImportApiPathModal } from './ImportApiPathModal';

export interface MenuItemFormHandle {
  getFormData: () => MenuItem;
  validate: () => Promise<boolean>;
}

interface MenuItemFormProps {
  item: MenuItem | null;
  menuTypeOptions: Option[];
  onCancel: () => void;
}

const MenuItemForm = forwardRef<MenuItemFormHandle, MenuItemFormProps>(({ item, menuTypeOptions, onCancel }, ref) => {
  const [showApiMap, setShowApiMap] = React.useState(false);
  const [loadingMaps, setLoadingMaps] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [filterController, setFilterController] = React.useState('');
  const [filterApiPath, setFilterApiPath] = React.useState('');
  const [quickAddPath, setQuickAddPath] = React.useState('');
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [filterIcon, setFilterIcon] = React.useState('');
  
  const { register, reset, watch, setValue, getValues, trigger, control, formState: { errors } } = useForm<MenuItem>({
    defaultValues: item || {
      menu_id: 0,
      parent_id: 0,
      application_id: 0,
      id: '',
      title: '',
      translate: '',
      type: 'item',
      icon: 'Circle',
      url: '',
      target: '_self',
      is_visible: true,
      sequence_no: 0,
      children: [],
      row_editor_status: 'insert',
      menu_type: 'admin_template',
      company_id: '',
      apiPathMaps: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "apiPathMaps"
  });

  const apiPathMapsValues = watch('apiPathMaps') || [];

  useImperativeHandle(ref, () => ({
    getFormData: () => getValues(),
    validate: () => trigger()
  }));

  const watchTitle = watch('title');
  const watchMenuId = watch('menu_id');
  const watchCompanyId = watch('company_id');
  const watchType = watch('type');
  const selectedIcon = watch('icon');

  const filteredIcons = filterIcon
    ? ICON_SELECTION.filter(name => name.toLowerCase().includes(filterIcon.toLowerCase()))
    : ICON_SELECTION;

  useEffect(() => {
    if (item) {
      reset(item);
    }
  }, [item, reset]);

  // Sync translate and auto-generate UI Unique ID
  useEffect(() => {
    // 1. Sync translation with title
    setValue('translate', watchTitle);
    
    // 2. Auto-generate UI Unique ID: [company]-[title]-[menuid]
    if (watchTitle || watchMenuId) {
      const slug = (str: string) => str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const companySlug = slug(String(watchCompanyId || ''));
      const titleSlug = slug(watchTitle || '');
      const generatedId = [companySlug, titleSlug, watchMenuId].filter(Boolean).join('-');
      
      setValue('id', generatedId);
    }
  }, [watchTitle, watchMenuId, watchCompanyId, setValue]);

  // Fetch API Path Maps for existing items
  useEffect(() => {
    const fetchApiMaps = async () => {
      if (item && item.menu_id > 0) {
        setLoadingMaps(true);
        try {
          const response = await securityService.getApiPathMap(item.menu_id);
          if (response?.data) {
            let apiMaps = [];
            try {
               apiMaps = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            } catch (e) {
               apiMaps = response.data;
            }
            
            if (Array.isArray(apiMaps)) {
              const mappedData = apiMaps.map((m: any) => ({
                ...m,
                mapid: m.map_id ?? m.mapid ?? 0,
                row_editor_status: 'update'
              }));
              setValue('apiPathMaps', mappedData);
            }
          }
        } catch (error) {
          console.error('Failed to fetch API path maps:', error);
        } finally {
          setLoadingMaps(false);
        }
      }
    };

    fetchApiMaps();
  }, [item?.menu_id, setValue]);

  // Dynamic suggestions for API Map fields
  const apiMapsWatch = watch('apiPathMaps') || [];
  const moduleSuggestions = [...COMMON_MODULES, ...getUniqueValues(apiMapsWatch, 'module')];
  const controllerSuggestions = getUniqueValues(apiMapsWatch, 'controller');
  const pathSuggestions = getUniqueValues(apiMapsWatch, 'api_path');
  const actionSuggestions = [...ACTION_TYPE_DEFAULTS, ...getUniqueValues(apiMapsWatch, 'action_type')];

  // Helper: Export Grid Data to CSV
  const downloadCSV = () => {
    const currentMenuId = getValues('menu_id') || 0;
    const items = (getValues('apiPathMaps') || []).filter((x: any) => x.row_editor_status !== 'deleted');
    const headers = ['menu_id', 'module', 'controller', 'api_path', 'action_type', 'button_id', 'button_title'];
    const csvRows = [headers.join(',')];

    for (const item of items) {
      const row = [
        currentMenuId,
        `"${(item.module || '').replace(/"/g, '""')}"`,
        `"${(item.controller || '').replace(/"/g, '""')}"`,
        `"${(item.api_path || '').replace(/"/g, '""')}"`,
        `"${(item.action_type || 'api').replace(/"/g, '""')}"`,
        `"${(item.button_id || '').replace(/"/g, '""')}"`,
        `"${(item.button_title || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const menuName = (getValues('title') || 'menu')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `menu_api_paths_${menuName}_${currentMenuId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Download a sample template CSV
  const downloadTemplate = () => {
    const headers = ['menu_id', 'module', 'controller', 'api_path', 'action_type', 'button_id', 'button_title'];
    const sampleRow = [
      getValues('menu_id') || 0,
      'auth',
      'user',
      '/api/v1/auth/user/login',
      'api',
      '',
      ''
    ];
    const csvRows = [headers.join(','), sampleRow.join(',')];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'api_path_map_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Import mappings from CSV
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (lines.length <= 1) return; // Only headers or empty

      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const importedRows: any[] = [];
      const currentMenuId = getValues('menu_id') || 0;

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = values[index];
        });

        // Map fields to correct format
        importedRows.push({
          mapid: 0,
          menu_id: currentMenuId,
          module: rowObj.module || '',
          controller: rowObj.controller || '',
          api_path: rowObj.api_path || '',
          action_type: rowObj.action_type || 'api',
          button_id: rowObj.button_id || '',
          button_title: rowObj.button_title || '',
          row_version: '',
          row_editor_status: 'insert'
        });
      }

      if (importedRows.length > 0) {
        importedRows.forEach(row => append(row));
      }
      
      // Clear input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Helper: Quick Add parsed API Path
  const handleQuickAdd = () => {
    if (!quickAddPath.trim()) return;

    let cleanPath = quickAddPath.trim();
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }
    if (cleanPath.toLowerCase().startsWith('api/v1/')) {
      cleanPath = cleanPath.slice(7);
    }

    const parts = cleanPath.split('/');
    const module = parts[0] || '';
    const controller = parts[1] || '';
    const api_path = parts.slice(2).join('/') || '';

    append({
      mapid: 0,
      menu_id: getValues('menu_id'),
      module: module,
      controller: controller,
      api_path: api_path,
      action_type: 'api',
      button_id: '',
      button_title: '',
      row_version: '',
      row_editor_status: 'insert'
    });

    setQuickAddPath(''); // Clear input
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
        
        {/* IDs & Core Identity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5 hidden">
            <input {...register('parent_id')} type="hidden" />
            <input {...register('sequence_no', { valueAsNumber: true })} type="hidden" />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              Menu ID
            </Label>
            <Input 
              type="number"
              {...register('menu_id', { required: true, valueAsNumber: true })}
              placeholder="Enter ID"
              className="h-8 text-[11px] font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5">
              <Type className="h-3 w-3" />
              Menu Title
            </Label>
            <Input 
              {...register('title', { required: true })}
              placeholder="e.g. Dashboard"
              className="h-8 text-[11px] font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <Type className="h-3 w-3" />
              UI Unique ID
            </Label>
            <Input 
              {...register('id', { required: true })}
              readOnly
              placeholder="Auto-generated ID"
              className="h-8 text-[11px] font-bold bg-content-bg text-text-muted"
            />
          </div>
        </div>

        {/* Translation & Menu Type & Company */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted/50 flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Translation Key
            </Label>
            <Input 
              {...register('translate')}
              readOnly
              className="h-8 bg-content-bg text-[11px] font-medium border-border-theme"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              Menu Type
            </Label>
            <select 
              {...register('menu_type')}
              disabled
              className="w-full h-8 text-[11px] font-bold px-2 rounded-md border border-border-theme bg-content-bg text-text-muted cursor-not-allowed outline-none"
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

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              Company ID
            </Label>
            <Input 
              {...register('company_id')}
              disabled
              className="h-8 bg-content-bg text-[11px] font-bold text-text-muted cursor-not-allowed border-border-theme"
            />
          </div>
        </div>

        {/* Type & URL & Target */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <Layout className="h-3 w-3" />
              Navigation Type
            </Label>
            <select 
              {...register('type')}
              className="w-full h-8 text-[11px] font-bold px-2 rounded-md border border-border-theme bg-card-bg text-text-main focus:ring-1 focus:ring-primary-600/20 focus:border-primary-600/50 transition-all outline-none"
            >
              <option value="item">Item (Route)</option>
              <option value="collapse">Collapse (Sub-menus)</option>
              <option value="group">Group (Header)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className={cn(
              "text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
              watchType === 'item' ? "text-primary-600" : "text-gray-300"
            )}>
              <LinkIcon className="h-3 w-3" />
              Route Path
            </Label>
            <Input 
              {...register('url', { required: watchType === 'item' })}
              disabled={watchType !== 'item'}
              placeholder={watchType === 'item' ? "/path" : "No URL for " + watchType}
              className={cn(
                "h-8 text-[11px] font-bold",
                watchType !== 'item' && "bg-content-bg/50 opacity-50"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <ExternalLink className="h-3 w-3" />
              Link Target
            </Label>
            <select 
              {...register('target')}
              className="w-full h-8 text-[11px] font-bold px-2 rounded-md border border-border-theme bg-card-bg text-text-main focus:ring-1 focus:ring-primary-600/20 outline-none"
            >
              <option value="_self">_self (Same Frame)</option>
              <option value="_blank">_blank (New Tab)</option>
              <option value="_parent">_parent (Parent Frame)</option>
              <option value="_top">_top (Full Window)</option>
            </select>
          </div>
        </div>

        {/* Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-3 bg-content-bg/50 p-2 rounded-lg border border-border-theme mt-5">
             <div className="flex-1">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-text-main">Visibility</h4>
             </div>
             <button
               type="button"
               onClick={() => setValue('is_visible', !watch('is_visible'))}
               className={cn(
                 "relative inline-flex h-4 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                 watch('is_visible') ? 'bg-emerald-500' : 'bg-border-theme'
               )}
             >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    watch('is_visible') ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
             </button>
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-2 pt-2 border-t border-border-theme">
          <div className="flex items-center gap-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 shrink-0">
              <Search className="h-3 w-3" />
              Pick Visual Icon
            </Label>
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted/50 pointer-events-none" />
              <input
                type="text"
                value={filterIcon}
                onChange={(e) => setFilterIcon(e.target.value)}
                placeholder="Search icons..."
                className="w-full h-8 pl-7 pr-3 text-[10px] font-bold border border-border-theme rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-600/30 focus:border-primary-600/50 bg-content-bg placeholder:text-text-muted/40 text-text-main"
              />
            </div>
            {selectedIcon && selectedIcon !== 'Circle' && (
              <div className="flex items-center gap-1.5 shrink-0 bg-primary-600/5 border border-primary-600/20 rounded-lg px-2 py-1">
                {(() => { const Sel = (Icons as any)[selectedIcon] as LucideIcon; return Sel ? <Sel className="h-3 w-3 text-primary-600" /> : null; })()}
                <span className="text-[8px] font-black uppercase text-primary-600">{selectedIcon}</span>
              </div>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto no-scrollbar border border-border-theme rounded-lg p-2 bg-content-bg/30">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
              {filteredIcons.length === 0 ? (
                <div className="col-span-full text-center py-6">
                  <p className="text-[10px] text-text-muted/50 font-medium italic">No icons match your search.</p>
                </div>
              ) : filteredIcons.map(iconName => {
                const IconComp = (Icons as any)[iconName] as LucideIcon;
                const isSelected = selectedIcon === iconName;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setValue('icon', iconName)}
                    className={cn(
                      "flex flex-col items-center justify-center p-1.5 rounded-md border transition-all hover:bg-primary-600/10 hover:border-primary-600/30 gap-1",
                      isSelected
                        ? "bg-primary-600 border-primary-600 text-white shadow-md scale-105 z-10"
                        : "bg-content-bg border-border-theme text-text-main/40 hover:text-text-main"
                    )}
                    title={iconName}
                  >
                    {IconComp && <IconComp className={cn("h-5 w-5", isSelected ? "animate-in zoom-in-50 duration-300" : "")} />}
                    <span className={cn(
                      "text-[8px] font-mono leading-none max-w-full truncate",
                      isSelected ? "text-white/90" : "text-text-muted"
                    )}>
                      {iconName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[7px] text-text-muted/40 font-medium text-right">{filteredIcons.length} icons</p>
        </div>

        {/* API Path Map Section */}
        <div className="pt-2 border-t border-border-theme">
            <button
             type="button"
             onClick={() => setShowApiMap(!showApiMap)}
             className="flex items-center justify-between w-full py-2 group"
           >
                <div className="flex flex-wrap items-center gap-2">
                   <Label className="text-[9px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 cursor-pointer mr-2">
                     <Settings className="h-3 w-3" />
                     API Path Map Grid
                     <span className="bg-primary-600/10 text-primary-600 px-1.5 rounded-full text-[8px] ml-1">
                       {fields.length}
                     </span>
                   </Label>
                   
                   {/* System DB Mapped Import */}
                   <Button
                     type="button"
                     size="sm"
                     variant="ghost"
                     onClick={(e) => {
                        e.stopPropagation();
                        setIsImportModalOpen(true);
                        if (!showApiMap) setShowApiMap(true);
                     }}
                     className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-primary-600 bg-primary-600/5 hover:bg-primary-600/10 border border-primary-600/20 gap-1"
                   >
                     <RotateCcw className="h-3 w-3" />
                     Import Paths
                   </Button>

                   {/* Export Grid Data to CSV */}
                   <Button
                     type="button"
                     size="sm"
                     variant="ghost"
                     onClick={(e) => {
                        e.stopPropagation();
                        downloadCSV();
                        if (!showApiMap) setShowApiMap(true);
                     }}
                     className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-600/5 hover:bg-emerald-600/10 border border-emerald-600/20 gap-1"
                   >
                     <Download className="h-3 w-3" />
                     Download CSV
                   </Button>

                   {/* Import/Upload CSV file */}
                   <div 
                     className="inline-block"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <label className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-600/5 hover:bg-blue-600/10 border border-blue-600/20 rounded-md cursor-pointer flex items-center gap-1 transition-all">
                       <Upload className="h-3 w-3" />
                       Upload CSV
                       <input 
                         type="file" 
                         accept=".csv" 
                         onChange={handleCSVUpload}
                         className="hidden" 
                       />
                     </label>
                   </div>

                   {/* Download CSV Format Template */}
                   <Button
                     type="button"
                     size="sm"
                     variant="ghost"
                     onClick={(e) => {
                        e.stopPropagation();
                        downloadTemplate();
                        if (!showApiMap) setShowApiMap(true);
                     }}
                     className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-gray-500 bg-gray-500/5 hover:bg-gray-500/10 border border-gray-500/20 gap-1"
                   >
                     <Download className="h-3 w-3" />
                     Template
                   </Button>

                   {/* Quick Add Raw Path */}
                   <Button
                     type="button"
                     size="sm"
                     variant="ghost"
                     onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickAdd(!showQuickAdd);
                        if (!showApiMap) setShowApiMap(true);
                     }}
                     className={cn(
                       "h-6 px-2 text-[8px] font-black uppercase tracking-widest gap-1 border transition-all",
                       showQuickAdd 
                         ? "text-purple-600 bg-purple-600/10 border-purple-600/40" 
                         : "text-purple-600 bg-purple-600/5 hover:bg-purple-600/10 border-purple-600/20"
                     )}
                   >
                     <Plus className="h-3 w-3" />
                     Quick Add
                   </Button>
                </div>
               {showApiMap ? <ChevronUp className="h-3.5 w-3.5 text-text-muted/50" /> : <ChevronDown className="h-3.5 w-3.5 text-text-muted/50 group-hover:text-primary-500" />}
           </button>

           {showApiMap && (
               <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Quick Add Inline Panel */}
                  {showQuickAdd && (
                     <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 flex flex-col md:flex-row items-stretch md:items-end gap-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex-1 space-y-1.5">
                           <Label className="text-[9px] font-black uppercase tracking-widest text-purple-700 flex items-center gap-1.5">
                              <Plus className="h-3 w-3" />
                              Paste Raw Path (e.g. auth/user/get-grid-data-super)
                           </Label>
                           <Input 
                              value={quickAddPath}
                              onChange={(e) => setQuickAddPath(e.target.value)}
                              placeholder="Type or paste API route path..."
                              className="h-8 text-[11px] font-bold border-purple-200 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleQuickAdd();
                                 }
                              }}
                           />
                        </div>
                        <div className="flex items-center gap-2 self-stretch md:self-end">
                           <Button
                              type="button"
                              onClick={handleQuickAdd}
                              className="h-8 text-[10px] font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-700 text-white flex-1 md:flex-none"
                           >
                              Parse & Add Row
                           </Button>
                           <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                 setQuickAddPath('');
                                 setShowQuickAdd(false);
                              }}
                              className="h-8 text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-100 hover:bg-purple-200"
                           >
                              Cancel
                           </Button>
                        </div>
                     </div>
                  )}
                  {/* Mobile View: Carded Layout */}
                  <div className="md:hidden space-y-3">
                     {!loadingMaps && fields.length > 0 && (
                        <div className="flex justify-end mb-2">
                           <Button 
                              type="button"
                              size="sm"
                              onClick={() => append({ 
                                 mapid: 0, 
                                 menu_id: getValues('menu_id'), 
                                 module: '', 
                                 controller: '', 
                                 api_path: '', 
                                 action_type: 'api', 
                                 button_id: '',
                                 button_title: '',
                                 row_version: '',
                                 row_editor_status: 'insert'
                              })}
                              className="h-7 text-[9px] font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-700"
                           >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Mapping
                           </Button>
                        </div>
                     )}
                     
                     {loadingMaps ? (
                        <div className="py-12 flex flex-col items-center justify-center bg-content-bg rounded-xl border border-border-theme border-dashed gap-3">
                           <Loader className="h-5 w-5 text-primary-600 animate-spin" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Loading API Maps...</p>
                        </div>
                     ) : fields.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center bg-content-bg rounded-xl border border-border-theme border-dashed gap-4 text-center px-6">
                           <p className="text-[10px] font-medium text-text-muted/50 italic">No API paths mapped yet.</p>
                           <Button 
                              type="button"
                              onClick={() => append({ 
                                 mapid: 0, 
                                 menu_id: getValues('menu_id'), 
                                 module: '', 
                                 controller: '', 
                                 api_path: '', 
                                 action_type: 'api', 
                                 button_id: '',
                                 button_title: '',
                                 row_version: '',
                                 row_editor_status: 'insert'
                              })}
                              className="h-8 text-[9px] font-black uppercase tracking-widest bg-primary-600"
                           >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Start Mapping
                           </Button>
                        </div>
                     ) : (
                        fields.map((field, index) => {
                           const isDeleted = watch(`apiPathMaps.${index}.row_editor_status`) === 'deleted';
                           const actionType = watch(`apiPathMaps.${index}.action_type`);
                           
                           const rowValue = apiPathMapsValues[index] || {};
                           const controllerVal = String(rowValue.controller || field.controller || '').toLowerCase();
                           const apiPathVal = String(rowValue.api_path || field.api_path || '').toLowerCase();

                           const matchesController = !filterController || controllerVal.includes(filterController.toLowerCase());
                           const matchesApiPath = !filterApiPath || apiPathVal.includes(filterApiPath.toLowerCase());

                           const isVisible = matchesController && matchesApiPath;
                           
                           return (
                              <div 
                                 key={field.id} 
                                 className={cn(
                                    "bg-white rounded-xl border p-3 shadow-sm transition-all relative overflow-hidden",
                                    isDeleted ? "border-red-100 bg-red-50/20 opacity-60" : "border-border-theme",
                                    !isVisible && "hidden"
                                 )}
                              >
                                 <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[8px] font-black uppercase tracking-tighter text-text-muted/50 bg-content-bg px-1.5 py-0.5 rounded">ID: {watch('menu_id')}</span>
                                          <div className={cn(
                                             "h-1.5 w-1.5 rounded-full",
                                             isDeleted ? "bg-red-500" : "bg-emerald-500"
                                          )} />
                                       </div>
                                       <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                             <span className="text-[8px] font-black uppercase text-text-muted/50">Module</span>
                                             <SuggestInput 
                                                {...register(`apiPathMaps.${index}.module` as const)}
                                                suggestions={moduleSuggestions}
                                                listId={`mobile-module-list-${index}`}
                                                placeholder="e.g. AUTH"
                                                disabled={isDeleted}
                                                className="h-7 text-[10px] font-bold border-border-theme"
                                             />
                                          </div>
                                          <div className="space-y-1">
                                             <span className="text-[8px] font-black uppercase text-text-muted/50">Controller</span>
                                             <SuggestInput 
                                                {...register(`apiPathMaps.${index}.controller` as const)}
                                                suggestions={controllerSuggestions}
                                                listId={`mobile-ctrl-list-${index}`}
                                                placeholder="e.g. User"
                                                disabled={isDeleted}
                                                className="h-7 text-[10px] font-bold border-border-theme"
                                             />
                                          </div>
                                       </div>
                                    </div>
                                    <div className="shrink-0">
                                       {isDeleted ? (
                                          <button 
                                             type="button" 
                                             onClick={() => setValue(`apiPathMaps.${index}.row_editor_status`, 'update')}
                                             className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"
                                          >
                                             <RotateCcw className="h-4 w-4" />
                                          </button>
                                       ) : (
                                          <button 
                                             type="button" 
                                             onClick={() => {
                                                const mapid = getValues(`apiPathMaps.${index}.mapid`);
                                                if (mapid === 0) remove(index);
                                                else setValue(`apiPathMaps.${index}.row_editor_status`, 'deleted');
                                             }}
                                             className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 border border-red-100"
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </button>
                                       )}
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <div className="space-y-1">
                                       <span className="text-[8px] font-black uppercase text-text-muted/50">API Path</span>
                                       <SuggestInput 
                                          {...register(`apiPathMaps.${index}.api_path` as const)}
                                          suggestions={pathSuggestions}
                                          listId={`mobile-path-list-${index}`}
                                          placeholder="/api/v1/..."
                                          disabled={isDeleted}
                                          className="h-7 text-[10px] font-bold border-border-theme"
                                       />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                       <div className="space-y-1">
                                          <span className="text-[8px] font-black uppercase text-text-muted/50">Type</span>
                                          <select 
                                             {...register(`apiPathMaps.${index}.action_type` as const)}
                                             disabled={isDeleted}
                                             className="w-full h-7 text-[10px] font-black uppercase px-2 rounded-md border border-border-theme outline-none"
                                          >
                                             <option value="api">API</option>
                                             <option value="btn">BTN</option>
                                          </select>
                                       </div>
                                       <div className="space-y-1">
                                          <span className="text-[8px] font-black uppercase text-text-muted/50">Btn ID</span>
                                          <Input 
                                             {...register(`apiPathMaps.${index}.button_id` as const)}
                                             disabled={isDeleted || actionType === 'api'}
                                             className="h-7 text-[10px] font-bold"
                                          />
                                       </div>
                                       <div className="space-y-1">
                                          <span className="text-[8px] font-black uppercase text-text-muted/50">Title</span>
                                          <Input 
                                             {...register(`apiPathMaps.${index}.button_title` as const)}
                                             disabled={isDeleted || actionType === 'api'}
                                             className="h-7 text-[10px] font-bold"
                                          />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           );
                        })
                     )}
                  </div>

                  {/* Desktop View: Traditional Table */}
                  <div className="hidden md:block overflow-x-auto border border-border-theme rounded-lg shadow-sm">
                     <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                           <tr className="bg-content-bg border-b border-border-theme">
                              <th className="p-2 text-center w-10">
                                 <button 
                                   type="button"
                                   onClick={() => append({ 
                                      mapid: 0, 
                                      menu_id: getValues('menu_id'), 
                                      module: '', 
                                      controller: '', 
                                      api_path: '', 
                                      action_type: 'api', 
                                      button_id: '',
                                      button_title: '',
                                      row_version: '',
                                      row_editor_status: 'insert'
                                   })}
                                   title="Add Mapping"
                                   className="p-1 rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-sm"
                                 >
                                    <Plus className="h-3.5 w-3.5" />
                                 </button>
                              </th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted w-20">Menu ID</th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted">Module</th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted">Controller</th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted">API Path</th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted w-24">Type</th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted">Button ID</th>
                              <th className="p-2 text-[8px] font-black uppercase text-text-muted">Title</th>
                           </tr>
                           <tr className="bg-content-bg/50 border-b border-border-theme">
                              <th className="p-1"></th>
                              <th className="p-1"></th>
                              <th className="p-1"></th>
                              <th className="p-1">
                                 <input 
                                    type="text" 
                                    placeholder="Filter controller..." 
                                    value={filterController}
                                    onChange={(e) => setFilterController(e.target.value)}
                                    className="w-full h-6 px-2 text-[9px] font-bold border border-border-theme rounded focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white placeholder:text-text-muted/40 text-text-main"
                                 />
                              </th>
                              <th className="p-1">
                                 <input 
                                    type="text" 
                                    placeholder="Filter api path..." 
                                    value={filterApiPath}
                                    onChange={(e) => setFilterApiPath(e.target.value)}
                                    className="w-full h-6 px-2 text-[9px] font-bold border border-border-theme rounded focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white placeholder:text-text-muted/40 text-text-main"
                                 />
                              </th>
                              <th className="p-1"></th>
                              <th className="p-1"></th>
                              <th className="p-1"></th>
                           </tr>
                        </thead>
                         <tbody>
                            {loadingMaps ? (
                               <tr>
                                  <td colSpan={8} className="py-12 text-center">
                                     <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader className="h-5 w-5 text-primary-600 animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Fetching mapping data...</p>
                                     </div>
                                  </td>
                               </tr>
                            ) : fields.length === 0 ? (
                               <tr>
                                  <td colSpan={8} className="py-8 text-center">
                                     <p className="text-[10px] font-medium text-text-muted/50 italic">No API paths mapped yet. Click the '+' button to add one.</p>
                                  </td>
                               </tr>
                            ) : (
                               fields.map((field, index) => {
                                  const isDeleted = watch(`apiPathMaps.${index}.row_editor_status`) === 'deleted';
                                  
                                  const rowValue = apiPathMapsValues[index] || {};
                                  const controllerVal = String(rowValue.controller || field.controller || '').toLowerCase();
                                  const apiPathVal = String(rowValue.api_path || field.api_path || '').toLowerCase();

                                  const matchesController = !filterController || controllerVal.includes(filterController.toLowerCase());
                                  const matchesApiPath = !filterApiPath || apiPathVal.includes(filterApiPath.toLowerCase());

                                  const isVisible = matchesController && matchesApiPath;

                                  return (
                                     <tr key={field.id} className={cn(
                                        "border-b border-border-theme transition-colors",
                                        isDeleted ? "bg-red-50/30 opacity-60" : "hover:bg-content-bg/50",
                                        !isVisible && "hidden"
                                     )}>
                                        <td className="p-1 text-center">
                                           {isDeleted ? (
                                              <button 
                                                type="button" 
                                                onClick={() => setValue(`apiPathMaps.${index}.row_editor_status`, 'update')}
                                                title="Restore Row"
                                                className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                                              >
                                                 <RotateCcw className="h-3.5 w-3.5" />
                                              </button>
                                           ) : (
                                              <button 
                                                type="button" 
                                                onClick={() => {
                                                   const mapid = getValues(`apiPathMaps.${index}.mapid`);
                                                   if (mapid === 0) {
                                                     remove(index);
                                                   } else {
                                                     setValue(`apiPathMaps.${index}.row_editor_status`, 'deleted');
                                                   }
                                                }}
                                                className="text-red-500 hover:text-red-600 transition-colors p-1"
                                              >
                                                 <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                           )}
                                        </td>
                                        <td className="p-1">
                                           <input type="hidden" {...register(`apiPathMaps.${index}.mapid` as const)} />
                                           <input type="hidden" {...register(`apiPathMaps.${index}.row_editor_status` as const)} />
  
                                           <Input 
                                             type="number"
                                             value={watch('menu_id')}
                                             readOnly
                                             className="h-7 text-[10px] w-full border-transparent bg-content-bg text-text-muted selection:bg-transparent cursor-not-allowed font-bold"
                                           />
                                           <input type="hidden" {...register(`apiPathMaps.${index}.menu_id` as const)} value={watch('menu_id')} />
                                        </td>
                                        <td className="p-1">
                                           <SuggestInput 
                                             {...register(`apiPathMaps.${index}.module` as const)}
                                             suggestions={moduleSuggestions}
                                             listId={`module-list-${index}`}
                                             placeholder="Module"
                                             disabled={isDeleted}
                                             className={cn(
                                               "h-7 text-[10px] w-full border-transparent bg-transparent hover:border-border-theme focus:bg-white font-bold text-text-main",
                                               isDeleted && "line-through text-red-300"
                                             )}
                                           />
                                        </td>
                                        <td className="p-1">
                                           <SuggestInput 
                                             {...register(`apiPathMaps.${index}.controller` as const)}
                                             suggestions={controllerSuggestions}
                                             listId={`controller-list-${index}`}
                                             placeholder="Controller"
                                             disabled={isDeleted}
                                             className={cn(
                                               "h-7 text-[10px] w-full border-transparent bg-transparent hover:border-border-theme focus:bg-white font-bold text-text-main",
                                               isDeleted && "line-through text-red-300"
                                             )}
                                           />
                                        </td>
                                        <td className="p-1">
                                           <SuggestInput 
                                             {...register(`apiPathMaps.${index}.api_path` as const)}
                                             suggestions={pathSuggestions}
                                             listId={`path-list-${index}`}
                                             placeholder="/api/v1/..."
                                             disabled={isDeleted}
                                             className={cn(
                                               "h-7 text-[10px] w-full border-transparent bg-transparent hover:border-border-theme focus:bg-white font-bold text-text-main",
                                               isDeleted && "line-through text-red-300"
                                             )}
                                           />
                                        </td>
                                        <td className="p-1">
                                            <select 
                                              {...register(`apiPathMaps.${index}.action_type` as const)}
                                              disabled={isDeleted}
                                              className={cn(
                                                "h-7 text-[10px] w-full border-transparent bg-transparent hover:border-border-theme focus:bg-white font-black text-text-main uppercase outline-none",
                                                isDeleted && "opacity-50"
                                              )}
                                            >
                                               <option value="api">API</option>
                                               <option value="btn">BTN</option>
                                            </select>
                                         </td>
                                         <td className="p-1">
                                            <Input 
                                              {...register(`apiPathMaps.${index}.button_id` as const)}
                                              placeholder="btn-id"
                                              disabled={isDeleted || watch(`apiPathMaps.${index}.action_type`) === 'api'}
                                              className={cn(
                                                "h-7 text-[10px] w-full border-transparent bg-transparent hover:border-border-theme focus:bg-white font-bold text-text-main",
                                                (isDeleted || watch(`apiPathMaps.${index}.action_type`) === 'api') && "bg-content-bg/50 opacity-40 font-normal"
                                              )}
                                            />
                                         </td>
                                         <td className="p-1">
                                            <Input 
                                              {...register(`apiPathMaps.${index}.button_title` as const)}
                                              placeholder="Display Title"
                                              disabled={isDeleted || watch(`apiPathMaps.${index}.action_type`) === 'api'}
                                              className={cn(
                                                "h-7 text-[10px] w-full border-transparent bg-transparent hover:border-border-theme focus:bg-white font-bold text-text-main",
                                                (isDeleted || watch(`apiPathMaps.${index}.action_type`) === 'api') && "bg-content-bg/50 opacity-40"
                                              )}
                                            />
                                            <input type="hidden" {...register(`apiPathMaps.${index}.row_version` as const)} />
                                         </td>
                                     </tr>
                                  );
                               })
                            )}
                         </tbody>
                     </table>
                  </div>
               </div>
           )}
        </div>

        <ImportApiPathModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          currentCompanyId={watch('company_id')}
          currentMenuType={watch('menu_type')}
          onImport={(importedPaths) => {
            importedPaths.forEach(path => {
              append({
                ...path,
                menu_id: getValues('menu_id'),
                row_editor_status: 'insert'
              });
            });
          }}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border-theme flex items-center justify-end gap-3 shrink-0">
         <Button 
            type="button"
            variant="ghost" 
            onClick={onCancel}
            className="h-8 text-[10px] font-black uppercase tracking-widest text-text-muted/50 hover:text-text-muted"
          >
            Reset Fields
         </Button>
      </div>
    </div>
  );
});

export default MenuItemForm;
