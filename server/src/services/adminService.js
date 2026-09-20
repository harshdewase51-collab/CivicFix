const { query } = require('../db');

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

const adminService = {
  async getAllReports({ status, category, search } = {}) {
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

    if (category && category.trim() && category !== 'All Categories') {
      params.push(category.trim());
      sql += ` AND r.category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (r.report_id ILIKE $${params.length} OR r.location ILIKE $${params.length} OR r.description ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY r.created_at DESC;`;

    const res = await query(sql, params);
    return res.rows;
  },

  async getAdminReport(id) {
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

    const res = await query(lookupSql, [id]);
    return res.rows[0] || null;
  },

  async updateReportStatus(id, newStatus) {
    if (!newStatus || !VALID_STATUSES.includes(newStatus.toUpperCase())) {
      const err = new Error(`Invalid status. Allowed values are: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const normalizedStatus = newStatus.toUpperCase();
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
      const err = new Error('Report not found to update.');
      err.statusCode = 404;
      throw err;
    }

    const fullRes = await query(
      `SELECT r.*, u.name as citizen_name, u.email as citizen_email 
       FROM reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1;`,
      [updateRes.rows[0].id]
    );

    return fullRes.rows[0];
  },

  async getStats() {
    const statsRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved
      FROM reports;
    `);

    const row = statsRes.rows[0];

    return {
      total: parseInt(row.total, 10),
      pending: parseInt(row.pending, 10),
      in_progress: parseInt(row.in_progress, 10),
      resolved: parseInt(row.resolved, 10)
    };
  }
};

module.exports = adminService;
