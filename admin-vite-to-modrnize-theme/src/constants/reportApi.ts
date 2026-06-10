export const REPORT_API = {
  // Query engine  → /api/v1/report/query/*
  SOURCES:             '/report/query/sources',
  DATABASES:           '/report/query/databases',
  COMPILE:             '/report/query/compile',
  EXECUTE:             '/report/query/execute',
  EXECUTE_SAVED:       (id: number) => `/report/query/execute/${id}`,
  EXPORT_EXCEL:        '/report/query/export-excel',
  EXPORT_PDF:          '/report/query/export-pdf',
  EXPORT_EXCEL_SAVED:  (id: number) => `/report/query/export-excel/${id}`,
  EXPORT_PDF_SAVED:    (id: number) => `/report/query/export-pdf/${id}`,

  // ReportSuite CRUD  → /api/v1/report/reportsuite/*
  REPORT_SUITE_GRID:             '/report/reportsuite/get-grid-data',
  REPORT_SUITE_TREE:             '/report/reportsuite/get-tree',
  REPORT_SUITE_GET:              (id: number) => `/report/reportsuite/get-by-id/${id}`,
  REPORT_SUITE_SAVE:             '/report/reportsuite/save',
  REPORT_SUITE_DELETE:           '/report/reportsuite/delete',
  REPORT_SUITE_REORDER:          '/report/reportsuite/reorder',
  REPORT_SUITE_GET_FIELDS:       (id: number) => `/report/reportsuite/get-fields/${id}`,
  REPORT_SUITE_SAVE_FIELDS:      '/report/reportsuite/save-fields',
  REPORT_SUITE_REFERENCE_OPTIONS:'/report/reportsuite/get-reference-options',
  REPORT_SUITE_SEED:             '/report/reportsuite/seed-defaults',
};

export interface SchemaSource {
  dbKey: string;
  schema: string;
  table: string;
  alias: string;
  columns: SchemaColumn[];
}

export interface SchemaColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
}

export interface QueryDef {
  version?: number;
  connection?: string;
  sources?: QuerySource[];
  columns?: QueryColumn[];
  filters?: QueryFilter[];
  sort?: QuerySort[];
  groupBy?: string[];
}

export interface QuerySource {
  alias: string;
  table: string;
  schema?: string;
  join?: QueryJoin;
}

export interface QueryJoin {
  type: string;
  on: string;
}

export interface QueryColumn {
  field: string;
  label?: string;
  aggregate?: string;
}

export interface QueryFilter {
  field: string;
  operator?: string;
  value?: unknown;
  paramRef?: string;
  logic?: string;
}

export interface QuerySort {
  field: string;
  dir: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRowCount: number;
  sql?: string;
}

export interface ReportSuiteDto {
  reportId: number;
  applicationId?: number;
  parentId?: number;
  displayName: string;
  reportName?: string;
  reportPath?: string;
  conName?: string;
  queryDef?: string;
  seqNo?: number;
  isVisible?: boolean;
  children?: ReportSuiteDto[];
  parentName?: string;
}

export interface SaveReportRequest {
  reportId?: number;
  applicationId?: number;
  parentId?: number | null;
  displayName: string;
  queryDef?: string;
  conName?: string;
  seqNo?: number;
  isVisible?: boolean;
}
