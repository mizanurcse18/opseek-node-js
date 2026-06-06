import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Column } from '@/components/ui/DataTable';
import { commonService } from '@/lib/auth/api/common.service';
import { cn } from '@/lib/utils';
import { User, Calendar, Clock, Monitor, ShieldAlert, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface UserLogTrackerTableProps {
  isSuperUser?: boolean;
}

const UserLogTrackerTable: React.FC<UserLogTrackerTableProps> = ({ isSuperUser = false }) => {
  const fetchDataFn = React.useMemo(() => 
    isSuperUser ? commonService.getUserLogGridDataSuper : commonService.getUserLogGridData,
  [isSuperUser]);

  const columns: Column[] = React.useMemo(() => [
    {
      header: 'User Name',
      accessor: 'user_name',
      searchFieldName: 'user_name',
      sortable: true,
      searchable: true,
      className: 'font-bold text-primary-600',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-50 rounded-md">
            <User className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <span className="font-bold text-text-main">{row.user_name || row.UserName}</span>
        </div>
      )
    },
    {
      header: 'Company Name',
      accessor: 'company_name',
      searchFieldName: 'company_name',
      sortable: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-text-muted/50" />
          <span className="text-text-main">{row.company_name || row.CompanyName || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Login Date',
      accessor: 'log_in_date',
      sortable: true,
      render: (_: any, row: any) => {
        const date = row.log_in_date || row.LoginDate;
        if (!date) return <span className="text-text-muted/50">-</span>;
        
        // Remove 'Z' if present so the browser parses it as local time without shifting
        const cleanDate = typeof date === 'string' && date.endsWith('Z') ? date.slice(0, -1) : date;
        
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-text-main font-medium">
              <Calendar className="h-3 w-3 text-text-muted/50" />
              {new Date(cleanDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <Clock className="h-2.5 w-2.5" />
              {new Date(cleanDate).toLocaleTimeString()}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Logout Date',
      accessor: 'log_out_date',
      sortable: true,
      render: (_: any, row: any) => {
        const date = row.log_out_date || row.LogoutDate;
        if (!date) return <span className="text-text-muted/50 italic text-[10px]">Active Session</span>;
        
        // Remove 'Z' if present so the browser parses it as local time without shifting
        const cleanDate = typeof date === 'string' && date.endsWith('Z') ? date.slice(0, -1) : date;
        
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Calendar className="h-3 w-3 text-text-muted/50" />
              {new Date(cleanDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted/50">
              <Clock className="h-2.5 w-2.5" />
              {new Date(cleanDate).toLocaleTimeString()}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'is_live',
      sortable: true,
      render: (_: any, row: any) => {
        const isLive = row.is_live === 1 || row.is_live === true || row.IsLive === 1;
        return (
          <Badge variant={isLive ? 'success' : 'secondary'} className="gap-1.5 py-0.5">
            <Monitor className={cn("h-3 w-3", isLive && "animate-pulse")} />
            {isLive ? 'Live' : 'Offline'}
          </Badge>
        );
      }
    },
    {
      header: 'Failed',
      accessor: 'is_login_failed',
      sortable: true,
      render: (_: any, row: any) => {
        const failed = row.is_login_failed === 1 || row.is_login_failed === true || row.IsLoginFailed === 1;
        if (!failed) return null;
        return (
          <Badge variant="danger" className="gap-1.5 py-0.5">
            <ShieldAlert className="h-3 w-3" />
            Failed
          </Badge>
        );
      }
    }
  ], [isSuperUser]);

  return (
    <DataTable
      columns={columns}
      fetchDataFn={fetchDataFn}
      striped={true}
      searchPlaceholder="Search user logs..."
    />
  );
};

export default UserLogTrackerTable;
