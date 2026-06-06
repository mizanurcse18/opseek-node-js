import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, Plus, IdCard, Eye } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { userService } from '@/lib/auth/api/user.service';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Switch } from '@/components/ui/Switch';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { companyService } from '@/lib/auth/api/company.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface UserTableProps {
  onAdd?: () => void;
  onEdit?: (user: any) => void;
  isSuperUser?: boolean;
  roleType?: string;
}

export default function UserTable({ onAdd, onEdit, isSuperUser = false, roleType }: UserTableProps) {
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [companies, setCompanies] = React.useState<{ value: string | number; label: string }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, ToastComponent } = useToast();

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
          console.error('Failed to load companies for UserTable:', error);
        }
      };
      loadCompanies();
    }
  }, [isSuperUser]);

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnAdd', button_title: isSuperUser ? 'Add Super User' : 'Add User' },
    { button_id: 'btnEdit', button_title: 'Edit User' },
    { button_id: 'btnDelete', button_title: 'Delete User' },
    { button_id: 'btnKyc', button_title: 'KYC Verification' }
  ], [isSuperUser]));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnDelete = buttons.find(b => b.button_id === 'btnDelete');
  const btnKyc = buttons.find(b => b.button_id === 'btnKyc');

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete.user_id || itemToDelete.UserID;
    if (!id) {
      toast({ title: 'Error', description: 'Could not identify user ID for deletion.', status: 'error' });
      setItemToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await userService.deleteUser(id);
      if (response && (response.status_code === 200 || response.response_code === 'Success')) {
        toast({ title: 'Success', description: 'User deleted successfully.', status: 'success' });
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

  const fetchGridData = React.useCallback(async (params: any) => {
    // dealer -> 8, dsr -> 6, agent -> 3
    let userTypeId: string | null = null;
    if (roleType === 'dealer') userTypeId = '8';
    else if (roleType === 'dsr') userTypeId = '6';
    else if (roleType === 'agent') userTypeId = '3';

    const mergedParams = { ...params };

    if (userTypeId) {
      if (mergedParams.SearchBy) {
        const numElements = mergedParams.SearchBy.split('$').length;
        mergedParams.SearchBy += `$user_type`;
        mergedParams.Search += `$${userTypeId}`;

        const searchTypes = new Array(numElements).fill('');
        searchTypes.push('int');
        mergedParams.SearchType = searchTypes.join('$');
      } else {
        mergedParams.SearchBy = `user_type`;
        mergedParams.Search = userTypeId;
        mergedParams.SearchType = `int`;
      }
    }

    const fetchFn = isSuperUser ? userService.getUserGridDataSuper : userService.getUserGridData;
    return await fetchFn(mergedParams);
  }, [isSuperUser, roleType]);

  const columns: Column[] = React.useMemo(() => {
    const baseColumns: Column[] = [
      {
        header: 'Username',
        accessor: 'user_name',
        searchFieldName: 'user_name',
        searchable: true,
        sortable: true,
        className: 'font-bold text-text-main',
        render: (val, row) => val || 'N/A'
      },
      {
        header: 'Name',
        accessor: 'full_name',
        searchFieldName: 'full_name',
        searchable: true,
        sortable: true,
        visible: true,
        className: 'text-text-main font-semibold',
        render: (val) => val || 'N/A'
      },
      {
        header: 'User Type',
        accessor: 'user_type_name',
        searchFieldName: 'user_type_name',
        searchable: true,
        sortable: true,
        className: 'text-text-muted',
        render: (val) => val || 'N/A'
      },
      {
        header: 'Admin Access',
        accessor: 'is_admin',
        sortable: true,
        render: (is_admin) => {
          const isAdmin = is_admin === true || is_admin === 'true' || is_admin === 1;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isAdmin}
                onCheckedChange={() => { }}
                disabled={true}
              />
            </div>
          );
        }
      },
      {
        header: 'Status',
        accessor: 'is_active',
        sortable: true,
        render: (is_active, row) => {
          const isActive = is_active === true || is_active === 'true' || is_active === 1;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                onCheckedChange={() => { }}
                disabled={true}
              />
            </div>
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
        render: (val, row) => {
          const company = companies.find(c => String(c.value) === String(val || row?.companyid));
          return company ? company.label : (val || row?.companyid || 'N/A');
        }
      },
      {
        header: 'Actions',
        accessor: 'user_id',
        className: 'text-right',
        render: (id, row) => {
          return (
            <div className="flex justify-end gap-1">
              {btnEdit?.visible && (
                <Button
                  variant="ghost"
                  size="sm"
                  title={btnEdit.button_title}
                  className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => onEdit && onEdit(row)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {btnKyc?.visible && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="View KYC Preview"
                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-600/10"
                    onClick={() => {
                      const username = row.user_name || row.UserName;
                      if (username) {
                        navigate(ROUTES.STAKEHOLDER_KYC_PREVIEW.replace(':id', username), {
                          state: { from: location.pathname }
                        });
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title={btnKyc.button_title}
                    className="h-8 w-8 p-0 text-primary-600 hover:bg-primary-600/10"
                    onClick={() => {
                      const username = row.user_name || row.UserName;
                      if (username) {
                        navigate(ROUTES.STAKEHOLDER_KYC.replace(':id', username), {
                          state: { from: location.pathname }
                        });
                      }
                    }}
                  >
                    <IdCard className="h-4 w-4" />
                  </Button>
                </>
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
            </div>
          );
        }
      }
    ];

    // Filter columns based on isSuperUser and roleType context
    return baseColumns.filter(col => {
      if (col.header === 'Admin Access' || col.header === 'Company') {
        return isSuperUser;
      }
      if (col.header === 'User Type' && roleType) {
        return false; // Hide User Type column in role-specific grids
      }
      return true;
    });
  }, [onEdit, btnEdit, btnDelete, companies, isSuperUser, roleType]);

  return (
    <>
      <DataTable
        key={refreshKey}
        columns={columns}
        fetchDataFn={fetchGridData}
        emptyMessage="No users found."
        pageSize={10}
        striped={true}
        renderActions={() => (
          btnAdd?.visible && (
            <Button onClick={onAdd} size="sm" className="h-9 px-4 font-black uppercase tracking-widest text-[10px]">
              <Plus className="mr-2 h-3.5 w-3.5" /> {btnAdd.button_title}
            </Button>
          )
        )}
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={btnDelete?.button_title || "Delete User"}
        description="Are you sure you want to delete this user? This action cannot be undone."
        loading={isDeleting}
        confirmVariant="danger"
        confirmLabel={btnDelete?.button_title || "Delete User"}
        icon={<Trash2 className="h-5 w-5 text-red-500" />}
        details={[
          { label: 'Name', value: itemToDelete?.user_full_name || itemToDelete?.name || itemToDelete?.user_name || '' },
          { label: 'Email', value: itemToDelete?.email || '' }
        ]}
      />

      <ToastComponent />
    </>
  );
}
