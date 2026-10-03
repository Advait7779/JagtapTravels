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

test('staff passwords accept six characters while administrator setup still requires twelve', async (t) => {
  const { app } = await environment(t);
  await request(app).post('/api/auth/setup').send({
    setupToken: SETUP, email: EMAIL, password: 'S3cret', fullName: 'Security Admin',
  }).expect(400);

  const admin = await setupAdmin(app);
  await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Short Password', email: 'short@example.invalid', password: 'S3cre',
  }).expect(400);
  const created = await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Operations User', email: 'operations@example.invalid', password: 'S3cret',
  }).expect(201);
  assert.equal(created.body.role, 'Staff');
  await request(app).post('/api/auth/login').send({
    email: 'operations@example.invalid', password: 'S3cret',
  }).expect(200);
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

test('password-change endpoint is unavailable', async (t) => {
  const { app } = await environment(t);
  const { agent, csrf } = await setupAdmin(app);
  await agent
    .post('/api/auth/change-password')
    .set('X-CSRF-Token', csrf)
    .send({ currentPassword: PASSWORD, newPassword: 'New-Security-Password-2026' })
    .expect(404);
  await agent.get('/api/auth/me').expect(200);
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

test('staff accounts can edit operations but cannot read company billing, settings or security', async (t) => {
  const { app, repo } = await environment(t);
  const admin = await setupAdmin(app);
  await admin.agent.put('/api/settings').set('X-CSRF-Token', admin.csrf).send({
    companyName: 'Private Travel Company', accountNumber: 'private-account-123',
    bankName: 'Private Bank', phone: '9876543210',
  }).expect(200);
  const created = await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Operations User', email: 'operations@example.invalid',
    password: 'Staff-Strong-Password-2026', role: 'Administrator',
  }).expect(201);
  assert.equal(created.body.role, 'Staff');
  assert.equal(created.body.passwordHash, undefined);
  await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Duplicate', email: 'operations@example.invalid',
    password: 'Another-Strong-Password-2026',
  }).expect(409);
  const staffAgent = request.agent(app);
  const login = await staffAgent.post('/api/auth/login').send({
    email: 'operations@example.invalid', password: 'Staff-Strong-Password-2026',
  }).expect(200);
  const csrf = login.body.csrfToken;
  const forbiddenGet = [
    '/api/bills', '/api/corporate-contracts', '/api/corporate-invoices',
    '/api/corporate-trip-logs', '/api/driver-advances', '/api/payroll',
    '/api/security/audit-logs', '/api/users',
  ];
  for (const route of forbiddenGet) await staffAgent.get(route).expect(403);
  await staffAgent.put('/api/settings').set('X-CSRF-Token', csrf)
    .send({ companyName: 'Changed by staff' }).expect(403);
  await staffAgent.post('/api/bills').set('X-CSRF-Token', csrf).send({}).expect(403);
  await staffAgent.post('/api/users').set('X-CSRF-Token', csrf).send({}).expect(403);
  await staffAgent.get('/api/uploads/00000000-0000-0000-0000-000000000000.pdf').expect(403);
  const settings = await staffAgent.get('/api/settings').expect(200);
  assert.equal(settings.body.companyName, 'Private Travel Company');
  assert.equal(settings.body.phone, '9876543210');
  assert.equal(settings.body.accountNumber, undefined);
  assert.equal(settings.body.bankName, undefined);
  const customer = await staffAgent.post('/api/customers').set('X-CSRF-Token', csrf)
    .send({ name: 'Daily Customer', phone: '9876543211' }).expect(201);
  assert.ok(customer.body.id);
  const quotation = await staffAgent.post('/api/quotations').set('X-CSRF-Token', csrf).send({
    customerName: 'Daily Customer', tourTitle: 'Pune Trip', pickupLocation: 'Pune',
    dropLocation: 'Mumbai', vehicleType: 'Innova', baseAmount: 5000,
  }).expect(201);
  assert.equal(quotation.body.company.accountNumber, undefined);
  assert.equal((await staffAgent.get('/api/quotations').expect(200)).body[0].company.bankName, undefined);
  await repo.change((data) => {
    data.drivers.push({
      id: 'staff-driver-1', name: 'Driver One', phone: '9876543212',
      licenseNumber: 'LIC-123', baseSalary: 42000,
      documents: [{ id: 'secret-document', fileUrl: '/api/uploads/private.pdf' }],
    });
  });
  const driver = (await staffAgent.get('/api/drivers').expect(200)).body[0];
  assert.equal(driver.baseSalary, undefined);
  assert.equal(driver.documents, undefined);
  await staffAgent.put('/api/drivers/staff-driver-1').set('X-CSRF-Token', csrf).send({
    name: 'Driver Updated', phone: '9876543212', licenseNumber: 'LIC-123',
    baseSalary: 999999, licenseDocumentUrl: '/api/uploads/forged.pdf',
  }).expect(200);
  const persisted = (await repo.read()).drivers.find((item) => item.id === 'staff-driver-1');
  assert.equal(persisted.baseSalary, 42000);
  assert.equal(persisted.licenseDocumentUrl, '');
  assert.equal(persisted.documents.length, 1);

  await admin.agent.put('/api/users/' + created.body.id).set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Operations User', email: 'operations@example.invalid', active: false,
  }).expect(200);
  await staffAgent.get('/api/quotations').expect(401);
  await request(app).post('/api/auth/login').send({
    email: 'operations@example.invalid', password: 'Staff-Strong-Password-2026',
  }).expect(401);
  await admin.agent.delete('/api/users/' + admin.user.id)
    .set('X-CSRF-Token', admin.csrf).expect(403);
  await admin.agent.put('/api/users/' + created.body.id).set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Operations User', email: 'operations@example.invalid', active: true,
    password: 'Replacement-Staff-Password-2026',
  }).expect(400);
  await admin.agent.put('/api/users/' + created.body.id).set('X-CSRF-Token', admin.csrf).send({
    fullName: 'Operations User', email: 'operations@example.invalid', active: true,
  }).expect(200);
  await request(app).post('/api/auth/login').send({
    email: 'operations@example.invalid', password: 'Replacement-Staff-Password-2026',
  }).expect(401);
  const relogin = await request.agent(app).post('/api/auth/login').send({
    email: 'operations@example.invalid', password: 'Staff-Strong-Password-2026',
  }).expect(200);
  assert.ok(relogin.body.csrfToken);
  await admin.agent.delete('/api/users/' + created.body.id)
    .set('X-CSRF-Token', admin.csrf).expect(200);
  await request(app).post('/api/auth/login').send({
    email: 'operations@example.invalid', password: 'Staff-Strong-Password-2026',
  }).expect(401);
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

