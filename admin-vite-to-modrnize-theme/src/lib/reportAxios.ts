// Re-export the shared apiClient as reportApiClient.
// No separate axios instance needed — Report API goes through
// the same gateway as every other service.
// Base URL: VITE_API_BASE_URL + VITE_API_PREFIX  (e.g. https://localhost:5000/api/v1)
// All report paths are prefixed with /report/ in reportApi.ts constants.
export { apiClient as reportApiClient } from './axios';
