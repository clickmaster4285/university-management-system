/**
 * Phase A permission verification (API-level)
 * Run: node scripts/verifyPhaseA.js
 */
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 5000;
const host = process.env.HOST || '127.0.0.1';
const BASE = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/api`;

const EXPECTED = {
  Finance: {
    email: 'finance@scholaros.test',
    password: 'Finance@123',
    allowModules: ['dashboard', 'finance', 'reports'],
    // /finance is also authorize("Admin") — use challans/reports for module-guard proof
    allowPaths: ['/reports', '/challans', '/payroll'],
    denyPaths: ['/staff', '/workforce/leaves', '/departments', '/platform-roles', '/admissions/applications'],
    adminOnlyPaths: ['/finance'], // expect 403 due to legacy authorize("Admin"), not module
  },
  Faculty: {
    email: 'faculty@scholaros.test',
    password: 'Faculty@123',
    allowModules: ['dashboard', 'academic_ops', 'assessments', 'staff'],
    // /staff is authorize("Admin","Staff") but Faculty JWT role is Teacher
    allowPaths: ['/offerings', '/assignments', '/exams', '/batches'],
    denyPaths: ['/finance', '/challans', '/workforce/leaves', '/platform-roles', '/campuses'],
    adminOnlyPaths: ['/staff'],
  },
  HR: {
    email: 'hr@scholaros.test',
    password: 'HR@123',
    allowModules: ['dashboard', 'staff', 'hr'],
    allowPaths: ['/staff', '/workforce/leaves', '/workforce/attendance'],
    denyPaths: ['/finance', '/challans', '/departments', '/platform-roles', '/admissions/applications'],
    adminOnlyPaths: [],
  },
};

let failures = 0;
const results = [];

function ok(label, pass, detail = '') {
  const status = pass ? 'PASS' : 'FAIL';
  if (!pass) failures += 1;
  results.push({ status, label, detail });
  console.log(`${pass ? '✅' : '❌'} [${status}] ${label}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const { status, data } = await req('POST', '/auth/login', null, { email, password });
  const token = data?.data?.token || data?.token;
  const user = data?.data?.user || data?.user;
  if (status !== 200 || !token || !user) {
    throw new Error(`Login failed for ${email}: HTTP ${status} ${data?.message || JSON.stringify(data)}`);
  }
  return { token, user, raw: data };
}

function moduleMap(user) {
  const ma = user.moduleAccess || {};
  if (ma instanceof Map) return Object.fromEntries(ma);
  return ma;
}

async function verifyRole(roleName, cfg) {
  console.log(`\n=== ${roleName} (${cfg.email}) ===`);
  const { token, user } = await login(cfg.email, cfg.password);
  const access = moduleMap(user);
  const primary = user.primaryRole || '(unknown)';

  ok(`${roleName} login`, Boolean(token), `primaryRole=${primary}`);

  for (const key of cfg.allowModules) {
    ok(`${roleName} has module ${key}`, access[key] === true, `got ${access[key]}`);
  }
  for (const key of Object.keys(access)) {
    if (cfg.allowModules.includes(key)) continue;
    if (access[key] === true) {
      ok(`${roleName} should NOT have ${key}`, false, 'unexpected true');
    }
  }

  for (const path of cfg.allowPaths) {
    const { status } = await req('GET', path, token);
    ok(`${roleName} ALLOW GET ${path}`, status !== 403 && status < 500, `HTTP ${status}`);
  }
  for (const path of cfg.denyPaths) {
    const { status } = await req('GET', path, token);
    ok(`${roleName} DENY GET ${path}`, status === 403, `HTTP ${status}`);
  }
  for (const path of cfg.adminOnlyPaths || []) {
    const { status } = await req('GET', path, token);
    ok(
      `${roleName} NOTE authorize() blocks GET ${path}`,
      status === 403,
      `HTTP ${status} (module ok; legacy JWT authorize tighter)`
    );
  }
}

async function verifyAdminAndApply() {
  console.log('\n=== System Admin ===');
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    ok('Admin env credentials', false, 'ADMIN_EMAIL/PASSWORD missing');
    return;
  }

  const { token, user } = await login(email, password);
  const access = moduleMap(user);
  const primary = user.primaryRole || '(unknown)';

  ok('Admin login', Boolean(token), `primaryRole=${primary}`);
  ok('Admin has settings (bypass/full)', access.settings === true || primary === 'System Admin');

  const rolesRes = await req('GET', '/platform-roles', token);
  ok('Admin GET /platform-roles', rolesRes.status === 200, `HTTP ${rolesRes.status}`);
  const roles = rolesRes.data?.data || rolesRes.data || [];
  const list = Array.isArray(roles) ? roles : [];

  let applied = 0;
  for (const role of list) {
    // Controller findRoleByIdentifier looks up by name, not Mongo _id
    const id = role.name;
    if (!id) continue;
    const { status, data } = await req(
      'POST',
      `/platform-roles/${encodeURIComponent(id)}/apply-to-users`,
      token
    );
    const pass = status === 200 || status === 201;
    ok(`Apply template "${role.name}"`, pass, `HTTP ${status} ${data?.message || ''}`);
    if (pass) applied += 1;
  }
  ok('Applied at least one role template', applied > 0, `applied=${applied}/${list.length}`);

  const again = await login(email, password);
  const againAccess = moduleMap(again.user);
  ok(
    'Admin still has settings after apply',
    againAccess.settings === true || again.user.primaryRole === 'System Admin'
  );

  for (const path of ['/dashboard', '/staff', '/finance', '/platform-roles', '/departments']) {
    const { status } = await req('GET', path, again.token);
    ok(`Admin ALLOW GET ${path}`, status !== 403 && status < 500, `HTTP ${status}`);
  }
}

async function main() {
  console.log(`Phase A verify against ${BASE}`);
  // health: try login endpoint exists
  try {
    await fetch(`${BASE.replace(/\/api$/, '')}/api/auth/login`, { method: 'OPTIONS' });
  } catch {
    // ignore
  }

  for (const [name, cfg] of Object.entries(EXPECTED)) {
    try {
      await verifyRole(name, cfg);
    } catch (e) {
      ok(`${name} suite`, false, e.message);
    }
  }

  try {
    await verifyAdminAndApply();
  } catch (e) {
    ok('Admin suite', false, e.message);
  }

  console.log(`\n======== SUMMARY: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILURE(S)'} ========`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
