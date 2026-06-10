export interface VisitPlan {
  plan_id?: number;
  dealer_id: number;
  plan_name: string;
  plan_type: number; // 0=Weekly, 1=Monthly, 2=Custom
  plan_type_name?: string;
  start_date: string;
  end_date: string;
  total_visits: number;
  completed_visits: number;
  status: number; // 0=Draft, 1=Active, 2=Completed, 3=Cancelled
  status_name?: string;
  notes?: string;
  company_id: number;
  dealer_business_name?: string;
  created_at?: string;
  details: VisitPlanDetail[];
}

export interface VisitPlanDetail {
  detail_id?: number;
  plan_id?: number;
  visit_date: string;
  dsr_user_id: number;
  dsr_name?: string;
  agent_user_id?: number;
  agent_name?: string;
  planned_latitude?: number;
  planned_longitude?: number;
  location_name?: string;
  visit_order: number;
  status?: number; // 0=Pending, 1=Visited, 2=Missed, 3=Cancelled, 4=Submitted, 5=Verified, 6=Rejected
  status_name?: string;
  comments?: string;
  actual_latitude?: number;
  actual_longitude?: number;
  check_in_time?: string;
  check_out_time?: string;
  images?: VisitPlanImage[];
}

export interface VisitPlanImage {
  image_id?: number;
  detail_id?: number;
  image_path: string;
  image_type?: string;
}

export interface GridRequest {
  ServerPagination: boolean;
  Limit: number;
  Offset: number;
  Order: string;
  SearchBy: string;
  SearchType: string;
  Search: string;
  Sort: string;
  SortName: string;
  SortOrder: string;
  ApprovalFilterData: string;
  Parameters: any[];
  menuid: number;
}

export const defaultGridRequest: GridRequest = {
  ServerPagination: true,
  Limit: 10,
  Offset: 0,
  Order: 'asc',
  SearchBy: '',
  SearchType: '',
  Search: '',
  Sort: 'plan_id',
  SortName: '',
  SortOrder: '',
  ApprovalFilterData: '',
  Parameters: [],
  menuid: 0,
};

export const PLAN_TYPE_OPTIONS = [
  { value: 0, label: 'Weekly' },
  { value: 1, label: 'Monthly' },
  { value: 2, label: 'Custom' },
];

export const PLAN_STATUS_OPTIONS = [
  { value: 0, label: 'Draft', color: 'text-gray-500 bg-gray-50 border-gray-100' },
  { value: 1, label: 'Active', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 2, label: 'Completed', color: 'text-green-600 bg-green-50 border-green-100' },
  { value: 3, label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-100' },
];

export const VISIT_STATUS_OPTIONS = [
  { value: 0, label: 'Pending', color: 'text-gray-500 bg-gray-50 border-gray-100' },
  { value: 1, label: 'Visited', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 2, label: 'Missed', color: 'text-red-600 bg-red-50 border-red-100' },
  { value: 3, label: 'Cancelled', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { value: 4, label: 'Submitted', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { value: 5, label: 'Verified', color: 'text-green-600 bg-green-50 border-green-100' },
  { value: 6, label: 'Rejected', color: 'text-rose-600 bg-rose-50 border-rose-100' },
];

// ========== Visit Plan Template Types ==========

export interface VisitPlanTemplate {
  template_id?: number;
  template_name: string;
  dealer_id: number;
  dealer_business_name?: string;
  status: number;
  status_name?: string;
  notes?: string;
  company_id: number;
  created_date?: string;
  details: VisitPlanTemplateDetail[];
}

export interface VisitPlanTemplateDetail {
  detail_id?: number;
  template_id?: number;
  day_of_week: number; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  day_of_week_name?: string;
  dsr_user_id: number;
  dsr_user_name?: string;
  agent_user_id?: number;
  agent_user_name?: string;
  planned_latitude?: number;
  planned_longitude?: number;
  location_name?: string;
  visit_order: number;
}

export interface GeneratePlanRequest {
  template_id: number;
  start_date: string;
  end_date: string;
  plan_name?: string;
}

export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Saturday' },
  { value: 1, label: 'Sunday' },
  { value: 2, label: 'Monday' },
  { value: 3, label: 'Tuesday' },
  { value: 4, label: 'Wednesday' },
  { value: 5, label: 'Thursday' },
  { value: 6, label: 'Friday' },
];

export const TEMPLATE_STATUS_OPTIONS = [
  { value: 0, label: 'Draft', color: 'text-gray-500 bg-gray-50 border-gray-100' },
  { value: 1, label: 'Active', color: 'text-blue-600 bg-blue-50 border-blue-100' },
];
