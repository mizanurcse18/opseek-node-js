import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userService } from '@/lib/auth/api/user.service';
import { securityService } from '@/lib/auth/api/security.service';
import { companyService } from '@/lib/auth/api/company.service';
import { kycService } from '@/lib/auth/api/kyc.service';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { Switch } from '@/components/ui/Switch';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Select } from '@/components/ui-old/Select';
import { Eye, EyeOff, Layout, Globe, Shield, Loader2, CheckCircle2, UserCircle, ClipboardCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Modal } from '@/components/ui/Modal';

interface UserFormProps {
  initialData?: any;
  isEditing?: boolean;
  onSave?: () => void;
  onClose?: () => void;
  isSuperUser?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  roleType?: string;
}

const CheckIcon = () => (
  <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  </div>
);

const CircleIcon = () => (
  <div className="h-4 w-4 rounded-full bg-gray-300 shrink-0"></div>
);

export default function UserForm({ initialData, isEditing, onSave, onClose, isSuperUser = false, onLoadingChange, roleType }: UserFormProps) {
  const { toast, ToastComponent } = useToast();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Resolve user type constraint from active router path to maintain strict form cohesion
  let routeUserType = '';
  if (roleType === 'dealer') routeUserType = '8';
  else if (roleType === 'dsr') routeUserType = '6';
  else if (roleType === 'agent') routeUserType = '3';

  const userObj = initialData?.user || initialData;
  // Support both camelCase groupChildList and snake_case group_child_list
  const rawInitialGroups = initialData?.groupChildList || initialData?.group_child_list || [];
  const initialGroups = Array.isArray(rawInitialGroups)
    ? rawInitialGroups.map((g: any) => g.security_group_id || g.SecurityGroupID || g.securityGroupId || g)
    : [];

  const [formData, setFormData] = useState({
    UserID: userObj?.user_id || userObj?.UserID || 0,
    UserName: userObj?.user_name || userObj?.UserName || '',
    IsAdmin: !!(userObj?.is_admin || userObj?.IsAdmin),
    IsActive: userObj ? !!(userObj?.is_active ?? userObj?.IsActive) : true,
    Password: '',
    selectedGroups: initialGroups as (string | number)[],
    CompanyID: userObj?.company_id || userObj?.CompanyID || '',
    default_menu: userObj?.default_menu || '',
    IsForcedLogin: !!(userObj?.is_forced_login || userObj?.IsForcedLogin),
    IsLocked: !!(userObj?.is_locked || userObj?.IsLocked),
    LockedDateTime: userObj?.locked_date_time || userObj?.LockedDateTime || '',
    UserType: String(userObj?.user_type || userObj?.UserType || routeUserType || ''),
    Pin: '', // New field for Mobile PIN
  });

  const [defaultMenus, setDefaultMenus] = useState<{ value: string, label: string }[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [groups, setGroups] = useState<{ value: number | string, label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string, label: string }[]>([]);
  const [userTypes, setUserTypes] = useState<{ value: string, label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedUser, setLastSavedUser] = useState<any>(null);
  const [errors, setErrors] = useState<{ UserName?: string; SecurityGroups?: string; CompanyID?: string; UserType?: string }>({});

  // Effect 0: Fetch full user details if editing
  const userId = userObj?.user_id || userObj?.UserID;

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (isEditing && userId && !isLoading) {
        setIsLoading(true);
        onLoadingChange?.(true);
        try {
          const response = isSuperUser ? await userService.getUserByIdSuper(userId) : await userService.getUserById(userId);
          if (response?.data) {
            const fullUser = response.data.user || response.data;
            const userGroups = response.data.groupChildList || response.data.group_child_list || [];

            // Sync with groups so MultiSelect has options for already assigned groups
            setGroups(prev => {
              const merged = [...prev];
              userGroups.forEach((g: any) => {
                const groupId = g.security_group_id || g.SecurityGroupID || g.securityGroupId || g;
                const groupName = g.group?.group_name || g.SecurityGroupName || g.securityGroupName || `Group #${groupId}`;
                if (groupId && !merged.some(opt => String(opt.value) === String(groupId))) {
                  merged.push({ value: groupId, label: groupName });
                }
              });
              return merged;
            });

            // Sync company option if not loaded
            const compId = fullUser.company_id || fullUser.CompanyID;
            if (compId) {
              setCompanies(prev => {
                if (!prev.some(opt => String(opt.value) === String(compId))) {
                  return [...prev, { value: compId, label: String(compId).toUpperCase() }];
                }
                return prev;
              });
            }

            // Sync default page option if not loaded
            const defaultMenu = fullUser.DefaultMenuID || fullUser.default_menu_id || fullUser.default_menu;
            if (defaultMenu) {
              setDefaultMenus(prev => {
                if (!prev.some(opt => String(opt.value) === String(defaultMenu))) {
                  return [...prev, { value: String(defaultMenu), label: `Page: ${defaultMenu}` }];
                }
                return prev;
              });
            }

            setFormData(prev => ({
              ...prev,
              UserID: fullUser.user_id || fullUser.UserID || prev.UserID,
              UserName: fullUser.user_name || fullUser.UserName || prev.UserName,
              IsAdmin: !!(fullUser.is_admin || fullUser.IsAdmin),
              IsActive: !!(fullUser.is_active ?? fullUser.IsActive),
              CompanyID: compId || prev.CompanyID,
              default_menu: String(defaultMenu || prev.default_menu || ''),
              IsForcedLogin: !!(fullUser.is_forced_login || fullUser.IsForcedLogin),
              IsLocked: !!(fullUser.is_locked || fullUser.IsLocked),
              LockedDateTime: fullUser.locked_date_time || fullUser.LockedDateTime || prev.LockedDateTime,
              UserType: String(fullUser.user_type || fullUser.UserType || prev.UserType),
              selectedGroups: userGroups.map((g: any) => g.security_group_id || g.SecurityGroupID || g.securityGroupId || g)
            }));
          }
        } catch (error) {
          console.error('Failed to fetch full user details:', error);
          if (error instanceof Error && !error.message.includes('Decryption failed')) {
            toast({ title: 'Error', description: 'Failed to load detailed user information.', status: 'error' });
          }
        } finally {
          setIsLoading(false);
          onLoadingChange?.(false);
        }
      }
    };

    fetchUserDetails();
  }, [isEditing, userId, isSuperUser]); // Stable dependency array

  // Password Security Logic
  const isMinLength = formData.Password.length >= 8;
  const hasUpperAndNumber = /[A-Z]/.test(formData.Password) && /[0-9]/.test(formData.Password);
  const hasSpecialChar = /[!@#$%]/.test(formData.Password);

  useEffect(() => {
    // Basic groups for non-superuser or first load
    if (!isSuperUser) {
      const fetchGroups = async () => {
        try {
          const rulesData = await securityService.getSecurityGroupsCombo();
          if (rulesData && Array.isArray(rulesData)) {
            setGroups(rulesData);
          }
        } catch (error) {
          console.error('Failed to fetch groups:', error);
        }
      };
      const fetchMenus = async () => {
        try {
          const menus = await securityService.getDefaultMenus();
          setDefaultMenus(menus.map((m: any) => ({
            value: m.url || m.path || m.value,
            label: m.title || m.label || m.name
          })));
        } catch (error) {
          console.error('Failed to fetch menus:', error);
        }
      };
      fetchGroups();
      fetchMenus();
    }

    if (isSuperUser) {
      const fetchCompanies = async () => {
        try {
          const resp = await securityService.getAllCompaniesCombo();
          setCompanies(resp.map((c: any) => ({
            value: String(c.value || c.id || c.company_id),
            label: c.label || c.company_name || c.CompanyName
          })));
        } catch (error) {
          console.error('Failed to fetch companies:', error);
        }
      };
      fetchCompanies();
    }

    const fetchUserTypes = async () => {
      try {
        const resp = await userService.getUserTypes();
        const data = resp?.data || resp;
        if (data && Array.isArray(data)) {
          setUserTypes(data.map((t: any) => ({
            value: String(t.value || t.id),
            label: t.label || t.name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch user types:', error);
      }
    };
    fetchUserTypes();
  }, [isSuperUser, initialData]);

  // Cascading Logic: Load Groups and Menus for Superuser when Company changes
  useEffect(() => {
    if (isSuperUser && formData.CompanyID) {
      const fetchCascadingData = async () => {
        setDataLoading(true);
        try {
          const [groupsResp, menusResp] = await Promise.all([
            securityService.getSecurityGroupsSuperCombo(formData.CompanyID),
            securityService.getDefaultMenusSuperCombo(formData.CompanyID)
          ]);

          setGroups(groupsResp.map((g: any) => ({
            value: g.value || g.id || g.security_group_id,
            label: g.label || g.name || g.group_name
          })));

          setDefaultMenus(menusResp.filter((m: any) => (m.url || m.path || m.value))
            .map((m: any) => ({
              value: m.url || m.path || m.value,
              label: m.title || m.label || m.name
            })));

        } catch (error) {
          console.error('Failed to load cascading data:', error);
          toast({ title: 'Error', description: 'Failed to load company specific groups/menus.', status: 'error' });
        } finally {
          setDataLoading(false);
        }
      };
      fetchCascadingData();
    }
  }, [formData.CompanyID, isSuperUser]);

  const [allowedGroupIds, setAllowedGroupIds] = useState<(string | number)[] | null>(null);
  const isRoleSpecific = !!roleType && ['dealer', 'dsr', 'agent', 'merchant'].includes(roleType.toLowerCase());

  // Dynamically fetch and filter the available security groups based on the KYC workflow configuration
  useEffect(() => {
    const fetchCascadedGroups = async () => {
      if (isRoleSpecific && formData.UserType) {
        try {
          const response = await kycService.getWorkflowConfig(Number(formData.UserType));
          if (response?.data?.allowedSecurityGroups && Array.isArray(response.data.allowedSecurityGroups)) {
            const mappedGroups = response.data.allowedSecurityGroups;
            setAllowedGroupIds(mappedGroups);
            
            // Auto-select allowed groups ONLY if we are creating a new user (isEditing is false)
            if (!isEditing) {
              setFormData(prev => {
                if (prev.selectedGroups.length === 0) {
                  const groupValues = mappedGroups.map((g: any) => 
                    typeof g === 'number' ? g : Number(g) || g
                  );
                  return {
                    ...prev,
                    selectedGroups: groupValues
                  };
                }
                return prev;
              });
            }
          } else {
            setAllowedGroupIds(null);
          }
        } catch (error) {
          console.error('Failed to fetch dynamic allowed security groups:', error);
          setAllowedGroupIds(null);
        }
      } else {
        setAllowedGroupIds(null);
      }
    };
    fetchCascadedGroups();
  }, [formData.UserType, isEditing, isRoleSpecific]);

  // Dynamically cascade security groups based on dynamic KYC workflow mapping
  const cascadedGroups = React.useMemo(() => {
    if (allowedGroupIds && allowedGroupIds.length > 0) {
      return groups.filter(g => 
        allowedGroupIds.some(ag => String(ag) === String(g.value)) ||
        formData.selectedGroups.some(sg => String(sg) === String(g.value)) // Always preserve and display already assigned groups during edits
      );
    }
    return groups; // Fallback to all groups if no mapping is configured
  }, [groups, allowedGroupIds, formData.selectedGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let isValid = true;
    const newErrors: { UserName?: string; SecurityGroups?: string; CompanyID?: string } = {};

    if (!formData.UserName.trim()) {
      newErrors.UserName = 'User Name is required.';
      isValid = false;
    }

    if (isSuperUser && !formData.CompanyID) {
      newErrors.CompanyID = 'Please select a company.';
      isValid = false;
    }

    if (formData.selectedGroups.length === 0) {
      newErrors.SecurityGroups = 'Please assign at least one security group.';
      isValid = false;
    }

    if (formData.Pin && formData.Pin.length !== 4) {
      toast({ title: 'Validation Error', description: 'Mobile PIN must be exactly 4 digits.', status: 'error' });
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    onLoadingChange?.(true);
    try {
      const selectedCompanyId = isSuperUser
        ? (formData.CompanyID || "")
        : (formData.CompanyID || authUser?.company_id || authUser?.CompanyID || "");

      const mappedGroupList = formData.selectedGroups.map(groupId => {
        const groupObj = groups.find(g => g.value === groupId);
        return {
          SecurityGroupUserChildID: 0,
          SecurityGroupID: groupId,
          UserID: formData.UserID,
          SecurityGroupName: groupObj ? groupObj.label : "",
          CompanyID: selectedCompanyId,
          CreatedBy: 0,
          RowVersion: 1
        };
      });

      const payload = {
        UserID: formData.UserID,
        Password: formData.Password,
        UserName: formData.UserName,
        CompanyID: selectedCompanyId,
        IsAdmin: formData.IsAdmin,
        IsActive: formData.IsActive,
        AccessFailedCount: 0,
        TwoFactorEnabled: true,
        PhoneNumberConfirmed: true,
        EmailConfirmed: true,
        PersonID: 0,
        IsForcedLogin: formData.IsForcedLogin,
        DefaultMenuID: formData.default_menu,
        default_menu: formData.default_menu,
        IsLocked: formData.IsLocked,
        UserType: formData.UserType,
        Pin: formData.Pin, // Include PIN in payload
        RowEditorStatus: isEditing ? "updated" : "inserted",
        forgot_password_token: "",
        SecurityGroupUserChildList: mappedGroupList
      };

      const response = isSuperUser
        ? await userService.saveUserSuper(payload)
        : await userService.saveUser(payload);

      if (response?.response_code === 'DUPLICATE_USER') {
        setErrors({ UserName: response.message || 'This username already exists.' });
        toast({ title: 'Validation Error', description: response.message || 'This username already exists.', status: 'error' });
      } else if (response && (
        response.response_code === 'SAVE_SUCCESS' ||
        response.response_code === 'Success' ||
        response.response_code === 'OK' ||
        response.status_code === 200 ||
        response.status_code === 201
      )) {
        const savedUser = response.data?.user || response.data || payload;
        setLastSavedUser({
          ...savedUser,
          user_id: savedUser.user_id || savedUser.UserID || response.data?.user_id,
          user_type: formData.UserType
        });
        
        toast({ title: 'Success', description: `User ${isEditing ? 'updated' : 'created'} successfully!`, status: 'success' });
        
        // Show success modal for next steps
        setShowSuccessModal(true);
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const filteredUserTypes = React.useMemo(() => {
    if (isRoleSpecific && authUser?.user_type === 8) {
      return userTypes.filter(ut => ut.value === '6' || ut.value === '3');
    }
    return userTypes;
  }, [userTypes, authUser, isRoleSpecific]);

  return (
    <>
      <form id="user-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-5">
          {/* Company Dropdown - Only for SuperUser */}
          {isSuperUser && (
            <div className="space-y-2">
              <label className="text-sm font-bold leading-none text-text-main flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary-500" />
                Primary Company <span className="text-red-500">*</span>
              </label>
              <div className={cn("relative rounded-md", errors.CompanyID && "ring-1 ring-red-500")}>
                <Select
                  options={companies}
                  value={formData.CompanyID || null}
                  onChange={(val) => {
                    setFormData({ ...formData, CompanyID: val || '', selectedGroups: [], default_menu: '' });
                    if (errors.CompanyID) setErrors({ ...errors, CompanyID: undefined });
                  }}
                  placeholder="Select a company..."
                  error={!!errors.CompanyID}
                />
              </div>
              {errors.CompanyID && <p className="text-xs font-medium text-red-500 mt-1">{errors.CompanyID}</p>}
            </div>
          )}

          {/* User Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold leading-none text-text-main">User Name <span className="text-red-500">*</span></label>
            <Input
              required
              placeholder="e.g. munnacse1809EA"
              value={formData.UserName}
              onChange={(e) => {
                setFormData({ ...formData, UserName: e.target.value });
                if (errors.UserName) setErrors({ ...errors, UserName: undefined });
              }}
              className={cn(errors.UserName ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300")}
            />
            {errors.UserName && <p className="text-xs font-medium text-red-500 mt-1">{errors.UserName}</p>}
          </div>

          {/* Security Group Multi-Select */}
          <div className="space-y-2">
            <label className="text-sm font-bold leading-none text-text-main flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary-500" />
              Security Groups <span className="text-red-500">*</span>
            </label>
            <div className={cn("relative rounded-md", errors.SecurityGroups && "ring-1 ring-red-500")}>
              <MultiSelect
                options={cascadedGroups}
                value={formData.selectedGroups}
                onChange={(val) => {
                  setFormData({ ...formData, selectedGroups: val });
                  if (errors.SecurityGroups) setErrors({ ...errors, SecurityGroups: undefined });
                }}
                placeholder={dataLoading ? "Loading groups..." : "Choose assigned security groups..."}
                className="z-20 relative"
                disabled={dataLoading || (isSuperUser && !formData.CompanyID)}
              />
              {dataLoading && <Loader2 className="absolute right-10 top-2.5 h-4 w-4 animate-spin text-primary-400 z-30" />}
            </div>
            {errors.SecurityGroups && <p className="text-xs font-medium text-red-500 mt-1">{errors.SecurityGroups}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Page (Redirect) Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold leading-none text-text-main flex items-center gap-2">
                <Layout className="h-3.5 w-3.5 text-primary-500" />
                Default Page (Redirect)
              </label>
              <div className="relative">
                <Select
                  options={defaultMenus}
                  value={formData.default_menu}
                  onChange={(val) => setFormData({ ...formData, default_menu: String(val || '') })}
                  placeholder={dataLoading ? "Loading menus..." : "Select startup page..."}
                  disabled={dataLoading || (isSuperUser && !formData.CompanyID)}
                />
                {dataLoading && <Loader2 className="absolute right-10 top-2.5 h-4 w-4 animate-spin text-primary-400 z-30" />}
              </div>
              <p className="text-[10px] text-text-muted/50 font-medium leading-relaxed italic">
                Path after successful authentication.
              </p>
            </div>

            {/* User Type Select */}
            <div className="space-y-2">
              <label className="text-sm font-bold leading-none text-text-main flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary-500" />
                User Type
              </label>
              <div className="relative">
                <Select
                  options={filteredUserTypes}
                  value={formData.UserType}
                  onChange={(val) => setFormData({ ...formData, UserType: String(val || '') })}
                  placeholder="Select user type..."
                  disabled={isRoleSpecific}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password field with optionality and toggle */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold leading-none text-text-main">Password {!isEditing ? '(Optional)' : ''}</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={formData.Password}
                  onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                  className="pr-10 border-gray-300"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted/50 hover:text-text-muted focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Validation (Only show if typing) */}
              {formData.Password.length > 0 && (
                <div className="bg-primary-500/5 rounded-lg p-3 border border-border-theme mt-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Security Requirements</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {isMinLength ? <CheckIcon /> : <CircleIcon />}
                      <span className={cn("text-[11px] font-medium", isMinLength ? "text-text-main" : "text-text-muted/60")}>
                        Minimum 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUpperAndNumber ? <CheckIcon /> : <CircleIcon />}
                      <span className={cn("text-[11px] font-medium", hasUpperAndNumber ? "text-text-main" : "text-text-muted/60")}>
                        Uppercase & Number
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSpecialChar ? <CheckIcon /> : <CircleIcon />}
                      <span className={cn("text-[11px] font-medium", hasSpecialChar ? "text-text-main" : "text-text-muted/60")}>
                        Special character (!@#$%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile PIN field */}
            <div className="space-y-2">
              <label className="text-sm font-bold leading-none text-text-main flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary-500" />
                Mobile Access PIN (Optional)
              </label>
              <div className="relative group/pin">
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Enter 4 digit mobile PIN"
                  value={formData.Pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 4) {
                      setFormData({ ...formData, Pin: val });
                    }
                  }}
                  className="border-gray-300 tracking-[1em] font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-text-muted/50 font-medium italic">
                Used for high-speed authentication on mobile devices and wallet apps (e.g. 01672xxxxxx).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
            {isSuperUser && (
              <div className="pt-2">
                <Switch
                  label={formData.IsAdmin ? "System Admin: Yes" : "System Admin: No"}
                  checked={formData.IsAdmin}
                  onCheckedChange={(val) => setFormData({ ...formData, IsAdmin: val })}
                />
              </div>
            )}
            <div className="pt-2">
              <Switch
                label={formData.IsActive ? "Status is Active" : "Status is Inactive"}
                checked={formData.IsActive}
                onCheckedChange={(val) => setFormData({ ...formData, IsActive: val })}
              />
            </div>
            <div className="pt-2">
              <Switch
                label={formData.IsForcedLogin ? "Forced Login: Yes" : "Forced Login: No"}
                checked={formData.IsForcedLogin}
                onCheckedChange={(val) => setFormData({ ...formData, IsForcedLogin: val })}
              />
            </div>
            <div className="pt-2 space-y-2">
              <Switch
                label={formData.IsLocked ? "Account Locked: Yes" : "Account Locked: No"}
                checked={formData.IsLocked}
                onCheckedChange={(val) => setFormData({ ...formData, IsLocked: val })}
              />
              {formData.IsLocked && formData.LockedDateTime && (
                <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 pl-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  Locked at: {new Date(formData.LockedDateTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
      <ToastComponent />

      {/* Post-Save Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          if (onSave) onSave();
          if (onClose) onClose();
        }}
        title="Operation Successful"
        maxWidth="sm"
      >
        <div className="p-1 sm:p-2">
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-ping" />
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500 relative z-10" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-text-main uppercase tracking-tight">User Account Ready</h3>
            <p className="text-[12px] sm:text-sm text-text-muted mt-2 max-w-[280px]">
              User <span className="font-bold text-text-main">@{formData.UserName}</span> has been {isEditing ? 'updated' : 'provisioned'} in the system.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                const username = lastSavedUser?.user_name || lastSavedUser?.UserName || formData.UserName;
                if (username) {
                  navigate(ROUTES.STAKEHOLDER_KYC.replace(':id', username), { 
                    state: { from: location.pathname } 
                  });
                }
              }}
              className="w-full group flex items-center justify-between p-3 sm:p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl transition-all shadow-lg shadow-primary-900/20"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="text-left">
                  <div className="text-[12px] sm:text-[13px] font-black uppercase tracking-wider">Setup KYC Profile</div>
                  <div className="text-[9px] sm:text-[10px] opacity-70">Complete mandatory identity verification</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </button>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onSave) onSave();
                if (onClose) onClose();
              }}
              className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-text-main transition-colors"
            >
              Return to User List
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
