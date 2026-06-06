import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { DataTable, Column } from './DataTable';
import { History, Search, Box, Terminal, Layers, User, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: number;
  new_values: string;
  row_state: 'Added' | 'Modified' | 'Deleted';
  company_id: string;
  created_by: number | string;
  created_date: string;
}

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityId: string | number;
}

// Dummy Data Generator
const generateDummyLogs = (entityName: string, entityId: string | number): AuditLogEntry[] => {
  return Array.from({ length: 25 }, (_, i) => ({
    id: 1000 + i,
    row_state: i % 3 === 0 ? 'Added' : i % 3 === 1 ? 'Modified' : 'Deleted',
    new_values: JSON.stringify({
      [`${entityName}_name`]: `${entityName} Sample ${i}`,
      description: `Description for ${i}`,
      is_active: i % 2 === 0,
      updated_at: new Date().toISOString()
    }),
    company_id: 'pgw',
    created_by: 57 + (i % 5),
    created_date: new Date(Date.now() - i * 86400000).toISOString()
  }));
};

export function AuditLogModal({ isOpen, onClose, entityName, entityId }: AuditLogModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock fetch function for DataTable
  const fetchLogs = async (params: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const allLogs = generateDummyLogs(entityName, entityId);
    const filtered = allLogs.filter(log => 
      log.new_values.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.row_state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const limit = params.Limit || 10;
    const offset = params.Offset || 0;
    
    return {
      status_code: 200,
      data: {
        rows: filtered.slice(offset, offset + limit),
        total_rows: filtered.length
      }
    };
  };

  const columns: Column[] = useMemo(() => [
    {
       header: 'Row State',
       accessor: 'row_state',
       className: 'w-[120px]',
       render: (val: string) => {
         const colors = {
           Added: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
           Modified: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
           Deleted: 'bg-rose-500/10 text-rose-600 ring-rose-500/20'
         }[val] || 'bg-text-muted/10 text-text-muted ring-border-theme';

         return (
           <span className={cn(
             "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset",
             colors
           )}>
             {val}
           </span>
         );
       }
    },
    {
      header: 'Details (New Values)',
      accessor: 'new_values',
      className: 'min-w-[300px]',
      render: (val: string) => {
        try {
          const parsed = JSON.parse(val);
          return (
            <div className="flex flex-wrap gap-2 py-1">
              {Object.entries(parsed).map(([key, value]) => (
                <div key={key} className="flex flex-col bg-content-bg/50 border border-border-theme rounded p-1.5 min-w-[120px]">
                  <span className="text-[8px] font-black uppercase tracking-tighter text-text-muted/50 leading-none mb-1">{key.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-bold text-primary-600 truncate max-w-[200px]">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          );
        } catch (e) {
          return <span className="text-[10px] text-text-muted font-mono italic">{val}</span>;
        }
      }
    },
    {
      header: 'Company',
      accessor: 'company_id',
      className: 'w-[100px] text-center',
      render: (val) => (
        <span className="text-[10px] font-black uppercase text-text-muted/50 tracking-widest">{val}</span>
      )
    },
    {
      header: 'Created By',
      accessor: 'created_by',
      className: 'w-[120px]',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary-600/10 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary-600" />
          </div>
          <span className="text-[11px] font-bold text-text-main">User #{val}</span>
        </div>
      )
    },
    {
      header: 'Created Date',
      accessor: 'created_date',
      className: 'w-[180px] text-right',
      render: (val) => (
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-bold text-text-main">
             {new Date(val).toLocaleDateString()}
           </span>
           <span className="text-[9px] text-text-muted">
              {new Date(val).toLocaleTimeString()}
           </span>
        </div>
      )
    }
  ], []);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Audit History: ${entityName} (ID: ${entityId})`}
      className="max-w-6xl"
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-3 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
             <Info className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-600">View-Only History</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">
              This log shows every modification made to this {entityName.toLowerCase()}. Changes are displayed as key-value snapshots at the time of the event.
            </p>
          </div>
        </div>

        <DataTable
          fetchDataFn={fetchLogs}
          columns={columns}
          pageSize={10}
          emptyMessage="No history logs found for this entry."
        />
      </div>
    </Modal>
  );
}
