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

const reportService = {
  async createCivicReport({ userId, category, location, description, imageUrl }) {
    if (!category || !VALID_CATEGORIES.includes(category)) {
      const err = new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (!location || !location.trim()) {
      const err = new Error('Location is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!description || !description.trim()) {
      const err = new Error('Description is required.');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reportId = await generateReportId(client);

      const insertRes = await client.query(
        `INSERT INTO reports (report_id, user_id, category, description, location, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
         RETURNING id, report_id, user_id, category, description, location, image_url, status, created_at, updated_at;`,
        [reportId, userId, category, description.trim(), location.trim(), imageUrl]
      );

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getReportsByUser(userId) {
    const res = await query(
      `SELECT id, report_id, category, description, location, image_url, status, created_at, updated_at
       FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [userId]
    );
    return res.rows;
  },

  async getReportByIdOrCode(id) {
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
  }
};

module.exports = reportService;
