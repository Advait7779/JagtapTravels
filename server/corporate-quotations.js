const crypto = require('node:crypto');
const { HttpError, text, number, date, today, validate } = require('./domain');

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const same = (a, b) => a != null && b != null && String(a) === String(b);

function quotationId(value) {
  if (typeof value !== 'string' || !/^[\w-]{1,100}$/.test(value))
    throw new HttpError(400, 'Invalid quotation or line ID.');
  return value;
}

function nextNumber(data, collection, field, prefix) {
  const key = `${prefix}-${today().slice(0, 4)}`;
  let maximum = Number(data.counters[key] || 0);
  for (const row of data[collection]) {
    const value = row[field];
    if (typeof value !== 'string' || !value.startsWith(key + '-')) continue;
    const sequence = Number(value.slice(key.length + 1));
    if (Number.isSafeInteger(sequence)) maximum = Math.max(maximum, sequence);
  }
  data.counters[key] = maximum + 1;
  return `${key}-${String(maximum + 1).padStart(3, '0')}`;
}

function validateCorporateQuotation(input, data, existing = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new HttpError(400, 'Quotation details must be an object.');
  const companyId = input.companyId ? quotationId(String(input.companyId)) : null;
  const customer = companyId
    ? data.customers.find((row) => same(row.id, companyId))
    : null;
  if (companyId && !customer) throw new HttpError(400, 'Selected company no longer exists.');
  const proposedStartDate = date(input.proposedStartDate, 'Proposed start date', true);
  const proposedEndDate = date(input.proposedEndDate, 'Proposed end date');
  const validityDate = date(input.validityDate, 'Validity date', true);
  if (proposedEndDate && proposedEndDate < proposedStartDate)
    throw new HttpError(400, 'Proposed end date cannot precede the start date.');
  if (validityDate < today()) throw new HttpError(400, 'Validity date cannot be in the past.');
  const taxMode = input.taxMode === 'nongst' ? 'nongst' : input.taxMode === 'gst' ? 'gst' : null;
  if (!taxMode) throw new HttpError(400, 'Choose GST or non-GST quotation.');
  const gstRate = taxMode === 'nongst' ? 0 : number(input.gstRate, 'GST rate', 0, 100);
  if (taxMode === 'gst' && ![5, 18].includes(gstRate))
    throw new HttpError(400, 'Choose a 5% or 18% GST rate.');
  if (!Array.isArray(input.lineItems) || input.lineItems.length < 1 || input.lineItems.length > 20)
    throw new HttpError(400, 'Add between 1 and 20 vehicle offers.');
  const seenIds = new Set();
  const lineItems = input.lineItems.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new HttpError(400, `Vehicle offer ${index + 1} is invalid.`);
    const lineId = item.id ? quotationId(String(item.id)) : crypto.randomUUID();
    if (seenIds.has(lineId)) throw new HttpError(400, 'Vehicle offer IDs must be unique.');
    seenIds.add(lineId);
    const monthlyBaseFare = number(item.monthlyBaseFare, 'Monthly fare', 0);
    const includedMonthlyKm = number(item.includedMonthlyKm, 'Included monthly KM', 0, 10000000);
    const extraRatePerKm = number(item.extraRatePerKm, 'Excess KM rate', 0, 1000000);
    const estimatedExtraKm = number(item.estimatedExtraKm, 'Estimated excess KM', 0, 10000000);
    if (monthlyBaseFare <= 0) throw new HttpError(400, 'Each vehicle offer needs a monthly fare.');
    return {
      id: lineId,
      vehicleType: text(item.vehicleType, 'Vehicle type', true, 200),
      monthlyBaseFare,
      includedMonthlyKm,
      extraRatePerKm,
      estimatedExtraKm,
      estimatedExtraCharge: money(estimatedExtraKm * extraRatePerKm),
    };
  });
  const estimatedOtherCharges = number(input.estimatedOtherCharges, 'Estimated other charges', 0);
  const fixedMonthlyTotal = money(lineItems.reduce((sum, item) => sum + item.monthlyBaseFare, 0));
  const estimatedExcessTotal = money(lineItems.reduce((sum, item) => sum + item.estimatedExtraCharge, 0));
  const estimatedSubtotal = money(fixedMonthlyTotal + estimatedExcessTotal + estimatedOtherCharges);
  const estimatedTax = money(estimatedSubtotal * gstRate / 100);
  const contactEmail = text(input.contactEmail, 'Contact email', false, 255);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    throw new HttpError(400, 'Enter a valid contact email.');
  return {
    companyId,
    companyName: customer?.name || text(input.companyName, 'Company name', true, 200),
    companyAddress: text(input.companyAddress, 'Company address', false, 1000),
    companyGstin: text(input.companyGstin, 'Company GSTIN', false, 30),
    contactName: text(input.contactName, 'Contact name', false, 200),
    contactPhone: text(input.contactPhone || customer?.phone, 'Contact phone', true, 50),
    contactEmail,
    proposedStartDate,
    proposedEndDate,
    validityDate,
    taxMode,
    gstRate,
    lineItems,
    estimatedOtherCharges,
    fixedMonthlyTotal,
    estimatedExcessTotal,
    estimatedSubtotal,
    estimatedTax,
    estimatedTotal: money(estimatedSubtotal + estimatedTax),
    paymentTerms: text(input.paymentTerms, 'Payment terms', false, 1000),
    serviceTerms: text(input.serviceTerms, 'Service terms', false, 1000),
    tollParkingTerms: text(input.tollParkingTerms, 'Toll and parking terms', false, 1000),
    notes: text(input.notes, 'Notes', false, 10000),
    company: existing?.company || { ...data.settings },
  };
}

