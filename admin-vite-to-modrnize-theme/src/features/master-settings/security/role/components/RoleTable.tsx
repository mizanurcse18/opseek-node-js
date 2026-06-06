import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, AlertTriangle, History, Layout } from 'lucide-react';
import { AuditLogModal } from '@/components/ui/AuditLogModal';
import { AuditLogFormModal } from '@/components/ui/AuditLogFormModal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { securityService } from '@/lib/auth/api/security.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { companyService } from '@/lib/auth/api/company.service';

interface RoleTableProps {
  onAdd?: () => void;
  onEdit?: (role: any) => void;
  isSuperUser?: boolean;
}

export default function RoleTable({ onAdd, onEdit, isSuperUser = false }: RoleTableProps) {
  const { toast, ToastComponent } = useToast();
  
  // Dialog & Refresh State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [companies, setCompanies] = React.useState<{ value: string | number; label: string }[]>([]);
  const [auditLogState, setAuditLogState] = useState<{ isOpen: boolean; id: string | number; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [auditLogFormState, setAuditLogFormState] = useState<{ isOpen: boolean; id: string | number; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  React.useEffect(() => {
    if (isSuperUser) {
      const loadCompanies = async () => {
        try {
          const resp = await companyService.getAllCompanies();
          if (resp && Array.isArray(resp)) {
            setCompanies(resp.map(c => ({
              value: c.value || c.id || c.company_id || c.CompanyID,
              label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`
            })));
          }
        } catch (error) {
          console.error('Failed to load companies for RoleTable:', error);
        }
      };
      loadCompanies();
    }
  }, [isSuperUser]);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Add Role' },
    { button_id: 'btnEdit', button_title: 'Edit Role' },
    { button_id: 'btnDelete', button_title: 'Delete Role' },
    { button_id: 'btnAuditGrid', button_title: 'Grid Audit' },
    { button_id: 'btnAuditForm', button_title: 'Form Audit' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');
  const btnAuditGrid = buttons.find(b => b.button_id === 'btnAuditGrid');
  const btnAuditForm = buttons.find(b => b.button_id === 'btnAuditForm');

  const handleDeleteClick = (role: any) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    try {
      const resp = await securityService.deleteSecurityRule(roleToDelete.security_rule_id);
      if (resp && (resp.status_code === 200 || resp.response_code === 'Success')) {
        toast({ title: 'Success', description: 'Role deleted successfully.', status: 'success' });
        setIsDeleteDialogOpen(false);
        setRefreshKey(prev => prev + 1); // Trigger DataTable refresh
      } else {
        toast(handleApiError(resp));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsDeleting(false);
      setRoleToDelete(null);
    }
  };

  const columns: Column[] = React.useMemo(() => [
    {
      header: 'Role Name',
      accessor: 'security_rule_name',
      searchFieldName: 'security_rule_name',
      searchable: true,
      sortable: true,
      className: 'font-bold text-text-main'
    },
    {
      header: 'Description',
      accessor: 'security_rule_description',
      searchFieldName: 'security_rule_description',
      searchable: true,
      sortable: true,
      className: 'text-text-muted'
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (is_active) => {
        const status = is_active === true || is_active === 1 || is_active === 'Active' ? 'Active' :
          is_active === false || is_active === 0 || is_active === 'Inactive' ? 'Inactive' : 'Pending';

        const colors = {
          Active: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
          Inactive: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
          Pending: 'bg-amber-500/10 text-amber-500 ring-amber-500/20'
        }[status];

        return (
          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${colors}`}>
            {status}
          </span>
        );
      }
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
      accessor: 'security_rule_id',
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
              onClick={() => handleDeleteClick(row)}
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
                id: row.security_rule_id || row.rule_id || row.RuleID,
                name: row.security_rule_name || row.RuleName
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
                id: row.security_rule_id || row.rule_id || row.RuleID,
                name: row.security_rule_name || row.RuleName
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
        fetchDataFn={isSuperUser ? securityService.getRoleGridDataSuper : securityService.getRoleGridData}
        emptyMessage="No roles found."
        pageSize={10}
        striped={true}
        renderActions={() => (
          btnAdd?.visible && (
            <Button onClick={onAdd} size="sm" className="h-9 px-4 font-black uppercase tracking-widest text-[10px] bg-primary-600 hover:bg-primary-700">
              <Plus className="mr-2 h-3.5 w-3.5" /> {btnAdd.button_title}
            </Button>
          )
        )}
      />

      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={btnDelete?.button_title || "Delete Security Role"}
        description="Are you sure you want to delete this security role? Users assigned to this role may lose access."
        confirmLabel={btnDelete?.button_title || "Delete Role"}
        confirmVariant="danger"
        loading={isDeleting}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        details={roleToDelete ? [
          { label: 'Role Name', value: roleToDelete.security_rule_name },
          { label: 'Description', value: roleToDelete.security_rule_description }
        ] : []}
      />

      <AuditLogModal
        isOpen={auditLogState.isOpen}
        onClose={() => setAuditLogState(prev => ({ ...prev, isOpen: false }))}
        entityName="Security Role"
        entityId={auditLogState.id}
      />

      <AuditLogFormModal
        isOpen={auditLogFormState.isOpen}
        onClose={() => setAuditLogFormState(prev => ({ ...prev, isOpen: false }))}
        entityName="Security Role"
        entityId={auditLogFormState.id}
      />

      <ToastComponent />
    </>
  );
}

