const adminService = require('../services/adminService');

async function getAllReports(req, res, next) {
  try {
    const { status, category, search } = req.query;
    const reports = await adminService.getAllReports({ status, category, search });

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminReportById(req, res, next) {
  try {
    const { id } = req.params;
    const report = await adminService.getAdminReport(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    return res.json({
      success: true,
      report
    });
  } catch (err) {
    next(err);
  }
}

async function updateReportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await adminService.updateReportStatus(id, status);

    return res.json({
      success: true,
      message: `Report status updated to ${status.toUpperCase()}.`,
      report
    });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getStats();

    return res.json({
      success: true,
      stats
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllReports,
  getAdminReportById,
  updateReportStatus,
  getStats
};
