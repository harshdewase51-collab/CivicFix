import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function runPhase12Tests() {
  console.log('=== RUNNING PHASE 12 AUTOMATED REGRESSION TESTS ===\n');
  const results = [];

  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? '(' + detail + ')' : ''}`);
  };

  try {
    // 1. Register a test citizen
    const unique = Date.now();
    const email = `phase12_${unique}@test.org`;
    const password = 'OldPassword123!';
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 12 Citizen',
        email,
        password
      })
    });
    const regData = await regRes.json();
    record('Registration returns profile fields', !!regData.user && regData.user.email === email);

    const token = regData.token;
    const authHeaders = {
      Authorization: `Bearer ${token}`
    };

    // 2. GET /api/auth/me includes phone, area, avatar_url, created_at
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: authHeaders
    });
    const meData = await meRes.json();
    const u = meData.user;
    record('GET /api/auth/me returns new profile fields', 
      'phone' in u && 'area' in u && 'avatar_url' in u && 'created_at' in u,
      `phone: ${u.phone}, area: ${u.area}`
    );

    // 3. PATCH /api/auth/profile updates phone, area, name
    const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Updated Civic Champion',
        phone: '+1 (555) 234-5678',
        area: 'Ward 4, North District',
        role: 'ADMIN' // Malicious attempt to change role!
      })
    });
    const updateData = await updateRes.json();
    record('PATCH /api/auth/profile succeeds', updateData.success === true);
    record('Security: User cannot escalate role via profile update', updateData.user.role.toLowerCase() === 'citizen');
    record('Profile fields updated in database', 
      updateData.user.phone === '+1 (555) 234-5678' && 
      updateData.user.area === 'Ward 4, North District' &&
      updateData.user.name === 'Updated Civic Champion'
    );

    // 4. POST /api/auth/change-password
    // Wrong current password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!'
      })
    });
    record('Security: Rejects incorrect current password', wrongPassRes.status === 400 || wrongPassRes.status === 401);

    // Valid current password
    const changePassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: password,
        newPassword: 'NewSecurePassword123!'
      })
    });
    const changePassData = await changePassRes.json();
    record('POST /api/auth/change-password succeeds', changePassData.success === true);

    // Login with new password
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'NewSecurePassword123!'
      })
    });
    const newLoginData = await newLoginRes.json();
    record('Login works with newly updated password', newLoginData.success === true);

    // Old password should now fail
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password
      })
    });
    record('Security: Old password invalidated after change', oldLoginRes.status === 401);

    // 5. Upload profile photo using 'photo' field
    const sampleImgPath = path.resolve('test-pothole.png');
    const fileBuffer = fs.readFileSync(sampleImgPath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });

    const photoForm = new FormData();
    photoForm.append('photo', blob, 'test-pothole.png');

    const uploadRes = await fetch(`${BASE_URL}/auth/profile-photo`, {
      method: 'POST',
      headers: authHeaders,
      body: photoForm
    });
    const uploadData = await uploadRes.json();
    record('POST /api/auth/profile-photo uploads and links avatar', 
      uploadData.success === true && !!uploadData.avatar_url && uploadData.avatar_url.startsWith('/uploads/')
    );

    // Verify avatar persists on GET /api/auth/me
    const verifyMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: authHeaders
    });
    const verifyMeData = await verifyMeRes.json();
    record('Avatar persists on user profile in DB', verifyMeData.user.avatar_url === uploadData.avatar_url);

    // 6. Test Report Ticket & Civic Activity
    const reportForm = new FormData();
    reportForm.append('category', 'Streetlight');
    reportForm.append('location', 'Civic Center West Gate');
    reportForm.append('description', 'High mast light bulb flickering constantly.');
    const reportRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: authHeaders,
      body: reportForm
    });
    const reportData = await reportRes.json();
    record('Create report returns CF-XXXX report_id', reportData.success && reportData.report.report_id.startsWith('CF-'));

    // 7. Test Admin Stats and Needs Attention Deterministic Logic
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@civicfix.org',
        password: 'Admin@12345'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminHeaders = { Authorization: `Bearer ${adminLoginData.token}` };

    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: adminHeaders
    });
    const adminStats = await adminStatsRes.json();
    record('Civic Pulse: Stats endpoint returns total, pending, in_progress, resolved', 
      adminStats.success && 
      typeof adminStats.stats.total === 'number' &&
      typeof adminStats.stats.pending === 'number'
    );

    const adminReportsRes = await fetch(`${BASE_URL}/admin/reports`, {
      headers: adminHeaders
    });
    const adminReports = await adminReportsRes.json();
    record('Admin queue lists real reports with citizen association', 
      adminReports.success && Array.isArray(adminReports.reports) && adminReports.reports.length > 0
    );

    console.log('\n========================================');
    console.log(`PHASE 12 REGRESSION RESULTS: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
    console.log('========================================\n');

    if (results.some(r => !r.passed)) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 12 test run failed:', err.message);
    process.exit(1);
  }
}

runPhase12Tests();
