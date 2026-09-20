const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const results = [];

function recordResult(testName, passed, issue = null, fix = null) {
  results.push({
    test: testName,
    result: passed ? 'PASS' : 'FAIL',
    issue: issue || 'None',
    fix: fix || 'None'
  });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}`);
  if (!passed && issue) {
    console.log(`       Issue: ${issue}`);
    console.log(`       Fix: ${fix}`);
  }
}

function request(options, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    if (postData && !reqHeaders['Content-Length']) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        ...options,
        headers: reqHeaders
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function uploadMultipart(token, fields, fileInfo = null) {
  const boundary = '----CivicFixTestBoundary' + Date.now();
  let payload = '';

  for (const [key, value] of Object.entries(fields)) {
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    payload += `${value}\r\n`;
  }

  let fileBuffer = Buffer.alloc(0);
  if (fileInfo) {
    let content = fileInfo.content;
    if (fileInfo.filePath) {
      content = fs.readFileSync(fileInfo.filePath);
    }
    const fileName = fileInfo.filename || 'test.png';
    const mime = fileInfo.mime || 'image/png';

    let fileHeader = `--${boundary}\r\n`;
    fileHeader += `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`;
    fileHeader += `Content-Type: ${mime}\r\n\r\n`;

    fileBuffer = Buffer.concat([
      Buffer.from(fileHeader, 'utf-8'),
      Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8'),
      Buffer.from('\r\n', 'utf-8')
    ]);
  }

  const headerBuffer = Buffer.from(payload, 'utf-8');
  const footerBuffer = Buffer.from(`--${boundary}--\r\n`, 'utf-8');
  const fullBody = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/reports',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function runPhase11Tests() {
  console.log('====================================================');
  console.log('  CIVICFIX PHASE 11 COMPLETE TEST SUITE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // 11.1 SERVER TESTING
    // ----------------------------------------------------
    console.log('--- 11.1 Server Endpoints & Routing ---');
    const healthRes = await request({ path: '/api/health', method: 'GET' });
    recordResult(
      'Server Health Check (GET /api/health)',
      healthRes.status === 200 && healthRes.body.success === true,
      healthRes.status !== 200 ? `Status ${healthRes.status}` : null
    );

    const notFoundRes = await request({ path: '/api/nonexistent-endpoint', method: 'GET' });
    recordResult(
      '404 Nonexistent Route (GET /api/nonexistent-endpoint)',
      notFoundRes.status === 404 && notFoundRes.body.success === false,
      notFoundRes.status !== 404 ? `Expected 404 but got ${notFoundRes.status}` : null
    );

    const unauthReports = await request({ path: '/api/reports/my', method: 'GET' });
    recordResult(
      '401 Unauthenticated Protection (GET /api/reports/my)',
      unauthReports.status === 401,
      unauthReports.status !== 401 ? `Expected 401 but got ${unauthReports.status}` : null
    );

    const unauthAdmin = await request({ path: '/api/admin/stats', method: 'GET' });
    recordResult(
      '401 Unauthenticated Admin Access (GET /api/admin/stats)',
      unauthAdmin.status === 401,
      unauthAdmin.status !== 401 ? `Expected 401 but got ${unauthAdmin.status}` : null
    );

    // ----------------------------------------------------
    // 11.2 DATABASE INTEGRITY & SCHEMA
    // ----------------------------------------------------
    console.log('\n--- 11.2 Database Integrity & Constraints ---');
    const userTableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    const hasEmailCol = userTableCheck.rows.some((c) => c.column_name === 'email');
    recordResult(
      'Database: Users Table Schema Verification',
      userTableCheck.rows.length >= 6 && hasEmailCol,
      userTableCheck.rows.length < 6 ? 'Missing columns in users table' : null
    );

    const reportTableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reports'
    `);
    const hasReportIdCol = reportTableCheck.rows.some((c) => c.column_name === 'report_id');
    recordResult(
      'Database: Reports Table Schema Verification',
      reportTableCheck.rows.length >= 8 && hasReportIdCol,
      reportTableCheck.rows.length < 8 ? 'Missing columns in reports table' : null
    );

    // ----------------------------------------------------
    // 11.3 CITIZEN USER FLOW (Registration, Login, Report)
    // ----------------------------------------------------
    console.log('\n--- 11.3 Citizen Flow Testing ---');
    const timestamp = Date.now();
    const citizenEmail = `citizen_test_${timestamp}@civicfix.org`;
    const citizenPassword = 'Password@123';

    // Register
    const regRes = await request(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Aarav Patel', email: citizenEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Citizen Registration (POST /api/auth/register)',
      regRes.status === 201 && regRes.body.token && regRes.body.user.role === 'citizen',
      regRes.status !== 201 ? `Registration failed with status ${regRes.status}` : null
    );
    const citizenToken = regRes.body.token;

    // Login
    const loginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: citizenEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Citizen Login (POST /api/auth/login)',
      loginRes.status === 200 && loginRes.body.token != null,
      loginRes.status !== 200 ? `Login failed with status ${loginRes.status}` : null
    );

    // Profile GET /api/auth/me
    const meRes = await request(
      { path: '/api/auth/me', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    recordResult(
      'Current User Profile (GET /api/auth/me)',
      meRes.status === 200 && meRes.body.user.email === citizenEmail,
      meRes.status !== 200 ? `Failed /api/auth/me with status ${meRes.status}` : null
    );

    // Create Report with Evidence Photo
    const testImgPath = path.join(__dirname, '../../../test-pothole.png');
    const reportSubmitRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Pothole',
        location: 'MG Road Junction, Ward 14',
        description: 'Dangerous 10-inch deep pothole near pedestrian crossing'
      },
      { filePath: testImgPath, filename: 'test-pothole.png', mime: 'image/png' }
    );
    recordResult(
      'Report Submission with Image (POST /api/reports)',
      reportSubmitRes.status === 201 && reportSubmitRes.body.report.report_id.startsWith('CF-'),
      reportSubmitRes.status !== 201 ? `Failed report creation with status ${reportSubmitRes.status}` : null
    );
    const createdReport = reportSubmitRes.body.report;
    const createdReportId = createdReport?.report_id;

    // Citizen My Reports
    const myReportsRes = await request(
      { path: '/api/reports/my', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    const hasSubmitted = myReportsRes.body.reports?.some((r) => r.report_id === createdReportId);
    recordResult(
      'Citizen My Reports List (GET /api/reports/my)',
      myReportsRes.status === 200 && hasSubmitted,
      !hasSubmitted ? 'Submitted report not found in My Reports' : null
    );

    // Citizen Report Details by ID
    const reportDetailsRes = await request(
      { path: `/api/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    recordResult(
      'Citizen Report Details & Initial Status PENDING (GET /api/reports/:id)',
      reportDetailsRes.status === 200 && reportDetailsRes.body.report.status === 'PENDING',
      reportDetailsRes.body.report?.status !== 'PENDING' ? `Expected PENDING but got ${reportDetailsRes.body.report?.status}` : null
    );

    // ----------------------------------------------------
    // 11.4 ADMIN FLOW & LIFECYCLE TRANSITIONS
    // ----------------------------------------------------
    console.log('\n--- 11.4 Admin Flow & Lifecycle Updates ---');
    // Admin Login
    const adminLoginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: 'admin@civicfix.org', password: 'Admin@12345' }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Admin Login (admin@civicfix.org)',
      adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin',
      adminLoginRes.status !== 200 ? `Admin login failed with status ${adminLoginRes.status}` : null
    );
    const adminToken = adminLoginRes.body.token;

    // Admin Stats
    const adminStatsRes = await request(
      { path: '/api/admin/stats', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const statsValid =
      adminStatsRes.status === 200 &&
      typeof adminStatsRes.body.stats.total === 'number' &&
      typeof adminStatsRes.body.stats.pending === 'number';
    recordResult(
      'Admin Real-time Stats (GET /api/admin/stats)',
      statsValid,
      !statsValid ? 'Invalid stats structure' : null
    );

    // Admin Reports Queue
    const adminReportsRes = await request(
      { path: '/api/admin/reports', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const foundInQueue = adminReportsRes.body.reports?.find((r) => r.report_id === createdReportId);
    recordResult(
      'Admin Reports Queue & Submitter Contact (GET /api/admin/reports)',
      adminReportsRes.status === 200 && foundInQueue && foundInQueue.citizen_email === citizenEmail,
      !foundInQueue ? 'Report not visible in admin queue' : null
    );

    // Admin Details
    const adminDetailsRes = await request(
      { path: `/api/admin/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    recordResult(
      'Admin Report Dossier (GET /api/admin/reports/:id)',
      adminDetailsRes.status === 200 && adminDetailsRes.body.report.report_id === createdReportId,
      adminDetailsRes.status !== 200 ? `Failed dossier fetch with status ${adminDetailsRes.status}` : null
    );

    // Status Transition 1: PENDING -> IN_PROGRESS
    const updateProgressRes = await request(
      { path: `/api/admin/reports/${createdReportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'IN_PROGRESS' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    recordResult(
      'Status Transition: PENDING -> IN_PROGRESS',
      updateProgressRes.status === 200 && updateProgressRes.body.report.status === 'IN_PROGRESS',
      updateProgressRes.body.report?.status !== 'IN_PROGRESS' ? 'Failed transition to IN_PROGRESS' : null
    );

    // Status Transition 2: IN_PROGRESS -> RESOLVED
    const updateResolvedRes = await request(
      { path: `/api/admin/reports/${createdReportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'RESOLVED' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    recordResult(
      'Status Transition: IN_PROGRESS -> RESOLVED',
      updateResolvedRes.status === 200 && updateResolvedRes.body.report.status === 'RESOLVED',
      updateResolvedRes.body.report?.status !== 'RESOLVED' ? 'Failed transition to RESOLVED' : null
    );

    // ----------------------------------------------------
    // 11.5 CITIZEN STATUS REFLECTION
    // ----------------------------------------------------
    console.log('\n--- 11.5 Citizen Status Reflection ---');
    const citizenCheckRes = await request(
      { path: `/api/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    const isResolved = citizenCheckRes.body.report?.status === 'RESOLVED';
    recordResult(
      'Citizen Sees Updated RESOLVED Status in Details',
      citizenCheckRes.status === 200 && isResolved,
      !isResolved ? `Status not updated: ${citizenCheckRes.body.report?.status}` : null
    );

    // ----------------------------------------------------
    // 11.6 SECURITY & ACCESS CONTROL
    // ----------------------------------------------------
    console.log('\n--- 11.6 Security & Access Control ---');

    // Citizen attempting admin API
    const citizenAdminAttempt = await request(
      { path: '/api/admin/stats', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    recordResult(
      'Security: 403 Forbidden on Citizen accessing Admin API',
      citizenAdminAttempt.status === 403,
      citizenAdminAttempt.status !== 403 ? `Expected 403 but got ${citizenAdminAttempt.status}` : null
    );

    // Create Citizen B
    const citizenBEmail = `citizen_b_${timestamp}@civicfix.org`;
    const regB = await request(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Citizen B', email: citizenBEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    const citizenBToken = regB.body.token;

    // Citizen B trying to access Citizen A's report
    const crossAccessRes = await request(
      { path: `/api/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenBToken}` }
    );
    recordResult(
      'Security: 403 Forbidden on Citizen B accessing Citizen A report',
      crossAccessRes.status === 403,
      crossAccessRes.status !== 403 ? `Expected 403 but got ${crossAccessRes.status}` : null
    );

    // Invalid JWT Token
    const badJwtRes = await request(
      { path: '/api/reports/my', method: 'GET' },
      null,
      { Authorization: 'Bearer invalid.jwt.signature' }
    );
    recordResult(
      'Security: 401 Unauthorized on Invalid JWT',
      badJwtRes.status === 401,
      badJwtRes.status !== 401 ? `Expected 401 but got ${badJwtRes.status}` : null
    );

    // Invalid Status Value
    const badStatusRes = await request(
      { path: `/api/admin/reports/${createdReportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'INVALID_STATUS_VALUE' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    recordResult(
      'Validation: 400 Bad Request on Invalid Status Transition',
      badStatusRes.status === 400,
      badStatusRes.status !== 400 ? `Expected 400 but got ${badStatusRes.status}` : null
    );

    // Unsupported Image Format
    const badUploadRes = await uploadMultipart(
      citizenToken,
      { category: 'Pothole', location: 'Location', description: 'Description' },
      { content: 'Fake text file content', filename: 'malicious.txt', mime: 'text/plain' }
    );
    recordResult(
      'Validation: 400 Bad Request on Unsupported File Format (.txt)',
      badUploadRes.status === 400,
      badUploadRes.status !== 400 ? `Expected 400 but got ${badUploadRes.status}` : null
    );

    // SQL Injection Immunity in text inputs
    const sqlInjectionLocation = "'; DROP TABLE reports; --";
    const sqliRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Streetlight',
        location: sqlInjectionLocation,
        description: 'Testing parameterized query safety with quotes and escapes'
      },
      null
    );
    const sqliSafe = sqliRes.status === 201 && sqliRes.body.report.location === sqlInjectionLocation;
    recordResult(
      'Security: SQL Injection Immunity via Parameterized Queries',
      sqliSafe,
      !sqliSafe ? 'SQL Injection payload caused unexpected behavior' : null
    );

    // XSS Script Tag Handling in description
    const xssDesc = '<script>alert("xss")</script> Broken streetlight on 5th Ave';
    const xssRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Streetlight',
        location: '5th Avenue Corner',
        description: xssDesc
      },
      null
    );
    const xssSafe = xssRes.status === 201 && xssRes.body.report.description === xssDesc;
    recordResult(
      'Security: XSS String Sanitization / Neutral Handling',
      xssSafe,
      !xssSafe ? 'XSS payload caused unexpected server behavior' : null
    );

    // ----------------------------------------------------
    // 11.8 EDGE CASES
    // ----------------------------------------------------
    console.log('\n--- 11.8 Edge Cases ---');

    // Duplicate Email Registration
    const dupEmailRes = await request(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Duplicate User', email: citizenEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Edge Case: 400 Duplicate Email Registration',
      dupEmailRes.status === 400,
      dupEmailRes.status !== 400 ? `Expected 400 but got ${dupEmailRes.status}` : null
    );

    // Missing Form Fields
    const missingFieldsRes = await request(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: '', email: '', password: '' }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Edge Case: 400 Missing Registration Fields',
      missingFieldsRes.status === 400,
      missingFieldsRes.status !== 400 ? `Expected 400 but got ${missingFieldsRes.status}` : null
    );

    // Very Long Description (1500 chars)
    const longDesc = 'A'.repeat(1500);
    const longDescRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Water Leakage',
        location: 'Sector 9 Water Main',
        description: longDesc
      },
      null
    );
    recordResult(
      'Edge Case: Large Description Text (1500 characters)',
      longDescRes.status === 201 && longDescRes.body.report.description.length === 1500,
      longDescRes.status !== 201 ? `Failed with status ${longDescRes.status}` : null
    );

    // Report without photo (optional photo test)
    const textOnlyRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Garbage',
        location: 'Community Park Gate 2',
        description: 'Overflowing public waste bin requiring collection'
      },
      null
    );
    recordResult(
      'Edge Case: Report creation without image (Text-only submission)',
      textOnlyRes.status === 201 && textOnlyRes.body.report.image_url === null,
      textOnlyRes.status !== 201 ? `Failed text-only report with status ${textOnlyRes.status}` : null
    );

    console.log('\n====================================================');
    console.log('  TEST SUMMARY REPORT');
    console.log('====================================================');
    console.table(results);

    const failCount = results.filter((r) => r.result === 'FAIL').length;
    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`Passed: ${results.length - failCount}`);
    console.log(`Failed: ${failCount}`);

    if (failCount > 0) {
      console.error(`❌ Test run completed with ${failCount} failures.`);
      process.exit(1);
    } else {
      console.log('✅ ALL PHASE 11 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase11Tests();