function createCorporateQuotationService(repo) {
  return {
    async list() {
      const data = await repo.read();
      return data.corporateQuotations.map((quote) => ({
        ...quote,
        displayStatus: quote.status === 'Sent' && quote.validityDate < today()
          ? 'Expired'
          : quote.status,
      }));
    },
    create(input) {
      return repo.change((data) => {
        const now = new Date().toISOString();
        const row = {
          ...validateCorporateQuotation(input, data),
          id: crypto.randomUUID(),
          quotationNumber: nextNumber(data, 'corporateQuotations', 'quotationNumber', 'CQ'),
          revision: 1,
          revisions: [],
          status: 'Draft',
          contractIds: [],
          quotationDate: today(),
          createdAt: now,
          updatedAt: now,
        };
        data.corporateQuotations.unshift(row);
        return row;
      });
    },
    update(id, input) {
      return repo.change((data) => {
        const row = data.corporateQuotations.find((quote) => same(quote.id, quotationId(id)));
        if (!row) throw new HttpError(404, 'Corporate quotation not found.');
        if (row.contractIds?.length)
          throw new HttpError(409, 'A quotation linked to contracts cannot be edited. Create a new quotation.');
        if (Number(input?.revision) !== row.revision)
          throw new HttpError(409, 'This quotation changed elsewhere. Refresh before editing.');
        const validated = validateCorporateQuotation(input, data, row);
        const { revisions, ...previous } = row;
        row.revisions = [...revisions, { ...previous, revisedAt: new Date().toISOString() }];
        Object.assign(row, validated, {
          revision: row.revision + 1,
          status: 'Draft',
          updatedAt: new Date().toISOString(),
        });
        return row;
      });
    },
    status(id, desiredStatus) {
      return repo.change((data) => {
        const row = data.corporateQuotations.find((quote) => same(quote.id, quotationId(id)));
        if (!row) throw new HttpError(404, 'Corporate quotation not found.');
        const transitions = { Draft: ['Sent'], Sent: ['Accepted', 'Rejected', 'Expired'] };
        if (!(transitions[row.status] || []).includes(desiredStatus))
          throw new HttpError(409, 'This quotation cannot move to the requested status.');
        if (row.validityDate < today() && desiredStatus !== 'Expired')
          throw new HttpError(409, 'This quotation has expired. Revise it before sending or accepting.');
        row.status = desiredStatus;
        row.updatedAt = new Date().toISOString();
        if (desiredStatus === 'Sent') row.sentAt = row.updatedAt;
        if (desiredStatus === 'Accepted') row.acceptedAt = row.updatedAt;
        return row;
      });
    },
    removeDraft(id) {
      return repo.change((data) => {
        const row = data.corporateQuotations.find((quote) => same(quote.id, quotationId(id)));
        if (!row) throw new HttpError(404, 'Corporate quotation not found.');
        if (row.contractIds?.length || row.status !== 'Draft' || row.revisions.some((revision) => revision.status !== 'Draft'))
          throw new HttpError(409, 'Only quotations that have never been sent can be discarded.');
        data.corporateQuotations = data.corporateQuotations.filter((quote) => !same(quote.id, id));
        return { success: true };
      });
    },
    convert(id, input) {
      return repo.change((data) => {
        const quote = data.corporateQuotations.find((row) => same(row.id, quotationId(id)));
        if (!quote) throw new HttpError(404, 'Corporate quotation not found.');
        if (quote.contractIds?.length) throw new HttpError(409, 'This quotation already has contracts.');
        const assignments = input?.assignments;
        if (!Array.isArray(assignments) || assignments.length !== quote.lineItems.length)
          throw new HttpError(400, 'Assign one fleet vehicle to each quoted offer.');
        const assigned = new Map();
        const vehicleIds = new Set();
        for (const assignment of assignments) {
          const lineId = quotationId(assignment?.lineId);
          const vehicleId = quotationId(assignment?.vehicleId);
          if (assigned.has(lineId) || vehicleIds.has(vehicleId))
            throw new HttpError(400, 'Each offer needs a different fleet vehicle.');
          if (!quote.lineItems.some((line) => same(line.id, lineId)))
            throw new HttpError(400, 'Unknown quotation offer.');
          const vehicle = data.vehicles.find((row) => same(row.id, vehicleId));
          if (!vehicle) throw new HttpError(400, 'Selected fleet vehicle no longer exists.');
          const overlaps = (data.corporateContracts || []).some((contract) =>
            same(contract.vehicleId, vehicleId) && contract.status !== 'Terminated' &&
            (!contract.endDate || contract.endDate >= quote.proposedStartDate) &&
            (!quote.proposedEndDate || contract.startDate <= quote.proposedEndDate));
          if (overlaps) throw new HttpError(409, `${vehicle.vehicleNumber} already has an overlapping corporate contract.`);
          assigned.set(lineId, vehicle);
          vehicleIds.add(vehicleId);
        }
        let customerId = quote.companyId;
        if (!customerId) {
          const existing = data.customers.find((customer) =>
            customer.name.toLowerCase() === quote.companyName.toLowerCase());
          if (existing) customerId = existing.id;
          else {
            const customer = {
              ...validate('customers', {
                name: quote.companyName,
                phone: quote.contactPhone,
                email: quote.contactEmail,
                address: quote.companyAddress,
                gstNumber: quote.companyGstin,
              }, data),
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            };
            data.customers.unshift(customer);
            customerId = customer.id;
          }
        }
        const contracts = quote.lineItems.map((line) => {
          const vehicle = assigned.get(line.id);
          const contract = {
            ...validate('corporateContracts', {
              companyId: customerId,
              companyName: quote.companyName,
              vehicleId: vehicle.id,
              vehicleName: vehicle.name,
              vehicleNumber: vehicle.vehicleNumber,
              driverId: vehicle.driverId || '',
              driverName: vehicle.driverName || '',
              startDate: quote.proposedStartDate,
              endDate: quote.proposedEndDate || '',
              monthlyBaseFare: line.monthlyBaseFare,
              includedMonthlyKm: line.includedMonthlyKm,
              extraRatePerKm: line.extraRatePerKm,
              status: 'Active',
              notes: `From corporate quotation ${quote.quotationNumber} rev ${quote.revision}.`,
            }, data),
            id: crypto.randomUUID(),
            contractNumber: nextNumber(data, 'corporateContracts', 'contractNumber', 'CORP'),
            corporateQuotationId: quote.id,
            corporateQuotationLineId: line.id,
            quotationTaxMode: quote.taxMode,
            quotationGstRate: quote.gstRate,
            quotationTerms: {
              paymentTerms: quote.paymentTerms,
              serviceTerms: quote.serviceTerms,
              tollParkingTerms: quote.tollParkingTerms,
            },
            createdAt: new Date().toISOString(),
          };
          data.corporateContracts.unshift(contract);
          return contract;
        });
        quote.companyId = customerId;
        quote.contractIds = contracts.map((contract) => contract.id);
        quote.status = 'Converted';
        quote.convertedAt = new Date().toISOString();
        quote.updatedAt = quote.convertedAt;
        return { quote, contracts };
      });
    },
  };
}

module.exports = { validateCorporateQuotation, createCorporateQuotationService };
