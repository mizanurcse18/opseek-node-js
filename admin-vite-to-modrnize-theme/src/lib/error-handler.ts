/**
 * Common API Error Handler
 * Parses backend error structures and returns user-friendly messages for toasts.
 */

export interface ApiError {
  status_code?: number;
  StatusCode?: number;
  response_code?: string;
  message?: string;
  Message?: string;
  errors?: Array<{
    field: string;
    messages: string[];
  }>;
}

const RESPONSE_CODE_TITLES: Record<string, string> = {
  'VALIDATION_ERROR': 'Validation Error',
  'UNAUTHORIZED': 'Access Denied',
  'INTERNAL_SERVER_ERROR': 'System Error',
  'NOT_FOUND': 'Not Found',
  'BUSINESS_ERROR': 'Processing Error',
  'SUCCESS': 'Success'
};

export const handleApiError = (error: any) => {
  // If the error passed is already the data from axios response interceptor
  const apiError = (error?.response?.data || error) as ApiError;
  
  const responseCode = apiError.response_code || 'ERROR';
  const title = RESPONSE_CODE_TITLES[responseCode] || 'Request Failed';
  
  // Priority: 
  // 1. Top level message (snake_case or PascalCase)
  // 2. First message in errors array
  // 3. Status text or generic message
  let description = apiError.message || apiError.Message;
  
  if (!description && apiError.errors && apiError.errors.length > 0) {
    description = apiError.errors[0].messages[0];
  }
  
  if (!description) {
    description = 'An unexpected error occurred. Please try again.';
  }

  const statusCode = apiError.status_code || apiError.StatusCode;

  return {
    title,
    description,
    status: (statusCode && statusCode >= 400 && statusCode < 500) ? 'warning' : 'error' as any
  };
};
