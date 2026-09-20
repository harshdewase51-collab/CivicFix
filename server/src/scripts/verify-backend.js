const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

function makeRequest(options, postData = null, headers = {}) {
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
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, raw: body });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function uploadMultipartReport(token, filePath) {
  const boundary = '----CivicFixTestBoundary' + Date.now();
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  let payload = '';
  payload += `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nPothole\r\n`;
  payload += `--${boundary}\r\nContent-Disposition: form-data; name="location"\r\n\r\nHighway Junction 2\r\n`;
  payload += `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nRoad hazard test\r\n`;
  payload += `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`;

  const headerBuf = Buffer.from(payload, 'utf-8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const body = Buffer.concat([headerBuf, fileContent, footerBuf]);

  return makeRequest(
    {
      path: '/api/reports',
      method: 'POST'
    },
    body,
    {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  );
}

async function runCompleteBackendTestSuite() {
  console.log('================================================================');
  console.log('CIVICFIX — COMPLETE PHASE 8 BACKEND TESTING SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(condition, name) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  }

  try {
    // 8.1 Health Test
    const health = await makeRequest({ path: '/api/health', method: 'GET' });
    test(health.status === 200 && health.body.success === true, '8.1 Health Check: GET /api/health returns 200 and success: true');

    // 8.3 Auth Tests
    const testEmail = `phase8_user_${Date.now()}@civicfix.org`;
    const regRes = await makeRequest(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Sanjay Dutt', email: testEmail, password: 'SecurePassword123' }),
      { 'Content-Type': 'application/json' }
    );
    test(regRes.status === 201 && regRes.body.token, '8.3a Register Citizen: creates citizen and issues JWT');
    const citizenToken = regRes.body.token;

    const dupRes = await makeRequest(
      { path: '/api/auth/register', method: 'POST' },
      JSON.stringify({ name: 'Sanjay Dutt', email: testEmail, password: 'SecurePassword123' }),
      { 'Content-Type': 'application/json' }
    );
    test(dupRes.status === 400 && dupRes.body.success === false, '8.3b Duplicate Email: rejected with 400 Bad Request');

    const wrongPassRes = await makeRequest(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: testEmail, password: 'WrongPassword' }),
      { 'Content-Type': 'application/json' }
    );
    test(wrongPassRes.status === 401, '8.3c Wrong Password: rejected with 401 Unauthorized');

    const loginRes = await makeRequest(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: testEmail, password: 'SecurePassword123' }),
      { 'Content-Type': 'application/json' }
    );
    test(loginRes.status === 200 && loginRes.body.token, '8.3d Login: authenticates citizen and returns token');

    const meRes = await makeRequest(
      { path: '/api/auth/me', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    test(meRes.status === 200 && meRes.body.user.email === testEmail, '8.3e Get Current User: /api/auth/me returns citizen profile');

    const missingTokenRes = await makeRequest({ path: '/api/auth/me', method: 'GET' });
    test(missingTokenRes.status === 401, '8.3f Missing Token: rejected with 401 Unauthorized');

    const invalidTokenRes = await makeRequest(
      { path: '/api/auth/me', method: 'GET' },
      null,
      { Authorization: 'Bearer invalid_garbage_token' }
    );
    test(invalidTokenRes.status === 401, '8.3g Invalid Token: rejected with 401 Unauthorized');

    // 8.4 Citizen Report Tests
    const missingFieldRes = await makeRequest(
      { path: '/api/reports', method: 'POST' },
      JSON.stringify({ category: 'Pothole' }),
      { Authorization: `Bearer ${citizenToken}`, 'Content-Type': 'application/json' }
    );
    test(missingFieldRes.status === 400, '8.4a Missing Fields: rejected with 400 Bad Request');

    const invalidCatRes = await makeRequest(
      { path: '/api/reports', method: 'POST' },
      JSON.stringify({ category: 'FlyingSaucer', location: 'Sky', description: 'Alien' }),
      { Authorization: `Bearer ${citizenToken}`, 'Content-Type': 'application/json' }
    );
    test(invalidCatRes.status === 400, '8.4b Invalid Category: rejected with 400 Bad Request');

    const testImgPath = path.join(__dirname, '../../../test-pothole.png');
    const uploadRes = await uploadMultipartReport(citizenToken, testImgPath);
    test(
      uploadRes.status === 201 &&
      uploadRes.body.report.report_id.startsWith('CF-') &&
      uploadRes.body.report.image_url,
      `8.4c Create Report with Photo: generated ${uploadRes.body.report?.report_id}`
    );
    const reportId = uploadRes.body.report?.report_id;

    const myReportsRes = await makeRequest(
      { path: '/api/reports/my', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    test(
      myReportsRes.status === 200 &&
      myReportsRes.body.reports.some((r) => r.report_id === reportId),
      '8.4d Get My Reports: returns complaints submitted by citizen'
    );

    const singleRes = await makeRequest(
      { path: `/api/reports/${reportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    test(singleRes.status === 200 && singleRes.body.report.report_id === reportId, '8.4e Get Report Details: returns complaint dossier');

    // 8.5 Admin Tests
    const adminLoginRes = await makeRequest(
      { path: '/api/auth/login', method: 'POST' },
      JSON.stringify({ email: 'admin@civicfix.org', password: 'Admin@12345' }),
      { 'Content-Type': 'application/json' }
    );
    test(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', '8.5a Admin Login: succeeds with default admin');
    const adminToken = adminLoginRes.body.token;

    const citizenBlockedRes = await makeRequest(
      { path: '/api/admin/reports', method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    test(citizenBlockedRes.status === 403, '8.5b Citizen Blocked from Admin: receives 403 Forbidden');

    const adminReportsRes = await makeRequest(
      { path: '/api/admin/reports', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    test(
      adminReportsRes.status === 200 &&
      Array.isArray(adminReportsRes.body.reports) &&
      adminReportsRes.body.reports.some((r) => r.report_id === reportId),
      '8.5c Admin Get All Reports: returns all municipal complaints'
    );

    const adminStatsRes = await makeRequest(
      { path: '/api/admin/stats', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    test(
      adminStatsRes.status === 200 &&
      typeof adminStatsRes.body.stats.total === 'number' &&
      typeof adminStatsRes.body.stats.pending === 'number',
      '8.5d Admin Statistics: aggregates counts from real PostgreSQL DB'
    );

    const updateStatusRes = await makeRequest(
      { path: `/api/admin/reports/${reportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'IN_PROGRESS' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    test(
      updateStatusRes.status === 200 && updateStatusRes.body.report.status === 'IN_PROGRESS',
      '8.5e Update Report Status: transitions PENDING -> IN_PROGRESS'
    );

    const invalidStatusRes = await makeRequest(
      { path: `/api/admin/reports/${reportId}/status`, method: 'PATCH' },
      JSON.stringify({ status: 'FAKE_STATUS' }),
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    );
    test(invalidStatusRes.status === 400, '8.5f Invalid Status: rejected with 400 Bad Request');

    // 8.6 Data Persistence Verification
    const recheckRes = await makeRequest(
      { path: `/api/reports/${reportId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${citizenToken}` }
    );
    test(
      recheckRes.status === 200 && recheckRes.body.report.status === 'IN_PROGRESS',
      '8.6 Data Persistence: status update persisted in PostgreSQL'
    );

    // 8.7 Error Route Testing
    const notFoundRes = await makeRequest({ path: '/api/nonexistent-endpoint', method: 'GET' });
    test(notFoundRes.status === 404 && notFoundRes.body.success === false, '8.7 404 Route Handling: unknown endpoints return clean JSON');

    console.log('\n================================================================');
    console.log(`PHASE 8 BACKEND TEST SUMMARY: ${passed}/${total} assertions passed`);
    console.log('================================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runCompleteBackendTestSuite();
