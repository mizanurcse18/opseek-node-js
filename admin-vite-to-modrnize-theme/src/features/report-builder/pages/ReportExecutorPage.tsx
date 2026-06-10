import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { reportApiClient } from '@/lib/reportAxios';
import {
  QueryResult,
  QueryDef,
  ReportSuiteDto,
  REPORT_API,
  SchemaSource,
} from '@/constants/reportApi';
import { Button } from '@/components/ui-old/Button';
import { Loader } from '@/components/ui-old/Loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-old/Table';
import { Download, Eye, ArrowLeft, Filter as FilterIcon } from 'lucide-react';

interface ReportField {
  reportFieldId: number;
  reportId?: number;
  valueField: string;
  labelField?: string;
  label: string;
  defaultValue?: string;
  fieldType?: string;      // text, date, select, multi-select
  mapField?: string;
  referenceSource?: string;
  operators?: string;
  filterOnly?: boolean;
  seqNo?: number;
  isSysParameter?: boolean;
  multiSelect?: boolean;
}

export default function ReportExecutorPage() {
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('reportId');
  const reportId = reportIdParam ? Number(reportIdParam) : null;

  const [report, setReport] = useState<ReportSuiteDto | null>(null);
  const [fields, setFields] = useState<ReportField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Parameter values
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  // Dropdown options per field
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  // Preview
  const [preview, setPreview] = useState<QueryResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Load Report ───
  useEffect(() => {
    if (!reportId) {
      setError('No report ID specified. Add ?reportId=N to the URL.');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load report suite
        const reportData = await reportApiClient.get(
          REPORT_API.REPORT_SUITE_GET(reportId)
        ) as unknown as ReportSuiteDto;

        if (!reportData) {
          setError('Report not found — the report ID may be invalid or the report was deleted.');
          setLoading(false);
          return;
        }

        setReport(reportData);

        // Try to load fields from the field config API
        let reportFields: ReportField[] = [];
        try {
          const fieldData = await reportApiClient.get(
            REPORT_API.REPORT_SUITE_GET_FIELDS(reportId)
          ) as unknown as ReportField[];
          if (Array.isArray(fieldData) && fieldData.length > 0) {
            reportFields = fieldData;
          }
        } catch {
          // Fields API might not be available — fall back to parsing query_def
        }

        // Fallback: parse filter parameters from the query_def JSON
        if (reportFields.length === 0 && reportData.queryDef) {
          const qd: QueryDef = JSON.parse(reportData.queryDef);
          if (qd.filters) {
            reportFields = qd.filters
              .filter(f => f.paramRef)
              .map((f, i) => {
                const isDate = f.field.toLowerCase().includes('date');
                return {
                  reportFieldId: -(i + 1),
                  reportId,
                  valueField: f.paramRef || '',
                  label: f.paramRef?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '',
                  fieldType: isDate ? 'date' : 'text',
                  mapField: f.field,
                  operators: f.operator,
                  referenceSource: undefined,
                  defaultValue: f.value as string,
                  seqNo: i + 1,
                };
              });
          }
        }

        setFields(reportFields);

        // Init param values
        const initial: Record<string, string> = {};
        reportFields.forEach(f => {
          initial[f.valueField] = f.defaultValue || '';
        });
        setParamValues(initial);

        // Load dropdown options from reference sources
        const options: Record<string, { value: string; label: string }[]> = {};
        for (const f of reportFields) {
          if ((f.fieldType === 'select' || f.fieldType === 'multi-select') && f.referenceSource) {
            try {
              const refOptions = await reportApiClient.post(REPORT_API.REPORT_SUITE_REFERENCE_OPTIONS, {
                dbKey: reportData.conName || 'SCM',
                referenceSource: f.referenceSource,
              }) as unknown as { value: string; label: string }[];
              if (Array.isArray(refOptions)) {
                options[f.valueField] = refOptions;
              }
            } catch {
              options[f.valueField] = [];
            }
          }

          // Pre-fill common reference options for fields without referenceSource
          if (!options[f.valueField]) {
            if (f.valueField === 'transaction_type') {
              options[f.valueField] = [
                { value: 'PURCHASE', label: 'Purchase' },
                { value: 'SALE', label: 'Sale' },
                { value: 'ADJUSTMENT', label: 'Adjustment' },
                { value: 'TRANSFER_IN', label: 'Transfer In' },
                { value: 'TRANSFER_OUT', label: 'Transfer Out' },
              ];
            }
          }
        }
        setDropdownOptions(options);

      } catch (e: any) {
        const isNetworkError = e?.code === 'ERR_NETWORK' || e?.message?.toLowerCase().includes('network');
        const isTimeout = e?.code === 'ECONNABORTED';
        const status = e?.response?.status;
        let msg = 'Failed to load report';
        if (isNetworkError || isTimeout) {
          msg = 'Cannot reach the Report API. Check that the service is running and the gateway is configured.';
        } else if (status === 401 || status === 403) {
          msg = `Access denied (HTTP ${status}). Your session may have expired — try refreshing the page.`;
        } else if (status === 404) {
          msg = `Report #${reportId} not found (HTTP 404). It may have been deleted.`;
        } else if (status >= 500) {
          msg = `Server error (HTTP ${status}): ${e?.response?.data?.message || e.message || 'Unknown server error'}.`;
        } else if (e.message) {
          msg = e.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reportId, retryCount]);

  // ─── Execute ───
  const executeReport = useCallback(async () => {
    if (!report?.queryDef) return;
    setPreviewLoading(true);
    try {
      const qd: QueryDef = JSON.parse(report.queryDef);

      // Build param values — map report fields to query params
      const paramVals: Record<string, object> = {};
      fields.forEach(f => {
        const val = paramValues[f.valueField];
        if (val !== undefined && val !== '') {
          // Try to parse as number if the operator is = or !=
          if (f.operators === '=' || f.operators === '!=') {
            const num = Number(val);
            paramVals[f.valueField] = isNaN(num) ? val : num;
          } else {
            paramVals[f.valueField] = val;
          }
        }
      });

      const data = await reportApiClient.post(REPORT_API.EXECUTE, {
        queryDef: report.queryDef,
        paramValues: Object.keys(paramVals).length > 0 ? paramVals : undefined,
        page,
        pageSize,
      }) as unknown as QueryResult;

      setPreview(data);
      showToast(`Loaded ${data.totalRowCount || data.rows?.length || 0} rows`, 'success');
    } catch (e: any) {
      showToast('Execution failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setPreviewLoading(false);
    }
  }, [report, fields, paramValues, page, pageSize, showToast]);

  // ─── Export ───
  const handleExport = useCallback(async (format: 'excel' | 'pdf') => {
    if (!report?.queryDef) return;
    try {
      const endpoint = format === 'excel' ? REPORT_API.EXPORT_EXCEL : REPORT_API.EXPORT_PDF;
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const mime = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      // Build param values for export (same as execute)
      const paramVals: Record<string, object> = {};
      fields.forEach(f => {
        const val = paramValues[f.valueField];
        if (val !== undefined && val !== '') {
          const num = Number(val);
          paramVals[f.valueField] = isNaN(num) ? val : num;
        }
      });

      const response = await reportApiClient.post(endpoint, {
        queryDef: report.queryDef,
        paramValues: Object.keys(paramVals).length > 0 ? paramVals : undefined,
        page: 1,
        pageSize: 10000,
      }, { responseType: 'blob' });

      const blob = response instanceof Blob ? response : (response as any)?.data as Blob;
      if (!blob || !(blob instanceof Blob)) {
        showToast('Export returned invalid data', 'error');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.displayName || 'report'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${report.displayName}.${ext}`, 'success');
    } catch (e: any) {
      showToast(`Export failed: ${e.message || 'Unknown error'}`, 'error');
    }
  }, [report, fields, paramValues, showToast]);

  // ─── Render Parameter Inputs ───
  const renderParams = () => {
    if (fields.length === 0) {
      return (
        <div className="text-sm text-text-muted py-2">
          No parameters configured. Run the report as-is.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {fields.map(f => (
          <div key={f.reportFieldId} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {f.label}
            </label>
            {f.fieldType === 'select' || dropdownOptions[f.valueField] ? (
              <select
                className="w-full border border-border-theme rounded-lg px-3 py-2 bg-card-bg text-sm focus:border-primary-500 outline-none"
                value={paramValues[f.valueField] || ''}
                onChange={e => setParamValues(prev => ({ ...prev, [f.valueField]: e.target.value }))}
              >
                <option value="">— All —</option>
                {(dropdownOptions[f.valueField] || []).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : f.fieldType === 'date' ? (
              <input
                type="date"
                className="w-full border border-border-theme rounded-lg px-3 py-2 bg-card-bg text-sm focus:border-primary-500 outline-none"
                value={paramValues[f.valueField] || ''}
                onChange={e => setParamValues(prev => ({ ...prev, [f.valueField]: e.target.value }))}
              />
            ) : (
              <input
                type="text"
                className="w-full border border-border-theme rounded-lg px-3 py-2 bg-card-bg text-sm focus:border-primary-500 outline-none"
                placeholder={f.label}
                value={paramValues[f.valueField] || ''}
                onChange={e => setParamValues(prev => ({ ...prev, [f.valueField]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // ─── Render Preview Table ───
  const renderPreview = () => {
    if (!preview) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Eye className="w-12 h-12 mb-3 opacity-30" />
          <h3 className="text-lg font-medium mb-1">Run the Report</h3>
          <p className="text-sm">Set parameters above and click <strong>Execute</strong> to see results.</p>
        </div>
      );
    }

    const { columns: cols, rows, totalRowCount } = preview;
    if (!cols || cols.length === 0) {
      return <div className="py-8 text-center text-text-muted">No data returned</div>;
    }

    const totalPages = Math.ceil((totalRowCount || rows.length) / pageSize);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{totalRowCount || rows.length} rows</span>
        </div>
        <div className="border border-border-theme rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {cols.map(col => (
                  <TableHead key={col} className="text-xs font-semibold uppercase tracking-wider">{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={cols.length} className="text-center text-text-muted py-8">No data</TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={i}>
                    {cols.map(col => (
                      <TableCell key={col} className="text-xs max-w-[200px] truncate" title={String(row[col] ?? '')}>
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ◀ Prev
            </Button>
            <span className="text-text-muted">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next ▶
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ─── Loading / Error ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 mr-2" /> Loading report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg w-full text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h3 className="text-base font-semibold text-red-700 mb-2">Failed to Load Report</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setRetryCount(c => c + 1)}
            >
              🔄 Retry
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
            </Button>
          </div>
        </div>
        {!reportId && (
          <p className="text-xs text-text-muted">Tip: Add <code className="bg-card-bg px-1 rounded">?reportId=N</code> to the URL to load a specific report.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            📊 {report?.displayName || 'Report'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            {report?.conName || ''} {report?.reportName ? `· ${report.reportName}` : ''}
          </p>
        </div>
      </div>

      {/* Parameter Inputs */}
      <div className="bg-card-bg border border-border-theme rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Parameters</span>
        </div>
        {renderParams()}
        <div className="flex gap-2 mt-4 pt-3 border-t border-border-theme">
          <Button onClick={executeReport} disabled={previewLoading}>
            {previewLoading ? <Loader className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            Execute
          </Button>
          <Button variant="success" size="sm" onClick={() => handleExport('excel')}>
            <Download className="w-3.5 h-3.5 mr-1" /> Excel
          </Button>
          <Button variant="success" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-3.5 h-3.5 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-card-bg border border-border-theme rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Results</span>
        </div>
        {renderPreview()}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-card-bg border border-border-theme rounded-lg shadow-lg px-4 py-3 text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
