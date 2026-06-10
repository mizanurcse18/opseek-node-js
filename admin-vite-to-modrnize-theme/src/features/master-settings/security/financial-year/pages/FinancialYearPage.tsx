import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { handleApiError } from '@/lib/error-handler';
import { apiService } from '@/lib/api.service';
import { API_MODULES } from '@/constants/api';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Calendar, Plus, Edit2, RotateCcw, Trash2, ShieldAlert, Award, PlayCircle } from 'lucide-react';

interface Period {
  period_id: number;
  financial_year_id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}

export default function FinancialYearPage() {
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [financialYearName, setFinancialYearName] = useState('');
  const [yearNumber, setYearNumber] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [isActive, setIsActive] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [periodLines, setPeriodLines] = useState<Period[]>([]);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const fetchFinancialYears = async () => {
    setLoading(true);
    try {
      const resp: any = await apiService.get(API_MODULES.AUTH, '/FinancialYear/GetAll');
      setFinancialYears(resp?.data || []);
    } catch (err) {
      console.error('Failed to load financial years:', err);
      setFinancialYears([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedYear(null);
    setFinancialYearName('');
    setYearNumber(new Date().getFullYear());
    setStartDate(`${new Date().getFullYear()}-01-01`);
    setEndDate(`${new Date().getFullYear()}-12-31`);
    setIsActive(true);
    setIsClosed(false);
    setPeriodLines([]);
  };

  const handleEdit = async (record: any) => {
    setLoading(true);
    try {
      const resp: any = await apiService.get(
        API_MODULES.AUTH,
        `/FinancialYear/Get/${record.financial_year_id || record.financialYearID}`
      );
      const master = resp?.data?.masterModel || record;
      const children = resp?.data?.childModels || [];
      
      setSelectedYear(master);
      setFinancialYearName(master.financial_year_name || master.financialYearName || '');
      setYearNumber(master.year || new Date().getFullYear());
      setStartDate(master.start_date ? new Date(master.start_date).toISOString().split('T')[0] : '');
      setEndDate(master.end_date ? new Date(master.end_date).toISOString().split('T')[0] : '');
      setIsActive(master.is_active ?? true);
      setIsClosed(master.is_closed ?? false);
      setPeriodLines(children);
      setIsModalOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load details.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePeriods = async () => {
    if (!financialYearName.trim()) {
      toast({ title: 'Validation Error', description: 'Please provide a name first.', status: 'error' });
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        financial_year_name: financialYearName.trim(),
        year: Number(yearNumber),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_active: isActive,
        is_closed: isClosed
      };

      const resp: any = await apiService.post(
        API_MODULES.AUTH,
        '/FinancialYear/GetGenerateChildList',
        payload
      );
      setPeriodLines(resp?.data?.childModels || []);
      toast({ title: 'Success', description: 'Monthly periods generated. Review below.', status: 'success' });
    } catch (err) {
      toast({ title: 'Generation Failed', description: 'Failed to generate period structure.', status: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!financialYearName.trim()) {
      toast({ title: 'Validation Error', description: 'Financial Year Name is required.', status: 'error' });
      return;
    }

    if (periodLines.length === 0) {
      toast({ title: 'Validation Error', description: 'Please click "Generate Periods" to structure monthly segments.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        MasterModel: {
          financial_year_id: selectedYear?.financial_year_id || selectedYear?.financialYearID || 0,
          financial_year_name: financialYearName.trim(),
          year: Number(yearNumber),
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          is_active: isActive,
          is_closed: isClosed
        },
        ChildModels: periodLines.map(l => ({
          period_id: l.period_id || 0,
          financial_year_id: selectedYear?.financial_year_id || selectedYear?.financialYearID || 0,
          period_name: l.period_name,
          start_date: new Date(l.start_date).toISOString(),
          end_date: new Date(l.end_date).toISOString(),
          is_closed: l.is_closed ?? false
        }))
      };

      const res: any = await apiService.post(
        API_MODULES.AUTH,
        '/FinancialYear/SaveFinancialYear',
        payload
      );
      
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Financial year saved successfully.', status: 'success' });
        handleCloseModal();
        await fetchFinancialYears();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const id = itemToDelete.financial_year_id || itemToDelete.financialYearID;
      const res: any = await apiService.get(
        API_MODULES.AUTH,
        `/FinancialYear/RemoveFinancialYear/${id}`
      );
      if (res && (res.success || res.status_code === 200)) {
        toast({ title: 'Success', description: 'Financial year removed.', status: 'success' });
        setItemToDelete(null);
        await fetchFinancialYears();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Financial Years'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage corporate financial years, generate active posting periods, and lock past months.
          </p>
        </div>
        <div>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="h-8 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" />
            Add Financial Year
          </Button>
        </div>
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-theme">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Year Name</th>
                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Year Number</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Start Date</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">End Date</th>
                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-theme text-[11px] font-semibold text-slate-700">
              {loading && financialYears.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </td>
                </tr>
              ) : financialYears.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-text-muted">
                    No financial years configured.
                  </td>
                </tr>
              ) : (
                financialYears.map((year, idx) => {
                  const id = year.financial_year_id || year.financialYearID;
                  const name = year.financial_year_name || year.financialYearName || '—';
                  return (
                    <tr key={id || idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-text-main flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary-500 shrink-0" />
                        <span>{name}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{year.year || '—'}</td>
                      <td className="px-4 py-3 font-mono text-text-muted">
                        {year.start_date ? new Date(year.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-text-muted">
                        {year.end_date ? new Date(year.end_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          year.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {year.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(year)}
                            className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-50"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemToDelete(year)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedYear ? 'Edit Financial Year' : 'Add Financial Year'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Financial Year Name</Label>
              <Input
                value={financialYearName}
                onChange={(e) => setFinancialYearName(e.target.value)}
                placeholder="e.g. FY 2026-27"
                className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Year Number</Label>
              <Input
                type="number"
                value={yearNumber}
                onChange={(e) => setYearNumber(Number(e.target.value))}
                className="h-10 border-slate-200 rounded-xl text-xs font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(!!checked)}
              />
              <div className="flex flex-col">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer">Active Year</Label>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Active for entries</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Checkbox
                checked={isClosed}
                onCheckedChange={(checked) => setIsClosed(!!checked)}
              />
              <div className="flex flex-col">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer">Closed status</Label>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Lock all ledger postings</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly period partitions</span>
            <Button
              type="button"
              onClick={handleGeneratePeriods}
              disabled={generating}
              className="h-8 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest gap-1 shadow-sm"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Generate Periods
            </Button>
          </div>

          {periodLines.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[160px] overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-[8px] font-black uppercase tracking-widest text-slate-500">Period Name</th>
                    <th className="px-3 py-1.5 text-left text-[8px] font-black uppercase tracking-widest text-slate-500">From Date</th>
                    <th className="px-3 py-1.5 text-left text-[8px] font-black uppercase tracking-widest text-slate-500">To Date</th>
                    <th className="px-3 py-1.5 text-center text-[8px] font-black uppercase tracking-widest text-slate-500">Closed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-[10px] font-semibold text-slate-700">
                  {periodLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5">{line.period_name}</td>
                      <td className="px-3 py-1.5 font-mono">{new Date(line.start_date).toLocaleDateString()}</td>
                      <td className="px-3 py-1.5 font-mono">{new Date(line.end_date).toLocaleDateString()}</td>
                      <td className="px-3 py-1.5 text-center">
                        <Checkbox
                          checked={line.is_closed ?? false}
                          onCheckedChange={(checked) => setPeriodLines(prev => prev.map((l, i) => i === idx ? { ...l, is_closed: !!checked } : l))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              isLoading={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              Save Year
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !deleting && setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Financial Year"
        description="Are you sure you want to delete this financial year? Any generated periods will also be removed."
        confirmLabel="Remove"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}

function Loader(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
