import reportService from '../services/reportService.js';

export const reportApi = {
  createReport: (formData) => reportService.createReport(formData),
  getMyReports: () => reportService.getMyReports(),
  getReportById: (id) => reportService.getReportById(id)
};

export default reportApi;
