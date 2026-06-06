import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { Search, Globe, Box, Terminal, Check } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';

interface ApiEndpoint {
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
  has_permission: boolean; // Managed by this modal
  _ui_key?: string; // Add a unique internal key
}

interface ApiPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuName: string;
  initialPermissions: any[];
  onApply: (updatedPermissions: any[]) => void;
}


export function ApiPermissionModal({ isOpen, onClose, menuName, initialPermissions, onApply }: ApiPermissionModalProps) {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(
    initialPermissions.map((p, idx) => {
      // Robust detection: boolean, string "true", or truthy object
      const isSelected = !!(
        p.has_permission === true || 
        p.has_permission === 'true' || 
        (typeof p.has_permission === 'object' && p.has_permission !== null && Object.keys(p.has_permission).length > 0)
      );

      return {
        ...p,
        has_permission: isSelected,
        _ui_key: `${p.api_path_mapid}-${p.button_id}-${idx}` // Create a unique key for UI toggling
      };
    })
  );
  const [searchTerm, setSearchTerm] = useState('');

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnApply', button_title: 'Apply Access' }
  ], []));

  const btnApply = buttons.find(b => b.button_id === 'btnApply');

  const toggleOne = (uiKey: string) => {
    setEndpoints(prev => prev.map(ep => 
      ep._ui_key === uiKey ? { ...ep, has_permission: !ep.has_permission } : ep
    ));
  };

  const toggleAll = (checked: boolean) => {
    setEndpoints(prev => prev.map(ep => ({ ...ep, has_permission: checked })));
  };

  const isAllSelected = endpoints.length > 0 && endpoints.every(ep => ep.has_permission);
  const filteredEndpoints = endpoints.filter(ep => 
    (ep.api_path || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ep.controller || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ep.button_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ep.button_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headerActionButton = btnApply?.visible && (
    <Button 
      size="sm" 
      onClick={() => onApply(endpoints.map(({_ui_key, ...rest}) => rest))} // Strip UI key before applying
      className="h-8 text-[10px] uppercase font-black tracking-widest bg-primary-600 hover:bg-primary-700 flex items-center gap-2 px-4 shadow-lg shadow-primary-500/20"
    >
      <Check className="h-3.5 w-3.5" />
      <span>{btnApply.button_title}</span>
    </Button>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`API Access Control: ${menuName}`}
      headerAction={headerActionButton}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Search & Stats */}
        <div className="flex items-center justify-between gap-4 bg-content-bg/50 p-3 rounded-lg border border-border-theme">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/50" />
             <input 
               type="text"
               placeholder="Filter endpoints..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-8 pl-8 pr-3 text-[11px] bg-white border border-border-theme rounded-md focus:ring-1 focus:ring-primary-100 outline-none"
             />
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">
                Selected: {endpoints.filter(e => e.has_permission).length}/{endpoints.length}
              </span>
           </div>
        </div>

        {/* Grid Container */}
        <div className="border border-border-theme rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-content-bg/80 border-b border-border-theme">
                   <th className="p-3 w-12 text-center">
                      <Checkbox 
                        checked={isAllSelected}
                        onCheckedChange={toggleAll}
                        className="scale-90"
                      />
                   </th>
                   <th className="p-3 text-[9px] font-black uppercase tracking-widest text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Box className="h-3 w-3" /> Module / Controller
                      </div>
                   </th>
                   <th className="p-3 text-[9px] font-black uppercase tracking-widest text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3" /> API Path
                      </div>
                   </th>
                   <th className="p-3 text-[9px] font-black uppercase tracking-widest text-text-muted w-20 text-center">
                       Type
                    </th>
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-text-muted w-24 text-center">
                       Button ID
                    </th>
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-text-muted w-32 text-center">
                       Title
                    </th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {filteredEndpoints.map((ep) => (
                   <tr 
                     key={ep._ui_key} 
                     className={cn(
                       "hover:bg-primary-50/10 transition-colors group",
                       ep.has_permission ? "bg-white" : "bg-content-bg/30 opacity-70"
                     )}
                   >
                      <td className="p-2 text-center">
                         <Checkbox 
                           checked={ep.has_permission}
                           onCheckedChange={() => toggleOne(ep._ui_key!)}
                           className="scale-90"
                         />
                      </td>
                      <td className="p-2">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-primary-600 tracking-tight">{ep.controller}</span>
                            <span className="text-[9px] font-black uppercase text-text-muted/50 tracking-tighter">{ep.module}</span>
                         </div>
                      </td>
                      <td className="p-2">
                         <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded bg-content-bg flex items-center justify-center border border-border-theme">
                              <Terminal className="h-3 w-3 text-text-muted/50 group-hover:text-primary-500 transition-colors" />
                           </div>
                           <code className="text-[10px] font-medium text-text-muted bg-content-bg px-1.5 py-0.5 rounded border border-border-theme">
                              {ep.api_path || '---'}
                           </code>
                         </div>
                      </td>
                      <td className="p-2 text-center">
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded-[4px] text-[8px] font-black tracking-widest",
                            ep.action_type === 'api' ? "bg-blue-50 text-blue-600" :
                            ep.action_type === 'btn' ? "bg-emerald-50 text-emerald-600" : "bg-content-bg text-text-muted"
                          )}>
                            {ep.action_type}
                          </span>
                       </td>
                       <td className="p-2 text-center">
                          <span className="text-[10px] font-bold text-text-muted">
                            {ep.button_id || '---'}
                          </span>
                       </td>
                       <td className="p-2 text-center">
                          <span className="text-[10px] font-medium text-text-main">
                            {ep.button_title || '---'}
                          </span>
                       </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
