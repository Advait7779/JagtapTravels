const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyState, normalize } = require('../data/repository');
const { createService } = require('../domain');

test('tour quotation keeps the package fare as its total and uses the new company name', async () => {
  const state = emptyState();
  state.settings.companyName = 'Jagtap Tours and Travels';
  const repo = {
    read: async () => state,
    change: async (fn) => fn(state),
  };
  const service = createService(repo);
  const quote = await service.add('quotations', {
    customerName: 'Customer',
    tourTitle: 'Pune tour',
    pickupLocation: 'Pune',
    dropLocation: 'Mumbai',
    vehicleType: 'Innova',
    durationDays: 2,
    baseAmount: 100000,
    taxAmount: 5000,
    totalAmount: 105000,
  });
  assert.equal(quote.taxAmount, 0);
  assert.equal(quote.totalAmount, 100000);
  assert.equal(quote.company.companyName, 'Jagtap Travels');

  const legacy = normalize({
    ...state,
    settings: { ...state.settings, companyName: 'Jagtap Tours and Travels' },
    quotations: [{ ...quote, company: { companyName: 'Jagtap Tours and Travels' }, taxAmount: 5000, totalAmount: 105000 }],
  });
  assert.equal(legacy.settings.companyName, 'Jagtap Travels');
  assert.equal(legacy.quotations[0].company.companyName, 'Jagtap Travels');
  assert.equal(legacy.quotations[0].taxAmount, 0);
  assert.equal(legacy.quotations[0].totalAmount, 100000);
});