test('corporate invoices are validated, recalculated, uniquely stored and safely deleted', async (t) => {
  const { app, repo } = await environment(t);
  const { agent, csrf } = await setupAdmin(app);
  await repo.change((data) => {
    data.corporateContracts.push(
      { id: 'contract-a', companyName: 'Alpha Industries', status: 'Active' },
      { id: 'contract-b', companyName: 'Beta Industries', status: 'Active' },
    );
  });
  const payload = (overrides = {}) => ({
    month: '2026-10',
    isNonGst: false,
    invoiceType: 'gst',
    invoiceNo: 'CORP-2026-001',
    invoiceDate: '2026-10-01',
    period: 'OCTOBER',
    partyName: 'Alpha Industries',
    partyAddress: 'Pune',
    partyGstin: '27ABCDE1234F1Z5',
    company: { companyName: 'Jagtap Travels', accountNumber: '1234', ifsc: 'TEST0001' },
    lineItems: [
      {
        particulars: 'MH 12 AB 1234 - Monthly package',
        packageKm: 3000,
        packageAmount: 1000,
        extraKm: 10,
        extraKmRate: 10,
        extraAmount: 100,
        amount: 1,
      },
    ],
    tollItems: [{ vehicle: 'INNOVA', type: 'TOLL', amount: 100 }],
    gstRate: 9,
    lineTotal: 1,
    tollTotal: 1,
    taxableValue: 1,
    cgst: 1,
    sgst: 1,
    grandTotal: 1,
    totalAmount: 1,
    showStamp: true,
    showSignature: false,
    ...overrides,
  });

  const created = await agent
    .post('/api/corporate-contracts/contract-a/saved-invoice')
    .set('X-CSRF-Token', csrf)
    .send(payload())
    .expect(201);
  assert.match(created.body.id, /^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  assert.equal(created.body.lineItems[0].amount, 1100);
  assert.equal(created.body.lineTotal, 1100);
  assert.equal(created.body.tollTotal, 100);
  assert.equal(created.body.taxableValue, 1200);
  assert.equal(created.body.cgst, 108);
  assert.equal(created.body.sgst, 108);
  assert.equal(created.body.grandTotal, 1416);

  const loaded = await agent
    .get('/api/corporate-contracts/contract-a/saved-invoice?month=2026-10&isNonGst=false')
    .expect(200);
  assert.equal(loaded.body.id, created.body.id);
  assert.equal((await agent.get('/api/corporate-invoices').expect(200)).body.length, 1);
  await agent.delete('/api/corporate-contracts/contract-a').set('X-CSRF-Token', csrf).expect(409);

  await agent
    .post('/api/corporate-contracts/contract-b/saved-invoice')
    .set('X-CSRF-Token', csrf)
    .send(payload({ month: '2026-11', partyName: 'Beta Industries' }))
    .expect(409);
  await agent
    .post('/api/corporate-contracts/contract-a/saved-invoice')
    .set('X-CSRF-Token', csrf)
    .send(payload({ invoiceNo: 'CORP-2026-002' }))
    .expect(409);

  const updated = await agent
    .post('/api/corporate-contracts/contract-a/saved-invoice')
    .set('X-CSRF-Token', csrf)
    .send(payload({ id: created.body.id, partyAddress: 'Updated Pune address' }))
    .expect(200);
  assert.equal(updated.body.id, created.body.id);
  assert.equal(updated.body.partyAddress, 'Updated Pune address');

  await repo.change((data) => {
    data.corporateContracts.push({
      id: created.body.id,
      companyName: 'Contract ID Collision Test',
      status: 'Active',
    });
  });
  const second = await agent
    .post(`/api/corporate-contracts/${created.body.id}/saved-invoice`)
    .set('X-CSRF-Token', csrf)
    .send(
      payload({
        month: '2026-12',
        invoiceNo: 'CORP-2026-003',
        partyName: 'Contract ID Collision Test',
      }),
    )
    .expect(201);

  await agent
    .delete(`/api/corporate-invoices/${created.body.id}`)
    .set('X-CSRF-Token', csrf)
    .expect(200);
  const remaining = (await agent.get('/api/corporate-invoices').expect(200)).body;
  assert.deepEqual(remaining.map((invoice) => invoice.id), [second.body.id]);
  await agent
    .delete('/api/corporate-invoices/missing-invoice')
    .set('X-CSRF-Token', csrf)
    .expect(404);
  await agent
    .post('/api/corporate-contracts/contract-a/saved-invoice')
    .set('X-CSRF-Token', csrf)
    .send(payload({ id: created.body.id, invoiceNo: 'CORP-2026-005' }))
    .expect(404);

  await agent
    .post('/api/corporate-contracts/contract-b/saved-invoice')
    .set('X-CSRF-Token', csrf)
    .send(payload({ invoiceNo: 'CORP-2026-004', lineItems: [{ particulars: 'Invalid', packageAmount: -1 }] }))
    .expect(400);
  await agent
    .get('/api/corporate-contracts/contract-a/saved-invoice?month=October&isNonGst=false')
    .expect(400);
});
