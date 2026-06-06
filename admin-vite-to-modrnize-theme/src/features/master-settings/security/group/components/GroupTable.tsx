import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, Users, History, Layout } from 'lucide-react';
import { AuditLogModal } from '@/components/ui/AuditLogModal';
import { AuditLogFormModal } from '@/components/ui/AuditLogFormModal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { securityService } from '@/lib/auth/api/security.service';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { companyService } from '@/lib/auth/api/company.service';

interface GroupTableProps {
  onAdd?: () => void;
  onEdit?: (group: any) => void;
  isSuperUser?: boolean;
}

export default function GroupTable({ onAdd, onEdit, isSuperUser = false }: GroupTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [companies, setCompanies] = React.useState<{ value: string | number; label: string }[]>([]);
  const [auditLogState, setAuditLogState] = React.useState<{ isOpen: boolean; id: string | number; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [auditLogFormState, setAuditLogFormState] = React.useState<{ isOpen: boolean; id: string | number; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const { toast, ToastComponent } = useToast();

  React.useEffect(() => {
    if (isSuperUser) {
      const loadCompanies = async () => {
        try {
          const resp = await securityService.getAllCompaniesCombo();
          if (resp && Array.isArray(resp)) {
            setCompanies(resp.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies for GroupTable:', error);
        }
      };
      loadCompanies();
    }
  }, [isSuperUser]);
  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Group' },
    { button_id: 'btnEdit', button_title: 'Edit Group' },
    { button_id: 'btnDelete', button_title: 'Delete Group' },
    { button_id: 'btnAuditGrid', button_title: 'Grid Audit' },
    { button_id: 'btnAuditForm', button_title: 'Form Audit' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');
  const btnAuditGrid = buttons.find(b => b.button_id === 'btnAuditGrid');
  const btnAuditForm = buttons.find(b => b.button_id === 'btnAuditForm');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    const id = itemToDelete.security_group_id || itemToDelete.group_id || itemToDelete.GroupID;
    if (!id) {
      toast({ title: 'Error', description: 'Could not identify group ID for deletion.', status: 'error' });
      setItemToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await securityService.deleteGroup(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Group deleted successfully.', status: 'success' });
        setRefreshKey(prev => prev + 1);
        setItemToDelete(null);
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column[] = React.useMemo(() => [
    {
      header: 'Group Name',
      accessor: 'group_name',
      searchFieldName: 'group_name',
      searchable: true,
      sortable: true,
      className: 'font-bold text-text-main'
    },
    {
      header: 'Assigned Roles',
      accessor: 'security_rule_names',
      searchFieldName: 'security_rule_names',
      searchable: true,
      sortable: true,
      render: (rule_names) => {
        if (!rule_names) return <span className="text-text-muted/50 italic text-[11px]">No roles assigned</span>;
        
        // Handle comma-separated list
        const roles = typeof rule_names === 'string' ? rule_names.split(',') : [];
        
        return (
          <div className="flex flex-wrap gap-1 max-w-[400px]">
            {roles.map((role, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center px-2 py-0.5 rounded bg-primary-600/10 text-primary-600 text-[10px] font-bold border border-primary-600/20"
              >
                {role.trim()}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Description',
      accessor: 'description',
      searchFieldName: 'description',
      searchable: true,
      sortable: true,
      className: 'text-text-muted'
    },
    {
      header: 'Company',
      accessor: 'company_id',
      sortable: true,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: companies,
      visible: isSuperUser,
      className: 'text-text-muted',
      render: (val: any) => {
        const company = companies.find(c => String(c.value) === String(val));
        return company ? company.label : (val || 'N/A');
      }
    },
    {
      header: 'Actions',
      accessor: 'security_group_id',
      className: 'text-right',
      render: (id, row) => (
        <div className="flex justify-end gap-1">
          {btnEdit?.visible && (
            <Button 
              variant="ghost" 
              size="sm" 
              title={btnEdit.button_title} 
              className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
              onClick={() => onEdit?.(row)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          
          {btnDelete?.visible && (
            <Button 
              variant="ghost" 
              size="sm" 
              title={btnDelete.button_title} 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setItemToDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {btnAuditGrid?.visible && (
            <Button 
              variant="ghost" 
              size="sm" 
              title={btnAuditGrid.button_title} 
              className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
              onClick={() => setAuditLogState({
                isOpen: true,
                id: row.security_group_id || row.group_id || row.GroupID,
                name: row.group_name || row.GroupName
              })}
            >
              <History className="h-4 w-4" />
            </Button>
          )}

          {btnAuditForm?.visible && (
            <Button 
              variant="ghost" 
              size="sm" 
              title={btnAuditForm.button_title} 
              className="h-8 w-8 p-0 text-primary-500 hover:text-amber-500 hover:bg-amber-500/10"
              onClick={() => setAuditLogFormState({
                isOpen: true,
                id: row.security_group_id || row.group_id || row.GroupID,
                name: row.group_name || row.GroupName
              })}
            >
              <Layout className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [onEdit, btnEdit, btnDelete, btnAuditGrid, btnAuditForm, companies, isSuperUser, setAuditLogState, setAuditLogFormState]);

  return (
    <>
      <DataTable
        key={refreshKey}
        columns={columns}
        fetchDataFn={isSuperUser ? securityService.getGroupGridDataSuper : securityService.getGroupGridData}
        emptyMessage="No groups found."
        pageSize={10}
        striped={true}
        renderActions={() => (
          <>
            {btnAdd?.visible && (
              <Button
                onClick={onAdd}
                size="sm"
                className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">{btnAdd.button_title}</span>
              </Button>
            )}
          </>
        )}
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={btnDelete?.button_title || "Delete Security Group"}
        description="Are you sure you want to delete this group? This will remove all associated rule mappings."
        loading={isDeleting}
        confirmVariant="danger"
        confirmLabel={btnDelete?.button_title || "Delete Group"}
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
        details={[
          { label: 'Group Name', value: itemToDelete?.group_name || itemToDelete?.GroupName || '' },
          { label: 'Description', value: itemToDelete?.description || itemToDelete?.Description || 'No description' }
        ]}
      />

      <AuditLogModal
        isOpen={auditLogState.isOpen}
        onClose={() => setAuditLogState(prev => ({ ...prev, isOpen: false }))}
        entityName="Security Group"
        entityId={auditLogState.id}
      />

      <AuditLogFormModal
        isOpen={auditLogFormState.isOpen}
        onClose={() => setAuditLogFormState(prev => ({ ...prev, isOpen: false }))}
        entityName="Security Group"
        entityId={auditLogFormState.id}
      />
      
      <ToastComponent />
    </>
  );
}
