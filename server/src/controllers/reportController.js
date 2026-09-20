const reportService = require('../services/reportService');

async function createReport(req, res, next) {
  try {
    const { category, location, description } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const report = await reportService.createCivicReport({
      userId: req.user.id,
      category,
      location,
      description,
      imageUrl
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      report
    });
  } catch (err) {
    next(err);
  }
}

async function getMyReports(req, res, next) {
  try {
    const reports = await reportService.getReportsByUser(req.user.id);
    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    next(err);
  }
}

async function getReportById(req, res, next) {
  try {
    const { id } = req.params;
    const report = await reportService.getReportByIdOrCode(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Civic report not found.'
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this report.'
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

module.exports = {
  createReport,
  getMyReports,
  getReportById
};
