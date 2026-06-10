import { apiService } from '@/lib/api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';
import type { VisitPlan, VisitPlanDetail, GridRequest } from '../types';
import { defaultGridRequest } from '../types';

const parseRows = (response: any) => {
  if (response?.data?.rows && typeof response.data.rows === 'string') {
    try { response.data.rows = JSON.parse(response.data.rows); } catch {}
  }
  return response;
};

export const visitPlanService = {
  // === Grid data ===
  getGridData: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.GET_GRID, { ...defaultGridRequest, ...params })),

  getGridDataSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.GET_GRID_SUPER, { ...defaultGridRequest, ...params })),

  // === CRUD ===
  getPlan: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.GET_BY_ID(id)),

  savePlan: async (data: Partial<VisitPlan>): Promise<any> =>
    apiService.post(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.SAVE, data),

  deletePlan: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.DELETE(id)),

  // === Status transitions ===
  activatePlan: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.ACTIVATE(id)),

  completePlan: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.COMPLETE(id)),

  cancelPlan: async (id: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.CANCEL(id)),

  // === Visit submission (merged into detail) ===
  submitVisit: async (data: Partial<VisitPlanDetail>): Promise<any> =>
    apiService.post(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.SUBMIT, data),

  verifyVisit: async (detailId: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.VERIFY(detailId)),

  rejectVisit: async (detailId: number | string, reason?: string): Promise<any> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiService.get(API_MODULES.SALES, `${API_ENDPOINTS.VISIT_PLAN.REJECT(detailId)}${query}`);
  },

  // === Reports ===
  getVisitReport: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.GET_VISIT_REPORT, params)),

  getVisitReportSuper: async (params: Partial<GridRequest>): Promise<any> =>
    parseRows(await apiService.post(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.GET_VISIT_REPORT_SUPER, params)),

  getDealerSummary: async (dealerId: number | string, companyId: number | string): Promise<any> =>
    apiService.get(API_MODULES.SALES, API_ENDPOINTS.VISIT_PLAN.DEALER_SUMMARY(dealerId, companyId)),
};
