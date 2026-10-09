const crypto = require('node:crypto');
const { HttpError, text, number, date } = require('./domain');

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function identifier(value, name = 'Invoice ID') {
  if (value == null || value === '') return '';
  if (!['string', 'number'].includes(typeof value) || String(value).length > 100)
    throw new HttpError(400, `${name} is invalid.`);
  return String(value);
}

function invoiceMonth(value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    throw new HttpError(400, 'Invoice month must use YYYY-MM format.');
  return value;
}

function boolean(value, name, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new HttpError(400, `${name} must be true or false.`);
  return value;
}

function companySnapshot(value) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value))
    throw new HttpError(400, 'Company details must be an object.');
  const limits = {
    companyName: 200,
    address: 1000,
    gstin: 20,
    gstNumber: 20,
    email: 255,
    contact: 50,
    contact2: 50,
    phone: 50,
    phone2: 50,
    hsnSac: 30,
    bankName: 200,
    bankBranch: 200,
    bankAccountNo: 100,
    accountNumber: 100,
    bankIfsc: 30,
    ifsc: 30,
    stampUrl: 1000,
    signatureUrl: 1000,
    nonGstQrUrl: 1000,
  };
  return Object.fromEntries(
    Object.entries(limits).map(([key, max]) => [key, text(value[key], key, false, max)]),
  );
}

function lineItems(value) {
  if (!Array.isArray(value) || value.length === 0)
    throw new HttpError(400, 'At least one invoice line item is required.');
  if (value.length > 100) throw new HttpError(400, 'An invoice can contain at most 100 line items.');
  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new HttpError(400, `Line item ${index + 1} is invalid.`);
    const packageKm = number(item.packageKm, `Line ${index + 1} package KM`, 0, 10000000);
    const packageAmount = number(
      item.packageAmount,
      `Line ${index + 1} package amount`,
      0,
      100000000,
    );
    const extraKm = number(item.extraKm, `Line ${index + 1} extra KM`, 0, 10000000);
    const extraKmRate = number(
      item.extraKmRate,
      `Line ${index + 1} extra KM rate`,
      0,
      1000000,
    );
    const extraAmount = number(
      item.extraAmount,
      `Line ${index + 1} extra amount`,
      roundMoney(extraKm * extraKmRate),
      100000000,
    );
    return {
      id: identifier(item.id) || crypto.randomUUID(),
      particulars: text(item.particulars, `Line ${index + 1} particulars`, true, 300),
      packageKm,
      packageAmount,
      extraKm,
      extraKmRate,
      extraAmount,
      amount: roundMoney(packageAmount + extraAmount),
    };
  });
}

function tollItems(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, 'Toll items must be a list.');
  if (value.length > 100) throw new HttpError(400, 'An invoice can contain at most 100 toll items.');
  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new HttpError(400, `Toll item ${index + 1} is invalid.`);
    const type = text(item.type, `Toll item ${index + 1} type`, true, 50).toUpperCase();
    if (!['TOLL', 'TOLL & PARKING', 'PARKING', 'FASTAG'].includes(type))
      throw new HttpError(400, `Toll item ${index + 1} type is invalid.`);
    return {
      id: identifier(item.id) || crypto.randomUUID(),
      vehicle: text(item.vehicle, `Toll item ${index + 1} vehicle`, false, 100),
      type,
      label: text(item.label, `Toll item ${index + 1} label`, false, 300),
      amount: number(item.amount, `Toll item ${index + 1} amount`, 0, 100000000),
    };
  });
}

function validateCorporateInvoice(input, contractId) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new HttpError(400, 'Invoice details must be an object.');
  if (input.invoiceType !== undefined && !['gst', 'nongst'].includes(input.invoiceType))
    throw new HttpError(400, 'Invoice type must be gst or nongst.');
  const isNonGst = boolean(input.isNonGst, 'isNonGst', input.invoiceType === 'nongst');
  if (input.invoiceType && (input.invoiceType === 'nongst') !== isNonGst)
    throw new HttpError(400, 'Invoice type fields do not match.');
  const gstRate = isNonGst ? 0 : number(input.gstRate, 'GST rate', 9, 100);
  if (!isNonGst && ![2.5, 9].includes(gstRate))
    throw new HttpError(400, 'GST rate must be 2.5 or 9 percent per tax component.');

  const items = lineItems(input.lineItems);
  const tolls = tollItems(input.tollItems);
  const lineTotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
  const tollTotal = roundMoney(tolls.reduce((sum, item) => sum + item.amount, 0));
  const taxableValue = roundMoney(lineTotal + tollTotal);
  const cgst = isNonGst ? 0 : Math.round(taxableValue * (gstRate / 100));
  const sgst = isNonGst ? 0 : Math.round(taxableValue * (gstRate / 100));
  const grandTotal = roundMoney(taxableValue + cgst + sgst);

  return {
    contractId: identifier(contractId, 'Contract ID'),
    month: invoiceMonth(input.month || input.selectedMonth),
    isNonGst,
    invoiceTitle: isNonGst ? 'INVOICE' : 'Tax Invoice',
    invoiceType: isNonGst ? 'nongst' : 'gst',
    invoiceNo: text(input.invoiceNo, 'Invoice number', true, 100),
    invoiceDate: date(input.invoiceDate, 'Invoice date', true),
    period: text(input.period, 'Invoice period', true, 100),
    poNo: text(input.poNo, 'PO number', false, 100),
    vehicleType: text(input.vehicleType, 'Vehicle type', false, 300),
    vehicleNumbers: text(input.vehicleNumbers, 'Vehicle numbers', false, 300),
    partyName: text(input.partyName, 'Party name', true, 200),
    partyAddress: text(input.partyAddress, 'Party address', false, 1000),
    partyGstin: text(input.partyGstin, 'Party GSTIN', false, 20).toUpperCase(),
    company: companySnapshot(input.company),
    lineItems: items,
    tollItems: tolls,
    gstRate,
    lineTotal,
    tollTotal,
    taxableValue,
    cgst,
    sgst,
    grandTotal,
    totalAmount: grandTotal,
    showStamp: boolean(input.showStamp, 'showStamp'),
    showSignature: boolean(input.showSignature, 'showSignature'),
  };
}

module.exports = { identifier, invoiceMonth, validateCorporateInvoice };
