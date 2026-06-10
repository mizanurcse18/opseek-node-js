import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { useToast } from '@/components/ui/Toast';
import { apiService } from '@/lib/api.service';
import { API_MODULES } from '@/constants/api';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Calendar, Search, Filter, History, User, FileText, CheckCircle2 } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [configId, setConfigId] = useState('1');
  const [dataSize, setDataSize] = useState('30');
  
  // Filters
  const [tableNameFilter, setTableNameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const resp: any = await apiService.get(
        API_MODULES.AUTH,
        `/AuditLog/get-system-config-audit/${configId}/${dataSize}`
      );
      setLogs(resp?.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [configId, dataSize]);

  const filteredLogs = logs.filter(log => {
    const tableMatch = !tableNameFilter || (log.table_name || '').toLowerCase().includes(tableNameFilter.toLowerCase());
    const actionMatch = !actionFilter || actionFilter === 'ALL' || (log.action || '').toLowerCase() === actionFilter.toLowerCase();
    const userMatch = !userFilter || (log.changed_by || '').toLowerCase().includes(userFilter.toLowerCase());
    return tableMatch && actionMatch && userMatch;
  });

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Audit Trail Logs'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Review security audit logs, database mutations (INSERTS, UPDATES, DELETES), and changes by administrators.
          </p>
        </div>
      </div>

      {/* Configurations & Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card-bg px-4 py-3 rounded-xl border border-border-theme shadow-sm">
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Config / Record ID</Label>
          <Input
            type="number"
            value={configId}
            onChange={(e) => setConfigId(e.target.value)}
            className="h-9 border-slate-200 rounded-xl text-xs font-bold font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Log Limit (Max Rows)</Label>
          <Select
            value={dataSize}
            onValueChange={(val) => setDataSize(val || '30')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="30">30 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Table Name Filter</Label>
          <Input
            value={tableNameFilter}
            onChange={(e) => setTableNameFilter(e.target.value)}
            placeholder="e.g. system_configuration"
            className="h-9 border-slate-200 rounded-xl text-xs font-semibold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Action Type</Label>
          <Select
            value={actionFilter || 'ALL'}
            onValueChange={(val) => setActionFilter(val || 'ALL')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-theme">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Changed By</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Table Name</th>
                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Action</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Old Value</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">New Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-theme text-[11px] font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <History className="h-6 w-6 text-primary-500 animate-spin mx-auto mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest animate-pulse">Fetching audit entries...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-text-muted">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-text-muted font-mono whitespace-nowrap">
                      {log.changed_at ? new Date(log.changed_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-text-main flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{log.changed_by || 'system'}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-text-muted">{log.table_name || 'system_configuration'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        log.action === 'INSERT' ? 'bg-green-50 text-green-600 border-green-100' :
                        log.action === 'DELETE' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {log.action || 'UPDATE'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate font-mono text-[9px] text-red-500" title={log.old_values || log.oldValues}>
                      {log.old_values || log.oldValues || '—'}
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate font-mono text-[9px] text-emerald-600" title={log.new_values || log.newValues}>
                      {log.new_values || log.newValues || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
