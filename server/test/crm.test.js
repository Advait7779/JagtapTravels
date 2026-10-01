const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { PGlite } = require('@electric-sql/pglite');
const { Repository, normalize } = require('../data/repository');
const { createService, today } = require('../domain');
const { createApp } = require('../app');
const { migrate, importEmpty } = require('../scripts/database');
const { hashPassword } = require('../auth');
async function local(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jagtap-test-'));
  t.after(async () => {
    const resolved = path.resolve(dir);
    assert.ok(
      resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith('jagtap-test-'),
    );
    await fs.rm(resolved, { recursive: true, force: true });
  });
  const repo = new Repository({ mode: 'json', file: path.join(dir, 'db.json') });
  await repo.initialize();
  return { repo, service: createService(repo), dir };
}
async function pg(t) {
  const db = new PGlite();
  let tail = Promise.resolve();
  const pool = {
    query: (...args) => db.query(...args),
    connect: async () => {
      let release;
      const before = tail;
      tail = new Promise((resolve) => {
        release = resolve;
      });
      await before;
      return { query: (...args) => db.query(...args), release };
    },
    end: () => db.close(),
  };
  t.after(() => pool.end());
  await migrate(pool);
  const repo = new Repository({ mode: 'postgres', pool });
  await repo.initialize();
  return { repo, service: createService(repo), pool };
}
const customer = { name: 'Test Customer', phone: '9876543210', email: 'test@example.invalid' };
const driver = {
  name: 'Test Driver',
  phone: '9876543211',
  licenseNumber: 'TEST-123',
  status: 'Available',
};
const daysFromToday = (days) => {
  const value = new Date(`${today()}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const bill = {
  customerName: 'Walk-in',
  customerId: '',
  driverId: '',
  tripSource: 'Pune',
  tripDestination: 'Mumbai',
  startDate: '2026-09-12',
  endDate: '2026-09-13',
  baseFare: 1000,
  driverAllowance: 0,
  tollParking: 0,
  taxPercent: 5,
  discount: 0,
  advancePaid: 0,
};
const quote = {
  customerName: 'Walk-in',
  customerId: '',
  tourTitle: 'Tour',
  pickupLocation: 'Pune',
  dropLocation: 'Mumbai',
  vehicleType: 'Car',
  baseAmount: 1000,
  travelDate: '',
  validityDate: '',
};
const slip = {
  vehicleName: 'Car',
  driverName: 'Test Driver',
  customerName: 'Test Customer',
  tripSource: 'Pune',
  tripDestination: 'Mumbai',
  startDate: '2026-09-12',
  endDate: '2026-09-13',
  openingKm: 1000,
  closingKm: 1100,
  ratePerKm: 20,
  driverAllowance: 0,
  tollParking: 0,
  status: 'Completed',
};
for (const [mode, setup] of [
  ['JSON', local],
  ['PostgreSQL engine', pg],
]) {
  test(mode + ': customer/driver creation and status-only update preserve fields', async (t) => {
    const { service } = await setup(t);
    const c = await service.add('customers', customer),
      d = await service.add('drivers', driver);
    assert.equal(c.name, customer.name);
    const updated = await service.status('drivers', d.id, 'On Trip');
    assert.equal(updated.licenseNumber, 'TEST-123');
    await assert.rejects(
      service.update('customers', c.id, { name: { invalid: true }, phone: 123 }),
      /text/,
    );
  });
  test(mode + ': optional IDs/dates and zero tax survive', async (t) => {
    const { service } = await setup(t);
    const b = await service.add('bills', { ...bill, taxPercent: 0 });
    const q = await service.add('quotations', quote);
    assert.equal(b.customerId, null);
    assert.equal(b.driverId, null);
    assert.equal(b.taxPercent, 0);
    assert.equal(b.taxAmount, 0);
    assert.equal(q.travelDate, null);
    assert.equal(q.validityDate, null);
    assert.equal(b.startDate, '2026-09-12');
    assert.equal(b.invoiceDate, today());
  });
  test(mode + ': counters survive deletion and serialize concurrent writes', async (t) => {
    const { service } = await setup(t);
    const first = await service.add('quotations', quote);
    await service.remove('quotations', first.id);
    const rows = await Promise.all(
      Array.from({ length: 8 }, () => service.add('quotations', quote)),
    );
    assert.equal(new Set(rows.map((r) => r.quotationNumber)).size, 8);
    assert.ok(rows.every((r) => r.quotationNumber !== first.quotationNumber));
    const bs = await Promise.all([service.add('bills', bill), service.add('bills', bill)]);
    assert.notEqual(bs[0].billNumber, bs[1].billNumber);
  });
  test(mode + ': linked billing snapshots meters and prevents repeat billing', async (t) => {
    const { service } = await setup(t);
    const c = await service.add('customers', customer);
    const s = await service.add('meterReadings', { ...slip, customerId: c.id });
    const b = await service.add('bills', {
      ...bill,
      linkedSlipId: s.id,
      baseFare: 99999,
      driverAllowance: 999,
    });
    assert.equal(b.totalKm, 100);
    assert.equal(b.startKm, 1000);
    assert.equal(b.endKm, 1100);
    assert.equal(b.ratePerKm, 20);
    assert.equal(b.kmAmount, 2000);
    assert.equal(b.driverAllowance, 0);
    assert.equal(b.customerPhone, c.phone);
    await assert.rejects(service.add('bills', { ...bill, linkedSlipId: s.id }), /unbilled/);
    await assert.rejects(service.update('meterReadings', s.id, slip), /Billed slips/);
    await service.remove('bills', b.id);
    assert.equal((await service.list('meterReadings'))[0].status, 'Completed');
    const rebill = await service.add('bills', { ...bill, linkedSlipId: s.id });
    assert.notEqual(rebill.billNumber, b.billNumber);
  });
  test(mode + ': authoritative totals, payment settlement, retry and history', async (t) => {
    const { service } = await setup(t);
    const b = await service.add('bills', {
      ...bill,
      totalAmount: 1,
      balanceDue: -20,
      paymentStatus: 'Paid',
      discount: 50,
      advancePaid: 100,
    });
    assert.equal(b.totalAmount, 1000);
    assert.equal(b.balanceDue, 900);
    assert.equal(b.paymentStatus, 'Partial');
    const payload = { amount: 900, requestId: 'test-receipt', mode: 'UPI', date: '2026-09-13' };
    const paid = await service.pay(b.id, payload);
    assert.equal(paid.balanceDue, 0);
    assert.equal(paid.paymentStatus, 'Paid');
    const retry = await service.pay(b.id, payload);
    assert.equal(retry.payments.length, 1);
    assert.equal(retry.totalPaid, 1000);
    await assert.rejects(
      service.pay(b.id, { ...payload, requestId: 'another', amount: 1 }),
      /balance/,
    );
    await assert.rejects(service.remove('bills', b.id), /payments/);
  });
  test(mode + ': invalid financial, date and odometer submissions are rejected', async (t) => {
    const { service } = await setup(t);
    for (const invalid of [
      { baseFare: -1 },
      { advancePaid: 99999 },
      { discount: 99999 },
      { startDate: '2026-02-30' },
      { endDate: '2026-09-01' },
    ])
      await assert.rejects(service.add('bills', { ...bill, ...invalid }));
    await assert.rejects(
      service.add('meterReadings', { ...slip, closingKm: 900, totalKm: 530 }),
      /closing KM/,
    );
    const s = await service.add('meterReadings', slip);
    await assert.rejects(
      service.update('meterReadings', s.id, { ...slip, closingKm: 900, totalKm: 530 }),
    );
    assert.equal((await service.list('meterReadings'))[0].totalKm, 100);
    await assert.rejects(service.status('quotations', 'bad', 'anything'), /not found/);
  });
  test(mode + ': trip counts are derived without double-counting linked invoices', async (t) => {
    const { service } = await setup(t);
    const c = await service.add('customers', customer);
    const s = await service.add('meterReadings', { ...slip, customerId: c.id });
    await service.add('bills', { ...bill, linkedSlipId: s.id });
    await service.add('bills', { ...bill, customerId: c.id });
    assert.equal((await service.list('customers'))[0].totalTrips, 2);
    await assert.rejects(service.remove('customers', c.id), /history/);
  });
}
test('API requires a verified session, CSRF and revokes logout', async (t) => {
  const { repo } = await local(t),
    app = createApp(repo, { setupToken: 'test-bootstrap-code', secure: false }),
    agent = request.agent(app);
  await request(app).get('/api/customers').expect(401);
  await request(app).post('/api/customers').send(customer).expect(401);
  await request(app)
    .post('/api/auth/login')
    .send({ email: 'anything@example.invalid', password: 'admin123' })
    .expect(401);
  await request(app)
    .post('/api/auth/setup')
    .send({
      setupToken: 'wrong',
      email: customer.email,
      password: 'test-password-long',
      fullName: 'Operator',
    })
    .expect(403);
  await agent
    .post('/api/auth/setup')
    .send({
      setupToken: 'test-bootstrap-code',
      email: customer.email,
      password: 'Strong-Test-Secret-2026',
      fullName: 'Operator',
    })
    .expect(201);
  const login = await agent
    .post('/api/auth/login')
    .send({ email: customer.email, password: 'Strong-Test-Secret-2026', rememberMe: true })
    .expect(200);
  assert.ok(login.headers['set-cookie'][0].includes('HttpOnly'));
  assert.ok(login.headers['set-cookie'][0].includes('SameSite=Strict'));
  const csrf = login.body.csrfToken;
  await agent.post('/api/customers').send(customer).expect(403);
  await agent.post('/api/customers').set('X-CSRF-Token', csrf).send(customer).expect(201);
  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.fullName, 'Operator');
  assert.equal(me.body.user.passwordHash, undefined);
  const onDisk = JSON.parse(await fs.readFile(repo.file, 'utf8'));
  assert.equal(onDisk.users[0].password, undefined);
  assert.notEqual(onDisk.users[0].passwordHash, 'Strong-Test-Secret-2026');
  const oldCookie = login.headers['set-cookie'][0].split(';')[0];
  await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf).expect(200);
  await request(app).get('/api/customers').set('Cookie', oldCookie).expect(401);
});
test('Login throttles repeated incorrect passwords', async (t) => {
  const { repo } = await local(t),
    app = createApp(repo);
  for (let i = 0; i < 15; i++)
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'none@example.invalid', password: 'invalid' })
      .expect(401);
  await request(app)
    .post('/api/auth/login')
    .send({ email: 'none@example.invalid', password: 'invalid' })
    .expect(429);
});
test('Corrupted JSON is preserved; failed writes do not commit; restart persists data', async (t) => {
  const { repo, service } = await local(t);
  await service.add('customers', customer);
  const reopened = new Repository({ mode: 'json', file: repo.file });
  await reopened.initialize();
  assert.equal((await reopened.read()).customers.length, 1);
  await assert.rejects(
    repo.change((d) => {
      d.customers = [];
      throw Error('Simulated failure');
    }),
  );
  assert.equal((await repo.read()).customers.length, 1);
  await fs.writeFile(repo.file, '{corrupt');
  await assert.rejects(repo.read());
  await assert.rejects(repo.change(() => {}));
  assert.equal(await fs.readFile(repo.file, 'utf8'), '{corrupt');
  await request(createApp(repo)).get('/api/health').expect(503);
});
test('Unavailable PostgreSQL never falls back or writes local data', async (t) => {
  const { dir } = await local(t);
  const file = path.join(dir, 'must-not-exist.json');
  const repo = new Repository({
    mode: 'postgres',
    file,
    pool: {
      query: async () => {
        throw Error('offline');
      },
    },
  });
  await assert.rejects(repo.initialize(), /offline/);
  await assert.rejects(fs.access(file));
  await request(createApp(repo)).get('/api/health').expect(503);
});
test('Migration is repeatable; JSON import preserves records, counters and password hashes', async (t) => {
  const localEnv = await local(t);
  const c = await localEnv.service.add('customers', customer);
  await localEnv.service.add('bills', { ...bill, customerId: c.id });
  await localEnv.repo.change(async (d) => {
    d.users.push({
      id: 'user',
      email: customer.email,
      passwordHash: await hashPassword('Secret-Long-2026'),
      role: 'Administrator',
    });
  });
  const { repo, pool } = await pg(t);
  const source = await localEnv.repo.read();
  await importEmpty(repo, source);
  await migrate(pool);
  const restored = await repo.read();
  assert.equal(restored.customers[0].id, c.id);
  assert.equal(restored.bills.length, 1);
  assert.deepEqual(restored.counters, source.counters);
  assert.equal(restored.users.length, 1);
  assert.equal(restored.sessions.length, 0);
  await assert.rejects(importEmpty(repo, source), /not empty/);
});
test('Legacy keys normalize, demo credentials are disabled, and zero values remain zero', () => {
  const d = normalize({
    customers: [{ id: 1, gst_number: 'TEST' }],
    users: [{ id: 1, password: 'admin123' }],
    bills: [
      {
        id: 1,
        total_amount: 0,
        advance_paid: 0,
        tax_percent: 0,
        created_at: '2026-09-12T10:00:00Z',
      },
    ],
  });
  assert.equal(d.users.length, 0);
  assert.equal(d.customers[0].gstNumber, 'TEST');
  assert.equal(d.bills[0].taxPercent, 0);
  assert.equal(d.bills[0].invoiceDate, '2026-09-12');
});

test('Backup and restore CLI preserves records and refuses overwrites', async (t) => {
  const { repo, service, dir } = await local(t);
  await service.add('customers', customer);
  await service.add('bills', bill);
  const source = await repo.read();
  const { execFile } = require('node:child_process');
  const run = require('node:util').promisify(execFile);
  const script = path.resolve(__dirname, '../scripts/database.js');
  const backup = path.join(dir, 'backup.json');
  const target = path.join(dir, 'restored.json');
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    STORAGE_MODE: 'json',
    DATA_FILE: repo.file,
    BACKUP_FILE: backup,
  };
  await run(process.execPath, [script, 'backup'], { env });
  await assert.rejects(run(process.execPath, [script, 'backup'], { env }), /EEXIST/);
  env.DATA_FILE = target;
  env.RESTORE_FILE = backup;
  await run(process.execPath, [script, 'restore'], { env });
  const restored = new Repository({ mode: 'json', file: target });
  assert.deepEqual((await restored.read()).customers, source.customers);
  assert.deepEqual((await restored.read()).bills, source.bills);
  await assert.rejects(run(process.execPath, [script, 'restore'], { env }), /not empty/);
  assert.deepEqual((await repo.read()).customers, source.customers);
});

test('8 New Features: bookings, inquiries, rateCard, compliance expiries, overdue and expenses', async (t) => {
  const { repo, service, dir } = await local(t);
  const app = createApp(repo, { uploadsDir: path.join(dir, 'uploads') });

  // 1. Inquiries public submission
  const inqRes = await request(app)
    .post('/api/public/inquiries')
    .send({
      name: 'Pooja Patil',
      phone: '9822012345',
      email: 'pooja@test.com',
      tripType: 'Mahabaleshwar Weekend',
      vehicle: 'Innova Crysta',
      travelDate: daysFromToday(20),
      message: 'Need 6 seater for family trip',
    })
    .expect(201);
  assert.equal(inqRes.body.success, true);
  assert.match(inqRes.body.inquiry.inquiryNumber, /^INQ-\d{4}-\d{3}$/);
  assert.equal(inqRes.body.inquiry.status, 'New');

  // 2. Bookings creation and numbering
  const c = await service.add('customers', customer);
  const drv = await service.add('drivers', {
    ...driver,
    licenseExpiryDate: daysFromToday(15),
    badgeExpiryDate: daysFromToday(90),
  });
  const v = await service.add('vehicles', {
    name: 'Toyota Innova Crysta',
    vehicleNumber: 'MH 12 AB 1234',
    currentOdometer: 10000,
    lastServiceKm: 5000,
    serviceIntervalKm: 30000,
    insuranceExpiryDate: daysFromToday(10),
    pucExpiryDate: daysFromToday(60),
    fitnessExpiryDate: daysFromToday(90),
    permitExpiryDate: daysFromToday(120),
    taxExpiryDate: daysFromToday(150),
  });

  const bk = await service.add('bookings', {
    customerName: c.name,
    customerPhone: c.phone,
    customerId: c.id,
    vehicleType: 'Innova Crysta',
    pickupLocation: 'Pune Station',
    dropLocation: 'Mahabaleshwar',
    startDate: daysFromToday(20),
    endDate: daysFromToday(22),
    pickupTime: '06:30 AM',
    driverId: drv.id,
    vehicleId: v.id,
    passengerCount: 5,
    estimatedAmount: 9500,
    advanceAmount: 2000,
    status: 'Confirmed',
  });
  assert.match(bk.bookingNumber, /^BK-\d{4}-\d{3}$/);
  assert.equal(bk.driverName, drv.name);
  assert.equal(bk.vehicleNumber, 'MH 12 AB 1234');

  // 3. Status change on booking
  const updatedBk = await service.status('bookings', bk.id, 'Dispatched');
  assert.equal(updatedBk.status, 'Dispatched');

  // 4. Vehicle document expiry calculation
  const vehiclesList = await service.list('vehicles');
  const foundV = vehiclesList.find((cand) => cand.id === v.id);
  assert.ok(foundV.docAlerts.length > 0);
  assert.equal(foundV.docStatus, 'Expiring Soon');

  // 5. Driver license status calculation
  const driversList = await service.list('drivers');
  const foundDrv = driversList.find((cand) => cand.id === drv.id);
  assert.equal(foundDrv.licenseStatus, 'Expiring Soon');

  // 6. Bill with expenses and overdue calculation
  const b = await service.add('bills', {
    ...bill,
    customerId: c.id,
    dueDate: '2026-09-10', // in past -> overdue
    fuelExpense: 200,
    tollExpense: 100,
    driverBattaExpense: 150,
    otherExpense: 50,
  });
  assert.equal(b.totalExpense, 500);
  assert.equal(b.netProfit, b.totalAmount - 500);

  const billsList = await service.list('bills');
  const foundB = billsList.find((cand) => cand.id === b.id);
  assert.equal(foundB.isOverdue, true);
  assert.ok(foundB.daysOverdue > 0);

  // 7. Rate card settings
  await repo.change((d) => {
    d.settings = { ...d.settings, ratePerKmSedan: '13', defaultDueDays: '20' };
    return d.settings;
  });
  const currentSettings = (await repo.read()).settings;
  assert.equal(currentSettings.ratePerKmSedan, '13');
  assert.equal(currentSettings.defaultDueDays, '20');
});

test('Fleet Operations: Corporate Contracts, Fuel, Tyres, and Driver Payroll', async (t) => {
  const { repo, service } = await local(t);

  // 1. Corporate Customer & Contract
  const comp = await service.add('customers', {
    name: 'Infosys Pune Development Center',
    phone: '9822998877',
    email: 'travel@infosys.com',
    city: 'Pune',
    address: 'Hinjawadi Phase 2, Pune',
    gstNumber: '27AABCI1234F1Z5',
  });

  const drv = await service.add('drivers', {
    name: 'Santosh Shinde',
    phone: '9823112233',
    licenseNumber: 'MH12-20150001234',
    baseSalary: 20000,
  });

  const veh = await service.add('vehicles', {
    name: 'Toyota Innova Crysta',
    vehicleNumber: 'MH 12 CR 5566',
    currentOdometer: 50000,
    rcExpiryDate: '2026-10-01',
    pucExpiryDate: '2026-09-28',
  });

  // Verify RC expiry and PUC in docAlerts
  const vehList = await service.list('vehicles');
  const foundVeh = vehList.find((cand) => cand.id === veh.id);
  const rcAlert = foundVeh.docAlerts.find((a) => a.key === 'rcExpiryDate');
  assert.ok(rcAlert, 'RC alert must be detected');
  assert.equal(rcAlert.label, 'RC (Registration)');

  // 2. Corporate Monthly Contract: 2000 KM package @ 40,000 / mo, ₹14/extra km
  const contract = await service.add('corporateContracts', {
    companyId: comp.id,
    companyName: comp.name,
    vehicleId: veh.id,
    vehicleName: veh.name,
    vehicleNumber: veh.vehicleNumber,
    driverId: drv.id,
    driverName: drv.name,
    startDate: '2026-09-01',
    monthlyBaseFare: 40000,
    includedMonthlyKm: 2000,
    extraRatePerKm: 14,
    status: 'Active',
  });
  assert.match(contract.contractNumber, /^CORP-\d{4}-\d{3}$/);

  // Log Daily KM for this vehicle: 1200 KM on Sept 5, 1150 KM on Sept 12 -> Total 2350 KM
  await service.addDailyKm(veh.id, {
    date: '2026-09-05',
    dailyKm: 1200,
    driverName: drv.name,
    notes: 'Company staff shift commute',
  });
  await service.addDailyKm(veh.id, {
    date: '2026-09-12',
    dailyKm: 1150,
    driverName: drv.name,
    notes: 'Company airport transfers and site visits',
  });

  // Check Monthly Summary calculation
  const summary = await service.calculateCorporateMonthlyKm(contract.id, '2026-09');
  assert.equal(summary.totalKmRun, 2350);
  assert.equal(summary.includedKm, 2000);
  assert.equal(summary.excessKm, 350);
  assert.equal(summary.extraRatePerKm, 14);
  assert.equal(summary.excessCharge, 350 * 14); // 4,900
  assert.equal(summary.monthlyBaseFare, 40000);
  assert.equal(summary.grandTotal, 44900); // 40,000 + 4,900

  // 3. Fuel Logs (Diesel, Petrol, CNG)
  const fuel1 = await service.add('fuelLogs', {
    vehicleId: veh.id,
    vehicleNumber: veh.vehicleNumber,
    driverId: drv.id,
    driverName: drv.name,
    date: '2026-09-10',
    fuelType: 'Diesel',
    quantity: 50,
    ratePerUnit: 90,
    totalCost: 1,
    odometerReading: 51200,
    petrolPumpName: 'Indian Oil Wakad',
  });
  assert.match(fuel1.fuelNumber, /^FUEL-\d{4}-\d{3}$/);
  assert.equal(fuel1.totalCost, 4500);

  const fuel2 = await service.add('fuelLogs', {
    vehicleId: veh.id,
    vehicleNumber: veh.vehicleNumber,
    date: '2026-09-15',
    fuelType: 'CNG',
    quantity: 15,
    ratePerUnit: 85,
    totalCost: 1275,
    odometerReading: 52350,
  });
  assert.equal(fuel2.totalCost, 1275);

  // 4. Tyre Replacement Log
  const tyre = await service.add('tyreLogs', {
    vehicleId: veh.id,
    vehicleNumber: veh.vehicleNumber,
    date: '2026-09-08',
    tyreBrand: 'Apollo Apterra AT2',
    tyreSize: '205/65 R16',
    tyrePosition: 'All 4 Tyres',
    quantity: 4,
    costPerTyre: 6000,
    totalCost: 1,
    odometerAtChange: 50000,
    oldTyreKmRun: 50000,
    vendorName: 'Bombay Tyres Chinchwad',
  });
  assert.match(tyre.tyreNumber, /^TYRE-\d{4}-\d{3}$/);
  assert.equal(tyre.totalCost, 24000);
  const updatedTyre = await service.update('tyreLogs', tyre.id, {
    ...tyre,
    costPerTyre: 6500,
    totalCost: 1,
  });
  assert.equal(updatedTyre.totalCost, 26000);
  const tyreVehicle = (await repo.read()).vehicles.find((candidate) => candidate.id === veh.id);
  assert.equal(tyreVehicle.tyreHistory.length, 1);
  assert.equal(tyreVehicle.tyreHistory[0].totalCost, 26000);

  // 5. Driver Payroll & Advance Deductions: Base 20k - Advance 10k = Remaining 10k
  const adv1 = await service.add('driverAdvances', {
    driverId: drv.id,
    driverName: drv.name,
    date: '2026-09-07',
    month: '2026-09',
    amount: 6000,
    paymentMode: 'Cash',
    notes: 'Festival advance',
  });
  assert.match(adv1.advanceNumber, /^ADV-\d{4}-\d{3}$/);

  await service.add('driverAdvances', {
    driverId: drv.id,
    driverName: drv.name,
    date: '2026-09-14',
    month: '2026-09',
    amount: 4000,
    paymentMode: 'UPI',
    notes: 'Family medical advance',
  });

  const payroll = await service.getDriverPayroll('2026-09');
  const drvPayroll = payroll.find((p) => p.driverId === drv.id);
  assert.ok(drvPayroll);
  assert.equal(drvPayroll.baseSalary, 20000);
  assert.equal(drvPayroll.totalAdvances, 10000); // 6k + 4k
  assert.equal(drvPayroll.remainingSalary, 10000); // 20k - 10k
  assert.equal(drvPayroll.status, 'Partial Advance');

  await assert.rejects(
    () =>
      service.add('driverAdvances', {
        driverId: drv.id,
        driverName: drv.name,
        date: '2026-09-18',
        month: '2026-09',
        amount: 10001,
      }),
    /cannot exceed the driver base salary/i,
  );

  const generated = await service.generateCorporateBill(contract.id, '2026-09');
  assert.equal(generated.bill.corporateContractId, contract.id);
  assert.equal(generated.bill.billingMonth, '2026-09');
  assert.equal(generated.bill.startDate, '2026-09-01');
  assert.equal(generated.bill.endDate, '2026-09-30');
  assert.equal(generated.bill.baseFare, 40000);
  assert.equal(generated.bill.otherCharges, 4900);
  await assert.rejects(
    () => service.generateCorporateBill(contract.id, '2026-09'),
    /already exists/i,
  );
  await assert.rejects(
    () => service.calculateCorporateMonthlyKm(contract.id, '2026-13'),
    /YYYY-MM/i,
  );

  await service.remove('tyreLogs', tyre.id);
  const afterTyreDelete = (await repo.read()).vehicles.find((candidate) => candidate.id === veh.id);
  assert.equal(afterTyreDelete.tyreHistory.length, 0);
});

test('Corporate Trip Logs: daily employee count, start/close KM, trip hours, and odometer update', async (t) => {
  const { repo, service } = await local(t);
  const cust = await service.add('customers', { name: 'Henkel Technologies', phone: '9876543299' });
  const drv = await service.add('drivers', { name: 'Nikhil N. Kamble', phone: '9876543298', licenseNumber: 'MH-12-DL' });
  const veh = await service.add('vehicles', { name: 'Innova Crysta', vehicleNumber: 'MH 12 TP 7220', currentOdometer: 105000 });
  const contract = await service.add('corporateContracts', {
    companyId: cust.id,
    companyName: cust.name,
    vehicleId: veh.id,
    vehicleName: veh.name,
    vehicleNumber: veh.vehicleNumber,
    driverId: drv.id,
    driverName: drv.name,
    startDate: '2026-09-01',
    monthlyBaseFare: 50000,
    includedMonthlyKm: 2500,
    extraRatePerKm: 16,
  });
  const secondContract = await service.add('corporateContracts', {
    companyId: cust.id,
    companyName: cust.name,
    vehicleId: veh.id,
    vehicleName: veh.name,
    vehicleNumber: veh.vehicleNumber,
    driverId: drv.id,
    driverName: drv.name,
    startDate: '2026-09-01',
    monthlyBaseFare: 40000,
    includedMonthlyKm: 2000,
    extraRatePerKm: 14,
  });

  // 1. Create a trip log
  const tripLog = await service.add('corporateTripLogs', {
    contractId: contract.id,
    companyId: cust.id,
    vehicleId: veh.id,
    driverId: drv.id,
    date: '2026-09-02',
    placeFrom: 'Parking',
    placeTo: 'Henkel',
    startKm: 105000,
    closeKm: 105038,
    startTime: '06:30 AM',
    closeTime: '08:00 AM',
    totalHours: 99,
    employeeCount: 5,
    employeeNames: 'Rahul, Priya, Amit, Sneha, Rajesh',
    tollParking: 120,
    signatureName: 'Henkel Shift Lead',
    remarks: 'Morning shift pickup',
  });

  assert.match(tripLog.tripLogNumber, /^LOG-\d{4}-\d{3}$/);
  assert.equal(tripLog.totalKm, 38);
  assert.equal(tripLog.totalHours, 1.5);
  assert.equal(tripLog.employeeCount, 5);
  assert.equal(tripLog.tollParking, 120);
  assert.equal(tripLog.companyName, 'Henkel Technologies');
  assert.equal(tripLog.vehicleNumber, 'MH 12 TP 7220');

  // 2. Vehicle current odometer was updated
  const updatedVeh = (await repo.read()).vehicles.find((v) => v.id === veh.id);
  assert.equal(updatedVeh.currentOdometer, 105038);

  // 3. Validation: closeKm < startKm is rejected
  await assert.rejects(
    () =>
      service.add('corporateTripLogs', {
        contractId: contract.id,
        placeFrom: 'Henkel',
        placeTo: 'Saswad',
        startKm: 105038,
        closeKm: 105010,
      }),
    /cannot be less than Start KM/i,
  );

  // 4. Validation: placeFrom and placeTo are required
  await assert.rejects(
    () =>
      service.add('corporateTripLogs', {
        contractId: contract.id,
        placeFrom: '',
        placeTo: 'Henkel',
        startKm: 105038,
        closeKm: 105039,
      }),
    /placeFrom is required/i,
  );

  await assert.rejects(
    () =>
      service.add('corporateTripLogs', {
        contractId: contract.id,
        date: '2099-01-01',
        placeFrom: 'Parking',
        placeTo: 'Henkel',
        startKm: 105038,
        closeKm: 105039,
      }),
    /future date/i,
  );
  await assert.rejects(
    () =>
      service.add('corporateTripLogs', {
        contractId: contract.id,
        date: '2026-09-02',
        placeFrom: 'Parking',
        placeTo: 'Henkel',
        startKm: 105038,
        closeKm: 105039,
        startTime: '99:99',
        closeTime: '88:88',
      }),
    /valid time/i,
  );
  await assert.rejects(
    () =>
      service.add('corporateTripLogs', {
        contractId: contract.id,
        date: '2026-09-02',
        placeFrom: 'Parking',
        placeTo: 'Henkel',
        startKm: 105038,
        closeKm: 105039,
        employeeCount: 1.5,
      }),
    /whole number/i,
  );
  await assert.rejects(
    () =>
      service.add('corporateTripLogs', {
        date: '2026-09-02',
        placeFrom: 'Parking',
        placeTo: 'Henkel',
        startKm: 105038,
        closeKm: 105039,
      }),
    /contract is required/i,
  );

  // 5. Add return leg
  const returnLeg = await service.add('corporateTripLogs', {
    contractId: contract.id,
    date: '2026-09-02',
    placeFrom: 'Henkel',
    placeTo: 'Saswad',
    startKm: 105038,
    closeKm: 105080,
    startTime: '17:00',
    closeTime: '18:30',
    employeeCount: 4,
    employeeNames: 'Rahul, Priya, Amit, Sneha',
    tollParking: 80,
  });
  assert.equal(returnLeg.totalKm, 42);
  assert.equal(returnLeg.totalHours, 1.5);

  // 6. Corporate monthly summary includes trip logs
  const summary = await service.calculateCorporateMonthlyKm(contract.id, '2026-09');
  assert.equal(summary.totalKmRun, 80); // 38 + 42
  assert.equal(summary.totalToll, 200); // 120 + 80
  assert.equal(summary.totalHours, 3); // 1.5 + 1.5
  assert.equal(summary.totalEmployeesTransported, 9); // 5 + 4
  assert.equal(summary.tripLogs.length, 2);
  const secondSummary = await service.calculateCorporateMonthlyKm(secondContract.id, '2026-09');
  assert.equal(secondSummary.totalKmRun, 0);
  assert.equal(secondSummary.tripLogs.length, 0);

  // 7. Contract deletion is blocked because trip logs exist
  await assert.rejects(
    () => service.remove('corporateContracts', contract.id),
    /trip logs or active invoices/i,
  );

  // 8. Update trip log
  const updatedLog = await service.update('corporateTripLogs', tripLog.id, {
    ...tripLog,
    employeeCount: 6,
    employeeNames: 'Rahul, Priya, Amit, Sneha, Rajesh, Vikram',
  });
  assert.equal(updatedLog.employeeCount, 6);

  // 9. Remove trip logs and then delete contract
  await service.remove('corporateTripLogs', tripLog.id);
  await service.remove('corporateTripLogs', returnLeg.id);
  const remainingLogs = await service.list('corporateTripLogs');
  assert.equal(remainingLogs.length, 0);
  const vehicleAfterDelete = (await repo.read()).vehicles.find((v) => v.id === veh.id);
  assert.equal(vehicleAfterDelete.currentOdometer, 105000);

  const contractDeleted = await service.remove('corporateContracts', contract.id);
  assert.equal(contractDeleted.success, true);
});
