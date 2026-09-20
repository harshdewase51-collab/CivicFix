const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with allowance for local static images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app')) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Evidence Photos
const uploadsPath = process.env.VERCEL
  ? path.join(require('os').tmpdir(), 'uploads')
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbConfigured = !!process.env.DATABASE_URL || process.env.NODE_ENV !== 'production';
  let dbStatus = 'untested';
  let latencyMs = null;
  let dbHostType = 'none';

  let dbHostname = null;
  let dbUrlInfo = null;
  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      dbHostname = u.hostname;
      dbUrlInfo = {
        protocol: u.protocol,
        pathname: u.pathname,
        hasPort: !!u.port,
        hasUser: !!u.username
      };
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        dbHostType = 'localhost';
      } else if (u.hostname.includes('neon.tech')) {
        dbHostType = 'neon';
      } else {
        dbHostType = 'cloud_postgres';
      }
    } catch {
      dbHostType = 'custom';
    }
  }

  let dbError = null;

  if (dbConfigured) {
    try {
      const { pool } = require('./db');
      if (pool) {
        const start = Date.now();
        await pool.query('SELECT 1');
        latencyMs = Date.now() - start;
        dbStatus = 'connected';
      } else {
        dbStatus = 'pool_not_initialized';
      }
    } catch (err) {
      dbStatus = 'error';
      dbError = err?.message || String(err);
      console.error('Health check database ping notice:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'CivicFix API is running',
    environment: process.env.NODE_ENV || 'development',
    database_configured: dbConfigured,
    database_host: dbHostname,
    database_host_type: dbHostType,
    database_url_info: dbUrlInfo,
    database_status: dbStatus,
    database_latency_ms: latencyMs,
    database_error: dbError
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for Unmatched API Endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err?.message || err);

  // Handle Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds limit. Maximum allowed size is 5MB.'
    });
  }

  if (err.message && err.message.includes('Only JPG, JPEG, PNG')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || (statusCode === 500 ? 'Internal Server Error' : 'An error occurred');
  return res.status(statusCode).json({
    success: false,
    message
  });
});

// Start Server (only if executed directly, not imported in tests or serverless)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 CivicFix Server listening on port ${PORT}`);
    console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
