import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Textarea } from './Textarea';
import { History, ChevronLeft, ChevronRight, User, Calendar, Shield, Layout, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader } from './Loader';

interface AuditLogEntry {
  id: number;
  new_values: string;
  row_state: 'Added' | 'Modified' | 'Deleted';
  company_id: string;
  created_by: number | string;
  created_date: string;
}

interface AuditLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityId: string | number;
}

// Reuse or Re-generate Dummy Data
const generateDummyLogs = (entityName: string, entityId: string | number): AuditLogEntry[] => {
  return Array.from({ length: 25 }, (_, i) => ({
    id: 2000 + i,
    row_state: i === 24 ? 'Added' : i % 2 === 0 ? 'Modified' : 'Modified',
    new_values: JSON.stringify({
      [`${entityName}_name`]: `${entityName} Version ${25 - i}`,
      description: `Historical description snapshot at index ${i}. This is a read-only audit view.`,
      is_active: i % 2 === 0,
       assigned_at: new Date(Date.now() - i * 86400000).toISOString(),
       row_version: 25 - i
    }),
    company_id: 'pgw',
    created_by: 57 + (i % 5),
    created_date: new Date(Date.now() - i * 86400000).toISOString()
  }));
};

export function AuditLogFormModal({ isOpen, onClose, entityName, entityId }: AuditLogFormModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentLog = logs[currentIndex];
  const parsedValues = useMemo(() => {
    if (!currentLog) return {};
    try {
      return JSON.parse(currentLog.new_values);
    } catch {
      return {};
    }
  }, [currentLog]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate fetch
      setTimeout(() => {
        setLogs(generateDummyLogs(entityName, entityId));
        setCurrentIndex(0);
        setLoading(false);
      }, 600);
    }
  }, [isOpen, entityName, entityId]);

  const handleNext = () => {
    if (currentIndex < logs.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'Added': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Modified': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Deleted': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit View (v2): ${entityName}`}
      className="max-w-2xl"
    >
      <div className="flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <Loader className="h-8 w-8 text-primary-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Restoring version data...</p>
          </div>
        ) : !currentLog ? (
           <div className="flex-1 flex items-center justify-center text-gray-400">No logs found.</div>
        ) : (
          <div className="flex-1 space-y-6 py-2 overflow-y-auto no-scrollbar">
            {/* Version Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
               <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm",
                    getStatusColor(currentLog.row_state)
                  )}>
                    <History className="h-3 w-3" />
                    {currentLog.row_state}
                  </div>
                  <span className="text-[11px] font-bold text-gray-900">
                    Change #{logs.length - currentIndex} of {logs.length}
                  </span>
               </div>
               <div className="flex items-center gap-4 text-[10px] font-medium text-gray-500">
                    <User className="h-3.5 w-3.5 text-primary-600" />
                    <span className="text-[11px] font-bold text-text-muted">User ID:</span>
                    <span className="text-[11px] font-black text-text-main">{currentLog.created_by || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary-600" />
                    {new Date(currentLog.created_date).toLocaleString()}
                  </div>
            </div>

            {/* Form Content */}
            <div className="grid grid-cols-1 gap-6 p-1">
               {Object.entries(parsedValues).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary-300" />
                       <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                         {key.replace(/_/g, ' ')}
                       </Label>
                    </div>
                    {typeof value === 'string' && value.length > 50 ? (
                      <Textarea 
                        readOnly 
                        value={value} 
                        className="bg-gray-50/30 text-[11px] font-medium text-gray-700 h-24 border-gray-100 resize-none cursor-default" 
                      />
                    ) : (
                      <Input 
                        readOnly 
                        value={typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)} 
                        className="bg-gray-50/30 text-[11px] font-medium text-gray-700 h-10 border-gray-100 cursor-default" 
                      />
                    )}
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        {!loading && logs.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === logs.length - 1}
              className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Older Version
            </Button>

            <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, logs.length) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 w-6 rounded-full transition-all",
                      i === (currentIndex % 5) ? "bg-primary-600" : "bg-border-theme"
                    )} 
                  />
                ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 bg-white"
            >
              Newer Version
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Read Only Badge */}
        <div className="mt-4 flex items-center gap-2 text-primary-600/50 justify-center">
           <Shield className="h-3.5 w-3.5" />
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Read-Only Historical Snapshot</span>
        </div>
      </div>
    </Modal>
  );
}
