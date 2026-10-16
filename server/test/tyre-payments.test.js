const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyState } = require('../data/repository');
const { createService, today } = require('../domain');

test('tyre amount paid can be updated without exceeding the replacement cost', async () => {
  const state = emptyState();
  const repo = {
    read: async () => state,
    change: async (fn) => fn(state),
  };
  const service = createService(repo);
  const details = {
    vehicleNumber: 'MH 12 AB 1234',
    date: today(),
    tyreBrand: 'MRF',
    quantity: 4,
    costPerTyre: 25000,
    odometerAtChange: 50000,
  };

  const tyre = await service.add('tyreLogs', { ...details, amountPaid: 50000 });
  assert.equal(tyre.totalCost, 100000);
  assert.equal(tyre.amountPaid, 50000);

  const paid = await service.update('tyreLogs', tyre.id, { ...tyre, amountPaid: 100000 });
  assert.equal(paid.id, tyre.id);
  assert.equal(paid.amountPaid, 100000);
  await assert.rejects(
    service.update('tyreLogs', tyre.id, { ...paid, amountPaid: 100001 }),
    /cannot exceed the total tyre cost/i,
  );
  await assert.rejects(
    service.update('tyreLogs', tyre.id, { ...paid, costPerTyre: 20000 }),
    /cannot exceed the total tyre cost/i,
  );
  await assert.rejects(
    service.update('tyreLogs', tyre.id, { ...paid, amountPaid: null }),
    /cannot be cleared once set/i,
  );
  assert.equal((await service.list('tyreLogs'))[0].amountPaid, 100000);

  const older = await service.add('tyreLogs', details);
  assert.equal(older.amountPaid, null);
  const updatedOlder = await service.update('tyreLogs', older.id, {
    ...details,
    notes: 'Warranty recorded later',
  });
  assert.equal(updatedOlder.amountPaid, null);
});
