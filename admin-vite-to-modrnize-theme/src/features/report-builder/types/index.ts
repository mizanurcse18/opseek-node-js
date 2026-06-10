export interface ColumnDef {
  field: string;
  label: string;
  tableAlias: string;
  dataType: string;
  aggregate: 'NONE' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  sortDir: '' | 'ASC' | 'DESC';
}

export interface FilterDef {
  field: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

export interface SelectedSource {
  alias: string;
  table: string;
  schema: string;
}

export interface DraggedColumn {
  field: string;
  label: string;
  dataType: string;
}

export interface ReportFieldConfig {
  reportFieldId?: number;
  valueField: string;
  label: string;
  fieldType: 'text' | 'date' | 'select' | 'multi-select';
  referenceSource?: string;
  defaultValue?: string;
  operators?: string;
  seqNo: number;
  filterOnly?: boolean;
  isSysParameter?: boolean;
  multiSelect?: boolean;
  mapField?: string;
  labelField?: string;
}
