import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/components/ui/Toast';
import { visitPlanService } from '../api/visit-plans.api';
import { handleApiError } from '@/lib/error-handler';
import { CalendarDays } from 'lucide-react';

interface GeneratePlanModalProps {
  template: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function GeneratePlanModal({ template, onClose, onSuccess }: GeneratePlanModalProps) {
  const { toast, ToastComponent } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [planName, setPlanName] = useState(`Generated: ${template.template_name}`);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Validation', description: 'Select start and end dates', status: 'error' as const });
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast({ title: 'Validation', description: 'End date must be after start date', status: 'error' as const });
      return;
    }

    setGenerating(true);
    try {
      const res = await visitPlanService.generatePlanFromTemplate({
        template_id: template.template_id,
        start_date: startDate,
        end_date: endDate,
        plan_name: planName || undefined,
      });
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS')) {
        const desc = res?.data?.total_visits
          ? `Generated with ${res.data.total_visits} visit slots`
          : 'Plan generated successfully';
        toast({ title: 'Success', description: desc, status: 'success' as const });
        onSuccess();
        onClose();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        maxWidth="md"
        title="Generate Plan"
      >
        <p className="text-xs text-gray-500 mb-4">
          From template: <span className="font-semibold text-gray-700">{template.template_name}</span>
        </p>
        <div className="space-y-4">
          <div>
            <Label>Plan Name</Label>
            <Input
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="Optional custom plan name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            This will create a visit plan with all weekly recurring visits based on this template,
            for every matching day within the selected date range.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest"
          >
            {generating ? 'Generating...' : 'Generate Plan'}
          </Button>
        </div>
      </Modal>
      <ToastComponent />
    </>
  );
}
