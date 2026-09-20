const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

const isCloud = connectionString && (
  connectionString.includes('neon.tech') ||
  connectionString.includes('sslmode=require') ||
  isProduction
);

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : false
  });
} else if (!isProduction) {
  // Local development fallback only
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'civicfix'
  });
}

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
}

module.exports = {
  pool,
  query: async (text, params) => {
    if (!pool) {
      const err = new Error(
        'Database connection unavailable: DATABASE_URL is not configured in Vercel environment variables. Please add your Neon PostgreSQL connection string to Project Settings → Environment Variables.'
      );
      err.statusCode = 503;
      throw err;
    }
    return pool.query(text, params);
  }
};
