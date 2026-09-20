import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function runAvatarTests() {
  console.log('=== CIVICFIX AVATAR SYSTEM AUTOMATED VERIFICATION ===\n');
  const results = [];

  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? '(' + detail + ')' : ''}`);
  };

  try {
    // 1. Citizen Registration
    const unique = Date.now();
    const email = `avatar_tester_${unique}@civicfix.org`;
    const password = 'TesterPassword123!';
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Parth Gautam',
        email,
        password
      })
    });
    const regData = await regRes.json();
    record('User registration succeeds', regData.success === true && !!regData.token);
    const token = regData.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Default Avatar state on fresh user
    const meRes1 = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData1 = await meRes1.json();
    const u1 = meData1.user;
    record('Default avatar state in DB', 
      u1.avatar_type === 'preset' && u1.avatar_preset === 'avatar_01' && u1.avatar_url === null,
      `type: ${u1.avatar_type}, preset: ${u1.avatar_preset}, url: ${u1.avatar_url}`
    );

    // 3. Update Avatar Preset to avatar_04
    const patchRes1 = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_preset: 'avatar_04',
        avatar_type: 'preset'
      })
    });
    const patchData1 = await patchRes1.json();
    record('PATCH /api/auth/profile updates avatar_preset', 
      patchData1.success && patchData1.user.avatar_preset === 'avatar_04' && patchData1.user.avatar_type === 'preset'
    );

    // Verify persistence on GET /api/auth/me
    const meRes2 = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData2 = await meRes2.json();
    record('Preset persistence verified on GET /api/auth/me', 
      meData2.user.avatar_preset === 'avatar_04' && meData2.user.avatar_type === 'preset'
    );

    // 4. Update Avatar Preset to avatar_09
    const patchRes2 = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_preset: 'avatar_09',
        avatar_type: 'preset'
      })
    });
    const patchData2 = await patchRes2.json();
    record('Switching preset to avatar_09 persists', 
      patchData2.success && patchData2.user.avatar_preset === 'avatar_09'
    );

    // 5. Upload Custom Profile Photo (JPG/PNG)
    const sampleImgPath = path.resolve('test-pothole.png');
    const fileBuffer = fs.readFileSync(sampleImgPath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });

    const photoForm = new FormData();
    photoForm.append('photo', blob, 'avatar.png');

    const uploadRes = await fetch(`${BASE_URL}/auth/profile-photo`, {
      method: 'POST',
      headers: authHeaders,
      body: photoForm
    });
    const uploadData = await uploadRes.json();
    record('Custom photo upload succeeds', 
      uploadData.success === true && !!uploadData.avatar_url && uploadData.avatar_url.startsWith('/uploads/')
    );

    // Verify priority: avatar_type is custom, avatar_url exists, avatar_preset preserved
    const meRes3 = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData3 = await meRes3.json();
    const u3 = meData3.user;
    record('Avatar Priority: Custom photo active with preset preserved', 
      u3.avatar_type === 'custom' && u3.avatar_url === uploadData.avatar_url && u3.avatar_preset === 'avatar_09',
      `type: ${u3.avatar_type}, url: ${u3.avatar_url}, preset: ${u3.avatar_preset}`
    );

    // 6. Remove Custom Photo
    const removeRes = await fetch(`${BASE_URL}/auth/profile-photo`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const removeData = await removeRes.json();
    record('DELETE /api/auth/profile-photo succeeds', removeData.success === true);

    // Verify fallback: avatar_url is null, avatar_type is preset, preset remains avatar_09
    const meRes4 = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData4 = await meRes4.json();
    const u4 = meData4.user;
    record('Fallback: Custom photo cleared, selected preset returns', 
      u4.avatar_type === 'preset' && u4.avatar_url === null && u4.avatar_preset === 'avatar_09',
      `type: ${u4.avatar_type}, url: ${u4.avatar_url}, preset: ${u4.avatar_preset}`
    );

    // 7. Test Alternate REST Endpoints (POST/DELETE /api/auth/profile/avatar)
    const photoForm2 = new FormData();
    photoForm2.append('photo', blob, 'avatar2.png');
    const uploadRes2 = await fetch(`${BASE_URL}/auth/profile/avatar`, {
      method: 'POST',
      headers: authHeaders,
      body: photoForm2
    });
    const uploadData2 = await uploadRes2.json();
    record('POST /api/auth/profile/avatar route alias works', 
      uploadData2.success === true && !!uploadData2.avatar_url
    );

    const removeRes2 = await fetch(`${BASE_URL}/auth/profile/avatar`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const removeData2 = await removeRes2.json();
    record('DELETE /api/auth/profile/avatar route alias works', 
      removeData2.success === true && removeData2.user.avatar_type === 'preset'
    );

    // 8. Security Checks
    // A. Unauthenticated request rejected
    const unauthRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_preset: 'avatar_02' })
    });
    record('Security: Unauthenticated profile update rejected', unauthRes.status === 401);

    // B. Role escalation attempt blocked
    const tamperRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN', user_id: 1 })
    });
    const tamperData = await tamperRes.json();
    record('Security: Role and user_id cannot be tampered', 
      tamperData.success && tamperData.user.role.toLowerCase() === 'citizen' && tamperData.user.id === u1.id
    );

    // 9. Admin Profile Avatar Support
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

    const adminPatchRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_preset: 'avatar_08', avatar_type: 'preset' })
    });
    const adminPatchData = await adminPatchRes.json();
    record('Admin avatar preset update succeeds', 
      adminPatchData.success && adminPatchData.user.avatar_preset === 'avatar_08' && adminPatchData.user.role.toLowerCase() === 'admin'
    );

    console.log('\n========================================');
    console.log(`AVATAR SYSTEM TEST RESULTS: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
    console.log('========================================\n');

    if (results.some(r => !r.passed)) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Avatar test run failed:', err);
    process.exit(1);
  }
}

runAvatarTests();
