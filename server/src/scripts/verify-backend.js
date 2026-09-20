const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(options, postData = null, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runBackendVerification() {
  console.log('🧪 Starting CivicFix Backend API Verification Suite...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, name, details = '') {
    testsTotal++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
    }
  }

  try {
    // 1. Health Check
    const health = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.status === 200 && health.body.success === true, '1. GET /api/health responds with 200 and success: true');

    // 2. Register New Citizen
    const testEmail = `tester_${Date.now()}@test.com`;
    const regPayload = JSON.stringify({
      name: 'Rohan Sharma',
      email: testEmail,
      password: 'password123'
    });

    const regRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(regPayload)
        }
      },
      regPayload
    );
    assert(regRes.status === 201 && regRes.body.token, '2. POST /api/auth/register creates citizen and returns JWT token');
    const citizenToken = regRes.body.token;

    // 3. Duplicate Registration Rejected
    const dupRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(regPayload)
        }
      },
      regPayload
    );
    assert(dupRes.status === 400 && dupRes.body.success === false, '3. Duplicate email registration rejected with 400');

    // 4. Login Citizen
    const loginPayload = JSON.stringify({
      email: testEmail,
      password: 'password123'
    });
    const loginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginPayload)
        }
      },
      loginPayload
    );
    assert(loginRes.status === 200 && loginRes.body.token && loginRes.body.user.role === 'citizen', '4. POST /api/auth/login succeeds for citizen');

    // 5. GET /api/auth/me
    const meRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    assert(meRes.status === 200 && meRes.body.user.email === testEmail, '5. GET /api/auth/me returns authenticated citizen profile');

    // 6. Citizen creates a report
    const reportPayload = JSON.stringify({
      category: 'Pothole',
      location: 'Ring Road near Metro Station',
      description: 'Dangerous pothole in left traffic lane.'
    });
    const createReportRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/reports',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reportPayload),
          Authorization: `Bearer ${citizenToken}`
        }
      },
      reportPayload
    );
    assert(
      createReportRes.status === 201 &&
        createReportRes.body.report.report_id &&
        createReportRes.body.report.report_id.startsWith('CF-') &&
        createReportRes.body.report.status === 'PENDING',
      `6. POST /api/reports creates ticket with sequential ID (${createReportRes.body.report?.report_id})`
    );
    const createdReportId = createReportRes.body.report?.report_id;

    // 7. Citizen retrieves own reports
    const myReportsRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports/my',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    assert(
      myReportsRes.status === 200 &&
        Array.isArray(myReportsRes.body.reports) &&
        myReportsRes.body.reports.some((r) => r.report_id === createdReportId),
      '7. GET /api/reports/my returns list containing newly created report'
    );

    // 8. Citizen views single report
    const singleReportRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/reports/${createdReportId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    assert(
      singleReportRes.status === 200 && singleReportRes.body.report.report_id === createdReportId,
      '8. GET /api/reports/:id returns single report'
    );

    // 9. Citizen forbidden from admin routes
    const citizenForbiddenRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/reports',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    assert(citizenForbiddenRes.status === 403, '9. Citizen is rejected from GET /api/admin/reports with 403 Forbidden');

    // 10. Login as seeded Admin
    const adminLoginPayload = JSON.stringify({
      email: 'admin@civicfix.org',
      password: 'Admin@12345'
    });
    const adminLoginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(adminLoginPayload)
        }
      },
      adminLoginPayload
    );
    assert(
      adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin',
      '10. Admin logs in with default seed credentials'
    );
    const adminToken = adminLoginRes.body.token;

    // 11. Admin views all reports
    const adminReportsRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/reports',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert(
      adminReportsRes.status === 200 &&
        Array.isArray(adminReportsRes.body.reports) &&
        adminReportsRes.body.reports.length > 0,
      `11. Admin GET /api/admin/reports retrieves all reports (${adminReportsRes.body.count} total)`
    );

    // 12. Admin views stats
    const statsRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/stats',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    assert(
      statsRes.status === 200 &&
        typeof statsRes.body.stats.total === 'number' &&
        typeof statsRes.body.stats.pending === 'number',
      `12. Admin GET /api/admin/stats returns aggregate counts (Total: ${statsRes.body.stats?.total})`
    );

    // 13. Admin transitions status: PENDING -> IN_PROGRESS
    const updateProgressPayload = JSON.stringify({ status: 'IN_PROGRESS' });
    const updateProgressRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/admin/reports/${createdReportId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updateProgressPayload),
          Authorization: `Bearer ${adminToken}`
        }
      },
      updateProgressPayload
    );
    assert(
      updateProgressRes.status === 200 && updateProgressRes.body.report.status === 'IN_PROGRESS',
      '13. Admin updates report status to IN_PROGRESS'
    );

    // 14. Admin transitions status: IN_PROGRESS -> RESOLVED
    const updateResolvedPayload = JSON.stringify({ status: 'RESOLVED' });
    const updateResolvedRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/admin/reports/${createdReportId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updateResolvedPayload),
          Authorization: `Bearer ${adminToken}`
        }
      },
      updateResolvedPayload
    );
    assert(
      updateResolvedRes.status === 200 && updateResolvedRes.body.report.status === 'RESOLVED',
      '14. Admin updates report status to RESOLVED'
    );

    // 15. Invalid status update rejected
    const invalidStatusPayload = JSON.stringify({ status: 'COMPLETED_INVALID' });
    const invalidStatusRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/admin/reports/${createdReportId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(invalidStatusPayload),
          Authorization: `Bearer ${adminToken}`
        }
      },
      invalidStatusPayload
    );
    assert(invalidStatusRes.status === 400, '15. Invalid status transition rejected with 400 Bad Request');

    // 16. Citizen verifies status is now RESOLVED
    const citizenCheckRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/reports/${createdReportId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    assert(
      citizenCheckRes.status === 200 && citizenCheckRes.body.report.status === 'RESOLVED',
      '16. Citizen verifies persisted RESOLVED status'
    );

    console.log(`\n========================================`);
    console.log(`Verification Summary: ${testsPassed}/${testsTotal} passed`);
    console.log(`========================================\n`);

    if (testsPassed === testsTotal) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Verification execution error:', err);
    process.exit(1);
  }
}

runBackendVerification();
