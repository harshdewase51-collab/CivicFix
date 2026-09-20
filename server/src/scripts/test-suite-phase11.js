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
  console.log('  CIVICFIX PHASE 11 EXHAUSTIVE END-TO-END TEST SUITE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // 11.2 BACKEND HEALTH TEST
    // ----------------------------------------------------
    console.log('--- 11.2 Backend Health Test ---');
    const healthRes = await request({ path: '/api/health', method: 'GET' });
    recordResult(
      'Server Health Check (GET /api/health)',
      healthRes.status === 200 && healthRes.body.success === true,
      healthRes.status !== 200 ? `Status ${healthRes.status}` : null
    );

    // ----------------------------------------------------
    // 11.3 DATABASE INTEGRITY & SCHEMA TEST
    // ----------------------------------------------------
    console.log('\n--- 11.3 Database Schema & Password Hashing Verification ---');
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

    // Check that admin password in DB is hashed and not plaintext
    const adminCheck = await pool.query(`SELECT password_hash FROM users WHERE email = 'admin@civicfix.org'`);
    const adminHash = adminCheck.rows[0]?.password_hash;
    const isBcryptHash = adminHash && adminHash.startsWith('$2');
    recordResult(
      'Database: Passwords Stored as Bcrypt Hashes (No Plaintext)',
      isBcryptHash,
      !isBcryptHash ? 'Admin password is not a bcrypt hash' : null
    );

    // ----------------------------------------------------
    // 11.4 CITIZEN REGISTRATION TEST
    // ----------------------------------------------------
    console.log('\n--- 11.4 Citizen Registration Testing ---');
    const timestamp = Date.now();
    const citizenEmail = `citizen_test_${timestamp}@civicfix.org`;
    const citizenPassword = 'Password@123';

    // Successful registration
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
    const citizenId = regRes.body.user.id;

    // Duplicate email rejected
    const dupEmailRes = await request(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Aarav Duplicate', email: citizenEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Registration: 400 Bad Request on Duplicate Email',
      dupEmailRes.status === 400 && dupEmailRes.body.message.includes('already exists'),
      dupEmailRes.status !== 400 ? `Expected 400 but got ${dupEmailRes.status}` : null
    );

    // ----------------------------------------------------
    // 11.5 CITIZEN LOGIN TEST
    // ----------------------------------------------------
    console.log('\n--- 11.5 Citizen Login Testing ---');
    // Valid login
    const loginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: citizenEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Citizen Valid Login (POST /api/auth/login)',
      loginRes.status === 200 && loginRes.body.token != null,
      loginRes.status !== 200 ? `Login failed with status ${loginRes.status}` : null
    );

    // Wrong password login
    const wrongPassRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: citizenEmail, password: 'WrongPassword@999' }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Login Security: 401 Unauthorized on Wrong Password',
      wrongPassRes.status === 401 && wrongPassRes.body.message.includes('Invalid email or password'),
      wrongPassRes.status !== 401 ? `Expected 401 but got ${wrongPassRes.status}` : null
    );

    // Nonexistent email login
    const noUserRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: 'nonexistent_9999@civicfix.org', password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Login Security: 401 Unauthorized on Nonexistent Email',
      noUserRes.status === 401 && noUserRes.body.message.includes('Invalid email or password'),
      noUserRes.status !== 401 ? `Expected 401 but got ${noUserRes.status}` : null
    );

    // Profile retrieval
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

    // ----------------------------------------------------
    // 11.6 & 11.20 LOGOUT & JWT TESTING
    // ----------------------------------------------------
    console.log('\n--- 11.6 & 11.20 Logout & JWT Validation Testing ---');
    // Missing Authorization header
    const noTokenRes = await request({ path: '/api/reports/my', method: 'GET' });
    recordResult(
      'JWT Security: 401 on Missing Token',
      noTokenRes.status === 401,
      noTokenRes.status !== 401 ? `Expected 401 but got ${noTokenRes.status}` : null
    );

    // Malformed JWT token
    const malformedJwtRes = await request(
      { path: '/api/reports/my', method: 'GET' },
      null,
      { Authorization: 'Bearer 12345malformedToken' }
    );
    recordResult(
      'JWT Security: 401 on Malformed Token',
      malformedJwtRes.status === 401,
      malformedJwtRes.status !== 401 ? `Expected 401 but got ${malformedJwtRes.status}` : null
    );

    // ----------------------------------------------------
    // 11.8 REPORT CREATION TEST (Photo + Pothole)
    // ----------------------------------------------------
    console.log('\n--- 11.8 Report Creation Test ---');
    const testImgPath = path.join(__dirname, '../../../test-pothole.png');
    const reportSubmitRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Pothole',
        location: 'Test Location - MG Road Junction',
        description: 'Test pothole report for CivicFix testing.'
      },
      { filePath: testImgPath, filename: 'test-pothole.png', mime: 'image/png' }
    );
    const createdReport = reportSubmitRes.body.report;
    const createdReportId = createdReport?.report_id;
    recordResult(
      'Report Submission with Image (POST /api/reports)',
      reportSubmitRes.status === 201 && createdReportId && createdReportId.startsWith('CF-'),
      reportSubmitRes.status !== 201 ? `Failed report creation with status ${reportSubmitRes.status}` : null
    );

    // Verify initial status is PENDING
    recordResult(
      'Report Initial Status is PENDING',
      createdReport?.status === 'PENDING',
      createdReport?.status !== 'PENDING' ? `Expected PENDING but got ${createdReport?.status}` : null
    );

    // ----------------------------------------------------
    // 11.9 REPORT VALIDATION TEST
    // ----------------------------------------------------
    console.log('\n--- 11.9 Report Form Input Validation Testing ---');
    // Missing Category
    const noCatRes = await uploadMultipart(
      citizenToken,
      { category: '', location: 'Valid Location', description: 'Valid Description' },
      null
    );
    recordResult(
      'Validation: 400 Bad Request on Missing Category',
      noCatRes.status === 400,
      noCatRes.status !== 400 ? `Expected 400 but got ${noCatRes.status}` : null
    );

    // Missing Location
    const noLocRes = await uploadMultipart(
      citizenToken,
      { category: 'Pothole', location: '', description: 'Valid Description' },
      null
    );
    recordResult(
      'Validation: 400 Bad Request on Missing Location',
      noLocRes.status === 400,
      noLocRes.status !== 400 ? `Expected 400 but got ${noLocRes.status}` : null
    );

    // Missing Description
    const noDescRes = await uploadMultipart(
      citizenToken,
      { category: 'Pothole', location: 'Valid Location', description: '' },
      null
    );
    recordResult(
      'Validation: 400 Bad Request on Missing Description',
      noDescRes.status === 400,
      noDescRes.status !== 400 ? `Expected 400 but got ${noDescRes.status}` : null
    );

    // Unsupported file type (.txt)
    const badFileRes = await uploadMultipart(
      citizenToken,
      { category: 'Pothole', location: 'Valid Location', description: 'Valid Description' },
      { content: 'fake txt content', filename: 'malicious.txt', mime: 'text/plain' }
    );
    recordResult(
      'Validation: 400 Bad Request on Unsupported Image Format (.txt)',
      badFileRes.status === 400,
      badFileRes.status !== 400 ? `Expected 400 but got ${badFileRes.status}` : null
    );

    // ----------------------------------------------------
    // 11.10 MY REPORTS TEST & CITIZEN ISOLATION
    // ----------------------------------------------------
    console.log('\n--- 11.10 My Reports & Citizen Isolation Testing ---');
    const myReportsRes = await request(
      { path: '/api/reports/my', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    const hasSubmitted = myReportsRes.body.reports?.some((r) => r.report_id === createdReportId);
    recordResult(
      'My Reports Displays Citizen-Owned Reports (GET /api/reports/my)',
      myReportsRes.status === 200 && hasSubmitted,
      !hasSubmitted ? 'Submitted report not found in My Reports' : null
    );

    // Create Citizen B to verify isolation
    const citizenBEmail = `citizen_b_${timestamp}@civicfix.org`;
    const regB = await request(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Citizen B', email: citizenBEmail, password: citizenPassword }),
      { 'Content-Type': 'application/json' }
    );
    const citizenBToken = regB.body.token;

    // Citizen B My Reports should NOT include Citizen A's report
    const citizenBReportsRes = await request(
      { path: '/api/reports/my', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenBToken}` }
    );
    const leakedToB = citizenBReportsRes.body.reports?.some((r) => r.report_id === createdReportId);
    recordResult(
      'Citizen Isolation: Citizen B Cannot See Citizen A Reports in My Reports',
      !leakedToB,
      leakedToB ? "Citizen B's list contains Citizen A's report" : null
    );

    // ----------------------------------------------------
    // 11.11 REPORT DETAILS TEST
    // ----------------------------------------------------
    console.log('\n--- 11.11 Report Details Testing ---');
    const reportDetailsRes = await request(
      { path: `/api/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    const reportMatch =
      reportDetailsRes.status === 200 &&
      reportDetailsRes.body.report.report_id === createdReportId &&
      reportDetailsRes.body.report.category === 'Pothole' &&
      reportDetailsRes.body.report.status === 'PENDING';
    recordResult(
      'Report Details Loaded Correctly by ID (GET /api/reports/:id)',
      reportMatch,
      !reportMatch ? 'Report details mismatch' : null
    );

    // Nonexistent report query
    const notFoundReport = await request(
      { path: '/api/reports/CF-99999', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    recordResult(
      'Error Handling: 404 on Nonexistent Report ID',
      notFoundReport.status === 404 && notFoundReport.body.message.includes('not found'),
      notFoundReport.status !== 404 ? `Expected 404 but got ${notFoundReport.status}` : null
    );

    // ----------------------------------------------------
    // 11.12 ADMIN LOGIN TEST
    // ----------------------------------------------------
    console.log('\n--- 11.12 Admin Login Testing ---');
    const adminLoginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: 'admin@civicfix.org', password: 'Admin@12345' }),
      { 'Content-Type': 'application/json' }
    );
    recordResult(
      'Admin Login & Role Verification (admin@civicfix.org)',
      adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin',
      adminLoginRes.status !== 200 ? `Admin login failed with status ${adminLoginRes.status}` : null
    );
    const adminToken = adminLoginRes.body.token;

    // ----------------------------------------------------
    // 11.13 ADMIN DASHBOARD STATS & QUEUE TEST
    // ----------------------------------------------------
    console.log('\n--- 11.13 Admin Dashboard Stats & Queue Testing ---');
    const adminStatsRes = await request(
      { path: '/api/admin/stats', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const statsValid =
      adminStatsRes.status === 200 &&
      typeof adminStatsRes.body.stats.total === 'number' &&
      typeof adminStatsRes.body.stats.pending === 'number' &&
      typeof adminStatsRes.body.stats.in_progress === 'number' &&
      typeof adminStatsRes.body.stats.resolved === 'number';
    recordResult(
      'Admin Real-Time Stats Aggregation (GET /api/admin/stats)',
      statsValid,
      !statsValid ? 'Invalid stats structure' : null
    );

    // ----------------------------------------------------
    // 11.14 & 11.15 ADMIN SEARCH & FILTER TESTING
    // ----------------------------------------------------
    console.log('\n--- 11.14 & 11.15 Admin Search & Filters Testing ---');
    // Search by Report ID
    const searchRes = await request(
      { path: `/api/admin/reports?search=${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const searchFound = searchRes.body.reports?.some((r) => r.report_id === createdReportId);
    recordResult(
      `Admin Search by Report ID (${createdReportId})`,
      searchRes.status === 200 && searchFound,
      !searchFound ? 'Search failed to find created report' : null
    );

    // Filter by Status PENDING
    const filterPendingRes = await request(
      { path: '/api/admin/reports?status=PENDING', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const allPending = filterPendingRes.body.reports?.every((r) => r.status === 'PENDING');
    recordResult(
      'Admin Filter by Status (status=PENDING)',
      filterPendingRes.status === 200 && allPending && filterPendingRes.body.reports.length > 0,
      !allPending ? 'Non-pending reports returned' : null
    );

    // Filter by Category Pothole
    const filterCatRes = await request(
      { path: '/api/admin/reports?category=Pothole', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const allPotholes = filterCatRes.body.reports?.every((r) => r.category === 'Pothole');
    recordResult(
      'Admin Filter by Category (category=Pothole)',
      filterCatRes.status === 200 && allPotholes,
      !allPotholes ? 'Non-pothole reports returned' : null
    );

    // ----------------------------------------------------
    // 11.16 & 11.17 ADMIN REPORT DOSSIER & STATUS UPDATE
    // ----------------------------------------------------
    console.log('\n--- 11.16 & 11.17 Admin Dossier & Status Lifecycle Testing ---');
    const adminDossierRes = await request(
      { path: `/api/admin/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const dossierValid =
      adminDossierRes.status === 200 &&
      adminDossierRes.body.report.citizen_email === citizenEmail &&
      adminDossierRes.body.report.citizen_name === 'Aarav Patel';
    recordResult(
      'Admin Dossier Inspection with Citizen Contact Info',
      dossierValid,
      !dossierValid ? 'Dossier did not contain expected citizen info' : null
    );

    // Status Update 1: PENDING -> IN_PROGRESS
    const updateProgressRes = await request(
      { path: `/api/admin/reports/${createdReportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'IN_PROGRESS' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    recordResult(
      'Status Transition 1: PENDING -> IN_PROGRESS',
      updateProgressRes.status === 200 && updateProgressRes.body.report.status === 'IN_PROGRESS',
      updateProgressRes.body.report?.status !== 'IN_PROGRESS' ? 'Failed transition to IN_PROGRESS' : null
    );

    // Status Update 2: IN_PROGRESS -> RESOLVED
    const updateResolvedRes = await request(
      { path: `/api/admin/reports/${createdReportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'RESOLVED' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    recordResult(
      'Status Transition 2: IN_PROGRESS -> RESOLVED',
      updateResolvedRes.status === 200 && updateResolvedRes.body.report.status === 'RESOLVED',
      updateResolvedRes.body.report?.status !== 'RESOLVED' ? 'Failed transition to RESOLVED' : null
    );

    // ----------------------------------------------------
    // 11.18 CITIZEN STATUS VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 11.18 Citizen Status Verification ---');
    const citizenCheckRes = await request(
      { path: `/api/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    recordResult(
      'Citizen Sees Updated RESOLVED Status in Real-Time',
      citizenCheckRes.status === 200 && citizenCheckRes.body.report.status === 'RESOLVED',
      citizenCheckRes.body.report?.status !== 'RESOLVED' ? `Expected RESOLVED but got ${citizenCheckRes.body.report?.status}` : null
    );

    // ----------------------------------------------------
    // 11.19 AUTHORIZATION & ROLE-BASED ACCESS
    // ----------------------------------------------------
    console.log('\n--- 11.19 Authorization & Access Isolation Testing ---');
    // Case 3 & 4: Citizen calling Admin API
    const citizenAdminAttempt = await request(
      { path: '/api/admin/stats', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    recordResult(
      'Security Case 4: 403 Forbidden on Citizen Calling Admin API',
      citizenAdminAttempt.status === 403,
      citizenAdminAttempt.status !== 403 ? `Expected 403 but got ${citizenAdminAttempt.status}` : null
    );

    // Case 5: Citizen B attempting to view Citizen A's report
    const crossAccessRes = await request(
      { path: `/api/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenBToken}` }
    );
    recordResult(
      'Security Case 5: 403 Forbidden on Citizen B Accessing Citizen A Report',
      crossAccessRes.status === 403,
      crossAccessRes.status !== 403 ? `Expected 403 but got ${crossAccessRes.status}` : null
    );

    // Case 6: Admin accessing reports
    const adminAccessRes = await request(
      { path: `/api/admin/reports/${createdReportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    recordResult(
      'Security Case 6: Admin Can Access All Citizen Reports',
      adminAccessRes.status === 200,
      adminAccessRes.status !== 200 ? `Expected 200 but got ${adminAccessRes.status}` : null
    );

    // ----------------------------------------------------
    // 11.21 ERROR HANDLING & SANITIZATION
    // ----------------------------------------------------
    console.log('\n--- 11.21 Error Handling & Sanitization ---');
    // SQL Injection Immunity
    const sqliPayload = "'; DROP TABLE reports; --";
    const sqliRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Streetlight',
        location: sqliPayload,
        description: 'Testing parameterized query safety with single quotes and SQL operators'
      },
      null
    );
    const sqliSafe = sqliRes.status === 201 && sqliRes.body.report.location === sqliPayload;
    recordResult(
      'Security: SQL Injection Immunity via Parameterized Queries',
      sqliSafe,
      !sqliSafe ? 'SQL Injection payload caused unexpected behavior' : null
    );

    // XSS Neutral Handling
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
      'Security: XSS Script String Neutral Storage & Rendering',
      xssSafe,
      !xssSafe ? 'XSS payload caused unexpected server behavior' : null
    );

    // ----------------------------------------------------
    // 11.23 DATABASE CONSISTENCY TEST
    // ----------------------------------------------------
    console.log('\n--- 11.23 Database Consistency & Timestamp Verification ---');
    const dbRowRes = await pool.query(
      `SELECT user_id, status, created_at, updated_at FROM reports WHERE report_id = $1`,
      [createdReportId]
    );
    const dbRow = dbRowRes.rows[0];
    const dbConsistencyValid =
      dbRow &&
      dbRow.user_id === citizenId &&
      dbRow.status === 'RESOLVED' &&
      new Date(dbRow.updated_at) >= new Date(dbRow.created_at);
    recordResult(
      'Database Consistency: Foreign Key & Timestamp Alignment (updated_at >= created_at)',
      dbConsistencyValid,
      !dbConsistencyValid ? 'Database row inconsistency' : null
    );

    // ----------------------------------------------------
    // 11.22 IMAGE FORMATS (Optional Uploads)
    // ----------------------------------------------------
    console.log('\n--- 11.22 Image Upload Formats Testing ---');
    const textOnlyRes = await uploadMultipart(
      citizenToken,
      {
        category: 'Garbage',
        location: 'Park Gate 2',
        description: 'Overflowing bin without photo attachment'
      },
      null
    );
    recordResult(
      'Image Upload: Optional Photo (Text-Only Reports Handled Gracefully)',
      textOnlyRes.status === 201 && textOnlyRes.body.report.image_url === null,
      textOnlyRes.status !== 201 ? 'Failed text-only submission' : null
    );

    console.log('\n====================================================');
    console.log('  PHASE 11 TEST SUMMARY REPORT');
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
