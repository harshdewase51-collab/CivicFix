const { query } = require('../db');

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

/**
 * Admin: List all community reports with filtering, search, and citizen metadata.
 */
async function getAllReports(req, res, next) {
  try {
    const { status, category, search } = req.query;

    let sql = `
      SELECT r.id, r.report_id, r.category, r.description, r.location, r.image_url, 
             r.status, r.created_at, r.updated_at,
             u.id as citizen_id, u.name as citizen_name, u.email as citizen_email
      FROM reports r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      params.push(status.toUpperCase());
      sql += ` AND r.status = $${params.length}`;
    }

    if (category && category.trim()) {
      params.push(category.trim());
      sql += ` AND r.category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (r.report_id ILIKE $${params.length} OR r.location ILIKE $${params.length} OR r.description ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY r.created_at DESC;`;

    const reportsRes = await query(sql, params);

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
 * Admin: Get complete report details including citizen contact info.
 */
async function getAdminReportById(req, res, next) {
  try {
    const { id } = req.params;
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
        message: 'Report not found.'
      });
    }

    return res.json({
      success: true,
      report: reportRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update ticket status (PENDING -> IN_PROGRESS -> RESOLVED).
 */
async function updateReportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${VALID_STATUSES.join(', ')}`
      });
    }

    const normalizedStatus = status.toUpperCase();
    const isPublicCode = isNaN(id);

    const updateSql = isPublicCode
      ? `UPDATE reports 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE report_id = $2 
         RETURNING *;`
      : `UPDATE reports 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *;`;

    const updateRes = await query(updateSql, [normalizedStatus, id]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found to update.'
      });
    }

    // Retrieve updated report with citizen details for complete response
    const fullRes = await query(
      `SELECT r.*, u.name as citizen_name, u.email as citizen_email 
       FROM reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1;`,
      [updateRes.rows[0].id]
    );

    return res.json({
      success: true,
      message: `Report status updated to ${normalizedStatus}.`,
      report: fullRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get aggregated system metrics for admin overview dashboard.
 */
async function getStats(req, res, next) {
  try {
    const statsRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved
      FROM reports;
    `);

    const row = statsRes.rows[0];

    return res.json({
      success: true,
      stats: {
        total: parseInt(row.total, 10),
        pending: parseInt(row.pending, 10),
        in_progress: parseInt(row.in_progress, 10),
        resolved: parseInt(row.resolved, 10)
      }
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
