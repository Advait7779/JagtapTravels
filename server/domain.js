const crypto = require('node:crypto');
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (message) => {
  throw new HttpError(400, message);
};
function text(value, name, required = false, max = 500) {
  if (value == null || value === '') {
    if (required) fail(name + ' is required.');
    return '';
  }
  if (typeof value !== 'string' || value.length > max)
    fail(name + ' must be text (max ' + max + ' characters).');
  const result = value.trim();
  if (required && !result) fail(name + ' is required.');
  return result;
}
function number(value, name, fallback = 0, max = 100000000) {
  if (value == null || value === '') return fallback;
  if (
    !['number', 'string'].includes(typeof value) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0 ||
    Number(value) > max
  )
    fail(name + ' must be a valid nonnegative number.');
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function date(value, name, required = false) {
  if (!value) {
    if (required) fail(name + ' is required.');
    return null;
  }
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail(name + ' must be a valid date.');
  return value;
}
function month(value, name = 'Month', required = false) {
  if (!value) {
    if (required) fail(name + ' is required.');
    return '';
  }
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    fail(name + ' must use YYYY-MM format.');
  return value;
}
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
function choice(value, values, name, fallback) {
  const v = value ?? fallback;
  if (!values.includes(v)) fail('Invalid ' + name + '.');
  return v;
}
function id(value, name = 'ID') {
  if (value == null || value === '') return null;
  if (!['string', 'number'].includes(typeof value) || !/^[\w-]{1,100}$/.test(String(value)))
    fail('Invalid ' + name);
  return String(value);
}
const same = (a, b) => a != null && b != null && String(a) === String(b);
function find(data, collection, value) {
  const row = data[collection].find((r) => same(r.id, value));
  if (!row) throw new HttpError(404, 'Record not found.');
  return row;
}
function ref(data, collection, value) {
  const key = id(value);
  if (key) find(data, collection, key);
  return key;
}
function dates(input) {
  const startDate = date(input.startDate, 'Trip start date', true),
    endDate = date(input.endDate, 'Trip end date');
  if (endDate && endDate < startDate) fail('End date cannot precede start date.');
  return { startDate, endDate };
}
function fields(input, spec) {
  return Object.fromEntries(
    Object.entries(spec).map(([k, required]) => [
      k,
      text(
        input[k],
        k,
        required,
        k === 'notes' || ['itinerary', 'inclusions', 'exclusions'].includes(k) ? 10000 : 500,
      ),
    ]),
  );
}
const customerSpec = {
  name: true,
  phone: true,
  email: false,
  city: false,
  address: false,
  gstNumber: false,
  emergencyContact: false,
  notes: false,
};
const driverSpec = {
  name: true,
  phone: true,
  licenseNumber: true,
  vehicleAssigned: false,
  vehicleNumber: false,
  address: false,
  emergencyContact: false,
  notes: false,
};
const vehicleSpec = {
  name: true,
  vehicleNumber: true,
  model: false,
  fuelType: false,
  notes: false,
};
const bookingSpec = {
  customerName: true,
  customerPhone: true,
  customerEmail: false,
  pickupLocation: true,
  dropLocation: true,
  pickupAddress: false,
  pickupTime: false,
  vehicleType: true,
  vehicleName: false,
  vehicleNumber: false,
  driverName: false,
  flightTrainNumber: false,
  notes: false,
};
const inquirySpec = {
  name: true,
  phone: true,
  email: false,
  tripType: false,
  vehicle: false,
  travelDate: false,
  pickupLocation: false,
  dropLocation: false,
  passengerCount: false,
  message: false,
  notes: false,
};
const corporateContractSpec = {
  companyName: true,
  vehicleName: false,
  vehicleNumber: true,
  driverName: false,
  startDate: true,
  endDate: false,
  notes: false,
};
const fuelLogSpec = {
  vehicleNumber: true,
  date: true,
  fuelType: true,
  petrolPumpName: false,
  receiptNumber: false,
  driverName: false,
  notes: false,
};
const tyreLogSpec = {
  vehicleNumber: true,
  date: true,
  tyreBrand: true,
  tyreSize: false,
  tyrePosition: false,
  vendorName: false,
  notes: false,
};
const driverAdvanceSpec = {
  driverName: true,
  date: true,
  month: false,
  paymentMode: false,
  notes: false,
};
const corporateTripLogSpec = {
  placeFrom: true,
  placeTo: true,
  employeeNames: false,
  remarks: false,
  signatureName: false,
};
function calculateHours(startTime, closeTime) {
  if (!startTime || !closeTime) return 0;
  const parseMin = (t) => {
    const m = String(t).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!m) return null;
    let hr = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const mer = m[3]?.toUpperCase();
    if (mer === 'PM' && hr < 12) hr += 12;
    if (mer === 'AM' && hr === 12) hr = 0;
    return hr * 60 + min;
  };
  const s = parseMin(startTime);
  const c = parseMin(closeTime);
  if (s === null || c === null) return 0;
  let diff = c - s;
  if (diff < 0) diff += 24 * 60;
  return round(diff / 60);
}
const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const statusFor = (total, paid) => (paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending');
function tripTime(value, name) {
  const result = text(value, name, false, 20);
  if (
    result &&
    !/^(?:(?:[01]?\d|2[0-3]):[0-5]\d|(?:0?[1-9]|1[0-2]):[0-5]\d\s*(?:AM|PM))$/i.test(
      result,
    )
  )
    fail(name + ' must be a valid time such as 06:30 or 06:30 AM.');
  return result;
}
function tripLogMatchesContract(log, contract) {
  if (log.contractId) return same(log.contractId, contract.id);
  if (contract.vehicleId && log.vehicleId) return same(log.vehicleId, contract.vehicleId);
  return Boolean(contract.vehicleNumber && log.vehicleNumber === contract.vehicleNumber);
}
function recalculateVehicleOdometer(data, vehicleId) {
  if (!vehicleId) return;
  const vehicle = data.vehicles.find((candidate) => same(candidate.id, vehicleId));
  if (!vehicle) return;
  const candidates = [
    Number(vehicle.initialOdometer || 0),
    ...(vehicle.kmLogs || []).map((log) => Number(log.odometerReading) || 0),
    ...(vehicle.serviceHistory || []).map((record) => Number(record.serviceOdometer) || 0),
    ...(data.fuelLogs || [])
      .filter((log) => same(log.vehicleId, vehicleId))
      .map((log) => Number(log.odometerReading) || 0),
    ...(data.tyreLogs || [])
      .filter((log) => same(log.vehicleId, vehicleId))
      .map((log) => Number(log.odometerAtChange) || 0),
    ...(data.corporateTripLogs || [])
      .filter((log) => same(log.vehicleId, vehicleId))
      .map((log) => Number(log.closeKm) || 0),
  ];
  vehicle.currentOdometer = Math.max(0, ...candidates);
  vehicle.updatedAt = new Date().toISOString();
}
function nextNumber(data, collection, field, prefix) {
  const year = today().slice(0, 4),
    key = prefix + '-' + year;
  let max = Number(data.counters[key] || 0);
  for (const row of data[collection]) {
    const value = row[field];
    if (typeof value === 'string' && value.startsWith(key + '-')) {
      const n = Number(value.slice(key.length + 1));
      if (Number.isSafeInteger(n)) max = Math.max(max, n);
    }
  }
  data.counters[key] = max + 1;
  return key + '-' + String(max + 1).padStart(3, '0');
}
function sameVehicle(left, right) {
  if (left.vehicleId && right.vehicleId) return same(left.vehicleId, right.vehicleId);
  return (
    String(left.vehicleNumber || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') ===
    String(right.vehicleNumber || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
  );
}
function validateFuelOdometer(data, candidate, excludeId) {
  const related = (data.fuelLogs || []).filter(
    (log) => !same(log.id, excludeId) && sameVehicle(log, candidate),
  );
  const previousOdometer = Math.max(
    0,
    ...related
      .filter((log) => log.date < candidate.date)
      .map((log) => Number(log.odometerReading) || 0),
  );
  const laterOdometers = related
    .filter((log) => log.date > candidate.date)
    .map((log) => Number(log.odometerReading) || 0)
    .filter((value) => value > 0);
  const nextOdometer = laterOdometers.length ? Math.min(...laterOdometers) : 0;
  if (previousOdometer && candidate.odometerReading < previousOdometer)
    fail('Fuel odometer cannot be lower than an earlier fuel entry.');
  if (nextOdometer && candidate.odometerReading > nextOdometer)
    fail('Fuel odometer cannot exceed a later fuel entry.');
}
function enforceAdvanceLimit(data, candidate, excludeId) {
  const driver = find(data, 'drivers', candidate.driverId);
  const baseSalary = Number(driver.baseSalary ?? 0);
  const existingTotal = (data.driverAdvances || [])
    .filter(
      (advance) =>
        !same(advance.id, excludeId) &&
        same(advance.driverId, candidate.driverId) &&
        advance.month === candidate.month,
    )
    .reduce((sum, advance) => sum + Number(advance.amount || 0), 0);
  if (round(existingTotal + candidate.amount) > baseSalary)
    fail('Total advances cannot exceed the driver base salary for this month.');
}
function corporateMonthlySummary(data, contractId, monthValue) {
  const contract = find(data, 'corporateContracts', contractId);
  const billingMonth = month(monthValue || today().slice(0, 7), 'Billing month', true);
  const [year, monthNumber] = billingMonth.split('-').map(Number);
  const monthStart = billingMonth + '-01';
  const monthEnd = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  if (contract.startDate > monthEnd || (contract.endDate && contract.endDate < monthStart))
    fail('The selected month is outside this contract period.');
  const periodStart = contract.startDate > monthStart ? contract.startDate : monthStart;
  const periodEnd =
    contract.endDate && contract.endDate < monthEnd ? contract.endDate : monthEnd;
  const vehicle = contract.vehicleId
    ? data.vehicles.find((vehicleRow) => same(vehicleRow.id, contract.vehicleId))
    : data.vehicles.find((vehicleRow) => vehicleRow.vehicleNumber === contract.vehicleNumber);
  const monthLogs = (vehicle?.kmLogs || []).filter(
    (log) => log.date && log.date >= periodStart && log.date <= periodEnd,
  );
  const tripLogs = (data.corporateTripLogs || []).filter(
    (log) =>
      tripLogMatchesContract(log, contract) &&
      log.date &&
      log.date >= periodStart &&
      log.date <= periodEnd,
  );
  const totalTripKm = round(tripLogs.reduce((sum, log) => sum + Number(log.totalKm || 0), 0));
  const totalKmRun =
    tripLogs.length > 0
      ? totalTripKm
      : round(monthLogs.reduce((sum, log) => sum + Number(log.dailyKm || 0), 0));
  const totalToll = round(tripLogs.reduce((sum, log) => sum + Number(log.tollParking || 0), 0));
  const totalHours = round(tripLogs.reduce((sum, log) => sum + Number(log.totalHours || 0), 0));
  const totalExtraHours = round(
    tripLogs.reduce((sum, log) => sum + Number(log.extraHours || 0), 0),
  );
  const totalEmployeesTransported = tripLogs.reduce(
    (sum, log) => sum + Number(log.employeeCount || 0),
    0,
  );
  const includedKm = Number(contract.includedMonthlyKm || 0);
  const excessKm = Math.max(0, round(totalKmRun - includedKm));
  const extraRatePerKm = Number(contract.extraRatePerKm || 0);
  const excessCharge = round(excessKm * extraRatePerKm);
  const monthlyBaseFare = Number(contract.monthlyBaseFare || 0);
  return {
    contract,
    month: billingMonth,
    periodStart,
    periodEnd,
    vehicle,
    totalKmRun,
    includedKm,
    excessKm,
    extraRatePerKm,
    excessCharge,
    monthlyBaseFare,
    grandTotal: round(monthlyBaseFare + excessCharge),
    logs: monthLogs,
    tripLogs,
    totalToll,
    totalHours,
    totalExtraHours,
    totalEmployeesTransported,
  };
}
function validate(collection, input, data, existing) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Expected a JSON object.');
  if (collection === 'customers') {
    const out = fields(input, customerSpec);
    if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) fail('Invalid email.');
    return out;
  }
  if (collection === 'drivers')
    return {
      ...fields(input, driverSpec),
      experienceYears: number(input.experienceYears, 'Experience', 0, 50),
      baseSalary: number(input.baseSalary, 'Base salary', 0),
      licenseDocumentUrl: text(input.licenseDocumentUrl, 'License document', false, 500),
      driverPhotoUrl: text(input.driverPhotoUrl, 'Driver photo', false, 500),
      status: choice(
        input.status,
        ['Available', 'On Trip', 'Off Duty'],
        'driver status',
        'Available',
      ),
      licenseExpiryDate: date(input.licenseExpiryDate, 'License expiry date'),
      badgeExpiryDate: date(input.badgeExpiryDate, 'Badge expiry date'),
      documents: existing?.documents || [],
    };
  if (collection === 'vehicles') {
    const details = fields(input, vehicleSpec);
    details.vehicleNumber = details.vehicleNumber.toUpperCase().replace(/\s+/g, ' ');
    const currentOdometer = number(input.currentOdometer, 'Current Odometer', 0);
    const lastServiceKm = number(input.lastServiceKm, 'Last Service Odometer', 0);
    const serviceIntervalKm = number(input.serviceIntervalKm, 'Service Interval KM', 30000);
    const plateKey = details.vehicleNumber.replace(/[^A-Z0-9]/g, '');
    if (
      data.vehicles.some(
        (vehicle) =>
          vehicle !== existing &&
          String(vehicle.vehicleNumber || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '') === plateKey,
      )
    )
      fail('A vehicle with this registration plate already exists.');
    if (serviceIntervalKm <= 0) fail('Service interval must be greater than zero.');
    if (lastServiceKm > currentOdometer)
      fail('Last service odometer cannot exceed the current odometer.');
    const recordedOdometer = Math.max(
      0,
      ...(existing?.kmLogs || []).map((log) => Number(log.odometerReading) || 0),
      ...(existing?.serviceHistory || []).map((record) => Number(record.serviceOdometer) || 0),
    );
    const recordedServiceOdometer = Math.max(
      0,
      ...(existing?.serviceHistory || []).map((record) => Number(record.serviceOdometer) || 0),
    );
    if (currentOdometer < recordedOdometer)
      fail('Current odometer cannot be lower than recorded vehicle history.');
    if (lastServiceKm < recordedServiceOdometer)
      fail('Last service odometer cannot be lower than recorded service history.');
    const assignedDriver = input.driverId ? find(data, 'drivers', input.driverId) : null;
    return {
      ...details,
      driverId: ref(data, 'drivers', input.driverId),
      driverName: assignedDriver?.name || '',
      currentOdometer,
      initialOdometer: existing?.initialOdometer ?? currentOdometer,
      lastServiceKm,
      serviceIntervalKm,
      insuranceExpiryDate: date(input.insuranceExpiryDate, 'Insurance expiry date'),
      pucExpiryDate: date(input.pucExpiryDate, 'PUC expiry date'),
      fitnessExpiryDate: date(input.fitnessExpiryDate, 'Fitness expiry date'),
      permitExpiryDate: date(input.permitExpiryDate, 'Permit expiry date'),
      taxExpiryDate: date(input.taxExpiryDate, 'Road tax expiry date'),
      rcExpiryDate: date(input.rcExpiryDate, 'RC expiry date'),
      rcDocumentUrl: text(input.rcDocumentUrl, 'RC document', false, 500),
      kmLogs: existing?.kmLogs || [],
      serviceHistory: existing?.serviceHistory || [],
      documents: existing?.documents || [],
      tyreHistory: existing?.tyreHistory || [],
    };
  }
  if (collection === 'meterReadings') {
    if (existing?.status === 'Billed')
      throw new HttpError(409, 'Billed slips cannot be edited. Cancel their invoice first.');
    const status = choice(input.status, ['Ongoing', 'Completed'], 'slip status', 'Completed');
    const openingKm = number(input.openingKm, 'Opening KM', null);
    if (openingKm === null) fail('Opening KM is required.');
    const closingKm =
      input.closingKm === '' || input.closingKm == null
        ? null
        : number(input.closingKm, 'Closing KM');
    if (status === 'Completed' && (closingKm === null || closingKm < openingKm))
      fail('Completed trips require closing KM at least equal to opening KM.');
    if (status === 'Ongoing' && closingKm !== null && closingKm !== 0)
      fail('Complete the trip when entering closing KM.');
    const range = dates(input);
    if (status === 'Completed' && !range.endDate) fail('Completed trips require an end date.');
    return {
      ...fields(input, {
        vehicleName: true,
        vehicleNumber: false,
        driverName: true,
        customerName: false,
        tripSource: true,
        tripDestination: true,
        notes: false,
      }),
      ...range,
      driverId: ref(data, 'drivers', input.driverId),
      customerId: ref(data, 'customers', input.customerId),
      openingKm,
      closingKm: status === 'Ongoing' ? null : closingKm,
      totalKm: status === 'Completed' ? round(closingKm - openingKm) : 0,
      ratePerKm: number(input.ratePerKm, 'Rate per KM'),
      driverAllowance: number(input.driverAllowance, 'Driver allowance'),
      tollParking: number(input.tollParking, 'Toll and parking'),
      documents: Array.isArray(input.documents) ? input.documents : existing?.documents || [],
      status,
    };
  }
  if (collection === 'quotations') {
    const baseAmount = number(input.baseAmount, 'Package cost'),
      taxAmount = round(baseAmount * 0.05),
      durationDays = number(input.durationDays, 'Duration', 1, 365);
    if (!Number.isInteger(durationDays) || durationDays < 1)
      fail('Duration must be a whole number of days.');
    const travelDate = date(input.travelDate, 'Travel date'),
      validityDate = date(input.validityDate, 'Validity date');
    if (travelDate && validityDate && validityDate > travelDate)
      fail('Quote validity cannot be later than travel date.');
    return {
      ...fields(input, {
        customerName: true,
        customerPhone: false,
        customerEmail: false,
        tourTitle: true,
        pickupLocation: true,
        dropLocation: true,
        vehicleType: true,
        itinerary: false,
        inclusions: false,
        exclusions: false,
        notes: false,
      }),
      company: { ...data.settings },
      customerId: ref(data, 'customers', input.customerId),
      durationDays,
      travelDate,
      validityDate,
      estimatedKm: number(input.estimatedKm, 'Estimated KM'),
      baseAmount,
      taxAmount,
      totalAmount: round(baseAmount + taxAmount),
      status: choice(
        input.status,
        ['Draft', 'Sent', 'Accepted', 'Rejected'],
        'quotation status',
        'Draft',
      ),
    };
  }
  if (collection === 'bills') {
    const linkedSlipId = ref(data, 'meterReadings', input.linkedSlipId);
    let source = { ...input },
      slip;
    if (linkedSlipId) {
      slip = find(data, 'meterReadings', linkedSlipId);
      if (
        slip.status !== 'Completed' ||
        data.bills.some((b) => same(b.linkedSlipId, linkedSlipId) && !b.voidedAt)
      )
        throw new HttpError(409, 'Only an unbilled completed slip can be invoiced.');
      const customer = slip.customerId ? find(data, 'customers', slip.customerId) : null;
      source = { ...source, ...slip, customerPhone: customer?.phone || '', linkedSlipId };
    }
    const baseFare = slip
      ? round(Number(slip.totalKm) * Number(slip.ratePerKm))
      : number(source.baseFare ?? source.kmAmount, 'Base fare');
    const driverAllowance = number(source.driverAllowance, 'Driver allowance'),
      tollParking = number(source.tollParking, 'Toll and parking'),
      otherCharges = number(input.otherCharges, 'Other charges');
    const subtotal = round(baseFare + driverAllowance + tollParking + otherCharges);
    const taxPercent = number(input.taxPercent, 'Tax percent', 5, 100),
      taxAmount = round((subtotal * taxPercent) / 100),
      discount = number(input.discount, 'Discount');
    if (discount > round(subtotal + taxAmount)) fail('Discount cannot exceed the invoice value.');
    const totalAmount = round(subtotal + taxAmount - discount),
      advancePaid = number(input.advancePaid, 'Advance');
    if (advancePaid > totalAmount) fail('Advance cannot exceed the invoice value.');
    const range = dates(source);
    if (!range.endDate) fail('Trip end date is required.');
    const fuelExpense = number(input.fuelExpense, 'Fuel expense', 0);
    const tollExpense = number(input.tollExpense, 'Toll expense', 0);
    const driverBattaExpense = number(input.driverBattaExpense, 'Driver batta expense', 0);
    const otherExpense = number(input.otherExpense, 'Other expense', 0);
    const totalExpense = round(fuelExpense + tollExpense + driverBattaExpense + otherExpense);
    const netProfit = round(totalAmount - totalExpense);
    return {
      ...fields(source, {
        customerName: true,
        customerPhone: false,
        driverName: false,
        vehicleName: false,
        vehicleNumber: false,
        tripSource: true,
        tripDestination: true,
      }),
      ...range,
      notes: text(input.notes, 'Notes', false, 10000),
      customerId: ref(data, 'customers', source.customerId),
      driverId: ref(data, 'drivers', source.driverId),
      linkedSlipId,
      corporateContractId: ref(data, 'corporateContracts', input.corporateContractId),
      billingMonth: month(input.billingMonth, 'Billing month'),
      invoiceDate: date(input.invoiceDate || today(), 'Invoice date', true),
      dueDate: date(input.dueDate || input.invoiceDate || today(), 'Due date') || input.invoiceDate || today(),
      billingType: slip ? 'distance' : 'package',
      baseFare,
      kmAmount: baseFare,
      startKm: slip?.openingKm ?? 0,
      endKm: slip?.closingKm ?? 0,
      totalKm: slip?.totalKm ?? 0,
      ratePerKm: slip?.ratePerKm ?? 0,
      driverAllowance,
      tollParking,
      otherCharges,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      totalAmount,
      advancePaid,
      totalPaid: advancePaid,
      balanceDue: round(totalAmount - advancePaid),
      paymentStatus: statusFor(totalAmount, advancePaid),
      paymentMode: choice(
        input.paymentMode,
        ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
        'payment mode',
        'Cash',
      ),
      payments: [],
      company: { ...data.settings },
      fuelExpense,
      tollExpense,
      driverBattaExpense,
      otherExpense,
      totalExpense,
      netProfit,
    };
  }
  if (collection === 'bookings') {
    const range = dates(input);
    const assignedDriver = input.driverId ? find(data, 'drivers', input.driverId) : null;
    const assignedVehicle = input.vehicleId ? find(data, 'vehicles', input.vehicleId) : null;
    return {
      ...fields(input, bookingSpec),
      ...range,
      customerId: ref(data, 'customers', input.customerId),
      driverId: ref(data, 'drivers', input.driverId),
      vehicleId: ref(data, 'vehicles', input.vehicleId),
      driverName: assignedDriver?.name || input.driverName || '',
      vehicleName: assignedVehicle?.name || input.vehicleName || '',
      vehicleNumber: assignedVehicle?.vehicleNumber || input.vehicleNumber || '',
      passengerCount: number(input.passengerCount, 'Passenger count', 1, 100),
      estimatedAmount: number(input.estimatedAmount, 'Estimated amount', 0),
      advanceAmount: number(input.advanceAmount, 'Advance amount', 0),
      pickupTime: text(input.pickupTime, 'Pickup time', false, 50),
      pickupAddress: text(input.pickupAddress, 'Pickup address', false, 500),
      flightTrainNumber: text(input.flightTrainNumber, 'Flight or Train number', false, 100),
      status: choice(
        input.status,
        ['Confirmed', 'Dispatched', 'Completed', 'Cancelled'],
        'booking status',
        'Confirmed',
      ),
    };
  }
  if (collection === 'inquiries') {
    return {
      ...fields(input, inquirySpec),
      status: choice(
        input.status,
        ['New', 'Contacted', 'Quoted', 'Converted', 'Lost'],
        'inquiry status',
        'New',
      ),
      source: text(input.source || 'Website', 'Source', false, 100),
    };
  }
  if (collection === 'corporateContracts') {
    const assignedCompany = input.companyId ? find(data, 'customers', input.companyId) : null;
    const assignedVehicle = input.vehicleId ? find(data, 'vehicles', input.vehicleId) : null;
    const assignedDriver = input.driverId ? find(data, 'drivers', input.driverId) : null;
    const startDate = date(input.startDate, 'Start date', true);
    const endDate = date(input.endDate, 'End date');
    if (endDate && endDate < startDate) fail('Contract end date cannot precede start date.');
    return {
      ...fields(input, corporateContractSpec),
      companyId: ref(data, 'customers', input.companyId),
      companyName: assignedCompany?.name || input.companyName || '',
      vehicleId: ref(data, 'vehicles', input.vehicleId),
      vehicleName: assignedVehicle?.name || input.vehicleName || '',
      vehicleNumber: assignedVehicle?.vehicleNumber || input.vehicleNumber || '',
      driverId: ref(data, 'drivers', input.driverId),
      driverName: assignedDriver?.name || input.driverName || '',
      startDate,
      endDate,
      monthlyBaseFare: number(input.monthlyBaseFare, 'Monthly base fare', 0),
      includedMonthlyKm: number(input.includedMonthlyKm, 'Included monthly KM', 0),
      extraRatePerKm: number(input.extraRatePerKm, 'Extra rate per KM', 0),
      status: choice(
        input.status,
        ['Active', 'Paused', 'Terminated'],
        'contract status',
        'Active',
      ),
    };
  }
  if (collection === 'fuelLogs') {
    const assignedVehicle = input.vehicleId ? find(data, 'vehicles', input.vehicleId) : null;
    const assignedDriver = input.driverId ? find(data, 'drivers', input.driverId) : null;
    const quantity = number(input.quantity, 'Fuel quantity');
    const ratePerUnit = number(input.ratePerUnit, 'Rate per unit', 0);
    if (quantity <= 0) fail('Fuel quantity must be greater than zero.');
    if (ratePerUnit <= 0) fail('Rate per unit must be greater than zero.');
    const fuelDate = date(input.date || today(), 'Fuel date', true);
    if (fuelDate > today()) fail('Fuel date cannot be in the future.');
    const odometerReading = number(input.odometerReading, 'Odometer reading');
    if (odometerReading <= 0) fail('Odometer reading must be greater than zero.');
    return {
      ...fields(input, fuelLogSpec),
      vehicleId: ref(data, 'vehicles', input.vehicleId),
      vehicleNumber: assignedVehicle?.vehicleNumber || input.vehicleNumber || '',
      driverId: ref(data, 'drivers', input.driverId),
      driverName: assignedDriver?.name || input.driverName || '',
      date: fuelDate,
      fuelType: choice(input.fuelType, ['Diesel', 'Petrol', 'CNG'], 'fuel type', 'Diesel'),
      quantity,
      ratePerUnit,
      totalCost: round(quantity * ratePerUnit),
      odometerReading,
    };
  }
  if (collection === 'tyreLogs') {
    const assignedVehicle = input.vehicleId ? find(data, 'vehicles', input.vehicleId) : null;
    const quantity = number(input.quantity, 'Tyre quantity', 1, 10);
    const costPerTyre = number(input.costPerTyre, 'Cost per tyre', 0);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
      fail('Tyre quantity must be a whole number from 1 to 10.');
    if (costPerTyre <= 0) fail('Cost per tyre must be greater than zero.');
    const replacementDate = date(input.date || today(), 'Replacement date', true);
    if (replacementDate > today()) fail('Replacement date cannot be in the future.');
    const odometerAtChange = number(input.odometerAtChange, 'Odometer at change');
    if (odometerAtChange <= 0) fail('Odometer at change must be greater than zero.');
    return {
      ...fields(input, tyreLogSpec),
      vehicleId: ref(data, 'vehicles', input.vehicleId),
      vehicleNumber: assignedVehicle?.vehicleNumber || input.vehicleNumber || '',
      date: replacementDate,
      odometerAtChange,
      tyrePosition: choice(
        input.tyrePosition,
        [
          'All 4 Tyres',
          'Front Left',
          'Front Right',
          'Rear Left',
          'Rear Right',
          'Both Front',
          'Both Rear',
          'Spare / Stepney',
        ],
        'tyre position',
        'All 4 Tyres',
      ),
      quantity,
      costPerTyre,
      totalCost: round(quantity * costPerTyre),
      oldTyreKmRun: number(input.oldTyreKmRun, 'Old tyre lifespan KM', 0),
    };
  }
  if (collection === 'driverAdvances') {
    const assignedDriver = input.driverId ? find(data, 'drivers', input.driverId) : null;
    const advanceDate = date(input.date || today(), 'Advance date', true);
    return {
      ...fields(input, driverAdvanceSpec),
      driverId: ref(data, 'drivers', input.driverId),
      driverName: assignedDriver?.name || input.driverName || '',
      date: advanceDate,
      month: month(input.month || advanceDate.slice(0, 7), 'Salary month', true),
      amount: number(input.amount, 'Advance amount', 1),
      paymentMode: choice(
        input.paymentMode,
        ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
        'payment mode',
        'Cash',
      ),
    };
  }
  if (collection === 'corporateTripLogs') {
    const contractId = ref(data, 'corporateContracts', input.contractId);
    if (!contractId) fail('Corporate contract is required.');
    const assignedContract = find(data, 'corporateContracts', contractId);
    if (!existing && assignedContract.status && assignedContract.status !== 'Active')
      fail('Daily trips can only be added to an active corporate contract.');

    const companyId = input.companyId
      ? ref(data, 'customers', input.companyId)
      : assignedContract.companyId || null;
    const vehicleId = input.vehicleId
      ? ref(data, 'vehicles', input.vehicleId)
      : assignedContract.vehicleId || null;
    const driverId = input.driverId
      ? ref(data, 'drivers', input.driverId)
      : assignedContract.driverId || null;
    if (!vehicleId) fail('A vehicle linked to the corporate contract is required.');
    if (!driverId) fail('A driver linked to the corporate contract is required.');
    if (assignedContract.companyId && !same(companyId, assignedContract.companyId))
      fail('The selected company does not match the corporate contract.');
    if (assignedContract.vehicleId && !same(vehicleId, assignedContract.vehicleId))
      fail('The selected vehicle does not match the corporate contract.');
    if (assignedContract.driverId && !same(driverId, assignedContract.driverId))
      fail('The selected driver does not match the corporate contract.');

    const assignedCompany = companyId
      ? data.customers.find((candidate) => same(candidate.id, companyId))
      : null;
    const assignedVehicle = find(data, 'vehicles', vehicleId);
    const assignedDriver = find(data, 'drivers', driverId);

    const logDate = date(input.date || today(), 'Log date', true);
    if (logDate > today()) fail('Trip logs cannot be recorded for a future date.');
    if (
      logDate < assignedContract.startDate ||
      (assignedContract.endDate && logDate > assignedContract.endDate)
    )
      fail('The trip date must be within the corporate contract period.');
    const startKm = number(input.startKm, 'Start KM', null);
    const closeKm = number(input.closeKm, 'Close KM', null);
    if (startKm === null || closeKm === null) fail('Start KM and Close KM are required.');
    if (closeKm < startKm) fail('Close KM cannot be less than Start KM.');

    const relatedLogs = (data.corporateTripLogs || []).filter(
      (log) => !same(log.id, existing?.id) && same(log.vehicleId, vehicleId),
    );
    if (
      relatedLogs.some(
        (log) => startKm < Number(log.closeKm || 0) && closeKm > Number(log.startKm || 0),
      )
    )
      fail('This odometer range overlaps another trip recorded for the vehicle.');

    const totalKm = round(closeKm - startKm);
    const startTime = tripTime(input.startTime, 'Start time');
    const closeTime = tripTime(input.closeTime, 'Close time');
    if (Boolean(startTime) !== Boolean(closeTime))
      fail('Start time and Close time must both be provided.');
    const totalHours = startTime && closeTime ? calculateHours(startTime, closeTime) : 0;
    const extraHours = number(input.extraHours, 'Extra hours', 0);
    const tollParking = number(input.tollParking, 'Toll and parking', 0);
    const employeeCount = number(input.employeeCount, 'Employee count', 0, 500);
    if (!Number.isSafeInteger(employeeCount)) fail('Employee count must be a whole number.');

    return {
      ...fields(input, corporateTripLogSpec),
      contractId,
      companyId,
      companyName:
        assignedCompany?.name || assignedContract?.companyName || input.companyName || '',
      vehicleId,
      vehicleName:
        assignedVehicle?.name || assignedContract?.vehicleName || input.vehicleName || '',
      vehicleNumber:
        assignedVehicle?.vehicleNumber ||
        assignedContract?.vehicleNumber ||
        input.vehicleNumber ||
        '',
      driverId,
      driverName: assignedDriver?.name || assignedContract?.driverName || input.driverName || '',
      date: logDate,
      startKm,
      closeKm,
      totalKm,
      startTime,
      closeTime,
      totalHours,
      extraHours,
      tollParking,
      employeeCount,
      employeeNames: text(input.employeeNames, 'Employee names', false, 1000),
      signatureName: text(input.signatureName, 'Signature name', false, 100),
      remarks: text(input.remarks, 'Remarks', false, 500),
    };
  }
  fail('Unknown collection.');
}
function createService(repo) {
  return {
    async list(collection) {
      const d = await repo.read();
      if (collection === 'customers')
        return d.customers.map((c) => ({
          ...c,
          totalTrips:
            d.meterReadings.filter((m) => same(m.customerId, c.id) && m.status !== 'Ongoing')
              .length +
            d.bills.filter((b) => same(b.customerId, c.id) && !b.linkedSlipId && !b.voidedAt)
              .length,
          totalBookings: (d.bookings || []).filter((b) => same(b.customerId, c.id)).length,
        }));
      if (collection === 'drivers') {
        const todayStr = today();
        return (d.drivers || []).map((drv) => {
          let licenseStatus = 'Valid';
          let licenseDaysRemaining = null;
          if (drv.licenseExpiryDate) {
            licenseDaysRemaining = Math.ceil(
              (Date.parse(drv.licenseExpiryDate) - Date.parse(todayStr)) / 86400000,
            );
            if (licenseDaysRemaining < 0) licenseStatus = 'Expired';
            else if (licenseDaysRemaining <= 30) licenseStatus = 'Expiring Soon';
          }
          return { ...drv, licenseStatus, licenseDaysRemaining };
        });
      }
      if (collection === 'bills') {
        const todayStr = today();
        return (d.bills || []).map((b) => {
          const isOverdue =
            b.paymentStatus !== 'Paid' && !b.voidedAt && b.dueDate && b.dueDate < todayStr;
          const daysOverdue = isOverdue
            ? Math.max(1, Math.ceil((Date.parse(todayStr) - Date.parse(b.dueDate)) / 86400000))
            : 0;
          return { ...b, isOverdue, daysOverdue };
        });
      }
      if (collection === 'vehicles') {
        const todayStr = today();
        return (d.vehicles || []).map((v) => {
          const currentOdometer = Number(v.currentOdometer) || 0;
          const lastServiceKm = Number(v.lastServiceKm) || 0;
          const serviceIntervalKm = Number(v.serviceIntervalKm) || 30000;
          const kmSinceLastService = Math.max(0, round(currentOdometer - lastServiceKm));
          const targetServiceKm = round(lastServiceKm + serviceIntervalKm);
          const kmRemaining = round(targetServiceKm - currentOdometer);
          const progressPercent = Math.min(
            100,
            Math.max(0, round((kmSinceLastService / serviceIntervalKm) * 100)),
          );
          let status = 'Healthy';
          if (kmRemaining <= 0) {
            status = 'Service Due';
          } else if (kmRemaining <= 2000) {
            status = 'Approaching';
          }

          const docAlerts = [];
          const docCheckList = [
            { key: 'insuranceExpiryDate', label: 'Insurance' },
            { key: 'pucExpiryDate', label: 'PUC' },
            { key: 'fitnessExpiryDate', label: 'Fitness' },
            { key: 'permitExpiryDate', label: 'Permit' },
            { key: 'taxExpiryDate', label: 'Road Tax' },
            { key: 'rcExpiryDate', label: 'RC (Registration)' },
          ];
          for (const item of docCheckList) {
            const val = v[item.key];
            if (val) {
              const diffDays = Math.ceil(
                (Date.parse(val) - Date.parse(todayStr)) / 86400000,
              );
              if (diffDays < 0) {
                docAlerts.push({ ...item, date: val, daysRemaining: diffDays, status: 'Expired' });
              } else if (diffDays <= 30) {
                docAlerts.push({ ...item, date: val, daysRemaining: diffDays, status: 'Expiring Soon' });
              }
            }
          }
          const hasExpired = docAlerts.some((a) => a.status === 'Expired');
          const hasExpiringSoon = docAlerts.some((a) => a.status === 'Expiring Soon');
          const docStatus = hasExpired ? 'Expired' : hasExpiringSoon ? 'Expiring Soon' : 'Valid';

          return {
            ...v,
            currentOdometer,
            lastServiceKm,
            serviceIntervalKm,
            kmSinceLastService,
            targetServiceKm,
            kmRemaining,
            progressPercent,
            status,
            docAlerts,
            docStatus,
          };
        });
      }
      return d[collection];
    },
    add(collection, input) {
      return repo.change((d) => {
        const row = {
          ...validate(collection, input, d),
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        if (collection === 'fuelLogs') {
          validateFuelOdometer(d, row);
          const vehicle = row.vehicleId
            ? d.vehicles.find((candidate) => same(candidate.id, row.vehicleId))
            : null;
          if (vehicle && row.odometerReading > Number(vehicle.currentOdometer || 0))
            vehicle.currentOdometer = row.odometerReading;
        }
        if (collection === 'driverAdvances') enforceAdvanceLimit(d, row);
        const numbering = {
          bills: ['billNumber', 'JTT'],
          quotations: ['quotationNumber', 'QTN'],
          meterReadings: ['slipNumber', 'DS'],
          bookings: ['bookingNumber', 'BK'],
          inquiries: ['inquiryNumber', 'INQ'],
          corporateContracts: ['contractNumber', 'CORP'],
          fuelLogs: ['fuelNumber', 'FUEL'],
          tyreLogs: ['tyreNumber', 'TYRE'],
          driverAdvances: ['advanceNumber', 'ADV'],
          corporateTripLogs: ['tripLogNumber', 'LOG'],
        };
        if (numbering[collection])
          row[numbering[collection][0]] = nextNumber(d, collection, ...numbering[collection]);
        if (row.linkedSlipId) find(d, 'meterReadings', row.linkedSlipId).status = 'Billed';
        if (collection === 'tyreLogs' && row.vehicleId) {
          const veh = d.vehicles.find((v) => same(v.id, row.vehicleId));
          if (veh) {
            if (row.odometerAtChange > Number(veh.currentOdometer || 0))
              veh.currentOdometer = row.odometerAtChange;
            veh.tyreHistory = veh.tyreHistory || [];
            veh.tyreHistory.unshift({ ...row });
          }
        }
        d[collection].unshift(row);
        if (collection === 'corporateTripLogs') recalculateVehicleOdometer(d, row.vehicleId);
        return row;
      });
    },
    update(collection, key, input, { staff = false } = {}) {
      return repo.change((d) => {
        const row = find(d, collection, key);
        const previousVehicleId = collection === 'corporateTripLogs' ? row.vehicleId : null;
        const safeInput = staff && collection === 'drivers'
          ? { ...input, baseSalary: row.baseSalary, licenseDocumentUrl: row.licenseDocumentUrl, driverPhotoUrl: row.driverPhotoUrl }
          : staff && collection === 'vehicles'
            ? { ...input, rcDocumentUrl: row.rcDocumentUrl }
            : input;
        const validated = validate(collection, safeInput, d, row);
        if (collection === 'fuelLogs') validateFuelOdometer(d, validated, key);
        if (collection === 'driverAdvances') enforceAdvanceLimit(d, validated, key);
        Object.assign(row, validated, {
          updatedAt: new Date().toISOString(),
        });
        if (collection === 'fuelLogs' && row.vehicleId) {
          const vehicle = d.vehicles.find((candidate) => same(candidate.id, row.vehicleId));
          if (vehicle && row.odometerReading > Number(vehicle.currentOdometer || 0))
            vehicle.currentOdometer = row.odometerReading;
        }
        if (collection === 'corporateTripLogs') {
          recalculateVehicleOdometer(d, previousVehicleId);
          if (!same(previousVehicleId, row.vehicleId)) recalculateVehicleOdometer(d, row.vehicleId);
        }
        if (collection === 'tyreLogs') {
          for (const vehicle of d.vehicles || [])
            vehicle.tyreHistory = (vehicle.tyreHistory || []).filter(
              (history) => !same(history.id, row.id),
            );
          const vehicle = row.vehicleId
            ? d.vehicles.find((candidate) => same(candidate.id, row.vehicleId))
            : null;
          if (vehicle) {
            if (row.odometerAtChange > Number(vehicle.currentOdometer || 0))
              vehicle.currentOdometer = row.odometerAtChange;
            vehicle.tyreHistory.unshift({ ...row });
          }
        }
        return row;
      });
    },
    status(collection, key, status) {
      return repo.change((d) => {
        const row = find(d, collection, key);
        const choices = {
          drivers: ['Available', 'On Trip', 'Off Duty'],
          quotations: ['Draft', 'Sent', 'Accepted', 'Rejected'],
          bookings: ['Confirmed', 'Dispatched', 'Completed', 'Cancelled'],
          inquiries: ['New', 'Contacted', 'Quoted', 'Converted', 'Lost'],
          corporateContracts: ['Active', 'Paused', 'Terminated'],
        };
        row.status = choice(status, choices[collection] || ['Active', 'Inactive'], 'status');
        return row;
      });
    },
    remove(collection, key) {
      return repo.change((d) => {
        const row = find(d, collection, key);
        if (collection === 'bills') {
          if (row.voidedAt) throw new HttpError(409, 'Invoice already cancelled.');
          if (Number(row.totalPaid ?? row.advancePaid) > 0)
            throw new HttpError(
              409,
              'Invoices with payments cannot be cancelled. Retain the financial record.',
            );
          row.voidedAt = new Date().toISOString();
          row.paymentStatus = 'Cancelled';
          row.balanceDue = 0;
          if (row.linkedSlipId) find(d, 'meterReadings', row.linkedSlipId).status = 'Completed';
          return { success: true };
        }
        if (collection === 'meterReadings') {
          if (d.bills.some((b) => same(b.linkedSlipId, key)))
            throw new HttpError(409, 'This slip is referenced by an invoice and must be retained.');
          if ((row.documents || []).length)
            throw new HttpError(409, "Remove this slip's documents before deleting it.");
        }
        if (
          collection === 'vehicles' &&
          ((row.kmLogs || []).length ||
            (row.serviceHistory || []).length ||
            (row.documents || []).length ||
            ['corporateContracts', 'fuelLogs', 'tyreLogs', 'corporateTripLogs'].some((name) =>
              (d[name] || []).some((record) => same(record.vehicleId, key)),
            ))
        )
          throw new HttpError(
            409,
            'This vehicle has maintenance or document history and must be retained.',
          );
        if (['customers', 'drivers'].includes(collection)) {
          const field = collection === 'customers' ? 'customerId' : 'driverId';
          if (
            [
              'bills',
              'quotations',
              'meterReadings',
              'vehicles',
              'bookings',
              'corporateContracts',
              'driverAdvances',
              'fuelLogs',
              'corporateTripLogs',
            ].some((c) =>
              (d[c] || []).some(
                (r) => same(r[field], key) || (field === 'customerId' && same(r.companyId, key)),
              ),
            )
          )
            throw new HttpError(
              409,
              'This record is used in trip history or contracts. Edit it instead of deleting.',
            );
        }
        if (
          collection === 'corporateContracts' &&
          ((d.bills || []).some(
            (bill) => same(bill.corporateContractId, key) && !bill.voidedAt,
          ) ||
            (d.corporateInvoices || []).some((invoice) => same(invoice.contractId, key)) ||
            (d.corporateTripLogs || []).some((log) => same(log.contractId, key)))
        )
          throw new HttpError(
            409,
            'This contract has trip logs or active invoices and must be retained.',
          );
        if (collection === 'tyreLogs') {
          for (const vehicle of d.vehicles || [])
            vehicle.tyreHistory = (vehicle.tyreHistory || []).filter(
              (history) => !same(history.id, key),
            );
        }
        d[collection] = d[collection].filter((r) => !same(r.id, key));
        if (collection === 'corporateTripLogs') recalculateVehicleOdometer(d, row.vehicleId);
        return { success: true };
      });
    },
    pay(key, input) {
      return repo.change((d) => {
        const bill = find(d, 'bills', key);
        if (bill.voidedAt) throw new HttpError(409, 'Cancelled invoice.');
        const requestId = text(input.requestId, 'Payment request ID', true, 100);
        const duplicate = bill.payments.find((p) => p.requestId === requestId);
        if (duplicate) {
          if (
            duplicate.amount !== number(input.amount, 'Payment amount') ||
            duplicate.mode !== (input.mode ?? 'Cash') ||
            duplicate.date !== (input.date || today()) ||
            duplicate.reference !== text(input.reference, 'Reference', false, 200)
          )
            throw new HttpError(
              409,
              'This payment request was already used with different details. Reopen the payment form.',
            );
          return bill;
        }
        const amount = number(input.amount, 'Payment amount');
        if (amount <= 0 || amount > round(bill.balanceDue))
          fail('Payment must be greater than zero and no more than the balance.');
        bill.payments.push({
          id: crypto.randomUUID(),
          requestId,
          amount,
          date: date(input.date || today(), 'Payment date', true),
          mode: choice(
            input.mode,
            ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
            'payment mode',
            'Cash',
          ),
          reference: text(input.reference, 'Reference', false, 200),
          createdAt: new Date().toISOString(),
        });
        bill.totalPaid = round(Number(bill.totalPaid) + amount);
        bill.balanceDue = round(Number(bill.totalAmount) - bill.totalPaid);
        bill.paymentStatus = statusFor(Number(bill.totalAmount), bill.totalPaid);
        return bill;
      });
    },
    addDailyKm(key, input) {
      return repo.change((d) => {
        if (!input || typeof input !== 'object' || Array.isArray(input))
          fail('Expected a JSON object.');
        const vehicle = find(d, 'vehicles', key);
        const dailyKm = number(input.dailyKm, 'Daily KM');
        if (dailyKm <= 0) fail('Daily KM must be greater than zero.');
        const logDate = date(input.date || today(), 'Log date', true);
        if (logDate > today()) fail('Daily KM cannot be recorded for a future date.');
        const newOdometer = round(Number(vehicle.currentOdometer || 0) + dailyKm);
        vehicle.currentOdometer = newOdometer;
        vehicle.kmLogs = vehicle.kmLogs || [];
        vehicle.kmLogs.unshift({
          id: crypto.randomUUID(),
          date: logDate,
          dailyKm,
          odometerReading: newOdometer,
          driverName: text(input.driverName, 'Driver name', false, 200) || vehicle.driverName || '',
          notes: text(input.notes, 'Notes', false, 1000),
          createdAt: new Date().toISOString(),
        });
        vehicle.updatedAt = new Date().toISOString();
        return vehicle;
      });
    },
    recordService(key, input) {
      return repo.change((d) => {
        if (!input || typeof input !== 'object' || Array.isArray(input))
          fail('Expected a JSON object.');
        const vehicle = find(d, 'vehicles', key);
        const serviceDate = date(input.serviceDate || today(), 'Service date', true);
        if (serviceDate > today()) fail('Service cannot be recorded for a future date.');
        const serviceOdometer = number(
          input.serviceOdometer ?? vehicle.currentOdometer,
          'Service odometer reading',
          vehicle.currentOdometer || 0,
        );
        const cost = number(input.cost, 'Service cost', 0);
        const garageName = text(input.garageName, 'Garage / Workshop name', false, 200);
        const notes = text(input.notes, 'Service notes', false, 2000);
        const latestServiceDate = (vehicle.serviceHistory || []).reduce(
          (latest, record) => (record.serviceDate > latest ? record.serviceDate : latest),
          '',
        );
        if (latestServiceDate && serviceDate < latestServiceDate)
          fail('Service date cannot be earlier than the latest recorded service.');
        if (serviceOdometer < Number(vehicle.lastServiceKm || 0))
          fail('Service odometer cannot be lower than the last recorded service.');
        if (serviceOdometer > Number(vehicle.currentOdometer || 0))
          vehicle.currentOdometer = serviceOdometer;
        vehicle.serviceHistory = vehicle.serviceHistory || [];
        vehicle.serviceHistory.unshift({
          id: crypto.randomUUID(),
          serviceDate,
          serviceOdometer,
          garageName,
          cost,
          notes,
          createdAt: new Date().toISOString(),
        });
        vehicle.lastServiceKm = serviceOdometer;
        vehicle.updatedAt = new Date().toISOString();
        return vehicle;
      });
    },
    addMeterDocument(slipKey, docData) {
      return repo.change((d) => {
        const slip = find(d, 'meterReadings', slipKey);
        slip.documents = slip.documents || [];
        const mimeType = text(docData.mimeType, 'MIME type', true, 100);
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
          fail('Only PDF, JPEG, PNG and WebP documents are allowed.');
        const fileSize = number(docData.fileSize, 'File size', 0, 10 * 1024 * 1024);
        if (fileSize <= 0) fail('Uploaded document is empty.');
        const fileUrl = text(docData.fileUrl, 'File URL', true, 500);
        if (!/^\/api\/uploads\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(fileUrl))
          fail('Invalid stored document path.');
        const docId = crypto.randomUUID();
        const doc = {
          id: docId,
          documentType: text(docData.documentType, 'Document type', true, 100),
          title:
            text(docData.title, 'Document title', false, 200) ||
            docData.fileName ||
            'Untitled Document',
          fileName: text(docData.fileName, 'File name', true, 255),
          fileUrl,
          fileSize,
          mimeType,
          notes: text(docData.notes, 'Notes', false, 1000),
          uploadedAt: new Date().toISOString(),
          slipNumber: slip.slipNumber,
          vehicleNumber: slip.vehicleNumber,
        };
        slip.documents.unshift(doc);
        slip.updatedAt = new Date().toISOString();

        if (slip.vehicleNumber) {
          const plateKey = slip.vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const veh = d.vehicles.find(
            (v) =>
              String(v.vehicleNumber || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '') === plateKey,
          );
          if (veh) {
            veh.documents = veh.documents || [];
            veh.documents.unshift(doc);
            veh.updatedAt = new Date().toISOString();
          }
        }

        return { slip, document: doc };
      });
    },
    removeMeterDocument(slipKey, docId) {
      return repo.change((d) => {
        const slip = find(d, 'meterReadings', slipKey);
        slip.documents = slip.documents || [];
        const docIndex = slip.documents.findIndex((doc) => doc.id === docId);
        if (docIndex === -1) throw new HttpError(404, 'Document not found.');
        const [removedDoc] = slip.documents.splice(docIndex, 1);
        slip.updatedAt = new Date().toISOString();

        for (const veh of d.vehicles) {
          if (veh.documents && veh.documents.length) {
            veh.documents = veh.documents.filter((doc) => doc.id !== docId);
          }
        }

        return { success: true, removedDocument: removedDoc, slip };
      });
    },
    calculateCorporateMonthlyKm(contractId, monthStr) {
      return repo.read().then((d) => corporateMonthlySummary(d, contractId, monthStr));
    },
    generateCorporateBill(contractId, monthStr) {
      return repo.change((d) => {
        const summary = corporateMonthlySummary(d, contractId, monthStr);
        const duplicate = (d.bills || []).find(
          (bill) =>
            same(bill.corporateContractId, contractId) &&
            bill.billingMonth === summary.month &&
            !bill.voidedAt,
        );
        if (duplicate)
          throw new HttpError(409, 'An active invoice already exists for this contract and month.');
        const contract = summary.contract;
        const customer = contract.companyId
          ? d.customers.find((candidate) => same(candidate.id, contract.companyId))
          : null;
        const row = {
          ...validate(
            'bills',
            {
              corporateContractId: contract.id,
              billingMonth: summary.month,
              customerId: contract.companyId || '',
              customerName: contract.companyName,
              customerPhone: customer?.phone || '',
              vehicleName: contract.vehicleName || '',
              vehicleNumber: contract.vehicleNumber,
              driverName: contract.driverName || '',
              tripSource: 'Pune (Corporate Tie-up)',
              tripDestination: summary.month + ' Monthly Deployment',
              startDate: summary.periodStart,
              endDate: summary.periodEnd,
              invoiceDate: today(),
              dueDate: today(),
              baseFare: summary.monthlyBaseFare,
              otherCharges: summary.excessCharge,
              taxPercent: 5,
              advancePaid: 0,
              notes:
                'Corporate Monthly Package: ' +
                summary.includedKm +
                ' KM included. Total run: ' +
                summary.totalKmRun +
                ' KM. Excess: ' +
                summary.excessKm +
                ' KM @ ₹' +
                summary.extraRatePerKm +
                '/km (₹' +
                summary.excessCharge +
                ').',
            },
            d,
          ),
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        row.billNumber = nextNumber(d, 'bills', 'billNumber', 'JTT');
        d.bills.unshift(row);
        return { success: true, bill: row, summary };
      });
    },
    getDriverPayroll(monthStr) {
      return repo.read().then((d) => {
        const month = monthStr || today().slice(0, 7);
        return (d.drivers || []).map((driver) => {
          const baseSalary = Number(driver.baseSalary ?? 0);
          const advances = (d.driverAdvances || []).filter(
            (a) => same(a.driverId, driver.id) && (a.month === month || (a.date && a.date.startsWith(month))),
          );
          const totalAdvances = round(advances.reduce((sum, a) => sum + Number(a.amount || 0), 0));
          const remainingSalary = round(baseSalary - totalAdvances);
          const status = remainingSalary <= 0 ? 'Settled' : totalAdvances > 0 ? 'Partial Advance' : 'Unpaid';
          return {
            driverId: driver.id,
            driverName: driver.name,
            phone: driver.phone,
            vehicleAssigned: driver.vehicleAssigned,
            vehicleNumber: driver.vehicleNumber,
            baseSalary,
            totalAdvances,
            remainingSalary,
            status,
            advances,
            licenseNumber: driver.licenseNumber || '',
            licenseDocumentUrl: driver.licenseDocumentUrl || '',
            documents: driver.documents || [],
          };
        });
      });
    },
    addDriverDocument(driverKey, docData) {
      return repo.change((d) => {
        const driver = find(d, 'drivers', driverKey);
        driver.documents = driver.documents || [];
        const mimeType = text(docData.mimeType, 'MIME type', true, 100);
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
          fail('Only PDF, JPEG, PNG and WebP documents are allowed.');
        const fileSize = number(docData.fileSize, 'File size', 0, 10 * 1024 * 1024);
        if (fileSize <= 0) fail('Uploaded document is empty.');
        const fileUrl = text(docData.fileUrl, 'File URL', true, 500);
        if (!/^\/api\/uploads\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(fileUrl))
          fail('Invalid stored document path.');
        const docId = crypto.randomUUID();
        const doc = {
          id: docId,
          documentType: text(docData.documentType || "Driver's License", 'Document type', true, 100),
          title: text(docData.title, 'Document title', false, 200) || docData.fileName || 'Driver License',
          fileName: text(docData.fileName, 'File name', true, 255),
          fileUrl,
          fileSize,
          mimeType,
          uploadedAt: new Date().toISOString(),
        };
        driver.documents.unshift(doc);
        if (doc.documentType.toLowerCase().includes('license')) {
          driver.licenseDocumentUrl = fileUrl;
        }
        driver.updatedAt = new Date().toISOString();
        return { driver, document: doc };
      });
    },
    removeDriverDocument(driverKey, docId) {
      return repo.change((d) => {
        const driver = find(d, 'drivers', driverKey);
        driver.documents = driver.documents || [];
        const docIndex = driver.documents.findIndex((doc) => doc.id === docId);
        if (docIndex === -1) throw new HttpError(404, 'Document not found.');
        const [removedDocument] = driver.documents.splice(docIndex, 1);
        if (driver.licenseDocumentUrl && !driver.documents.some((doc) => doc.fileUrl === driver.licenseDocumentUrl)) {
          driver.licenseDocumentUrl = driver.documents[0]?.fileUrl || '';
        }
        driver.updatedAt = new Date().toISOString();
        return { success: true, removedDocument };
      });
    },
    addVehicleDocument(vehicleKey, docData) {
      return repo.change((d) => {
        const vehicle = find(d, 'vehicles', vehicleKey);
        vehicle.documents = vehicle.documents || [];
        const mimeType = text(docData.mimeType, 'MIME type', true, 100);
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
          fail('Only PDF, JPEG, PNG and WebP documents are allowed.');
        const fileSize = number(docData.fileSize, 'File size', 0, 10 * 1024 * 1024);
        if (fileSize <= 0) fail('Uploaded document is empty.');
        const fileUrl = text(docData.fileUrl, 'File URL', true, 500);
        if (!/^\/api\/uploads\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(fileUrl))
          fail('Invalid stored document path.');
        const docId = crypto.randomUUID();
        const doc = {
          id: docId,
          documentType: text(docData.documentType || 'Vehicle RC', 'Document type', true, 100),
          title: text(docData.title, 'Document title', false, 200) || docData.fileName || 'Vehicle Document',
          fileName: text(docData.fileName, 'File name', true, 255),
          fileUrl,
          fileSize,
          mimeType,
          uploadedAt: new Date().toISOString(),
        };
        vehicle.documents.unshift(doc);
        if (doc.documentType.toLowerCase().includes('rc')) {
          vehicle.rcDocumentUrl = fileUrl;
        }
        vehicle.updatedAt = new Date().toISOString();
        return { vehicle, document: doc };
      });
    },
    removeVehicleDocument(vehicleKey, docId) {
      return repo.change((d) => {
        const vehicle = find(d, 'vehicles', vehicleKey);
        vehicle.documents = vehicle.documents || [];
        const docIndex = vehicle.documents.findIndex((doc) => doc.id === docId);
        if (docIndex === -1) throw new HttpError(404, 'Document not found.');
        const [removedDocument] = vehicle.documents.splice(docIndex, 1);
        if (vehicle.rcDocumentUrl && !vehicle.documents.some((doc) => doc.fileUrl === vehicle.rcDocumentUrl)) {
          vehicle.rcDocumentUrl = vehicle.documents[0]?.fileUrl || '';
        }
        vehicle.updatedAt = new Date().toISOString();
        return { success: true, removedDocument };
      });
    },
  };
}
module.exports = {
  HttpError,
  fail,
  text,
  number,
  date,
  today,
  choice,
  find,
  validate,
  createService,
};
