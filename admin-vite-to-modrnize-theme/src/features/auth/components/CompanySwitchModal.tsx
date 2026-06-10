import { useState, useEffect } from 'react';
import { Building2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select, Option } from '@/components/ui-old/Select';
import { Button } from '@/components/ui-old/Button';
import { companyService } from '@/lib/auth/api/company.service';
import { authService } from '@/lib/auth/api/auth.service';
import { setTokens, getRefreshToken } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';

interface CompanySwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanySwitchModal({ isOpen, onClose }: CompanySwitchModalProps) {
  const [companies, setCompanies] = useState<Option[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const { toast, ToastComponent } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const data = await companyService.getAllCompanies();
      const options = (data || []).map((c: any) => ({
        value: c.value || c.id || c.company_id || c.CompanyID,
        label: c.label || c.company_name || c.CompanyName || `Company #${c.value || c.id}`,
      }));
      setCompanies(options);
    } catch (err) {
      console.error('Failed to load companies:', err);
      toast({ title: 'Error', description: 'Failed to load companies list.', status: 'error' });
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleSwitchCompany = async () => {
    if (!selectedCompanyId) return;

    setIsSwitching(true);
    setSwitchError(null);

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setSwitchError('No refresh token found. Please login again.');
        setIsSwitching(false);
        return;
      }

      const response = await authService.changeCompany({
        RefreshToken: refreshToken,
        CompanyID: String(selectedCompanyId),
      });

      if (response?.response_code === 'OK') {
        setTokens(response.data.token, response.data.refresh_token);
        toast({ title: 'Company switched', description: 'Company context updated. Redirecting...', status: 'success' });

        // Small delay to show success toast before navigating
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else {
        setSwitchError(response?.message || 'Failed to switch company.');
      }
    } catch (err: any) {
      console.error('Company switch error:', err);
      setSwitchError(err?.message || 'Failed to switch company. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Select Company"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSwitching}
            >
              Skip
            </Button>
            <Button
              onClick={handleSwitchCompany}
              isLoading={isSwitching}
              disabled={!selectedCompanyId || isSwitching}
            >
              {isSwitching ? 'Switching...' : 'Change Company'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Info text */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary-500/5 border border-primary-500/10">
            <Building2 className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-text-main">Superadmin Access</p>
              <p className="text-xs text-text-muted mt-0.5">
                You are logged in as a superadmin. Select a company to access the system with that company's context.
              </p>
            </div>
          </div>

          {/* Company selector */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">
              Company <span className="text-red-500">*</span>
            </label>
            {isLoadingCompanies ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border-theme">
                <RefreshCw className="h-4 w-4 animate-spin text-text-muted" />
                <span className="text-sm text-text-muted">Loading companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border-theme bg-red-50/50">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-600">No companies found. Contact system administrator.</span>
              </div>
            ) : (
              <Select
                options={companies}
                value={selectedCompanyId}
                onChange={(val) => {
                  setSelectedCompanyId(val);
                  setSwitchError(null);
                }}
                placeholder="Select a company..."
                isSearchable={true}
                isClearable={true}
              />
            )}
          </div>

          {/* Error message */}
          {switchError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-sm text-red-600">{switchError}</span>
            </div>
          )}

          {/* Success indicator */}
          {!switchError && selectedCompanyId && !isSwitching && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-600">
                Ready to switch. Click "Change Company" to continue.
              </span>
            </div>
          )}
        </div>
      </Modal>
      <ToastComponent />
    </>
  );
}
