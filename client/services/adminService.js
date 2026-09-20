import apiClient from '../api/apiClient.js';

export const adminService = {
  async getAllReports(filters = {}) {
    const res = await apiClient.get('/admin/reports', { params: filters });
    return res.data;
  },

  async getAdminReportById(id) {
    const res = await apiClient.get(`/admin/reports/${id}`);
    return res.data;
  },

  async updateReportStatus(id, status) {
    const res = await apiClient.patch(`/admin/reports/${id}/status`, { status });
    return res.data;
  },

  async getStats() {
    const res = await apiClient.get('/admin/stats');
    return res.data;
  }
};

export default adminService;
