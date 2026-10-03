const ADMIN_ROLES = new Set(['administrator', 'admin', 'owner']);

const isAdministrator = (user) => ADMIN_ROLES.has(String(user?.role || '').toLowerCase());

const quotationCompany = (settings = {}) =>
  Object.fromEntries(
    ['companyName', 'address', 'phone', 'phone2', 'email']
      .filter((key) => settings[key] !== undefined)
      .map((key) => [key, settings[key]]),
  );

const STAFF_COLLECTIONS = new Set([
  'customers', 'drivers', 'meter-readings', 'quotations', 'vehicles',
  'bookings', 'inquiries', 'fuel-logs', 'tyre-logs',
]);

function staffCanAccess(method, route) {
  if (method === 'GET' && route === '/settings') return true;
  const parts = route.split('/').filter(Boolean);
  if (STAFF_COLLECTIONS.has(parts[0])) {
    if (parts.length === 1) return method === 'GET' || method === 'POST';
    if (parts.length === 2) return ['PUT', 'DELETE'].includes(method);
    if (parts.length === 3 && parts[2] === 'status') return method === 'PATCH';
  }
  if (parts[0] === 'vehicles' && parts.length === 3 &&
      ['daily-km', 'service'].includes(parts[2])) return method === 'POST';
  return false;
}

function redactStaffRecord(value) {
  if (Array.isArray(value)) return value.map(redactStaffRecord);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (['passwordHash', 'baseSalary', 'documents', 'licenseDocumentUrl',
        'driverPhotoUrl', 'rcDocumentUrl'].includes(key)) return [];
      if (key === 'company') return [[key, quotationCompany(item)]];
      return [[key, redactStaffRecord(item)]];
    }),
  );
}

module.exports = { isAdministrator, quotationCompany, staffCanAccess, redactStaffRecord };
