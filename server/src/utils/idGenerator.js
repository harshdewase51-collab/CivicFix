const { query } = require('../db');

/**
 * Atomically generates the next unique Report ID using PostgreSQL sequence.
 * Output format: CF-1004, CF-1005, etc.
 */
async function generateReportId(client = null) {
  const sql = "SELECT nextval('report_code_seq') AS seq;";
  const res = client ? await client.query(sql) : await query(sql);
  const nextNum = res.rows[0].seq;
  return `CF-${nextNum}`;
}

module.exports = {
  generateReportId
};
