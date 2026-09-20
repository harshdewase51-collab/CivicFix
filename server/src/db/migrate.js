const { pool } = require('./index');

async function migrate() {
  console.log('🔄 Running CivicFix database migrations...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS area VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'preset';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_preset VARCHAR(50) DEFAULT 'avatar_01';
    `);
    console.log('✅ Table "users" verified with profile and avatar columns.');

    // 2. Report ID Sequence
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS report_code_seq START WITH 1001;
    `);
    console.log('✅ Sequence "report_code_seq" verified.');

    // 3. Reports Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(20) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        image_url VARCHAR(500),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "reports" verified.');

    // 4. Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
    `);
    console.log('✅ Indexes verified.');

    await client.query('COMMIT');
    console.log('🎉 Migrations applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
