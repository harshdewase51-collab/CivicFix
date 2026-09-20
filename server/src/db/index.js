const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function optimizeConnectionString(urlStr) {
  if (!urlStr) return urlStr;
  try {
    const u = new URL(urlStr);
    // If it's a Neon endpoint without -pooler, add -pooler for PgBouncer & IPv4 compatibility
    if (u.hostname.includes('.neon.tech') && !u.hostname.includes('-pooler')) {
      const parts = u.hostname.split('.');
      if (parts[0].startsWith('ep-')) {
        parts[0] = parts[0] + '-pooler';
        u.hostname = parts.join('.');
      }
    }
    // Ensure sslmode=require is set for cloud connections
    if (u.hostname.includes('.neon.tech') && !u.searchParams.has('sslmode')) {
      u.searchParams.set('sslmode', 'require');
    }
    return u.toString();
  } catch {
    return urlStr;
  }
}

const rawConnectionString = process.env.DATABASE_URL;
const connectionString = optimizeConnectionString(rawConnectionString);
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

const isLocalhost = connectionString && (
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1')
);

const isCloud = connectionString && (
  connectionString.includes('neon.tech') ||
  connectionString.includes('sslmode=require') ||
  (isProduction && !isLocalhost)
);

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 15000,
    max: 5,
    keepAlive: true,
    statement_timeout: 10000
  });
} else if (!isProduction) {
  // Local development fallback only
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'civicfix',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5
  });
}

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err?.message || err);
  });
}

let isReady = false;
let initPromise = null;

/**
 * Idempotent database readiness check:
 * Automatically ensures tables and default accounts (admin & citizen) exist
 */
async function ensureDatabaseReady() {
  if (isReady || !pool) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Check if users table exists
      const checkTable = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'users'
        ) AS exists;
      `);

      const tableExists = checkTable.rows[0]?.exists;
      if (!tableExists) {
        console.log('🔄 Required tables missing. Running database migrations...');
        const migrate = require('./migrate');
        await migrate();
      }

      // Check if default admin and citizen accounts exist
      const checkUsers = await pool.query(`
        SELECT email FROM users WHERE email IN ('admin@civicfix.org', 'citizen@civicfix.org');
      `);

      if (checkUsers.rows.length < 2) {
        console.log('🌱 Default accounts missing. Running database seed...');
        const seed = require('./seed');
        await seed();
      }

      isReady = true;
    } catch (err) {
      console.error('Database auto-initialization notice:', err.message);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

function formatDbError(err) {
  if (
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    (err.message && err.message.includes('timeout expired')) ||
    (err.message && err.message.includes('Connection terminated due to connection timeout'))
  ) {
    const dbErr = new Error('Database service is temporarily unavailable or timed out. Please try again shortly.');
    dbErr.statusCode = 503;
    return dbErr;
  }
  return err;
}

module.exports = {
  pool,
  ensureDatabaseReady,
  query: async (text, params) => {
    if (!pool) {
      const err = new Error(
        'Database connection unavailable: DATABASE_URL is not configured in Vercel environment variables. Please add your Neon PostgreSQL connection string to Project Settings → Environment Variables.'
      );
      err.statusCode = 503;
      throw err;
    }

    if (!isReady && typeof text === 'string' && !text.includes('information_schema') && !text.includes('SELECT 1')) {
      await ensureDatabaseReady();
    }

    try {
      return await pool.query(text, params);
    } catch (err) {
      const isStaleConnection =
        err.message &&
        (err.message.includes('Connection terminated') ||
          err.message.includes('Connection ended') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('timeout expired') ||
          err.code === '57P01');

      if (isStaleConnection) {
        console.warn('Stale connection detected in serverless pool, retrying query once...');
        try {
          return await pool.query(text, params);
        } catch (retryErr) {
          throw formatDbError(retryErr);
        }
      }
      throw formatDbError(err);
    }
  }
};
