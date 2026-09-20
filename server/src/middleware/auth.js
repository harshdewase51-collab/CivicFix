const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'civicfix_secret_jwt_key_hackathon_2026';

/**
 * Validates JWT token in Authorization header and attaches req.user
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Cross-verify with active database record to ensure user still exists and role is current
    const userRes = await query(
      'SELECT id, name, email, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
}

/**
 * Restricts access to users with role === 'admin'
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Municipal administrator privileges required.'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
