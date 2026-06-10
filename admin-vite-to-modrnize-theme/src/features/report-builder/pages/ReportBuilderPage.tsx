import React, { useState, useEffect, useCallback, useRef } from 'react';
import { reportApiClient } from '@/lib/reportAxios';
import {
  SchemaSource,
  QueryDef,
  QueryResult,
  ReportSuiteDto,
  SaveReportRequest,
  REPORT_API,
} from '@/constants/reportApi';
import { ColumnDef, FilterDef, ReportFieldConfig } from '../types';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Button } from '@/components/ui-old/Button';
import { Loader } from '@/components/ui-old/Loader';
import { Modal } from '@/components/ui-old/Modal';
import { Input } from '@/components/ui-old/Input';
import { Select } from '@/components/ui-old/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui-old/Table';
import {
  Plus,
  Trash2,
  Download,
  Eye,
  Save,
  FolderOpen,
  GripVertical,
  ArrowUpDown,
  Search,
  Database,
  Table2,
  Columns3,
  Filter,
  X,
  AlertCircle,
} from 'lucide-react';

type TabId = 'columns' | 'filters' | 'parameters' | 'preview';

export default function ReportBuilderPage() {
  const pageTitle = useMenuTitle();

  // Schema
  const [dbKey, setDbKey] = useState('SCM');
  const [sources, setSources] = useState<SchemaSource[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Builder state
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  // Filters
  const [filters, setFilters] = useState<FilterDef[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [reportName, setReportName] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('columns');

  // Field configs (for Parameters tab)
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, ReportFieldConfig>>({});
  const [fieldList, setFieldList] = useState<ReportFieldConfig[]>([]);

  // Preview
  const [preview, setPreview] = useState<QueryResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Save / Load
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<ReportSuiteDto[]>([]);
  const [saveParent, setSaveParent] = useState<number | null>(null);
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Drop zone ref
  const dropRef = useRef<HTMLDivElement>(null);

  // ─── Load Schema ───
  const loadSchema = useCallback(async () => {
    setSchemaLoading(true);
    try {
      const data = await reportApiClient.get(REPORT_API.SOURCES, {
        params: { dbKey },
      }) as unknown as SchemaSource[];
      setSources(Array.isArray(data) ? data : []);
      // Auto-expand first table
      if (data.length > 0) {
        setExpandedTables(new Set([`${data[0].schema}.${data[0].table}`]));
      }
    } catch (e: any) {
      showToast('Failed to load schema: ' + (e.message || 'Unknown error'), 'error');
      setSources([]);
    } finally {
      setSchemaLoading(false);
    }
  }, [dbKey, showToast]);

  // ─── Auto-populate field configs from filter params ───
  useEffect(() => {
    // Extract unique filter fields that look like parameter references
    // (field names containing _id or being common reference fields)
    const paramCandidates = filters
      .map(f => f.field)
      .filter(f => f.endsWith('_id') || f.includes('type') || f.includes('date'))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    setFieldList(prev => {
      const existing = new Map(prev.map(f => [f.valueField, f]));
      let changed = false;

      for (const field of paramCandidates) {
        if (!existing.has(field)) {
          changed = true;
          const isDate = field.toLowerCase().includes('date');
          existing.set(field, {
            valueField: field,
            label: field.split('.').pop()!.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            fieldType: isDate ? 'date' : 'select',
            referenceSource: field.endsWith('.warehouse_id') || field === 'warehouse_id'
              ? 'SELECT warehouse_id AS value, warehouse_name AS label FROM warehouse'
              : field.endsWith('.product_id') || field === 'product_id'
              ? 'SELECT product_id AS value, product_name AS label FROM product'
              : field.endsWith('.category_id') || field === 'category_id'
              ? 'SELECT category_id AS value, category_name AS label FROM category'
              : field.endsWith('.supplier_id') || field === 'supplier_id'
              ? 'SELECT supplier_id AS value, supplier_name AS label FROM supplier'
              : undefined,
            seqNo: existing.size + 1,
          });
        }
      }

      if (!changed) return prev;
      return Array.from(existing.values());
    });
  }, [filters]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  // ─── Drag & Drop ───
  const handleDragStart = useCallback((e: React.DragEvent, field: string, label: string, dataType: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ field, label, dataType }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const dragged = JSON.parse(raw);

    setColumns(prev => {
      if (prev.some(c => c.field === dragged.field)) {
        showToast('Column already added', 'info');
        return prev;
      }
      return [...prev, {
        field: dragged.field,
        label: dragged.label,
        tableAlias: dragged.field.split('.')[0],
        dataType: dragged.dataType,
        aggregate: 'NONE' as const,
        sortDir: '' as const,
      }];
    });
  }, [showToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const removeColumn = useCallback((index: number) => {
    setColumns(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAggregate = useCallback((index: number, agg: ColumnDef['aggregate']) => {
    setColumns(prev => prev.map((c, i) => i === index ? { ...c, aggregate: agg } : c));
  }, []);

  const toggleSort = useCallback((index: number) => {
    setColumns(prev => prev.map((c, i) => {
      if (i !== index) return c;
      const next: Record<string, '' | 'ASC' | 'DESC'> = { '': 'ASC', ASC: 'DESC', DESC: '' };
      return { ...c, sortDir: next[c.sortDir] };
    }));
  }, []);

  // ─── Filters ───
  const addFilter = useCallback(() => {
    setFilters(prev => [...prev, { field: '', operator: '=', value: '', logic: 'AND' }]);
  }, []);

  const updateFilter = useCallback((index: number, key: keyof FilterDef, value: string) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
  }, []);

  const removeFilter = useCallback((index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Build QueryDef ───
  const buildQueryDef = useCallback((): QueryDef => {
    // Collect table aliases from columns
    const aliasSet = new Set<string>();
    columns.forEach(c => {
      const alias = c.field.split('.')[0];
      if (alias) aliasSet.add(alias);
    });

    // Map aliases to actual tables from schema
    const usedSources: QueryDef['sources'] = [];
    let firstAlias = '';

    aliasSet.forEach(alias => {
      // Find source by alias or table name
      const found = sources.find(s => (s.alias || s.table) === alias);
      if (found) {
        if (!firstAlias) firstAlias = found.alias || found.table;
        usedSources.push({
          alias: found.alias || found.table,
          table: found.table,
          schema: found.schema || 'public',
          join: firstAlias && firstAlias !== (found.alias || found.table)
            ? { type: 'LEFT', on: `${firstAlias}.id = ${found.alias || found.table}.${found.alias || found.table}_id` }
            : undefined,
        });
      } else {
        // Add as bare reference
        if (!firstAlias) firstAlias = alias;
        usedSources.push({ alias, table: alias, schema: 'public' });
      }
    });

    const queryFilters = filters
      .filter(f => f.field)
      .map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.operator === 'IS NULL' || f.operator === 'IS NOT NULL' ? undefined : f.value,
        logic: f.logic,
      }));

    const querySort = columns
      .filter(c => c.sortDir)
      .map(c => ({ field: c.field, dir: c.sortDir }));

    return {
      version: 1,
      connection: dbKey,
      sources: usedSources.length > 0 ? usedSources : undefined,
      columns: columns.map(c => ({
        field: c.field,
        label: c.label,
        aggregate: c.aggregate === 'NONE' ? undefined : c.aggregate,
      })),
      filters: queryFilters.length > 0 ? queryFilters : undefined,
      sort: querySort.length > 0 ? querySort : undefined,
      groupBy: groupBy.length > 0 ? groupBy : undefined,
    };
  }, [columns, filters, groupBy, dbKey, sources]);

  // ─── Preview ───
  const runPreview = useCallback(async () => {
    if (columns.length === 0) {
      showToast('Add at least one column', 'error');
      return;
    }
    setPreviewLoading(true);
    try {
      const qd = buildQueryDef();
      const data = await reportApiClient.post(REPORT_API.EXECUTE, {
        queryDef: JSON.stringify(qd),
        page,
        pageSize,
      }) as unknown as QueryResult;
      setPreview(data);
      setActiveTab('preview');
    } catch (e: any) {
      showToast('Preview failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setPreviewLoading(false);
    }
  }, [columns, buildQueryDef, page, pageSize, showToast]);

  // ─── Export ───
  const handleExport = useCallback(async (format: 'excel' | 'pdf') => {
    if (columns.length === 0) {
      showToast('Add columns first', 'error');
      return;
    }
    try {
      const qd = buildQueryDef();
      const endpoint = format === 'excel' ? REPORT_API.EXPORT_EXCEL : REPORT_API.EXPORT_PDF;
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const mime = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      const response = await reportApiClient.post(endpoint, {
        queryDef: JSON.stringify(qd),
        page: 1,
        pageSize: 10000,
      }, { responseType: 'blob' });

      // response interceptor might have unwrapped it; handle both cases
      const blob = response instanceof Blob ? response : (response as any)?.data as Blob;
      if (!blob || !(blob instanceof Blob)) {
        showToast('Export returned invalid data', 'error');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName || 'report'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${reportName || 'report'}.${ext}`, 'success');
    } catch (e: any) {
      showToast(`Export failed: ${e.message || 'Unknown error'}`, 'error');
    }
  }, [columns, buildQueryDef, reportName, showToast]);

  // ─── Save ───
  const loadSavedReportsForModal = useCallback(async () => {
    try {
      const data = await reportApiClient.get(REPORT_API.REPORT_SUITE_TREE) as unknown as ReportSuiteDto[];
      setSavedReports(Array.isArray(data) ? data : []);
    } catch {
      setSavedReports([]);
    }
  }, []);

  const openSaveModal = useCallback(async () => {
    await loadSavedReportsForModal();
    setSaveModalOpen(true);
  }, [loadSavedReportsForModal]);

  const saveReport = useCallback(async () => {
    if (!reportName.trim()) {
      showToast('Enter a report name', 'error');
      return;
    }
    try {
      const qd = buildQueryDef();
      const body: SaveReportRequest = {
        reportId: currentReportId ?? undefined,
        displayName: reportName,
        queryDef: JSON.stringify(qd),
        conName: dbKey,
        parentId: saveParent,
        isVisible: true,
      };
      const result = await reportApiClient.post(REPORT_API.REPORT_SUITE_SAVE, body) as any;
      
      // Save fields too
      if (fieldList.length > 0 && currentReportId) {
        await reportApiClient.post(REPORT_API.REPORT_SUITE_SAVE_FIELDS, {
          reportId: currentReportId,
          fields: fieldList.map(f => ({
            ...f,
            reportId: currentReportId,
          })),
        });
      }
      
      showToast('Report saved!', 'success');
      setSaveModalOpen(false);
    } catch (e: any) {
      showToast('Save failed: ' + (e.message || 'Unknown error'), 'error');
    }
  }, [reportName, buildQueryDef, dbKey, saveParent, currentReportId, showToast, fieldList]);

  const loadReport = useCallback(async (reportId: number) => {
    try {
      const report = await reportApiClient.get(REPORT_API.REPORT_SUITE_GET(reportId)) as unknown as ReportSuiteDto;
      if (!report || !report.queryDef) {
        showToast('Report has no query definition', 'error');
        return;
      }
      const qd: QueryDef = JSON.parse(report.queryDef);
      setReportName(report.displayName);
      setDbKey(report.conName || 'SCM');
      setCurrentReportId(report.reportId);

      setColumns((qd.columns || []).map(c => ({
        field: c.field,
        label: c.label || c.field.split('.').pop() || c.field,
        tableAlias: c.field.split('.')[0],
        dataType: 'text',
        aggregate: (c.aggregate as ColumnDef['aggregate']) || 'NONE',
        sortDir: '' as const,
      })));
      setGroupBy(qd.groupBy || []);
      setFilters((qd.filters || []).map(f => ({
        field: f.field,
        operator: f.operator || '=',
        value: (f.value as string) || '',
        logic: (f.logic as 'AND' | 'OR') || 'AND',
      })));

      // Load field configs
      try {
        const fields = await reportApiClient.get(
          REPORT_API.REPORT_SUITE_GET_FIELDS(reportId)
        ) as unknown as ReportFieldConfig[];
        if (Array.isArray(fields) && fields.length > 0) {
          setFieldList(fields);
          const configMap: Record<string, ReportFieldConfig> = {};
          fields.forEach(f => { configMap[f.valueField] = f; });
          setFieldConfigs(configMap);
        }
      } catch {
        // Fields might not exist yet — that's ok
      }

      setLoadModalOpen(false);
      showToast('Loaded: ' + report.displayName, 'success');
    } catch (e: any) {
      showToast('Failed to load report', 'error');
    }
  }, [showToast]);

  const deleteReport = useCallback(async (reportId: number, displayName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${displayName}"?\nThis cannot be undone.`)) return;
    setDeletingId(reportId);
    try {
      await reportApiClient.post(REPORT_API.REPORT_SUITE_DELETE, { reportId });
      showToast(`Deleted: ${displayName}`, 'success');
      await loadSavedReportsForModal();
      // Clear current report if we just deleted the active one
      if (currentReportId === reportId) {
        setCurrentReportId(null);
        setReportName('');
        setColumns([]);
        setFilters([]);
        setGroupBy([]);
        setFieldList([]);
      }
    } catch (err: any) {
      showToast('Delete failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setDeletingId(null);
    }
  }, [showToast, loadSavedReportsForModal, currentReportId]);

  // ─── Render Schema Tree ───
  const renderSchemaTree = () => {
    if (schemaLoading) {
      return <div className="p-4 text-center text-text-muted text-sm"><Loader className="mx-auto mb-2" /> Loading...</div>;
    }
    if (sources.length === 0) {
      return <div className="p-4 text-center text-text-muted text-sm">No tables found. Check connection string.</div>;
    }

    return sources.map(source => {
      const key = `${source.schema}.${source.table}`;
      const isExpanded = expandedTables.has(key);
      return (
        <div key={key} className="mb-1">
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded hover:bg-primary-50/10 transition-colors"
            onClick={() => {
              const next = new Set(expandedTables);
              isExpanded ? next.delete(key) : next.add(key);
              setExpandedTables(next);
            }}
          >
            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
            <Table2 className="w-4 h-4 text-amber-500" />
            <span className="font-medium">{source.table}</span>
            <span className="ml-auto text-xs text-text-muted">{source.columns.length}</span>
          </button>
          {isExpanded && (
            <div className="ml-6 border-l border-border-theme pl-2">
              {source.columns.map(col => {
                const colKey = `${source.alias || source.table}.${col.name}`;
                const typeIcon = col.dataType.toLowerCase().includes('int') || col.dataType.toLowerCase().includes('decimal')
                  ? '#' : col.dataType.toLowerCase().includes('date') ? '📅' : '📝';
                return (
                  <div
                    key={colKey}
                    className="flex items-center gap-2 px-3 py-1 text-xs rounded cursor-grab hover:bg-primary-50/10 transition-colors group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, colKey, col.name, col.dataType)}
                    onClick={() => {
                      setColumns(prev => {
                        if (prev.some(c => c.field === colKey)) return prev;
                        return [...prev, {
                          field: colKey,
                          label: col.name,
                          tableAlias: source.alias || source.table,
                          dataType: col.dataType,
                          aggregate: 'NONE' as const,
                          sortDir: '' as const,
                        }];
                      });
                    }}
                  >
                    <span className="text-xs">{typeIcon}</span>
                    <span className="flex-1 truncate">{col.name}</span>
                    <span className="text-text-muted opacity-0 group-hover:opacity-100 text-[10px]">{col.dataType}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  // ─── Column chip ───
  const renderColumnChip = (col: ColumnDef, index: number) => {
    const sortIcon = col.sortDir === 'ASC' ? '🔼' : col.sortDir === 'DESC' ? '🔽' : '↕️';
    return (
      <div
        key={`${col.field}-${index}`}
        className="inline-flex items-center gap-1.5 bg-card-bg border border-border-theme rounded-full px-3 py-1.5 text-xs cursor-default hover:border-primary-500/30 transition-colors group"
      >
        <GripVertical className="w-3 h-3 text-text-muted cursor-grab" />
        <span className="font-medium">{col.label}</span>
        <select
          className="bg-transparent text-primary-600 text-[10px] font-semibold border-none outline-none cursor-pointer"
          value={col.aggregate}
          onClick={e => e.stopPropagation()}
          onChange={e => updateAggregate(index, e.target.value as ColumnDef['aggregate'])}
        >
          <option value="NONE">—</option>
          <option value="SUM">SUM</option>
          <option value="COUNT">COUNT</option>
          <option value="AVG">AVG</option>
          <option value="MIN">MIN</option>
          <option value="MAX">MAX</option>
        </select>
        <button
          className={`text-xs ${col.sortDir ? 'text-primary-600' : 'text-text-muted'} hover:text-primary-600`}
          onClick={() => toggleSort(index)}
          title="Toggle sort"
        >
          {sortIcon}
        </button>
        <button
          className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeColumn(index)}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // ─── Render Preview Table ───
  const renderPreviewTable = () => {
    if (!preview) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Eye className="w-12 h-12 mb-3 opacity-30" />
          <h3 className="text-lg font-medium mb-1">Run a Preview</h3>
          <p className="text-sm">Select columns and click <strong>Preview</strong> to see results.</p>
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
          {preview.sql && (
            <span className="text-text-muted text-xs truncate max-w-[400px]" title={preview.sql}>
              SQL: {preview.sql.substring(0, 60)}...
            </span>
          )}
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

  // ─── Render Save Modal ───
  const renderSaveModal = () => (
    <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="💾 Save Report Suite">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Report Name</label>
          <Input
            value={reportName}
            onChange={e => setReportName(e.target.value)}
            placeholder="e.g. Stock Summary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Parent Folder</label>
          <select
            className="w-full border border-border-theme rounded-lg px-3 py-2 bg-card-bg text-sm"
            value={saveParent ?? ''}
            onChange={e => setSaveParent(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Root (no parent)</option>
            {renderTreeOptions(savedReports, 0)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Connection</label>
          <Select value={dbKey} onChange={e => setDbKey(e.target.value)}>
            <option value="SCM">SCM</option>
            <option value="Finance">Finance</option>
            <option value="Security">Security</option>
            <option value="Approval">Approval</option>
          </Select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
          <Button onClick={saveReport}>Save Report</Button>
        </div>
      </div>
    </Modal>
  );

  const renderTreeOptions = (items: ReportSuiteDto[], depth: number): React.ReactNode => {
    return items.map(item => {
      const prefix = '  '.repeat(depth);
      return (
        <React.Fragment key={item.reportId}>
          <option value={item.reportId}>
            {prefix}{item.children ? '📁 ' : '📊 '}{item.displayName}
          </option>
          {item.children && renderTreeOptions(item.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  // ─── Render Load Modal ───
  const renderLoadModal = () => {
    const renderTree = (items: ReportSuiteDto[], depth: number) => {
      return items.map(item => {
        const pad = depth * 16;
        if (item.children && item.children.length > 0) {
          return (
            <div key={item.reportId}>
              <div className="px-3 py-2 text-sm font-semibold text-amber-600 flex items-center gap-2" style={{ paddingLeft: 12 + pad }}>
                📁 {item.displayName}
              </div>
              {renderTree(item.children, depth + 1)}
            </div>
          );
        }
        return (
          <div
            key={item.reportId}
            className="group flex items-center gap-1 rounded hover:bg-primary-50/10 transition-colors pr-1"
            style={{ paddingLeft: 12 + pad }}
          >
            <button
              className="flex-1 text-left py-2 text-sm"
              onClick={() => loadReport(item.reportId)}
            >
              📊 {item.displayName}
            </button>
            <button
              className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
              title={`Delete "${item.displayName}"`}
              disabled={deletingId === item.reportId}
              onClick={(e) => deleteReport(item.reportId, item.displayName, e)}
            >
              {deletingId === item.reportId
                ? <span className="text-[10px]">…</span>
                : <Trash2 className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        );
      });
    };

    return (
      <Modal isOpen={loadModalOpen} onClose={() => setLoadModalOpen(false)} title="📂 Load Saved Report">
        <p className="text-xs text-text-muted mb-3">Click a report to load it. Hover to reveal the delete button.</p>
        <div className="max-h-80 overflow-y-auto space-y-0.5">
          {savedReports.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">No saved reports yet.</p>
          ) : (
            renderTree(savedReports, 0)
          )}
        </div>
        <div className="flex justify-end pt-3">
          <Button variant="outline" onClick={() => setLoadModalOpen(false)}>Close</Button>
        </div>
      </Modal>
    );
  };

  // ─── Main Render ───
  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -mb-6">
      {/* Sidebar: Schema Browser */}
      <div className="w-72 min-w-[288px] bg-card-bg border-r border-border-theme flex flex-col">
        <div className="p-3 border-b border-border-theme flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Schema</span>
          <select
            className="ml-auto bg-transparent text-xs border border-border-theme rounded px-1.5 py-1"
            value={dbKey}
            onChange={e => { setDbKey(e.target.value); setColumns([]); setPreview(null); }}
          >
            <option value="SCM">SCM</option>
            <option value="Finance">Finance</option>
            <option value="Security">Security</option>
            <option value="Approval">Approval</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {renderSchemaTree()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-theme bg-card-bg/50">
          <Input
            className="w-48 h-8 text-xs"
            placeholder="Report name..."
            value={reportName}
            onChange={e => setReportName(e.target.value)}
          />
          <span className="text-xs text-text-muted bg-primary-50/10 px-2 py-0.5 rounded-full">
            {columns.length} col{columns.length !== 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" onClick={runPreview} disabled={previewLoading}>
              {previewLoading ? <Loader className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              Preview
            </Button>
            <Button size="sm" variant="success" onClick={() => handleExport('excel')}>
              <Download className="w-3.5 h-3.5 mr-1" /> Excel
            </Button>
            <Button size="sm" variant="success" onClick={() => handleExport('pdf')}>
              <Download className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={openSaveModal}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await loadSavedReportsForModal();
                setLoadModalOpen(true);
              }}
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1" /> Load
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-theme px-4">
          {[
            { id: 'columns' as TabId, label: '📋 Columns' },
            { id: 'filters' as TabId, label: '🔍 Filters' },
            { id: 'parameters' as TabId, label: '🔧 Parameters' },
            { id: 'preview' as TabId, label: '📊 Preview' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Columns3 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Selected Columns</span>
                  <span className="text-xs bg-card-bg px-1.5 py-0.5 rounded">{columns.length}</span>
                </div>
                <div
                  ref={dropRef}
                  className={`min-h-[80px] border-2 border-dashed rounded-xl p-3 flex flex-wrap gap-2 items-start content-start transition-colors ${
                    columns.length === 0
                      ? 'border-border-theme flex items-center justify-center text-text-muted text-sm italic'
                      : 'border-border-theme'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {columns.length === 0
                    ? 'Drag columns here from the schema browser, or click a column name to add it'
                    : columns.map((col, i) => renderColumnChip(col, i))
                  }
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Group By</span>
                </div>
                <div
                  className={`min-h-[40px] border-2 border-dashed rounded-xl p-3 flex flex-wrap gap-2 items-start content-start transition-colors ${
                    groupBy.length === 0
                      ? 'border-border-theme flex items-center justify-center text-text-muted text-xs italic'
                      : 'border-border-theme'
                  }`}
                  onDrop={e => {
                    e.preventDefault();
                    const raw = e.dataTransfer.getData('application/json');
                    if (!raw) return;
                    const dragged = JSON.parse(raw);
                    setGroupBy(prev => prev.includes(dragged.field) ? prev : [...prev, dragged.field]);
                  }}
                  onDragOver={handleDragOver}
                >
                  {groupBy.length === 0
                    ? 'Drop columns to group by'
                    : groupBy.map((g, i) => (
                        <span
                          key={g}
                          className="inline-flex items-center gap-1 bg-card-bg border border-border-theme rounded-full px-3 py-1 text-xs"
                        >
                          {g}
                          <button className="text-text-muted hover:text-red-500" onClick={() => setGroupBy(prev => prev.filter((_, j) => j !== i))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Filter Conditions</span>
              </div>
              {filters.length === 0 ? (
                <p className="text-text-muted text-sm mb-3">No filters — all rows will be returned.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {filters.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-card-bg border border-border-theme rounded-lg px-3 py-2">
                      <select
                        className="bg-transparent text-xs border border-border-theme rounded px-2 py-1 min-w-[120px]"
                        value={f.field}
                        onChange={e => updateFilter(i, 'field', e.target.value)}
                      >
                        <option value="">Select field</option>
                        {columns.map(c => (
                          <option key={c.field} value={c.field}>{c.label} ({c.field})</option>
                        ))}
                      </select>
                      <select
                        className="bg-transparent text-xs border border-border-theme rounded px-2 py-1"
                        value={f.operator}
                        onChange={e => updateFilter(i, 'operator', e.target.value)}
                      >
                        {['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'].map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      {f.operator !== 'IS NULL' && f.operator !== 'IS NOT NULL' && (
                        <input
                          className="flex-1 bg-transparent text-xs border border-border-theme rounded px-2 py-1 min-w-[80px]"
                          placeholder="Value"
                          value={f.value}
                          onChange={e => updateFilter(i, 'value', e.target.value)}
                        />
                      )}
                      {i < filters.length - 1 && (
                        <select
                          className="bg-transparent text-xs border border-border-theme rounded px-2 py-1"
                          value={f.logic}
                          onChange={e => updateFilter(i, 'logic', e.target.value as 'AND' | 'OR')}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      <button className="text-text-muted hover:text-red-500 ml-auto" onClick={() => removeFilter(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={addFilter}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Filter
              </Button>
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Filter Parameter Configuration</span>
                <span className="text-xs text-text-muted bg-card-bg px-2 py-0.5 rounded-full">{fieldList.length} params</span>
              </div>
              {fieldList.length === 0 ? (
                <p className="text-text-muted text-sm">No filter parameters detected. Add filters with <code>paramRef</code> in the Filters tab first.</p>
              ) : (
                <div className="space-y-3">
                  {fieldList.map((f, i) => (
                    <div key={f.valueField} className="bg-card-bg border border-border-theme rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">{f.label}</span>
                        <span className="text-xs text-text-muted bg-primary-50/10 px-2 py-0.5 rounded">{f.valueField}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-text-muted block mb-1">Label</label>
                          <input
                            className="w-full border border-border-theme rounded-lg px-3 py-1.5 bg-card-bg text-sm"
                            value={f.label}
                            onChange={e => {
                              setFieldList(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x));
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted block mb-1">Field Type</label>
                          <select
                            className="w-full border border-border-theme rounded-lg px-3 py-1.5 bg-card-bg text-sm"
                            value={f.fieldType}
                            onChange={e => setFieldList(prev => prev.map((x, j) => j === i ? { ...x, fieldType: e.target.value as any } : x))}
                          >
                            <option value="text">Text</option>
                            <option value="date">Date</option>
                            <option value="select">Select (Dropdown)</option>
                            <option value="multi-select">Multi-Select</option>
                          </select>
                        </div>
                        {(f.fieldType === 'select' || f.fieldType === 'multi-select') && (
                          <div className="col-span-2">
                            <label className="text-xs text-text-muted block mb-1">
                              Reference Source (SQL — must return <code>value</code> and <code>label</code> columns)
                            </label>
                            <textarea
                              className="w-full border border-border-theme rounded-lg px-3 py-1.5 bg-card-bg text-xs font-mono"
                              rows={2}
                              value={f.referenceSource || ''}
                              placeholder="e.g. SELECT warehouse_id AS value, warehouse_name AS label FROM warehouse"
                              onChange={e => setFieldList(prev => prev.map((x, j) => j === i ? { ...x, referenceSource: e.target.value } : x))}
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-text-muted block mb-1">Default Value</label>
                          <input
                            className="w-full border border-border-theme rounded-lg px-3 py-1.5 bg-card-bg text-sm"
                            value={f.defaultValue || ''}
                            onChange={e => setFieldList(prev => prev.map((x, j) => j === i ? { ...x, defaultValue: e.target.value } : x))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted block mb-1">Seq No</label>
                          <input
                            type="number"
                            className="w-full border border-border-theme rounded-lg px-3 py-1.5 bg-card-bg text-sm"
                            value={f.seqNo}
                            onChange={e => setFieldList(prev => prev.map((x, j) => j === i ? { ...x, seqNo: parseInt(e.target.value) || 0 } : x))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && renderPreviewTable()}
        </div>
      </div>

      {/* Toasts */}
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

      {/* Modals */}
      {renderSaveModal()}
      {renderLoadModal()}
    </div>
  );
}
