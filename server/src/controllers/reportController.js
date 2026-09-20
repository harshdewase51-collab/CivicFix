const { query, pool } = require('../db');
const { generateReportId } = require('../utils/idGenerator');

const VALID_CATEGORIES = [
  'Pothole',
  'Streetlight',
  'Garbage',
  'Water Leakage',
  'Traffic Signal',
  'Public Infrastructure',
  'Other'
];

/**
 * Citizen: Submit a new civic complaint with optional photo evidence.
 */
async function createReport(req, res, next) {
  const client = await pool.connect();
  try {
    const { category, location, description } = req.body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location is required. Please specify street, landmark, or intersection.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required. Please provide problem details.'
      });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await client.query('BEGIN');

    // Generate atomic sequential Report ID
    const reportId = await generateReportId(client);

    const insertRes = await client.query(
      `INSERT INTO reports (report_id, user_id, category, description, location, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING id, report_id, user_id, category, description, location, image_url, status, created_at, updated_at;`,
      [reportId, req.user.id, category, description.trim(), location.trim(), imageUrl]
    );

    await client.query('COMMIT');

    const createdReport = insertRes.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      report: createdReport
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Citizen: Get all reports submitted by the logged-in citizen.
 */
async function getMyReports(req, res, next) {
  try {
    const reportsRes = await query(
      `SELECT id, report_id, category, description, location, image_url, status, created_at, updated_at
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: reportsRes.rows.length,
      reports: reportsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single report details (accessible by owner citizen or municipal admin).
 */
async function getReportById(req, res, next) {
  try {
    const { id } = req.params;

    // Support looking up either by CF-XXXX public code or internal integer ID
    const isPublicCode = isNaN(id);
    const lookupSql = isPublicCode
      ? `SELECT r.*, u.name as citizen_name, u.email as citizen_email 
         FROM reports r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.report_id = $1`
      : `SELECT r.*, u.name as citizen_name, u.email as citizen_email 
         FROM reports r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.id = $1`;

    const reportRes = await query(lookupSql, [id]);

    if (reportRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Civic report not found.'
      });
    }

    const report = reportRes.rows[0];

    // Citizen authorization check: Can only view own report unless admin
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
