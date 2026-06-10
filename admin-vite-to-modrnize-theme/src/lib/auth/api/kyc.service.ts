import { apiService } from '../../api.service';
import { API_MODULES, API_ENDPOINTS } from '@/constants/api';

const MODULE = API_MODULES.AUTH;

export interface OcrRequest {
  fileData: string;
  fileName: string;
  documentType: 'NID' | 'NID-Front' | 'NID-Back' | 'Passport' | 'DrivingLicense' | 'License';
  oldFileKey?: string; // Optional old file to delete
}

export interface OcrResponse {
  full_name: string;
  nid_number: string;
  date_of_birth: string;
  address: string;
  confidence_score: number;
  file_path: string;
  file_key: string;
  extra_fields?: Record<string, string>;
}

export interface KycSubmitPayload {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nid_number: string;
  present_address: {
    division_id: number | string;
    district_id: number | string;
    thana_id: number | string;
    address_detail: string;
  };
  permanent_address: {
    division_id: number | string;
    district_id: number | string;
    thana_id: number | string;
    address_detail: string;
  };
  documents: Array<{
    document_type: string;
    file_path: string;
    file_key?: string;
    status: string;
  }>;
}

export const kycService = {
  processOcr: async (payload: OcrRequest): Promise<any> => {
    return apiService.post(MODULE, API_ENDPOINTS.KYC.OCR, payload);
  },

  uploadDocument: async (formData: FormData): Promise<any> => {
    return apiService.post(MODULE, '/kyc/upload-document', formData);
  },


  submitKyc: async (formData: FormData): Promise<any> => {
    return apiService.post(MODULE, API_ENDPOINTS.KYC.SUBMIT, formData);
  },

  getKyc: async (userId: number): Promise<any> => {
    return apiService.postSecure(MODULE, '/kyc/get-kyc', { UserID: userId });
  },

  getWorkflowConfig: async (userType: number): Promise<any> => {
    return apiService.get(MODULE, `/kyc/workflow-config/${userType}`);
  },

  saveWorkflowConfig: async (userType: number, configJson: any): Promise<any> => {
    const jsonString = typeof configJson === 'string' ? configJson : JSON.stringify(configJson);
    return apiService.post(MODULE, '/kyc/save-workflow-config', { user_type: userType, config_json: jsonString });
  },

  getDealers: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, '/combo/get-dealers');
  },

  getDsrs: async (): Promise<any> => {
    return apiService.get(API_MODULES.AUTH, '/combo/get-dsrs');
  }
};
