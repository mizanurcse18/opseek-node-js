import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { useToast } from '@/components/ui/Toast';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Bell, Search, Filter, RefreshCw, Calendar, Mail, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { notificationService } from '@/lib/auth/api/notification.service';
import { handleApiError } from '@/lib/error-handler';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [apTypes, setApTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    const loadApTypes = async () => {
      try {
        const resp = await notificationService.getAPTypeList();
        if (resp && Array.isArray(resp)) {
          setApTypes(resp);
        } else if (resp?.data && Array.isArray(resp.data)) {
          setApTypes(resp.data);
        }
      } catch (err) {
        console.error('Failed to load AP types:', err);
      }
    };
    loadApTypes();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const resp = await notificationService.getNotificationList();
      if (resp && Array.isArray(resp)) {
        setNotifications(resp);
      } else if (resp?.data && Array.isArray(resp.data)) {
        setNotifications(resp.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast(handleApiError(err));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [refreshKey]);

  // Client-side filtering for search and type
  const filteredNotifications = notifications.filter(item => {
    const titleText = (item.Title || item.title || '').toLowerCase();
    const descText = (item.Description || item.Particulars || item.message || '').toLowerCase();
    const typeText = String(item.APTypeID || item.type || '');
    
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || titleText.includes(query) || descText.includes(query);
    const matchesType = !typeFilter || typeFilter === 'ALL' || typeText === typeFilter;
 
    return matchesQuery && matchesType;
  });

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Notifications & Feedback Requests'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Monitor and manage pending approvals, feedback requests, and system-wide notifications.
          </p>
        </div>
        <Button
          onClick={() => setRefreshKey(prev => prev + 1)}
          variant="outline"
          size="sm"
          disabled={loading}
          className="self-start sm:self-center h-9 rounded-xl flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card-bg px-4 py-3 rounded-xl border border-border-theme shadow-sm">
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Search Notifications</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or details..."
              className="pl-9 h-9 border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Filter by Type</Label>
          <Select
            value={typeFilter || 'ALL'}
            onValueChange={(val) => setTypeFilter(val || 'ALL')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {apTypes.map((t) => {
                const val = String(t.APTypeID ?? t.aptypeid ?? t.apTypeID);
                const label = String(t.APTypeName ?? t.aptypename ?? t.apTypeName ?? `Type #${t.APTypeID}`);
                return (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-theme">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Date Received</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Category/Type</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Title</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Details</th>
                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Assignment</th>
                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Action status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-theme text-[11px] font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Bell className="h-6 w-6 text-primary-500 animate-spin mx-auto mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest animate-pulse">Loading notifications...</span>
                  </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-text-muted">
                    No notifications or feedback requests found.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((item, idx) => (
                  <tr key={item.APEmployeeFeedbackID || idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-text-muted font-mono whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {item.FeedbackRequestDate || item.FeedbackRequestDate
                          ? new Date(item.FeedbackRequestDate).toLocaleString()
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-primary-50 text-primary-600 border-primary-100">
                        {item.APTypeName || item.APName || 'Approval System'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-text-main font-bold max-w-[200px] truncate" title={item.Title}>
                      {item.Title || 'Feedback Request'}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted max-w-[300px] truncate" title={item.Description || item.Particulars}>
                      {item.Description || item.Particulars || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      {item.Proxy === 'Proxy' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          <UserCheck className="h-3 w-3" />
                          Proxy
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        item.IsEditable || item.IsAPEditable
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {item.IsEditable || item.IsAPEditable ? (
                          <>
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Pending Action
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-2.5 w-2.5" />
                            Read Only
                          </>
                        )}
                      </span>
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
