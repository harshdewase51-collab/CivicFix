import { apiClient } from './api/apiClient.js';
import axiosInstance from './api/axios.js';
import { authApi } from './api/authApi.js';
import { reportApi } from './api/reportApi.js';
import { adminApi } from './api/adminApi.js';
import { authService } from './services/authService.js';
import { reportService } from './services/reportService.js';
import { adminService } from './services/adminService.js';
import { tokenStorage } from './auth/tokenStorage.js';
import { authUtils } from './auth/authUtils.js';

// Core API Client & Axios Instance
export { apiClient, axiosInstance };

// Dedicated API Modules
export { authApi, reportApi, adminApi };

// High-level Services
export { authService, reportService, adminService };

// Auth Utilities & Token Storage
export { tokenStorage, authUtils };

// Helpers & Formatters
export * from './utils/formatters.js';

export default {
  apiClient,
  axiosInstance,
  authApi,
  reportApi,
  adminApi,
  authService,
  reportService,
  adminService,
  tokenStorage,
  authUtils
};
