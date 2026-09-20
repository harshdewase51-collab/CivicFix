import apiClient from '../api/apiClient.js';

export const reportService = {
  async createReport(formData) {
    const res = await apiClient.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  async getMyReports() {
    const res = await apiClient.get('/reports/my');
    return res.data;
  },

  async getReportById(id) {
    const res = await apiClient.get(`/reports/${id}`);
    return res.data;
  }
};

export default reportService;
