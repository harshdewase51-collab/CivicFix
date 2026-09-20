const bcrypt = require('bcryptjs');
const { pool } = require('./index');

async function seed() {
  console.log('🌱 Seeding CivicFix database...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Default Admin
    const adminEmail = 'admin@civicfix.org';
    const adminPass = 'Admin@12345';
    const adminHash = await bcrypt.hash(adminPass, 10);

    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE 
       SET name = EXCLUDED.name, role = 'admin'
       RETURNING id;`,
      ['Municipal Admin', adminEmail, adminHash]
    );
    const adminId = adminRes.rows[0].id;
    console.log(`✅ Admin account verified: ${adminEmail} (User ID: ${adminId})`);

    // 2. Create Demo Citizen
    const citizenEmail = 'citizen@civicfix.org';
    const citizenPass = 'Citizen@12345';
    const citizenHash = await bcrypt.hash(citizenPass, 10);

    const citizenRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'citizen')
       ON CONFLICT (email) DO UPDATE 
       SET name = EXCLUDED.name, role = 'citizen'
       RETURNING id;`,
      ['Priya Sharma', citizenEmail, citizenHash]
    );
    const citizenId = citizenRes.rows[0].id;
    console.log(`✅ Citizen account verified: ${citizenEmail} (User ID: ${citizenId})`);

    // 3. Create Sample Reports if none exist
    const countRes = await client.query('SELECT COUNT(*) FROM reports;');
    const count = parseInt(countRes.rows[0].count, 10);

    if (count === 0) {
      console.log('Creating initial sample civic reports...');
      
      const sampleReports = [
        {
          report_id: 'CF-1001',
          user_id: citizenId,
          category: 'Pothole',
          description: 'Large and deep pothole causing two-wheeler skidding near the main intersection.',
          location: 'Main Road & 4th Avenue Junction',
          image_url: null,
          status: 'PENDING'
        },
        {
          report_id: 'CF-1002',
          user_id: citizenId,
          category: 'Streetlight',
          description: 'Streetlight pole #14 has been dark for 3 consecutive nights, causing safety concerns.',
          location: 'Oak Street, opposite Community Hall',
          image_url: null,
          status: 'IN_PROGRESS'
        },
        {
          report_id: 'CF-1003',
          user_id: citizenId,
          category: 'Garbage',
          description: 'Community dumpster overflowing onto the pedestrian pathway for 48 hours.',
          location: 'Market Square, East Gate',
          image_url: null,
          status: 'RESOLVED'
        }
      ];

      for (const r of sampleReports) {
        await client.query(
          `INSERT INTO reports (report_id, user_id, category, description, location, image_url, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (report_id) DO NOTHING;`,
          [r.report_id, r.user_id, r.category, r.description, r.location, r.image_url, r.status]
        );
      }

      // Sync sequence
      await client.query(`SELECT setval('report_code_seq', (SELECT GREATEST(1003, COALESCE(MAX(SUBSTRING(report_id FROM 4)::integer), 1000)) FROM reports));`);
      console.log('✅ Sample reports created and sequence synchronized.');
    } else {
      console.log(`ℹ️ Database already contains ${count} reports. Skipping sample report generation.`);
    }

    await client.query('COMMIT');
    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
