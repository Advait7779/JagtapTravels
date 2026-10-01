const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { Repository } = require('../data/repository');
const { createApp } = require('../app');
const { bootstrapAdminFromEnv, verifyPassword } = require('../auth');
const { validateProductionConfig } = require('../security');
const { verifyAuditChain } = require('../audit');

const SETUP = 'test-security-setup-token-long-enough';
const EMAIL = 'security@example.invalid';
const PASSWORD = 'Strong-Security-Password-2026';

async function environment(t, options = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jagtap-security-'));
  t.after(async () => {
    const resolved = path.resolve(dir);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  const repo = new Repository({ mode: 'json', file: path.join(dir, 'db.json') });
  await repo.initialize();
  const app = createApp(repo, {
    secure: false,
    setupToken: SETUP,
    uploadsDir: path.join(dir, 'uploads'),
    ...options,
  });
  return { repo, app };
}

async function setupAdmin(app, agent = request.agent(app)) {
  const response = await agent
    .post('/api/auth/setup')
    .send({ setupToken: SETUP, email: EMAIL, password: PASSWORD, fullName: 'Security Admin' })
    .expect(201);
  return { agent, csrf: response.body.csrfToken, user: response.body.user };
}

test('plaintext credentials are never accepted', async () => {
  assert.equal(await verifyPassword('admin123', 'admin123'), false);
  assert.equal(await verifyPassword('anything', ''), false);
});

test('environment bootstrap creates the first administrator once without overwriting it', async (t) => {
  const { app, repo } = await environment(t);
  const first = await bootstrapAdminFromEnv(repo, {
    ADMIN_EMAIL: 'owner@example.com',
    ADMIN_PASSWORD: 'Initial-Admin-Password-2026',
    ADMIN_FULL_NAME: 'Company Owner',
  });
  assert.equal(first.created, true);
  let state = await repo.read();
  assert.equal(state.users.length, 1);
  assert.equal(state.users[0].email, 'owner@example.com');
  assert.equal(state.users[0].fullName, 'Company Owner');
  assert.equal(await verifyPassword('Initial-Admin-Password-2026', state.users[0].passwordHash), true);

  const second = await bootstrapAdminFromEnv(repo, {
    ADMIN_EMAIL: 'replacement@example.com',
    ADMIN_PASSWORD: 'Replacement-Password-2026',
    ADMIN_FULL_NAME: 'Replacement User',
  });
  assert.equal(second.created, false);
  state = await repo.read();
  assert.equal(state.users.length, 1);
  assert.equal(state.users[0].email, 'owner@example.com');
  await request(app)
    .post('/api/auth/login')
    .send({ email: 'owner@example.com', password: 'Initial-Admin-Password-2026' })
    .expect(200);
});

test('MFA endpoints are removed and password login completes directly', async (t) => {
  const { app } = await environment(t);
  const { agent, csrf } = await setupAdmin(app);
  await agent.post('/api/auth/mfa/setup').set('X-CSRF-Token', csrf).expect(404);
  await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf).expect(200);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .expect(200);
  assert.ok(login.body.csrfToken);
  assert.equal(login.body.mfaRequired, undefined);
});

test('sessions expire after inactivity and can be individually or globally revoked', async (t) => {
  const { app } = await environment(t, { idleMs: 500 });
  const first = await setupAdmin(app);
  const secondAgent = request.agent(app);
  const secondLogin = await secondAgent
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .expect(200);
  const sessions = await first.agent.get('/api/auth/sessions').expect(200);
  assert.equal(sessions.body.length, 2);
  const other = sessions.body.find((session) => !session.current);
  await first.agent
    .delete('/api/auth/sessions/' + other.id)
    .set('X-CSRF-Token', first.csrf)
    .expect(200);
  await secondAgent.get('/api/auth/me').expect(401);
  await new Promise((resolve) => setTimeout(resolve, 550));
  await first.agent.get('/api/auth/me').expect(401);

  const signedIn = request.agent(app);
  const login = await signedIn
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .expect(200);
  await signedIn
    .post('/api/auth/logout-all')
    .set('X-CSRF-Token', login.body.csrfToken)
    .expect(200);
  await signedIn.get('/api/auth/me').expect(401);
  assert.ok(secondLogin.body.csrfToken);
});

test('password change requires the old password and revokes every session', async (t) => {
  const { app } = await environment(t);
  const first = await setupAdmin(app);
  const second = request.agent(app);
  await second.post('/api/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(200);
  await first.agent
    .post('/api/auth/change-password')
    .set('X-CSRF-Token', first.csrf)
    .send({ currentPassword: 'wrong-password', newPassword: 'New-Security-Password-2026' })
    .expect(401);
  await first.agent
    .post('/api/auth/change-password')
    .set('X-CSRF-Token', first.csrf)
    .send({ currentPassword: PASSWORD, newPassword: 'New-Security-Password-2026' })
    .expect(200);
  await second.get('/api/auth/me').expect(401);
  await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(401);
  await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: 'New-Security-Password-2026' })
    .expect(200);
});

