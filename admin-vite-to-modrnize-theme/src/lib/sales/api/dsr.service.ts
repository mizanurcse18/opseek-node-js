import { apiService } from '@/lib/api.service';
import { API_MODULES } from '@/constants/api';

export const dsrService = {
  attendance: {
    getGrid: (params: any, superUser = false) =>
      apiService.post(API_MODULES.SALES, superUser ? '/attendance/get-grid-data-super' : '/attendance/get-grid-data', params),
    getById: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/attendance/get/${id}`),
    save: (payload: any) =>
      apiService.post(API_MODULES.SALES, '/attendance/save', payload),
    delete: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/attendance/delete/${id}`)
  },
  collection: {
    getGrid: (params: any, superUser = false) =>
      apiService.post(API_MODULES.SALES, superUser ? '/collection/get-grid-data-super' : '/collection/get-grid-data', params),
    getById: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/collection/get/${id}`),
    save: (payload: any) =>
      apiService.post(API_MODULES.SALES, '/collection/save', payload),
    delete: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/collection/delete/${id}`)
  },
  dailySales: {
    getGrid: (params: any, superUser = false) =>
      apiService.post(API_MODULES.SALES, superUser ? '/dailysales/get-grid-data-super' : '/dailysales/get-grid-data', params),
    getById: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/dailysales/get/${id}`),
    save: (payload: any) =>
      apiService.post(API_MODULES.SALES, '/dailysales/save', payload),
    delete: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/dailysales/delete/${id}`)
  },
  expense: {
    getGrid: (params: any, superUser = false) =>
      apiService.post(API_MODULES.SALES, superUser ? '/expense/get-grid-data-super' : '/expense/get-grid-data', params),
    getById: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/expense/get/${id}`),
    save: (payload: any) =>
      apiService.post(API_MODULES.SALES, '/expense/save', payload),
    delete: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/expense/delete/${id}`)
  },
  target: {
    getGrid: (params: any, superUser = false) =>
      apiService.post(API_MODULES.SALES, superUser ? '/target/get-grid-data-super' : '/target/get-grid-data', params),
    getById: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/target/get/${id}`),
    save: (payload: any) =>
      apiService.post(API_MODULES.SALES, '/target/save', payload),
    delete: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/target/delete/${id}`)
  },
  visit: {
    getGrid: (params: any, superUser = false) =>
      apiService.post(API_MODULES.SALES, superUser ? '/visit/get-grid-data-super' : '/visit/get-grid-data', params),
    getById: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/visit/get/${id}`),
    save: (payload: any) =>
      apiService.post(API_MODULES.SALES, '/visit/save', payload),
    delete: (id: number | string) =>
      apiService.get(API_MODULES.SALES, `/visit/delete/${id}`)
  },
  getDsrCombo: async (): Promise<any> => {
    const resp = await apiService.get(API_MODULES.AUTH, '/combo/get-dsrs');
    return (resp?.data || []).map((d: any) => ({
      value: d.value || d.id || d.dsr_user_id || d.dsrUserId,
      label: d.label || d.dsr_name || d.name || `DSR #${d.value}`
    }));
  },
  getCustomerCombo: async (): Promise<any> => {
    const resp = await apiService.get(API_MODULES.AUTH, '/combo/get-persons');
    return (resp?.data || []).map((p: any) => ({
      value: p.value || p.id || p.person_id,
      label: p.label || p.person_name || p.name || `Customer #${p.value}`
    }));
  },
  getProductCombo: async (): Promise<any> => {
    const resp = await apiService.get(API_MODULES.SCM, '/product/get-all');
    return (resp?.data || []).map((p: any) => ({
      value: p.product_id || p.id,
      label: p.product_name || p.name || `Product #${p.product_id}`,
      price: p.unit_price || p.price || 0
    }));
  }
};
