import adminService from '../services/adminService.js';

export const adminApi = {
  getAllReports: (filters) => adminService.getAllReports(filters),
  getAdminReportById: (id) => adminService.getAdminReportById(id),
  updateReportStatus: (id, status) => adminService.updateReportStatus(id, status),
  getStats: () => adminService.getStats()
};

export default adminApi;
