let csrfToken = '';
export async function request(endpoint, options = {}) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  try {
    const res = await fetch('/api' + endpoint, {
      ...options,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...options.headers,
      },
    });
    const data = await res
      .json()
      .catch(() => ({ error: 'Unexpected server response. Check the API connection.' }));
    if (!res.ok) {
      if (res.status === 401 && !endpoint.startsWith('/auth/'))
        window.dispatchEvent(new Event('session-expired'));
      const error = new Error(data.error || 'Request failed.');
      error.status = res.status;
      throw error;
    }
    if (data.csrfToken) csrfToken = data.csrfToken;
    return data;
  } catch (error) {
    if (error.name === 'AbortError')
      throw new Error('The request timed out. Check the connection before retrying.', {
        cause: error,
      });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
const send = (path, method, data) =>
  request(path, { method, body: data === undefined ? undefined : JSON.stringify(data) });
export const api = {
  authStatus: () => request('/auth/status'),
  setup: (data) => send('/auth/setup', 'POST', data),
  login: (data) => send('/auth/login', 'POST', data),
  me: () => request('/auth/me'),
  getSessions: () => request('/auth/sessions'),
  revokeSession: async (id) => {
    const result = await send('/auth/sessions/' + id, 'DELETE');
    if (result.signedOut) csrfToken = '';
    return result;
  },
  logoutAll: async () => {
    const result = await send('/auth/logout-all', 'POST');
    csrfToken = '';
    return result;
  },
  changePassword: async (data) => {
    const result = await send('/auth/change-password', 'POST', data);
    csrfToken = '';
    return result;
  },
  logout: async () => {
    await send('/auth/logout', 'POST');
    csrfToken = '';
  },
  getHealth: () => request('/health'),
  getSettings: () => request('/settings'),
  saveSettings: (data) => send('/settings', 'PUT', data),
  getCustomers: () => request('/customers'),
  addCustomer: (data) => send('/customers', 'POST', data),
  updateCustomer: (id, data) => send('/customers/' + id, 'PUT', data),
  deleteCustomer: (id) => send('/customers/' + id, 'DELETE'),
  getDrivers: () => request('/drivers'),
  addDriver: (data) => send('/drivers', 'POST', data),
  updateDriver: (id, data) => send('/drivers/' + id, 'PUT', data),
  updateDriverStatus: (id, status) => send('/drivers/' + id + '/status', 'PATCH', { status }),
  deleteDriver: (id) => send('/drivers/' + id, 'DELETE'),
  getBills: () => request('/bills'),
  addBill: (data) => send('/bills', 'POST', data),
  deleteBill: (id) => send('/bills/' + id, 'DELETE'),
  addPayment: (id, data) => send('/bills/' + id + '/payments', 'POST', data),
  getQuotations: () => request('/quotations'),
  addQuotation: (data) => send('/quotations', 'POST', data),
  updateQuotationStatus: (id, status) => send('/quotations/' + id + '/status', 'PATCH', { status }),
  deleteQuotation: (id) => send('/quotations/' + id, 'DELETE'),
  getMeterReadings: () => request('/meter-readings'),
  addMeterReading: (data) => send('/meter-readings', 'POST', data),
  updateMeterReading: (id, data) => send('/meter-readings/' + id, 'PUT', data),
  deleteMeterReading: (id) => send('/meter-readings/' + id, 'DELETE'),
  uploadMeterDocument: (id, data) => {
    const form = new FormData();
    form.append('file', data.file);
    form.append('documentType', data.documentType);
    form.append('title', data.title);
    form.append('notes', data.notes);
    return request('/meter-readings/' + id + '/documents', { method: 'POST', body: form });
  },
  getMeterDocuments: (id) => request('/meter-readings/' + id + '/documents'),
  deleteMeterDocument: (slipId, docId) =>
    send('/meter-readings/' + slipId + '/documents/' + docId, 'DELETE'),
  getVehicles: () => request('/vehicles'),
  addVehicle: (data) => send('/vehicles', 'POST', data),
  updateVehicle: (id, data) => send('/vehicles/' + id, 'PUT', data),
  deleteVehicle: (id) => send('/vehicles/' + id, 'DELETE'),
  addDailyKm: (id, data) => send('/vehicles/' + id + '/daily-km', 'POST', data),
  recordVehicleService: (id, data) => send('/vehicles/' + id + '/service', 'POST', data),
  getBookings: () => request('/bookings'),
  addBooking: (data) => send('/bookings', 'POST', data),
  updateBooking: (id, data) => send('/bookings/' + id, 'PUT', data),
  updateBookingStatus: (id, status) => send('/bookings/' + id + '/status', 'PATCH', { status }),
  deleteBooking: (id) => send('/bookings/' + id, 'DELETE'),
  getInquiries: () => request('/inquiries'),
  addInquiry: (data) => send('/inquiries', 'POST', data),
  updateInquiry: (id, data) => send('/inquiries/' + id, 'PUT', data),
  updateInquiryStatus: (id, status) => send('/inquiries/' + id + '/status', 'PATCH', { status }),
  deleteInquiry: (id) => send('/inquiries/' + id, 'DELETE'),
  submitPublicInquiry: (data) => send('/public/inquiries', 'POST', data),

  // Corporate Vehicle Contracts
  getCorporateContracts: () => request('/corporate-contracts'),
  addCorporateContract: (data) => send('/corporate-contracts', 'POST', data),
  updateCorporateContract: (id, data) => send('/corporate-contracts/' + id, 'PUT', data),
  updateCorporateContractStatus: (id, status) =>
    send('/corporate-contracts/' + id + '/status', 'PATCH', { status }),
  deleteCorporateContract: (id) => send('/corporate-contracts/' + id, 'DELETE'),
  getCorporateMonthlySummary: (id, month) =>
    request('/corporate-contracts/' + id + '/monthly-summary' + (month ? `?month=${month}` : '')),
  generateCorporateBill: (id, month) =>
    send('/corporate-contracts/' + id + '/generate-bill', 'POST', { month }),

  // Corporate Daily KM Trip Logs & Employee Commute
  getCorporateTripLogs: () => request('/corporate-trip-logs'),
  addCorporateTripLog: (data) => send('/corporate-trip-logs', 'POST', data),
  updateCorporateTripLog: (id, data) => send('/corporate-trip-logs/' + id, 'PUT', data),
  deleteCorporateTripLog: (id) => send('/corporate-trip-logs/' + id, 'DELETE'),

  // Fuel Logs
  getFuelLogs: () => request('/fuel-logs'),
  addFuelLog: (data) => send('/fuel-logs', 'POST', data),
  updateFuelLog: (id, data) => send('/fuel-logs/' + id, 'PUT', data),
  deleteFuelLog: (id) => send('/fuel-logs/' + id, 'DELETE'),

  // Tyre Logs
  getTyreLogs: () => request('/tyre-logs'),
  addTyreLog: (data) => send('/tyre-logs', 'POST', data),
  updateTyreLog: (id, data) => send('/tyre-logs/' + id, 'PUT', data),
  deleteTyreLog: (id) => send('/tyre-logs/' + id, 'DELETE'),

  // Driver Advances & Payroll
  getDriverAdvances: () => request('/driver-advances'),
  addDriverAdvance: (data) => send('/driver-advances', 'POST', data),
  updateDriverAdvance: (id, data) => send('/driver-advances/' + id, 'PUT', data),
  deleteDriverAdvance: (id) => send('/driver-advances/' + id, 'DELETE'),
  getPayroll: (month) => request('/payroll' + (month ? `?month=${month}` : '')),

  // Document Uploads for Drivers & Vehicles
  uploadDriverDocument: (id, data) => {
    const form = new FormData();
    form.append('file', data.file);
    if (data.documentType) form.append('documentType', data.documentType);
    if (data.title) form.append('title', data.title);
    if (data.notes) form.append('notes', data.notes);
    return request('/drivers/' + id + '/documents', { method: 'POST', body: form });
  },
  deleteDriverDocument: (driverId, docId) =>
    send('/drivers/' + driverId + '/documents/' + docId, 'DELETE'),

  uploadVehicleDocument: (id, data) => {
    const form = new FormData();
    form.append('file', data.file);
    if (data.documentType) form.append('documentType', data.documentType);
    if (data.title) form.append('title', data.title);
    if (data.notes) form.append('notes', data.notes);
    return request('/vehicles/' + id + '/documents', { method: 'POST', body: form });
  },
  deleteVehicleDocument: (vehicleId, docId) =>
    send('/vehicles/' + vehicleId + '/documents/' + docId, 'DELETE'),

  uploadSettingsAsset: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/settings/asset', { method: 'POST', body: form });
  },
};
