import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { visitPlanService } from '../api/visit-plans.api';
import { PLAN_TYPE_OPTIONS } from '../types';
import { CalendarDays, Plus, Trash2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitPlanFormProps {
  initialData?: any;
  isSuperUser?: boolean;
  onSave?: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

interface DetailRow {
  tempId: number;
  visit_date: string;
  dsr_user_id: number;
  agent_user_id?: number;
  planned_latitude?: number;
  planned_longitude?: number;
  location_name?: string;
  visit_order: number;
}

export function VisitPlanForm({ initialData, isSuperUser = false, onSave, onClose, onLoadingChange }: VisitPlanFormProps) {
  const [planName, setPlanName] = useState('');
  const [dealerId, setDealerId] = useState<number>(0);
  const [planType, setPlanType] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [companyId, setCompanyId] = useState<number>(0);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [nextTempId, setNextTempId] = useState(1);
  const [companies, setCompanies] = useState<{ value: string | number; label: string }[]>([]);

  const { toast, ToastComponent } = useToast();
  const isEditing = !!(initialData?.plan_id);

  useEffect(() => {
    const loadData = async () => {
      if (onLoadingChange) onLoadingChange(true);
      try {
        if (isSuperUser) {
          try {
            const { companyService } = await import('@/lib/auth/api/company.service');
            const resp = await companyService.getAllCompanies();
            if (resp && Array.isArray(resp)) {
              setCompanies(resp.map((c: any) => ({
                value: c.value || c.id || c.company_id,
                label: c.label || c.company_name || `Company #${c.value || c.id}`
              })));
            }
          } catch {}
        }

        if (initialData?.plan_id) {
          const response = await visitPlanService.getPlan(initialData.plan_id);
          const data = response?.data || response;
          if (data) {
            setPlanName(data.plan_name || '');
            setDealerId(data.dealer_id || 0);
            setPlanType(data.plan_type ?? 0);
            setStartDate(data.start_date ? data.start_date.substring(0, 10) : '');
            setEndDate(data.end_date ? data.end_date.substring(0, 10) : '');
            setNotes(data.notes || '');
            setCompanyId(data.company_id || 0);
            if (data.details?.length) {
              const mapped = data.details.map((d: any, i: number) => ({
                tempId: i + 1,
                visit_date: d.visit_date ? d.visit_date.substring(0, 10) : '',
                dsr_user_id: d.dsr_user_id || 0,
                agent_user_id: d.agent_user_id,
                planned_latitude: d.planned_latitude,
                planned_longitude: d.planned_longitude,
                location_name: d.location_name || '',
                visit_order: d.visit_order || i + 1,
              }));
              setDetails(mapped);
              setNextTempId(mapped.length + 1);
            } else {
              addDetailRow();
            }
          }
        } else {
          addDetailRow();
        }
      } finally {
        if (onLoadingChange) onLoadingChange(false);
      }
    };
    loadData();
  }, [initialData]);

  const addDetailRow = () => {
    setDetails(prev => [...prev, {
      tempId: nextTempId,
      visit_date: '',
      dsr_user_id: 0,
      visit_order: prev.length + 1,
    }]);
    setNextTempId(prev => prev + 1);
  };

  const removeDetailRow = (tempId: number) => {
    if (details.length <= 1) return;
    setDetails(prev => {
      const filtered = prev.filter(d => d.tempId !== tempId);
      return filtered.map((d, i) => ({ ...d, visit_order: i + 1 }));
    });
  };

  const updateDetail = (tempId: number, field: keyof DetailRow, value: any) => {
    setDetails(prev => prev.map(d => d.tempId === tempId ? { ...d, [field]: value } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planName.trim()) {
      toast({ title: 'Validation Error', description: 'Plan name is required.', status: 'error' });
      return;
    }
    if (!dealerId) {
      toast({ title: 'Validation Error', description: 'Dealer ID is required.', status: 'error' });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: 'Validation Error', description: 'Start and end dates are required.', status: 'error' });
      return;
    }
    if (details.length === 0) {
      toast({ title: 'Validation Error', description: 'At least one visit detail is required.', status: 'error' });
      return;
    }

    if (onLoadingChange) onLoadingChange(true);

    try {
      const payload = {
        plan_id: initialData?.plan_id || 0,
        plan_name: planName,
        dealer_id: dealerId,
        plan_type: planType,
        start_date: startDate,
        end_date: endDate,
        notes: notes || undefined,
        company_id: companyId,
        total_visits: details.length,
        details: details.map(d => ({
          visit_date: d.visit_date,
          dsr_user_id: d.dsr_user_id,
          agent_user_id: d.agent_user_id || undefined,
          planned_latitude: d.planned_latitude || undefined,
          planned_longitude: d.planned_longitude || undefined,
          location_name: d.location_name || undefined,
          visit_order: d.visit_order,
        })),
      };

      const response = await visitPlanService.savePlan(payload);
      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SAVE_SUCCESS')) {
        toast({ title: 'Success', description: 'Visit plan saved successfully.', status: 'success' });
        onSave?.();
        onClose();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <>
      <form id="visit-plan-form" onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isSuperUser && (
            <div className="space-y-2 lg:col-span-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
                Company <span className="text-red-500 font-bold">*</span>
              </Label>
              <Select
                options={companies}
                value={companyId || null}
                onChange={(val) => setCompanyId(Number(val) || 0)}
                placeholder="Select Company"
                className="w-full shadow-sm"
              />
            </div>
          )}

          <div className="space-y-2 lg:col-span-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Plan Name <span className="text-red-500 font-bold">*</span>
            </Label>
            <div className="relative group">
              <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 group-focus-within:text-primary-600 transition-colors" />
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Weekly Route — Dhaka North"
                required
                className="h-11 pl-10 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Dealer ID <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              type="number"
              value={dealerId || ''}
              onChange={(e) => setDealerId(Number(e.target.value))}
              placeholder="e.g. 123"
              required
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Plan Type</Label>
            <Select
              options={PLAN_TYPE_OPTIONS}
              value={planType}
              onChange={(val) => setPlanType(Number(val))}
              placeholder="Select type"
              className="w-full shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              Start Date <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">
              End Date <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="h-11 text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Visit Details / Route */}
        <div className="space-y-3 pt-4 border-t border-border-theme">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" />
              <span className="text-xs font-black uppercase tracking-widest text-primary-600">Visit Route — {details.length} stop{details.length !== 1 ? 's' : ''}</span>
            </div>
            <Button type="button" onClick={addDetailRow} variant="ghost" size="sm"
              className="text-primary-600 hover:bg-primary-50 h-7 px-3 text-[10px] font-black uppercase tracking-widest">
              <Plus className="h-3 w-3 mr-1" /> Add Stop
            </Button>
          </div>

          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={detail.tempId}
                className={cn(
                  "relative group/card rounded-lg border border-border-theme p-4 transition-all",
                  "hover:border-primary-200 hover:shadow-sm bg-white"
                )}>
                <div className="flex items-start gap-3">
                  {/* Stop number indicator */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black",
                      "border-2 transition-colors",
                      detail.visit_date
                        ? "bg-primary-500 border-primary-500 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    )}>
                      {index + 1}
                    </div>
                    {index < details.length - 1 && (
                      <div className="w-0.5 h-full min-h-[24px] bg-gray-200 group-hover/card:bg-primary-200 transition-colors" />
                    )}
                  </div>

                  {/* Detail fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">
                        Visit Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={detail.visit_date}
                        onChange={(e) => updateDetail(detail.tempId, 'visit_date', e.target.value)}
                        required
                        className="h-9 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">
                        DSR User ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={detail.dsr_user_id || ''}
                        onChange={(e) => updateDetail(detail.tempId, 'dsr_user_id', Number(e.target.value))}
                        placeholder="DSR ID"
                        required
                        className="h-9 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">Agent ID</Label>
                      <Input
                        type="number"
                        value={detail.agent_user_id || ''}
                        onChange={(e) => updateDetail(detail.tempId, 'agent_user_id', Number(e.target.value) || undefined)}
                        placeholder="Agent ID (optional)"
                        className="h-9 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">Location Name</Label>
                      <Input
                        value={detail.location_name || ''}
                        onChange={(e) => updateDetail(detail.tempId, 'location_name', e.target.value)}
                        placeholder="e.g. Gulshan Outlet"
                        className="h-9 text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">GPS</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number" step="any"
                          value={detail.planned_latitude ?? ''}
                          onChange={(e) => updateDetail(detail.tempId, 'planned_latitude', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Lat"
                          className="h-9 text-[10px] font-mono font-medium"
                        />
                        <Input
                          type="number" step="any"
                          value={detail.planned_longitude ?? ''}
                          onChange={(e) => updateDetail(detail.tempId, 'planned_longitude', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Lng"
                          className="h-9 text-[10px] font-mono font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  {details.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDetailRow(detail.tempId)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/card:opacity-100 transition-all flex-shrink-0 mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-2 border-t border-border-theme">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 ml-1">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this plan..."
            rows={2}
            className="text-sm font-medium border-border-theme focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all resize-none"
          />
        </div>
      </form>
      <ToastComponent />
    </>
  );
}
