export const isAdministrator = (user) =>
  ['administrator', 'admin', 'owner'].includes(String(user?.role || '').toLowerCase());

export const STAFF_TABS = new Set([
  'bookings', 'inquiries', 'meterReadings', 'quotations', 'fuel', 'tyres',
  'vehicles', 'drivers', 'customers',
]);

export const canAccessTab = (user, tab) => isAdministrator(user) || STAFF_TABS.has(tab);
