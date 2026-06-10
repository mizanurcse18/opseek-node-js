import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { visitPlanService } from '../api/visit-plans.api';
import type { AgentDto } from '../api/visit-plans.api';
import { DAY_OF_WEEK_OPTIONS } from '../types';
import type { VisitPlanTemplate, VisitPlanTemplateDetail } from '../types';
import { CalendarDays, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface VisitPlanTemplateFormProps {
  initialData?: VisitPlanTemplate | null;
  isSuperUser?: boolean;
  onSave: () => void;
  onClose: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function VisitPlanTemplateForm({
  initialData,
  isSuperUser = false,
  onSave,
  onClose,
  onLoadingChange,
}: VisitPlanTemplateFormProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  const [templateName, setTemplateName] = useState(initialData?.template_name || '');
  const [dealerId, setDealerId] = useState<number>(initialData?.dealer_id || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [companyId, setCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);

  // Dealer & DSR data
  const [dealers, setDealers] = useState<{ value: number; label: string }[]>([]);
  const [dealerMembers, setDealerMembers] = useState<{ value: number; label: string; agents: AgentDto[] }[]>([]);

  const handleCompanyChange = useCallback(async (val: number | string | null) => {
    const id = val != null ? String(val) : '';
    setCompanyId(id);
    setDealerId(0);
    setDealerMembers([]);
    setSlots([]);
    setNewDsr(0);
    setNewAgents([]);

    if (id && isSuperUser) {
      setLoadingDealers(true);
      try {
        const dealerList = await visitPlanService.getDealersByCompany(id);
        setDealers(dealerList || []);
      } catch (err) {
        console.error('Failed to load dealers for company:', err);
      } finally {
        setLoadingDealers(false);
      }
    }
  }, [isSuperUser]);

  // Schedule slots
  const [slots, setSlots] = useState<VisitPlanTemplateDetail[]>(() => {
    if (initialData?.details?.length) {
      return initialData.details.map((d, i) => ({ ...d, visit_order: i + 1 }));
    }
    return [];
  });

  // New slot form state
  const [newDay, setNewDay] = useState(0);
  const [newDsr, setNewDsr] = useState<number>(0);
  const [newAgents, setNewAgents] = useState<(string | number)[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Inline validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setError = (field: string, msg: string) => {
    setValidationErrors(prev => ({ ...prev, [field]: msg }));
  };

  const isEditing = !!initialData;

  // DSR options from dealer members — moved before addSlot to avoid hoisting issues
  const dsrOptions = useMemo(
    () => dealerMembers.map(d => ({ value: d.value, label: d.label })),
    [dealerMembers]
  );

  // Agents for the selected DSR
  const agentOptions = useMemo(
    () =>
      newDsr
        ? (dealerMembers.find(d => d.value === newDsr)?.agents || []).map(a => ({
            value: a.value,
            label: a.label,
          }))
        : [],
    [dealerMembers, newDsr]
  );

  // Track existing (day, agent) combos for duplicate validation
  const existingCombos = useMemo(() => {
    const combos = new Set<string>();
    for (const s of slots) {
      if (s.agent_user_id != null) {
        combos.add(`${s.day_of_week}-${s.agent_user_id}`);
      }
    }
    return combos;
  }, [slots]);

  // Load companies & initial data
  useEffect(() => {
    const loadInit = async () => {
      if (onLoadingChange) onLoadingChange(true);
      try {
        if (isSuperUser) {
          try {
            const { companyService } = await import('@/lib/auth/api/company.service');
            const resp = await companyService.getAllCompanies();
            if (resp && Array.isArray(resp)) {
              setCompanies(resp.map((c: any) => ({
                value: String(c.value ?? c.id ?? c.company_id ?? ''),
                label: c.label || c.company_name || `Company #${c.value || c.id}`,
              })));
            }
          } catch (err) {
            console.error('Failed to load companies:', err);
          }
        }

        const authCompanyId = user?.company_id || '';
        let activeCompanyId: string;
        if (initialData?.template_id) {
          activeCompanyId = String((initialData as any).company_id || authCompanyId || '');
        } else {
          activeCompanyId = authCompanyId;
        }
        setCompanyId(activeCompanyId);

        // Load dealers
        setLoadingDealers(true);
        try {
          let dealerList: { value: number; label: string }[];
          if (isSuperUser && activeCompanyId) {
            dealerList = await visitPlanService.getDealersByCompany(activeCompanyId);
          } else if (activeCompanyId) {
            dealerList = await visitPlanService.getDealersByCompany(activeCompanyId);
          } else {
            dealerList = await visitPlanService.getDealers();
          }
          setDealers(dealerList || []);

          // Auto-select single dealer
          if (dealerList?.length === 1) {
            setDealerId(Number(dealerList[0].value));
          }
        } catch (err) {
          console.error('Failed to load dealers:', err);
        } finally {
          setLoadingDealers(false);
        }
      } finally {
        if (onLoadingChange) onLoadingChange(false);
      }
    };
    loadInit();
  }, [initialData, isSuperUser, user]);

  // Load dealer members when dealer changes
  useEffect(() => {
    const load = async () => {
      if (!dealerId) {
        setDealerMembers([]);
        return;
      }
      try {
        const res = await visitPlanService.getDealerMembers(dealerId);
        setDealerMembers(res?.dsrs || []);
      } catch (err) {
        console.error('Failed to load dealer members', err);
      }
    };
    load();
  }, [dealerId]);

  // Auto-select dealer in edit mode
  useEffect(() => {
    if (initialData?.dealer_id && dealers.length > 0) {
      const match = dealers.find(d => d.value === initialData.dealer_id);
      if (match) setDealerId(initialData.dealer_id);
    }
  }, [initialData, dealers]);

  // Sync state when initialData changes (e.g. after async fetch in modal)
  useEffect(() => {
    if (initialData) {
      setTemplateName(initialData.template_name || '');
      setDealerId(initialData.dealer_id || 0);
      setNotes(initialData.notes || '');
      setCompanyId(String((initialData as any).company_id || ''));
      if (initialData.details?.length) {
        setSlots(initialData.details.map((d, i) => ({ ...d, visit_order: i + 1 })));
      } else {
        setSlots([]);
      }
    } else {
      setTemplateName('');
      setDealerId(0);
      setNotes('');
      setCompanyId(String(user?.company_id || ''));
      setSlots([]);
    }
  }, [initialData, user]);

  // Set first dealer if superuser and no dealer selected
  useEffect(() => {
    if (isSuperUser && dealers.length > 0 && dealerId === 0 && !isEditing) {
      setDealerId(dealers[0].value);
    }
  }, [dealers, isSuperUser, dealerId, isEditing]);

  const addSlot = useCallback(() => {
    setValidationErrors({});

    if (!newDsr) {
      setError('dsr', 'Please select a DSR');
      return;
    }
    if (newAgents.length === 0) {
      setError('agents', 'Select at least one agent');
      return;
    }

    // Check for duplicates: same day + same agent
    const duplicateAgentIds: number[] = [];
    const validAgentIds: number[] = [];
    for (const agentVal of newAgents) {
      const agentId = Number(agentVal);
      const key = `${newDay}-${agentId}`;
      if (existingCombos.has(key)) {
        duplicateAgentIds.push(agentId);
      } else {
        validAgentIds.push(agentId);
      }
    }

    if (duplicateAgentIds.length > 0) {
      const dupLabels = duplicateAgentIds
        .map(id => agentOptions.find(a => a.value === id)?.label || `#${id}`)
        .join(', ');
      setError('agents', `Already scheduled on ${DAY_OF_WEEK_OPTIONS.find(d => d.value === newDay)?.label}: ${dupLabels}`);
    }

    if (validAgentIds.length === 0) return;

    const dsrName = dsrOptions.find(d => d.value === newDsr)?.label || '';

    setSlots(prev => {
      const newSlots: VisitPlanTemplateDetail[] = [];
      for (const agentId of validAgentIds) {
        const agentName = agentOptions.find(a => a.value === agentId)?.label || '';
        newSlots.push({
          day_of_week: newDay,
          dsr_user_id: newDsr,
          dsr_user_name: dsrName,
          agent_user_id: agentId,
          agent_user_name: agentName,
          visit_order: prev.length + newSlots.length + 1,
        });
      }
      return [...prev, ...newSlots];
    });

    // Reset agent selection but keep day+DSR for quick batch entry
    setNewAgents([]);
  }, [newDay, newDsr, newAgents, dsrOptions, agentOptions, existingCombos]);

  const removeSlot = useCallback((index: number) => {
    setSlots(prev =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, visit_order: i + 1 }))
    );
  }, []);

  const handleSave = async () => {
    setValidationErrors({});

    if (!templateName.trim()) {
      setError('templateName', 'Template name is required');
      return;
    }
    if (slots.length === 0) {
      setError('slots', 'Add at least one schedule slot');
      return;
    }

    // Check for duplicate day+agent combos
    const seenComboKeys = new Set<string>();
    for (const s of slots) {
      if (s.agent_user_id != null) {
        const key = `${s.day_of_week}-${s.agent_user_id}`;
        if (seenComboKeys.has(key)) {
          setError('slots', `Duplicate: ${DAY_OF_WEEK_OPTIONS.find(d => d.value === s.day_of_week)?.label || `Day ${s.day_of_week}`} already has ${s.agent_user_name || `Agent #${s.agent_user_id}`}`);
          return;
        }
        seenComboKeys.add(key);
      }
    }

    setSaving(true);
    onLoadingChange?.(true);

    try {
      const payload: Partial<VisitPlanTemplate> & { company_id?: number } = {
        template_id: initialData?.template_id || 0,
        template_name: templateName.trim(),
        dealer_id: dealerId,
        status: initialData?.status ?? 0,
        notes: notes || undefined,
        company_id: Number(companyId) || 0,
        details: slots.map((s, i) => ({
          day_of_week: s.day_of_week,
          dsr_user_id: s.dsr_user_id,
          agent_user_id: s.agent_user_id!,
          visit_order: i + 1,
        })),
      };

      const res = await visitPlanService.saveTemplate(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS')) {
        onSave();
        onClose();
      } else {
        const errMsg = res?.data?.message || res?.message || res?.error || res?.response_code || 'Failed to save template';
        setError('form', errMsg);
      }
    } catch (err) {
      setError('form', 'An unexpected error occurred while saving');
      console.error('Save error', err);
    } finally {
      setSaving(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header: Template Name + Dealer */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary-500" />
            Template Details
          </h3>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        <div className={`space-y-4 ${collapsed ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isSuperUser && (
              <div>
                <Label>Company <span className="text-red-500 font-bold">*</span></Label>
                <Select
                  options={companies}
                  value={companyId || null}
                  onChange={handleCompanyChange}
                  placeholder="Select Company"
                  className="w-full shadow-sm"
                />
              </div>
            )}
            <div className={isSuperUser ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={e => { setTemplateName(e.target.value); clearError('templateName'); }}
                placeholder="e.g. Weekly Route A"
                className={validationErrors.templateName ? 'border-red-500' : ''}
              />
              {validationErrors.templateName && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{validationErrors.templateName}</p>
              )}
            </div>
            {isSuperUser && (
              <div>
                <Label>Dealer</Label>
                <Select
                  options={dealers}
                  value={dealerId || null}
                  onChange={(val) => setDealerId(Number(val))}
                  placeholder="Select dealer..."
                  disabled={loadingDealers || isEditing}
                  className="w-full shadow-sm"
                />
              </div>
            )}
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this template..."
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Schedule Slots Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Schedule Slots ({slots.length})
        </h3>
        {validationErrors.slots && (
          <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {validationErrors.slots}
          </p>
        )}

        {/* Add new slot row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="sm:col-span-2">
            <Label className="text-[10px]">Day</Label>
            <Select
              options={DAY_OF_WEEK_OPTIONS}
              value={newDay}
              onChange={(val) => setNewDay(Number(val))}
              className="w-full"
              isSearchable={false}
              isClearable={false}
            />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-[10px]">DSR</Label>
            <Select
              options={dsrOptions}
              value={newDsr || null}
              onChange={(val) => { setNewDsr(Number(val)); clearError('dsr'); }}
              placeholder="Select DSR..."
              disabled={!dealerId}
              className={cn("w-full", validationErrors.dsr && 'border-red-500')}
              error={!!validationErrors.dsr}
            />
            {validationErrors.dsr && (
              <p className="mt-1 text-xs text-red-500 font-semibold">{validationErrors.dsr}</p>
            )}
          </div>
          <div className="sm:col-span-5">
            <Label className="text-[10px]">Agents *</Label>
            <MultiSelect
              options={agentOptions}
              value={newAgents}
              onChange={(v) => { setNewAgents(v); clearError('agents'); }}
              placeholder={newDsr ? 'Select agents...' : 'Select DSR first'}
              disabled={!newDsr}
              className={cn("w-full", validationErrors.agents && 'border-red-500')}
            />
            {validationErrors.agents && (
              <p className="mt-1 text-xs text-red-500 font-semibold">{validationErrors.agents}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              onClick={addSlot}
              size="sm"
              className="w-full h-9 bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Slot{newAgents.length > 0 ? ` (${newAgents.length})` : ''}
            </Button>
          </div>
        </div>

        {/* Slot list */}
        {slots.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            No schedule slots yet. Add one above.
          </p>
        ) : (
          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
            {slots.map((slot, index) => {
              const dayLabel = DAY_OF_WEEK_OPTIONS.find(d => d.value === slot.day_of_week)?.label || `Day ${slot.day_of_week}`;
              const dsrLabel = slot.dsr_user_name || `DSR #${slot.dsr_user_id}`;
              const agentLabel = slot.agent_user_name || `Agent #${slot.agent_user_id}`;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2.5 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors group"
                >
                  <span className="text-[11px] font-bold text-gray-400 w-5 shrink-0">{slot.visit_order}.</span>
                  <span className="text-[11px] font-semibold text-primary-600 w-[68px] shrink-0">{dayLabel}</span>
                  <span className="text-[11px] text-gray-700 w-[120px] truncate shrink-0">{dsrLabel}</span>
                  <span className="text-xs text-gray-500 truncate">
                    {agentLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 shrink-0"
                    title="Remove slot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          {saving ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
}
