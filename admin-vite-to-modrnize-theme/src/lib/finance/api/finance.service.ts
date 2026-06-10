import { apiService } from '@/lib/api.service';
import { API_MODULES } from '@/constants/api';

export const financeService = {
  getCoa: async (companyId: number): Promise<any> => {
    return apiService.get(API_MODULES.FINANCE, `/ChartOfAccounts/get-coa?companyId=${companyId}`);
  },
  getCoaById: async (id: number): Promise<any> => {
    return apiService.get(API_MODULES.FINANCE, `/ChartOfAccounts/get-by-id/${id}`);
  },
  saveCoa: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.FINANCE, `/ChartOfAccounts/save`, payload);
  },
  getVouchersGrid: async (params: any): Promise<any> => {
    return apiService.post(API_MODULES.FINANCE, `/Vouchers/get-grid-data`, params);
  },
  getVoucherById: async (id: number): Promise<any> => {
    return apiService.get(API_MODULES.FINANCE, `/Vouchers/get/${id}`);
  },
  createVoucher: async (payload: any): Promise<any> => {
    return apiService.post(API_MODULES.FINANCE, `/Vouchers/create`, payload);
  },
  reverseVoucher: async (id: number, reason: string): Promise<any> => {
    return apiService.post(API_MODULES.FINANCE, `/Vouchers/reverse/${id}`, { Reason: reason });
  },
  getCoaCombo: async (companyId: number): Promise<any> => {
    const resp = await apiService.get(API_MODULES.FINANCE, `/ChartOfAccounts/get-coa?companyId=${companyId}`);
    return resp?.data || [];
  }
};
