const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'civicfix_secret_jwt_key_hackathon_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const authService = {
  async registerUser({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const err = new Error('An account with this email address already exists.');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'citizen')
       RETURNING id, name, email, role, created_at;`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = insertRes.rows[0];
    const token = generateToken(user);

    return { user, token };
  },

  async authenticateUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const userRes = await query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    delete user.password_hash;
    const token = generateToken(user);

    return { user, token };
  },

  async getUserById(id) {
    const userRes = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return userRes.rows[0] || null;
  }
};

module.exports = authService;
