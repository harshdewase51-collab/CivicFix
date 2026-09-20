const { pool } = require('./index');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'preset';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_preset VARCHAR(50) DEFAULT 'avatar_01';
      UPDATE users SET avatar_preset = 'avatar_01' WHERE avatar_preset IS NULL;
      UPDATE users SET avatar_type = CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 'custom' ELSE 'preset' END WHERE avatar_type IS NULL;
    `);
    await client.query('COMMIT');
    console.log('✅ Columns avatar_type and avatar_preset added successfully to users table.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
