const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { PGlite } = require('@electric-sql/pglite');
const { Repository } = require('../data/repository');
const { createApp } = require('../app');
const { createCorporateQuotationService } = require('../corporate-quotations');
const { migrate } = require('../scripts/database');
const { today } = require('../domain');

const dateAfter = (days) => {
  const date = new Date(`${today()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

async function environment(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jagtap-corporate-quote-'));
  t.after(async () => fs.rm(dir, { recursive: true, force: true }));
  const repo = new Repository({ mode: 'json', file: path.join(dir, 'db.json') });
  await repo.initialize();
  const app = createApp(repo, { secure: false, setupToken: 'corporate-quote-test-setup-token-long-enough' });
  const agent = request.agent(app);
  const setup = await agent.post('/api/auth/setup').send({
    setupToken: 'corporate-quote-test-setup-token-long-enough',
    email: 'owner@example.invalid',
    password: 'Very-Strong-Admin-Password-2026',
    fullName: 'Owner',
  }).expect(201);
  return { repo, app, agent, csrf: setup.body.csrfToken };
}

const quotation = () => ({
  companyName: 'Example Industries',
  companyAddress: 'Pune',
  contactPhone: '9876543210',
  contactEmail: 'travel@example.invalid',
  proposedStartDate: dateAfter(15),
  validityDate: dateAfter(10),
  taxMode: 'gst',
  gstRate: 18,
  lineItems: [
    { vehicleType: 'Innova Crysta', monthlyBaseFare: 45000, includedMonthlyKm: 2500, extraRatePerKm: 14, estimatedExtraKm: 100 },
    { vehicleType: 'Sedan', monthlyBaseFare: 30000, includedMonthlyKm: 2000, extraRatePerKm: 12, estimatedExtraKm: 0 },
  ],
  estimatedOtherCharges: 500,
  paymentTerms: 'Pay within 15 days.',
});

test('corporate quotations are admin-only, server-priced, versioned and convert once without invoicing', async (t) => {
  const { repo, app, agent, csrf } = await environment(t);
  const createStaff = await agent.post('/api/users').set('X-CSRF-Token', csrf).send({
    fullName: 'Staff', email: 'staff@example.invalid', password: 'S3cret',
  }).expect(201);
  assert.equal(createStaff.body.role, 'Staff');
  const staff = request.agent(app);
  const staffLogin = await staff.post('/api/auth/login').send({
    email: 'staff@example.invalid', password: 'S3cret',
  }).expect(200);
  await staff.get('/api/corporate-quotations').expect(403);
  await staff.post('/api/corporate-quotations')
    .set('X-CSRF-Token', staffLogin.body.csrfToken).send(quotation()).expect(403);

  const vehicle1 = await agent.post('/api/vehicles').set('X-CSRF-Token', csrf)
    .send({ name: 'Innova', vehicleNumber: 'MH 12 AB 1234' }).expect(201);
  const vehicle2 = await agent.post('/api/vehicles').set('X-CSRF-Token', csrf)
    .send({ name: 'Sedan', vehicleNumber: 'MH 12 CD 5678' }).expect(201);
  const created = await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), estimatedTotal: 1, status: 'Accepted' }).expect(201);
  const quote = created.body;
  assert.match(quote.quotationNumber, /^CQ-\d{4}-001$/);
  assert.equal(quote.status, 'Draft');
  assert.equal(quote.fixedMonthlyTotal, 75000);
  assert.equal(quote.estimatedExcessTotal, 1400);
  assert.equal(quote.estimatedSubtotal, 76900);
  assert.equal(quote.estimatedTax, 13842);
  assert.equal(quote.estimatedTotal, 90742);
  assert.equal((await agent.get('/api/corporate-quotations').expect(200)).body.length, 1);
  await agent.post(`/api/corporate-quotations/${quote.id}/convert`)
    .set('X-CSRF-Token', csrf).send({ assignments: [] }).expect(400);
  await agent.patch(`/api/corporate-quotations/${quote.id}/status`).set('X-CSRF-Token', csrf)
    .send({ status: 'Sent' }).expect(200);
  const revised = await agent.put(`/api/corporate-quotations/${quote.id}`)
    .set('X-CSRF-Token', csrf)
    .send({ ...quotation(), revision: 1, lineItems: quotation().lineItems.map((line, index) => ({ ...line, id: quote.lineItems[index].id })) })
    .expect(200);
  assert.equal(revised.body.revision, 2);
  assert.equal(revised.body.revisions.length, 1);
  assert.equal(revised.body.revisions[0].status, 'Sent');
  assert.equal(revised.body.status, 'Draft');
  await agent.delete(`/api/corporate-quotations/${quote.id}`)
    .set('X-CSRF-Token', csrf).expect(409);
  await agent.put(`/api/corporate-quotations/${quote.id}`)
    .set('X-CSRF-Token', csrf).send({ ...quotation(), revision: 1 }).expect(409);
  await agent.patch(`/api/corporate-quotations/${quote.id}/status`).set('X-CSRF-Token', csrf)
    .send({ status: 'Sent' }).expect(200);
  await agent.patch(`/api/corporate-quotations/${quote.id}/status`).set('X-CSRF-Token', csrf)
    .send({ status: 'Accepted' }).expect(200);
  const assignments = [
    { lineId: quote.lineItems[0].id, vehicleId: vehicle1.body.id },
    { lineId: quote.lineItems[1].id, vehicleId: vehicle2.body.id },
  ];
  await agent.post(`/api/corporate-quotations/${quote.id}/convert`).set('X-CSRF-Token', csrf)
    .send({ assignments: [{ ...assignments[0] }, { ...assignments[1], vehicleId: vehicle1.body.id }] })
    .expect(400);
  const converted = await agent.post(`/api/corporate-quotations/${quote.id}/convert`)
    .set('X-CSRF-Token', csrf).send({ assignments }).expect(200);
  assert.equal(converted.body.contracts.length, 2);
  assert.equal(converted.body.contracts[0].monthlyBaseFare, 45000);
  assert.equal(converted.body.contracts[0].includedMonthlyKm, 2500);
  assert.equal(converted.body.contracts[0].extraRatePerKm, 14);
  assert.equal(converted.body.contracts[0].corporateQuotationId, quote.id);
  assert.equal(converted.body.contracts[0].quotationGstRate, 18);
  assert.equal((await repo.read()).customers.length, 1);
  assert.equal((await repo.read()).bills.length, 0);
  assert.equal((await repo.read()).corporateInvoices.length, 0);
  await agent.post(`/api/corporate-quotations/${quote.id}/convert`)
    .set('X-CSRF-Token', csrf).send({ assignments }).expect(409);
  await agent.delete(`/api/corporate-contracts/${converted.body.contracts[0].id}`)
    .set('X-CSRF-Token', csrf).expect(409);
  await agent.delete(`/api/corporate-quotations/${quote.id}`)
    .set('X-CSRF-Token', csrf).expect(409);
  const overlapping = await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), lineItems: [quotation().lineItems[0]] }).expect(201);
  await agent.patch(`/api/corporate-quotations/${overlapping.body.id}/status`)
    .set('X-CSRF-Token', csrf).send({ status: 'Sent' }).expect(200);
  await agent.patch(`/api/corporate-quotations/${overlapping.body.id}/status`)
    .set('X-CSRF-Token', csrf).send({ status: 'Accepted' }).expect(200);
  await agent.post(`/api/corporate-quotations/${overlapping.body.id}/convert`)
    .set('X-CSRF-Token', csrf)
    .send({ assignments: [{ lineId: overlapping.body.lineItems[0].id, vehicleId: vehicle1.body.id }] })
    .expect(409);
  assert.equal((await repo.read()).corporateContracts.length, 2);
});

test('corporate quotation records persist through repeat PostgreSQL migration', async (t) => {
  const db = new PGlite();
  let tail = Promise.resolve();
  const pool = {
    query: (...args) => db.query(...args),
    connect: async () => {
      let release;
      const before = tail;
      tail = new Promise((resolve) => { release = resolve; });
      await before;
      return { query: (...args) => db.query(...args), release };
    },
    end: () => db.close(),
  };
  t.after(() => pool.end());
  await migrate(pool);
  const repo = new Repository({ mode: 'postgres', pool });
  const service = createCorporateQuotationService(repo);
  const created = await service.create(quotation());
  await migrate(pool);
  const records = await service.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].quotationNumber, created.quotationNumber);
  assert.equal(records[0].estimatedTotal, 90742);
});

test('non-GST quotes calculate zero tax, reject malformed prices and protect draft deletion', async (t) => {
  const { agent, csrf } = await environment(t);
  await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), taxMode: 'gst', gstRate: 7 }).expect(400);
  await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), lineItems: [{ ...quotation().lineItems[0], monthlyBaseFare: -10 }] })
    .expect(400);
  await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), validityDate: dateAfter(-1) }).expect(400);
  await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), contactEmail: 'invalid-email' }).expect(400);
  const created = await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), taxMode: 'nongst', gstRate: 18 }).expect(201);
  assert.equal(created.body.gstRate, 0);
  assert.equal(created.body.estimatedTax, 0);
  await agent.delete(`/api/corporate-quotations/${created.body.id}`)
    .set('X-CSRF-Token', csrf).expect(200);
  assert.deepEqual((await agent.get('/api/corporate-quotations').expect(200)).body, []);
});

test('non-GST quotation converts directly and carries zero tax into a generated contract bill', async (t) => {
  const { agent, csrf } = await environment(t);
  const vehicle = await agent.post('/api/vehicles').set('X-CSRF-Token', csrf)
    .send({ name: 'Innova', vehicleNumber: 'MH 12 ZZ 1234' }).expect(201);
  const created = await agent.post('/api/corporate-quotations').set('X-CSRF-Token', csrf)
    .send({ ...quotation(), taxMode: 'nongst', lineItems: [quotation().lineItems[0]] }).expect(201);
  const conversion = await agent.post(`/api/corporate-quotations/${created.body.id}/convert`)
    .set('X-CSRF-Token', csrf)
    .send({ assignments: [{ lineId: created.body.lineItems[0].id, vehicleId: vehicle.body.id }] })
    .expect(200);
  const contract = conversion.body.contracts[0];
  assert.equal(conversion.body.quote.status, 'Converted');
  assert.equal(contract.quotationTaxMode, 'nongst');
  const bill = await agent.post(`/api/corporate-contracts/${contract.id}/generate-bill`)
    .set('X-CSRF-Token', csrf)
    .send({ month: created.body.proposedStartDate.slice(0, 7) }).expect(201);
  assert.equal(bill.body.bill.taxPercent, 0);
  assert.equal(bill.body.bill.taxAmount, 0);
});
