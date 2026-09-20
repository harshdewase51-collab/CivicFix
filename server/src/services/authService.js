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
       RETURNING id, name, email, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at;`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = insertRes.rows[0];
    const token = generateToken(user);

    return { user, token };
  },

  async authenticateUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const userRes = await query(
      'SELECT id, name, email, password_hash, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at FROM users WHERE email = $1',
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
    const userRes = await query(
      'SELECT id, name, email, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at FROM users WHERE id = $1',
      [id]
    );
    return userRes.rows[0] || null;
  },

  async updateProfile(userId, { name, phone, area, avatar_preset, avatar_type }) {
    const existing = await this.getUserById(userId);
    if (!existing) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const newName = name !== undefined ? (name ? name.trim() : existing.name) : existing.name;
    if (!newName) {
      const err = new Error('Full name is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanPhone = phone !== undefined ? (phone ? phone.trim() : null) : existing.phone;
    const cleanArea = area !== undefined ? (area ? area.trim() : null) : existing.area;
    const cleanPreset = avatar_preset !== undefined ? (avatar_preset ? avatar_preset.trim() : existing.avatar_preset) : existing.avatar_preset;
    const cleanType = avatar_type !== undefined ? (avatar_type ? avatar_type.trim() : existing.avatar_type) : existing.avatar_type;

    const res = await query(
      `UPDATE users 
       SET name = $1, 
           phone = $2, 
           area = $3,
           avatar_preset = $4,
           avatar_type = $5
       WHERE id = $6
       RETURNING id, name, email, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at;`,
      [newName, cleanPhone, cleanArea, cleanPreset, cleanType, userId]
    );

    return res.rows[0];
  },

  async updateAvatar(userId, avatarUrl) {
    const res = await query(
      `UPDATE users 
       SET avatar_url = $1, avatar_type = 'custom'
       WHERE id = $2
       RETURNING id, name, email, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at;`,
      [avatarUrl, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    return res.rows[0];
  },

  async removeAvatar(userId) {
    const res = await query(
      `UPDATE users 
       SET avatar_url = NULL, avatar_type = 'preset'
       WHERE id = $1
       RETURNING id, name, email, role, phone, area, avatar_url, avatar_type, avatar_preset, created_at;`,
      [userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    return res.rows[0];
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      const err = new Error('Current password and new password are required.');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters long.');
      err.statusCode = 400;
      throw err;
    }

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      const err = new Error('Current password is incorrect.');
      err.statusCode = 401;
      throw err;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    return { success: true, message: 'Password updated successfully.' };
  }
};

module.exports = authService;
