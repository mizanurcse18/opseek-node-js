import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { handleApiError } from '@/lib/error-handler';
import { financeService } from '@/lib/finance/api/finance.service';
import { companyService } from '@/lib/auth/api/company.service';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useMenuButtons } from '@/hooks/useMenuButtons';
import {
  Plus, Edit2, RotateCcw, Eye, RefreshCw, Trash2, Calendar, FileText, CheckCircle2, AlertTriangle, Building2
} from 'lucide-react';

interface VoucherLine {
  account_id: number;
  debit_amount: number;
  credit_amount: number;
  particular: string;
  ref_type: string;
  ref_id: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Create Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [voucherType, setVoucherType] = useState('JV');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [voucherLines, setVoucherLines] = useState<VoucherLine[]>([
    { account_id: 0, debit_amount: 0, credit_amount: 0, particular: '', ref_type: '', ref_id: '' },
    { account_id: 0, debit_amount: 0, credit_amount: 0, particular: '', ref_type: '', ref_id: '' }
  ]);
  const [coaOptions, setCoaOptions] = useState<{ value: number; label: string }[]>([]);
  
  // Reversal states
  const [voucherToReverse, setVoucherToReverse] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversing, setReversing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const { buttons } = useMenuButtons(useMemo(() => [
    { button_id: 'btnAdd', button_title: 'Create Voucher' },
    { button_id: 'btnReverse', button_title: 'Reverse Voucher' }
  ], []));

  const btnAdd = buttons.find(b => b.button_id === 'btnAdd');
  const btnReverse = buttons.find(b => b.button_id === 'btnReverse');

  useEffect(() => {
    const loadCompaniesAndCoa = async () => {
      try {
        const resp = await companyService.getAllCompanies();
        if (resp && Array.isArray(resp)) {
          const mapped = resp.map((c: any) => ({
            value: String(c.value || c.id || c.company_id),
            label: c.label || c.company_name || `Company #${c.value || c.id}`,
          }));
          setCompanies(mapped);
          if (mapped.length > 0) {
            const defaultCompanyId = Number(mapped[0].value);
            setSelectedCompanyId(String(defaultCompanyId));
            loadCOA(defaultCompanyId);
          }
        }
      } catch (err) {
        console.error('Failed to load companies for Vouchers:', err);
      }
    };
    loadCompaniesAndCoa();
  }, []);