test('audit trail records successes and failures without request secrets and verifies its chain', async (t) => {
  const { app, repo } = await environment(t);
  await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: 'Do-Not-Store-This-Password' })
    .expect(401);
  const { agent, csrf } = await setupAdmin(app);
  await agent
    .put('/api/settings')
    .set('X-CSRF-Token', csrf)
    .send({ companyName: 'Audited Company', accountNumber: 'Sensitive-Account-Value' })
    .expect(200);
  const logs = (await repo.read()).auditLogs;
  assert.ok(logs.some((entry) => entry.outcome === 'failure' && entry.statusCode === 401));
  assert.ok(logs.some((entry) => entry.outcome === 'success' && entry.path === '/api/settings'));
  assert.equal(verifyAuditChain(logs), true);
  const serialized = JSON.stringify(logs);
  assert.equal(serialized.includes('Do-Not-Store-This-Password'), false);
  assert.equal(serialized.includes('Sensitive-Account-Value'), false);
  assert.equal(serialized.includes(csrf), false);
  const visible = await agent.get('/api/security/audit-logs').expect(200);
  assert.ok(visible.body.length >= 3);
});

test('production configuration rejects missing or weak secrets', () => {
  const base = {
    NODE_ENV: 'production', STORAGE_MODE: 'postgres', TRUST_PROXY: '1',
    DATABASE_URL: 'postgresql://crm:ThisIsAStrongDatabasePassword2026@postgres:5432/crm',
    SETUP_TOKEN: 'a'.repeat(32),
  };
  assert.doesNotThrow(() => validateProductionConfig(base, { hasUsers: false }));
  assert.doesNotThrow(() =>
    validateProductionConfig({ ...base, SESSION_IDLE_MINUTES: '10080' }, { hasUsers: false }),
  );
  assert.throws(
    () =>
      validateProductionConfig({ ...base, SESSION_IDLE_MINUTES: '10081' }, { hasUsers: false }),
    /SESSION_IDLE_MINUTES/,
  );
  assert.doesNotThrow(() =>
    validateProductionConfig(
      {
        ...base,
        SETUP_TOKEN: '',
        ADMIN_EMAIL: 'owner@example.com',
        ADMIN_PASSWORD: 'Initial-Admin-Password-2026',
      },
      { hasUsers: false },
    ),
  );
  assert.throws(() => validateProductionConfig({ ...base, DATABASE_URL: 'postgresql://crm:password@postgres/crm' }), /database password/);
  assert.throws(
    () => validateProductionConfig({ ...base, SETUP_TOKEN: '' }, { hasUsers: false }),
    /ADMIN_EMAIL.*SETUP_TOKEN/,
  );
  assert.throws(
    () =>
      validateProductionConfig(
        { ...base, SETUP_TOKEN: '', ADMIN_EMAIL: 'owner@example.com' },
        { hasUsers: false },
      ),
    /ADMIN_PASSWORD/,
  );
  assert.throws(
    () =>
      validateProductionConfig(
        {
          ...base,
          SETUP_TOKEN: '',
          ADMIN_EMAIL: 'owner@example.com',
          ADMIN_PASSWORD: 'password123',
        },
        { hasUsers: false },
      ),
    /strong password/,
  );
});
