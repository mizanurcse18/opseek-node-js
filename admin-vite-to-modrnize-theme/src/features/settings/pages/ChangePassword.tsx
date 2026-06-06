import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { userService } from '@/lib/auth/api/user.service';
import { useToast } from '@/components/ui/Toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { Loader2, ShieldCheck, AlertCircle, X, Save } from 'lucide-react';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import { Button } from '@/components/ui/Button';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/authSlice';
import { clearTokens } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const getStrength = (pass: string) => {
  if (!pass) return { score: 0, text: '', color: 'bg-gray-200' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[!@#$%^&*]/.test(pass)) score += 1;

  if (score <= 1) return { score, text: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, text: 'Fair', color: 'bg-yellow-500' };
  if (score === 3) return { score, text: 'Good', color: 'bg-blue-500' };
  return { score, text: 'Strong', color: 'bg-green-500' };
};

const PasswordField = ({ label, value, onChange, show, setShow, placeholder, showStrength, message, messageColor }: any) => {
  const strength = showStrength ? getStrength(value) : null;

  return (
    <div>
      <label className="block text-sm font-bold text-text-main mb-1.5">{label}</label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2.5 text-[11px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-text-muted">Password complexity:</span>
            <span className={cn("font-bold uppercase tracking-wider", strength?.text === 'Weak' ? 'text-red-500' : strength?.text === 'Fair' ? 'text-yellow-500' : strength?.text === 'Good' ? 'text-blue-500' : 'text-green-500')}>{strength?.text}</span>
          </div>
          <div className="flex gap-1 h-1 w-full">
            {[1, 2, 3, 4].map((level) => (
              <div key={level} className={cn("h-full flex-1 rounded-full", strength!.score >= level ? strength!.color : 'bg-border-theme')}></div>
            ))}
          </div>
        </div>
      )}
      {message && (
        <p className={`mt-1.5 text-xs font-medium ${messageColor || 'text-gray-500'}`}>{message}</p>
      )}
    </div>
  );
};

const CheckIcon = () => (
  <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  </div>
);

const CircleIcon = () => (
  <div className="h-4 w-4 rounded-full bg-[#94a3b8] shrink-0"></div>
);

export default function ChangePassword() {
  const pageTitle = useMenuTitle('Change Password');
  const { toast, ToastComponent } = useToast();
  const { user, isForcedPasswordChange } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnChangePass', button_title: 'Update Password' }
  ], []));

  const btnChangePass = buttons.find(b => b.button_id === 'btnChangePass');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation logic
  const isMinLength = newPassword.length >= 6;
  const hasUpperAndNumber = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%]/.test(newPassword);
  const isDifferentFromOld = currentPassword !== newPassword && newPassword.length > 0;

  const isFormValid =
    currentPassword.length > 0 &&
    isMinLength &&
    hasUpperAndNumber &&
    hasSpecialChar &&
    isDifferentFromOld &&
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user?.id) return;

    setIsLoading(true);
    try {
      const payload = {
        OldPassword: currentPassword,
        NewPassword: newPassword,
        ConfirmNewPassword: confirmPassword
      };

      const response = await userService.changePassword(payload);

      if (response.response_code === 'PASSWORD_CHANGE_SUCCESS') {
        toast({ 
          title: 'Password updated successfully!', 
          description: 'You will be logged out. Please login with your new password.',
          status: 'success' 
        });
        
        // Wait a bit for the user to see the message
        setTimeout(() => {
          clearTokens();
          dispatch(logout());
          navigate(ROUTES.LOGIN);
        }, 1500);
      } else {
        toast({ title: response.message || 'Failed to update password', status: 'error' });
      }
    } catch (error: any) {
      toast({ title: error.response?.data?.message || 'An error occurred while updating password', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-4 px-4 sm:px-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-main">{pageTitle}</h2>
        <p className="text-sm text-text-muted mt-1">Update your password to keep your account secure.</p>
        
        {isForcedPasswordChange && (
          <div className="mt-4 p-4 bg-red-50/50 border border-red-200 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-bold animate-glow-red">
              AS PER POLICY: Please update your password to continue using the system.
            </p>
          </div>
        )}
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm p-6 sm:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={(e: any) => setCurrentPassword(e.target.value)}
            show={showCurrent}
            setShow={setShowCurrent}
            placeholder="Enter current password"
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={(e: any) => setNewPassword(e.target.value)}
            show={showNew}
            setShow={setShowNew}
            placeholder="Enter new password"
            showStrength={true}
          />

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
            show={showConfirm}
            setShow={setShowConfirm}
            placeholder="Confirm new password"
            message={confirmPassword.length > 0 ? (newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match') : ''}
            messageColor={newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}
          />

          {/* Security Requirements Panel */}
          <div className="bg-primary-500/5 rounded-lg p-5 border border-border-theme mt-6">
            <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Security Requirements</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {isMinLength ? <CheckIcon /> : <CircleIcon />}
                <span className={cn("text-sm font-medium", isMinLength ? "text-text-main" : "text-text-muted/60")}>
                  Minimum 6 characters long
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasUpperAndNumber ? <CheckIcon /> : <CircleIcon />}
                <span className={cn("text-sm font-medium", hasUpperAndNumber ? "text-text-main" : "text-text-muted/60")}>
                  At least one uppercase & one number
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasSpecialChar ? <CheckIcon /> : <CircleIcon />}
                <span className={cn("text-sm font-medium", hasSpecialChar ? "text-text-main" : "text-text-muted/60")}>
                  One special character (!@#$%)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isDifferentFromOld ? <CheckIcon /> : <CircleIcon />}
                <span className={cn("text-sm font-medium", isDifferentFromOld ? "text-text-main" : "text-text-muted/60")}>
                  New password must be different
                </span>
              </div>
              <div className="flex items-center gap-3">
                {(newPassword === confirmPassword && confirmPassword.length > 0) ? <CheckIcon /> : <CircleIcon />}
                <span className={cn("text-sm font-medium", (newPassword === confirmPassword && confirmPassword.length > 0) ? "text-text-main" : "text-text-muted/60")}>
                  Passwords must match
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-theme">
            <Button
              type="button"
              variant="outline"
              className="h-10 px-6 font-bold uppercase text-[10px] tracking-widest"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              <X className="mr-2 h-3.5 w-3.5" /> Clear
            </Button>

            {btnChangePass?.visible && (
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={cn(
                  "h-10 px-8 font-black uppercase text-[10px] tracking-widest transition-all duration-200",
                  isFormValid && !isLoading ? "bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-900/20" : ""
                )}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                {isLoading ? 'Updating...' : btnChangePass.button_title}
              </Button>
            )}
          </div>
        </form>
      </div>
      <ToastComponent />
    </div>
  );
}