  const loadCOA = async (companyId: number) => {
    try {
      const data = await financeService.getCoaCombo(companyId);
      const options = (data || []).map((c: any) => ({
        value: c.account_id,
        label: `${c.account_code} - ${c.account_name} (${c.account_type})`
      }));
      setCoaOptions(options);
    } catch (err) {
      console.error('Failed to load COA options:', err);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    loadCOA(Number(companyId));
    setRefreshKey(prev => prev + 1);
  };

  const totalDebits = useMemo(() => {
    return voucherLines.reduce((sum, line) => sum + Number(line.debit_amount || 0), 0);
  }, [voucherLines]);

  const totalCredits = useMemo(() => {
    return voucherLines.reduce((sum, line) => sum + Number(line.credit_amount || 0), 0);
  }, [voucherLines]);

  const isBalanced = useMemo(() => {
    return totalDebits > 0 && Math.abs(totalDebits - totalCredits) < 0.01;
  }, [totalDebits, totalCredits]);

  const handleAddLine = () => {
    setVoucherLines(prev => [...prev, { account_id: 0, debit_amount: 0, credit_amount: 0, particular: '', ref_type: '', ref_id: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (voucherLines.length <= 2) return;
    setVoucherLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, key: keyof VoucherLine, value: any) => {
    setVoucherLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      
      const updated = { ...line, [key]: value };
      if (key === 'debit_amount' && Number(value) > 0) {
        updated.credit_amount = 0; // standard ledger row balance
      } else if (key === 'credit_amount' && Number(value) > 0) {
        updated.debit_amount = 0;
      }
      return updated;
    }));
  };

  const handleViewDetails = async (voucher: any) => {
    try {
      const resp = await financeService.getVoucherById(voucher.voucher_id);
      setSelectedVoucher(resp?.data || voucher);
      setIsDetailOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load voucher details.', status: 'error' });
    }
  };

  const handleCreateVoucher = async () => {
    if (!selectedCompanyId) return;
    if (!isBalanced) {
      toast({ title: 'Validation Error', description: 'Total debits and credits must be equal and greater than 0.', status: 'error' });
      return;
    }

    const invalidRow = voucherLines.find(l => l.account_id === 0 || (Number(l.debit_amount || 0) === 0 && Number(l.credit_amount || 0) === 0));
    if (invalidRow) {
      toast({ title: 'Validation Error', description: 'All lines must have a valid account selected and a transaction amount.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        voucher_date: new Date(voucherDate).toISOString(),
        voucher_type: voucherType,
        narration: narration.trim(),
        company_id: Number(selectedCompanyId),
        details: voucherLines.map(l => ({
          account_id: l.account_id,
          debit_amount: Number(l.debit_amount || 0),
          credit_amount: Number(l.credit_amount || 0),
          particular: l.particular.trim() || narration.trim(),
          ref_type: l.ref_type || null,
          ref_id: l.ref_id ? Number(l.ref_id) : null
        }))
      };

      const res = await financeService.createVoucher(payload);
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Voucher created successfully.', status: 'success' });
        setIsCreateOpen(false);
        setNarration('');
        setVoucherLines([
          { account_id: 0, debit_amount: 0, credit_amount: 0, particular: '', ref_type: '', ref_id: '' },
          { account_id: 0, debit_amount: 0, credit_amount: 0, particular: '', ref_type: '', ref_id: '' }
        ]);
        setRefreshKey(prev => prev + 1);
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReverse = async () => {
    if (!voucherToReverse) return;
    setReversing(true);
    try {
      const res = await financeService.reverseVoucher(voucherToReverse.voucher_id, reversalReason.trim() || 'Manual Reversal');
      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Voucher reversed successfully.', status: 'success' });
        setVoucherToReverse(null);
        setReversalReason('');
        setRefreshKey(prev => prev + 1);
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setReversing(false);
    }
  };

  const fetchDataFn = useCallback((params: any) => {
    const defaultParams = {
      ...params,
      Parameters: [
        { Key: 'company_id', Value: selectedCompanyId || '0' }
      ]
    };
    return financeService.getVouchersGrid(defaultParams);
  }, [selectedCompanyId]);

  const columns: Column[] = useMemo(() => [
    {
      header: 'SL',
      accessor: 'autogenrownum',
      sortable: false,
      render: (_: any, row: any) => (
        <span className="font-mono text-[10px] font-bold bg-content-bg px-2 py-1 rounded text-text-main">{row.autogenrownum}</span>
      )
    },
    {
      header: 'Voucher No',
      accessor: 'voucher_no',
      sortable: true,
      searchable: true,
      searchFieldName: 'voucher_no',
      className: 'font-bold text-text-main',
      render: (val: any) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-500 shrink-0" />
          <span className="font-mono font-bold text-text-main">{val}</span>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'voucher_type',
      sortable: true,
      render: (val: any) => (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary-100 text-primary-600 border border-primary-200">
          {val}
        </span>
      )
    },
    {
      header: 'Voucher Date',
      accessor: 'voucher_date',
      sortable: true,
      render: (val: any) => (
        <span className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      sortable: true,
      render: (val: any) => (
        <span className="font-bold font-mono text-[12px] text-text-main">
          {val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'is_cancelled',
      sortable: true,
      render: (val: any) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
          val ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
        )}>
          {val ? 'Cancelled/Reversed' : 'Active'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      className: 'text-right',
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row)}
            className="h-8 w-8 p-0 text-primary-500 hover:bg-primary-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!row.is_cancelled && btnReverse?.visible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVoucherToReverse(row)}
              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
              title="Reverse Voucher"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [btnReverse]);

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Vouchers (General Ledger)'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Review journal entries, post receipts, payments, and reverse cancelled postings.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card-bg px-4 py-2.5 rounded-xl border border-border-theme shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 flex items-center gap-1.5 whitespace-nowrap">
          <Building2 className="h-3.5 w-3.5" />
          Company:
        </span>
        <Select
          value={selectedCompanyId}
          onValueChange={handleCompanyChange}
        >
          <SelectTrigger className="w-[220px]" size="sm">
            <SelectValue placeholder="Select Company..." />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCompanyId && (
        <DataTable
          columns={columns}
          fetchDataFn={fetchDataFn}
          refreshKey={refreshKey}
          striped={true}
          searchPlaceholder="Search vouchers..."
          renderActions={() => (
            <>
              {btnAdd?.visible && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  size="sm"
                  className="h-7 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 px-3"
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Create Voucher</span>
                </Button>
              )}
            </>
          )}
        />
      )}

      {/* Detail View Modal */}
      {selectedVoucher && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => { setIsDetailOpen(false); setSelectedVoucher(null); }}
          title={`Voucher Details: ${selectedVoucher.voucher_no}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Type</span>
                <span className="text-xs font-bold text-slate-800">{selectedVoucher.voucher_type}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Date</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedVoucher.voucher_date ? new Date(selectedVoucher.voucher_date).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Total Amount</span>
                <span className="text-xs font-bold text-slate-800">
                  {Number(selectedVoucher.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Cancelled</span>
                <span className="text-xs font-bold text-slate-800">{selectedVoucher.is_cancelled ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Narration</span>
              <p className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                {selectedVoucher.narration || 'No narration provided.'}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Account</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Debit</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Credit</th>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Particulars</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 font-mono text-[11px] font-semibold text-slate-700">
                  {(selectedVoucher.details || []).map((line: any, idx: number) => {
                    const coa = coaOptions.find(c => c.value === line.account_id);
                    return (
                      <tr key={line.detail_id || idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 max-w-[200px] truncate">{coa ? coa.label : `Account #${line.account_id}`}</td>
                        <td className="px-4 py-2 text-right text-emerald-600">
                          {line.debit_amount > 0 ? Number(line.debit_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-blue-600">
                          {line.credit_amount > 0 ? Number(line.credit_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td className="px-4 py-2 max-w-[150px] truncate text-slate-500">{line.particular || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Double Entry Entry Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create New Double-Entry Voucher"
        maxWidth="4xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ps-1">Voucher Type</Label>
              <Select
                value={voucherType}
                onValueChange={(val) => setVoucherType(val || 'JV')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JV">Journal Voucher (JV)</SelectItem>
                  <SelectItem value="PV">Payment Voucher (PV)</SelectItem>
                  <SelectItem value="RV">Receipt Voucher (RV)</SelectItem>
                  <SelectItem value="CV">Contra Voucher (CV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ps-1">Voucher Date</Label>
              <Input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="h-10 border-slate-200 rounded-xl font-mono text-xs font-bold shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ps-1">General Narration</Label>
              <Input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Voucher narration..."
                className="h-10 border-slate-200 rounded-xl text-xs font-bold shadow-sm"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/3">Account</th>
                  <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/6">Debit</th>
                  <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/6">Credit</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Row Particulars</th>
                  <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-500 w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {voucherLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2">
                      <Select
                        value={line.account_id ? String(line.account_id) : undefined}
                        onValueChange={(val) => handleLineChange(idx, 'account_id', Number(val || 0))}
                      >
                        <SelectTrigger className="w-full shadow-sm">
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                          {coaOptions.map((coa) => (
                            <SelectItem key={coa.value} value={String(coa.value)}>
                              {coa.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit_amount || ''}
                        onChange={(e) => handleLineChange(idx, 'debit_amount', Number(e.target.value || 0))}
                        className="h-9 font-mono text-xs font-bold text-right border-slate-200 rounded-xl"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit_amount || ''}
                        onChange={(e) => handleLineChange(idx, 'credit_amount', Number(e.target.value || 0))}
                        className="h-9 font-mono text-xs font-bold text-right border-slate-200 rounded-xl"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={line.particular}
                        onChange={(e) => handleLineChange(idx, 'particular', e.target.value)}
                        placeholder="Row info (optional)"
                        className="h-9 text-xs font-semibold border-slate-200 rounded-xl"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemoveLine(idx)}
                        disabled={voucherLines.length <= 2}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-mono text-xs font-bold text-slate-800">
                <tr>
                  <td className="px-4 py-3 text-right">Totals:</td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    {totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddLine}
                        className="h-7 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <Plus className="h-3 w-3" />
                        Add Line
                      </Button>
                      {isBalanced ? (
                        <div className="flex items-center gap-1 text-[10px] bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" /> Balanced
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                          <AlertTriangle className="h-3 w-3" /> Out of Balance
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={saving}
              className="h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVoucher}
              disabled={!isBalanced || saving}
              isLoading={saving}
              className="h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm px-6 font-black uppercase tracking-wider text-[10px]"
            >
              Save Voucher
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reverse Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!voucherToReverse}
        onClose={() => !reversing && setVoucherToReverse(null)}
        onConfirm={handleConfirmReverse}
        title="Reverse Voucher"
        description={
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              Reversing this voucher will create a matching journal entry with swapped debit and credit sides to fully negate this posting.
            </p>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Reason for Reversal</Label>
              <Input
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Data entry error"
                className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        }
        confirmLabel="Reverse"
        confirmVariant="danger"
        loading={reversing}
      />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
