const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { Repository } = require('../data/repository');
const { createService } = require('../domain');
const { migrate } = require('../scripts/database');

async function jsonStore(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jagtap-vehicles-'));
  t.after(async () => {
    const resolved = path.resolve(dir);
    assert.ok(
      resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith('jagtap-vehicles-'),
    );
    await fs.rm(resolved, { recursive: true, force: true });
  });
  const repo = new Repository({ mode: 'json', file: path.join(dir, 'db.json') });
  await repo.initialize();
  return repo;
}

async function postgresStore(t) {
  const database = new PGlite();
  let tail = Promise.resolve();
  const pool = {
    query: (...args) => database.query(...args),
    connect: async () => {
      let release;
      const before = tail;
      tail = new Promise((resolve) => {
        release = resolve;
      });
      await before;
      return { query: (...args) => database.query(...args), release };
    },
    end: () => database.close(),
  };
  t.after(() => pool.end());
  await migrate(pool);
  const repo = new Repository({ mode: 'postgres', pool });
  await repo.initialize();
  return repo;
}

for (const [name, factory] of [
  ['JSON', jsonStore],
  ['PostgreSQL engine', postgresStore],
]) {
  test(name + ': vehicle service cycles and maintenance history stay consistent', async (t) => {
    const repo = await factory(t);
    const service = createService(repo);
    const driver = await service.add('drivers', {
      name: 'Fleet Driver',
      phone: '9876543210',
      licenseNumber: 'MH-TEST-1',
    });
    const vehicle = await service.add('vehicles', {
      name: 'Innova Crysta',
      vehicleNumber: 'MH 12 AB 1234',
      driverId: driver.id,
      driverName: 'Untrusted Name',
      currentOdometer: 1000,
      lastServiceKm: 0,
      serviceIntervalKm: 30000,
    });
    assert.equal(vehicle.driverName, 'Fleet Driver');

    let status = (await service.list('vehicles'))[0];
    assert.equal(status.status, 'Healthy');
    assert.equal(status.kmRemaining, 29000);

    await service.addDailyKm(vehicle.id, { date: '2026-09-15', dailyKm: 28000 });
    status = (await service.list('vehicles'))[0];
    assert.equal(status.status, 'Approaching');
    assert.equal(status.kmRemaining, 1000);

    await service.addDailyKm(vehicle.id, { date: '2026-09-15', dailyKm: 1000 });
    status = (await service.list('vehicles'))[0];
    assert.equal(status.status, 'Service Due');
    assert.equal(status.currentOdometer, 30000);

    await service.recordService(vehicle.id, {
      serviceDate: '2026-09-15',
      serviceOdometer: 30500,
      garageName: 'Test Garage',
      cost: 4500,
      notes: 'Oil and filters',
    });
    status = (await service.list('vehicles'))[0];
    assert.equal(status.status, 'Healthy');
    assert.equal(status.currentOdometer, 30500);
    assert.equal(status.lastServiceKm, 30500);
    assert.equal(status.targetServiceKm, 60500);
    assert.equal(status.serviceHistory.length, 1);

    await assert.rejects(
      service.recordService(vehicle.id, {
        serviceDate: '2026-09-15',
        serviceOdometer: 30000,
      }),
      /lower than the last/,
    );
    await assert.rejects(
      service.recordService(vehicle.id, {
        serviceDate: '2026-09-14',
        serviceOdometer: 30600,
      }),
      /earlier than the latest/,
    );
    await assert.rejects(
      service.addDailyKm(vehicle.id, { date: '9999-01-01', dailyKm: 1 }),
      /future date/,
    );
    await assert.rejects(
      service.update('vehicles', vehicle.id, { ...status, currentOdometer: 100 }),
      /Last service odometer|recorded vehicle history/,
    );
    await assert.rejects(
      service.update('vehicles', vehicle.id, { ...status, lastServiceKm: 0 }),
      /recorded service history/,
    );
    await assert.rejects(
      service.add('vehicles', {
        name: 'Duplicate',
        vehicleNumber: 'MH12AB1234',
      }),
      /already exists/,
    );
    await assert.rejects(service.remove('drivers', driver.id), /trip history/);
    await assert.rejects(service.remove('vehicles', vehicle.id), /maintenance or document history/);
  });
}
