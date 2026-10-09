import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import BillModal from '../components/bills/BillModal';
import QuotationModal from '../components/quotations/QuotationModal';
import QuotationTable from '../components/quotations/QuotationTable';
import MeterReadingModal from '../components/meterReadings/MeterReadingModal';
import MeterReadingTable from '../components/meterReadings/MeterReadingTable';
import MeterDocumentModal from '../components/meterReadings/MeterDocumentModal';
import BillPrintView from '../components/bills/BillPrintView';
import QuotationPrintView, { quoteMessage } from '../components/quotations/QuotationPrintView';
import VehicleTable from '../components/vehicles/VehicleTable';
import DailyKmModal from '../components/vehicles/DailyKmModal';
import ServiceRecordModal from '../components/vehicles/ServiceRecordModal';
import Dashboard from '../components/Dashboard';
import LoginForm from '../components/LoginForm';
import ConfirmModal from '../components/ConfirmModal';
import CorporateTripLogModal from '../components/corporate/CorporateTripLogModal';
import CorporateLogsheetView from '../components/corporate/CorporateLogsheetView';
import CorporateContractTable from '../components/corporate/CorporateContractTable';
import CorporateQuotationHub from '../components/corporate/CorporateQuotationHub';
import CorporateQuotationPrintView from '../components/corporate/CorporateQuotationPrintView';
import CorporateInvoiceTable from '../components/corporate/CorporateInvoiceTable';
import CorporateInvoiceModal from '../components/corporate/CorporateInvoiceModal';
import CorporateLogsheetPrintView from '../components/corporate/CorporateLogsheetPrintView';
import App from '../App';
import Sidebar from '../components/Sidebar';
import TeamUsers from '../components/TeamUsers';
import { localDate, dateInput } from '../utils/formatters';
import { api } from '../services/api';
afterEach(() => vi.restoreAllMocks());
it('shows daily operations to staff but hides corporate, billing, payroll and settings', () => {
  render(<Sidebar activeTab="quotations" setActiveTab={vi.fn()} user={{ role: 'Staff' }} />);
  expect(screen.getByRole('button', { name: /^Quotations/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Fuel Expenses/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Tyre Management/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Corporate Contracts/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /^Corporate Invoices/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /^Corporate Quotations/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /^Customer Invoices/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /^Driver Salary/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /^Business Settings/ })).toBeNull();
});
it('prepares a corporate monthly quote and shows server-bound proposal details', async () => {
  const add = vi.spyOn(api, 'addCorporateQuotation').mockResolvedValue({ id: 'new-quote' });
  const refresh = vi.fn().mockResolvedValue();
  render(<CorporateQuotationHub quotations={[]} customers={[]} vehicles={[]} onRefresh={refresh} onView={vi.fn()} onOpenContracts={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'New corporate quotation' }));
  const editor = screen.getByRole('dialog', { name: 'New corporate quotation' });
  fireEvent.change(within(editor).getByLabelText('Company name *'), { target: { value: 'Example Industries' } });
  fireEvent.change(within(editor).getByLabelText('Phone *'), { target: { value: '9876543210' } });
  fireEvent.change(within(editor).getByLabelText('Vehicle type *'), { target: { value: 'Innova Crysta' } });
  fireEvent.change(within(editor).getByLabelText('Monthly fixed fare ₹ *'), { target: { value: '45000' } });
  fireEvent.change(within(editor).getByLabelText('Included KM/month'), { target: { value: '2500' } });
  fireEvent.change(within(editor).getByLabelText('Excess rate ₹/KM'), { target: { value: '14' } });
  expect(within(editor).queryByLabelText('Estimated excess KM')).toBeNull();
  expect(within(editor).queryByLabelText('Valid until *')).toBeNull();
  expect(within(editor).getByText('₹53,100.00')).toBeTruthy();
  fireEvent.click(within(editor).getByRole('button', { name: 'Save quotation' }));
  await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
  expect(add.mock.calls[0][0].lineItems[0]).toMatchObject({ vehicleType: 'Innova Crysta', includedMonthlyKm: '2500', extraRatePerKm: '14' });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
});
it('shows quote editing and print without contract or approval actions', () => {
  const quote = {
    id: 'q1', quotationNumber: 'CQ-2026-001', revision: 2, status: 'Draft',
    companyName: 'Example Industries', contactPhone: '9876543210',
    quotationDate: '2026-10-08', validityDate: '2026-10-20', proposedStartDate: '2026-11-01',
    lineItems: [
      { id: 'line-1', vehicleType: 'Innova', monthlyBaseFare: 45000, includedMonthlyKm: 2500, extraRatePerKm: 14, estimatedExtraKm: 100, estimatedExtraCharge: 1400 },
      { id: 'line-2', vehicleType: 'Sedan', monthlyBaseFare: 30000, includedMonthlyKm: 2000, extraRatePerKm: 12, estimatedExtraKm: 0, estimatedExtraCharge: 0 },
    ],
    fixedMonthlyTotal: 75000, estimatedExcessTotal: 1400, estimatedOtherCharges: 0,
    estimatedSubtotal: 76400, estimatedTax: 13752, estimatedTotal: 90152,
    taxMode: 'gst', gstRate: 18, contractIds: [],
    revisions: [{ revision: 1, quotationNumber: 'CQ-2026-001', quotationDate: '2026-10-08', companyName: 'Example Industries', contactPhone: '9876543210', validityDate: '2026-10-20', proposedStartDate: '2026-11-01', lineItems: [], fixedMonthlyTotal: 0, estimatedExcessTotal: 0, estimatedSubtotal: 0, estimatedTax: 0, estimatedTotal: 0, taxMode: 'gst', gstRate: 18 }],
  };
  render(<CorporateQuotationHub quotations={[quote]} customers={[]} onRefresh={vi.fn().mockResolvedValue()} onView={vi.fn()} onOpenContracts={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'View / PDF' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Mark sent' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Create contracts' })).toBeNull();
  render(<CorporateQuotationPrintView quotation={quote} settings={{ companyName: 'Jagtap Travels' }} onClose={vi.fn()} />);
  const preview = screen.getByRole('dialog', { name: 'Corporate quotation preview' });
  expect(within(preview).getByText('₹90,152.00')).toBeTruthy();
  fireEvent.change(within(preview).getByLabelText('Quotation revision'), { target: { value: '0' } });
  expect(within(preview).getByText('Previous version · Revision 1')).toBeTruthy();
});
it('shows a red dustbin only for staff and deletes the selected staff account', async () => {
  const admin = { id: 'admin-1', fullName: 'Owner', email: 'owner@example.invalid', role: 'Administrator' };
  const staff = { id: 'staff-1', fullName: 'Operator', email: 'operator@example.invalid', role: 'Staff', active: true };
  vi.spyOn(api, 'getUsers').mockResolvedValueOnce([admin, staff]).mockResolvedValueOnce([admin]);
  const deleteUser = vi.spyOn(api, 'deleteUser').mockResolvedValue({ success: true });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<TeamUsers />);
  const deleteButton = await screen.findByRole('button', { name: 'Delete staff account for Operator' });
  expect(deleteButton.className).toContain('text-rose-600');
  expect(deleteButton.querySelector('svg')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Delete staff account for Owner' })).toBeNull();
  fireEvent.click(deleteButton);
  await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('staff-1'));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete staff account for Operator' })).toBeNull());
});
it('shows and hides the six-character staff password before account creation', async () => {
  vi.spyOn(api, 'getUsers').mockResolvedValue([]);
  render(<TeamUsers />);
  const password = screen.getByLabelText('Password');
  expect(password.minLength).toBe(6);
  expect(password.type).toBe('password');
  fireEvent.change(password, { target: { value: 'S3cret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(password.type).toBe('text');
  expect(password.value).toBe('S3cret');
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(password.type).toBe('password');
});
const input = (container, key) => container.querySelector(key);
it('resets bill amounts, advance and customer on a new open', async () => {
  const props = { isOpen: true, onClose: vi.fn(), onSave: vi.fn() };
  const { container, rerender } = render(<BillModal {...props} />);
  const base = container.querySelector('input[placeholder="e.g. 5000"]');
  fireEvent.change(base, { target: { value: '999' } });
  rerender(<BillModal {...props} isOpen={false} />);
  rerender(<BillModal {...props} />);
  await waitFor(() =>
    expect(container.querySelector('input[placeholder="e.g. 5000"]').value).toBe('5000'),
  );
  expect(container.querySelector('input[placeholder="e.g. Rajesh Sharma"]').value).toBe('');
});
it('zero-tax linked bill preserves meters and zero allowance; cannot choose Paid manually', async () => {
  const onSave = vi.fn().mockResolvedValue({});
  const slip = {
    id: 's',
    customerId: 'c',
    customerName: 'Client',
    driverName: 'Driver',
    vehicleName: 'Car',
    tripSource: 'Pune',
    tripDestination: 'Mumbai',
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    openingKm: 1000,
    closingKm: 1100,
    totalKm: 100,
    ratePerKm: 20,
    driverAllowance: 0,
    tollParking: 0,
    status: 'Completed',
  };
  const { container } = render(
    <BillModal
      isOpen
      onClose={() => {}}
      onSave={onSave}
      preselectedSlip={slip}
      customers={[{ id: 'c', phone: '9876543210' }]}
    />,
  );
  const gst = Array.from(container.querySelectorAll('select')).find((s) =>
    s.textContent.includes('No Tax'),
  );
  fireEvent.change(gst, { target: { value: '0' } });
  await waitFor(() => expect(container.textContent).toContain('2,000.00'));
  fireEvent.submit(container.querySelector('form'));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const payload = onSave.mock.calls[0][0];
  expect(payload.startKm).toBe(1000);
  expect(payload.totalKm).toBe(100);
  expect(payload.driverAllowance).toBe(0);
  expect(payload.customerPhone).toBe('9876543210');
  expect(payload.taxAmount).toBe(0);
  const status = Array.from(container.querySelectorAll('select')).find((s) =>
    s.textContent.includes('Paid in Full'),
  );
  expect(status.disabled).toBe(true);
});
it('quote resets on new open and accepts clearing the selected customer', async () => {
  const props = {
    isOpen: true,
    onClose: () => {},
    onSave: vi.fn(),
    customers: [{ id: 'c', name: 'Alice', phone: '123' }],
  };
  const { container, rerender } = render(<QuotationModal {...props} />);
  const select = container.querySelector('select');
  fireEvent.change(select, { target: { value: 'c' } });
  expect(container.querySelector('input[placeholder="e.g. Rajesh Sharma"]').value).toBe('Alice');
  fireEvent.change(select, { target: { value: '' } });
  expect(container.querySelector('input[placeholder="e.g. Rajesh Sharma"]').value).toBe('');
  const title = container.querySelector('input[placeholder^="e.g. Mahabaleshwar Weekend"]');
  fireEvent.change(title, { target: { value: 'Previous tour' } });
  rerender(<QuotationModal {...props} isOpen={false} />);
  rerender(<QuotationModal {...props} />);
  await waitFor(() =>
    expect(container.querySelector('input[placeholder^="e.g. Mahabaleshwar Weekend"]').value).toBe(
      '',
    ),
  );
});
it('meter edit preserves zero rates and rejects reversed readings', async () => {
  const onSave = vi.fn();
  const { container } = render(
    <MeterReadingModal
      isOpen
      onSave={onSave}
      onClose={() => {}}
      readingToEdit={{
        id: 1,
        vehicleName: 'Car',
        driverName: 'Driver',
        tripSource: 'Pune',
        tripDestination: 'Mumbai',
        startDate: '2026-09-12',
        endDate: '2026-09-13',
        openingKm: 1000,
        closingKm: 1100,
        totalKm: 100,
        ratePerKm: 0,
        driverAllowance: 0,
        status: 'Completed',
      }}
    />,
  );
  fireEvent.change(container.querySelector('input[placeholder="e.g. 42680"]'), {
    target: { value: '900' },
  });
  fireEvent.submit(container.querySelector('form'));
  await waitFor(() => expect(container.textContent).toContain('Closing KM must be at least'));
  expect(onSave).not.toHaveBeenCalled();
});
it('invoice reconciles discount, zero tax, issue date, package fare and payments', () => {
  render(
    <BillPrintView
      onClose={() => {}}
      bill={{
        billNumber: 'B-1',
        invoiceDate: '2026-09-13',
        startDate: '2026-09-12',
        endDate: '2026-09-12',
        billingType: 'package',
        kmAmount: 1000,
        subtotal: 1000,
        taxPercent: 0,
        taxAmount: 0,
        discount: 100,
        totalAmount: 900,
        totalPaid: 900,
        balanceDue: 0,
        paymentStatus: 'Paid',
        payments: [{ id: 'p', amount: 900, date: '2026-09-13', mode: 'UPI' }],
      }}
    />,
  );
  expect(screen.getByText('Discount (−)')).toBeTruthy();
  expect(screen.getByText('GST (0%)')).toBeTruthy();
  expect(screen.getByText('Package / trip fare')).toBeTruthy();
  expect(screen.getByText('Payment history')).toBeTruthy();
  expect(screen.queryByText(/Opening:/)).toBeNull();
});
it('quotation prints optional fields and uses configured contact details', () => {
  const quote = {
    quotationNumber: 'Q-1',
    customerName: 'Alice',
    customerEmail: 'alice@example.invalid',
    validityDate: '2026-09-12',
    travelDate: '2026-09-13',
    company: { companyName: 'Actual Company', phone: '1234567890' },
  };
  render(<QuotationPrintView quote={quote} />);
  expect(screen.getByText('alice@example.invalid')).toBeTruthy();
  expect(screen.getByText(/Valid until:/)).toBeTruthy();
  expect(screen.getByText(/Travel date:/)).toBeTruthy();
  expect(quoteMessage(quote, quote.company)).toContain('1234567890');
});
it('network failure never logs in with demo credentials', async () => {
  vi.spyOn(api, 'authStatus').mockResolvedValue({ setupRequired: false });
  vi.spyOn(api, 'login').mockRejectedValue(new Error('Offline'));
  const success = vi.fn();
  render(<LoginForm onLoginSuccess={success} />);
  await screen.findByRole('button', { name: 'Sign in' });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@jagtaptours.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(success).not.toHaveBeenCalled();
});
it('toggles login password visibility without submitting the form', async () => {
  vi.spyOn(api, 'authStatus').mockResolvedValue({ setupRequired: false });
  const login = vi.spyOn(api, 'login');
  render(<LoginForm onLoginSuccess={vi.fn()} />);
  const password = await screen.findByLabelText('Password');
  fireEvent.change(password, { target: { value: 'MySecretPassword' } });
  expect(password.type).toBe('password');
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(password.type).toBe('text');
  expect(password.value).toBe('MySecretPassword');
  expect(login).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(password.type).toBe('password');
});
it('asks for sign-out confirmation and only logs out after confirmation', async () => {
  const originalPath = window.location.pathname;
  window.history.replaceState({}, '', '/admin');
  vi.spyOn(api, 'me').mockResolvedValue({ user: { id: 'admin-1', fullName: 'Admin', role: 'Administrator' } });
  vi.spyOn(api, 'authStatus').mockResolvedValue({ setupRequired: false });
  for (const key of Object.keys(api).filter((name) => name.startsWith('get'))) {
    vi.spyOn(api, key).mockResolvedValue([]);
  }
  api.getSettings.mockResolvedValue({});
  api.getHealth.mockResolvedValue({ status: 'ready', storage: 'postgres' });
  const logout = vi.spyOn(api, 'logout').mockResolvedValue({});
  render(<App />);
  const logoutButton = await screen.findByRole('button', { name: 'Logout' });
  fireEvent.click(logoutButton);
  let dialog = screen.getByRole('dialog', { name: 'Sign out of CRM' });
  expect(logout).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog', { name: 'Sign out of CRM' })).toBeNull();
  expect(logout).not.toHaveBeenCalled();
  fireEvent.click(logoutButton);
  dialog = screen.getByRole('dialog', { name: 'Sign out of CRM' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
  window.history.replaceState({}, '', originalPath);
});
it('malformed old browser credentials do not crash or authenticate', async () => {
  window.history.replaceState({}, '', '/admin');
  localStorage.setItem('jagtap_crm_user', '{broken');
  vi.spyOn(api, 'me').mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
  vi.spyOn(api, 'authStatus').mockResolvedValue({ setupRequired: false });
  render(<App />);
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
  expect(localStorage.getItem('jagtap_crm_user')).toBeNull();
});
it('calendar dates remain date-only and India timestamp conversion is stable', () => {
  expect(dateInput('2026-09-11T18:30:00.000Z')).toBe('2026-09-12');
  expect(dateInput('2026-09-12')).toBe('2026-09-12');
  expect(localDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
it('corporate invoice search accepts displayed, numeric and ISO dates', () => {
  render(
    <CorporateInvoiceTable
      invoices={[
        {
          id: 'invoice-1',
          invoiceNo: 'CORP-001',
          invoiceDate: '2026-10-01',
          month: '2026-10',
          period: 'OCTOBER',
          partyName: 'Alpha Industries',
          partyGstin: '27ABCDE1234F1Z5',
          vehicleNumbers: 'MH 12 AB 1234',
          grandTotal: 1416,
          lineItems: [{ particulars: 'Monthly corporate commute' }],
        },
        {
          id: 'invoice-2',
          invoiceNo: 'CORP-002',
          invoiceDate: '2026-11-15',
          month: '2026-11',
          period: 'NOVEMBER',
          partyName: 'Beta Industries',
          grandTotal: 2000,
          lineItems: [{ particulars: 'Airport transport' }],
        },
      ]}
    />,
  );
  const search = screen.getByPlaceholderText(/Search by party name/);
  fireEvent.change(search, { target: { value: '01 Oct 2026' } });
  expect(screen.getByText('CORP-001')).toBeTruthy();
  expect(screen.queryByText('CORP-002')).toBeNull();
  fireEvent.change(search, { target: { value: '01/10/2026' } });
  expect(screen.getByText('CORP-001')).toBeTruthy();
  fireEvent.change(search, { target: { value: 'MH 12 AB 1234' } });
  expect(screen.getByText('CORP-001')).toBeTruthy();
  fireEvent.change(search, { target: { value: '' } });
  fireEvent.change(screen.getByPlaceholderText('Filter Date (YYYY-MM)'), {
    target: { value: '2026-11' },
  });
  expect(screen.getByText('CORP-002')).toBeTruthy();
  expect(screen.queryByText('CORP-001')).toBeNull();
});
it('corporate invoice server failure remains unsaved and does not notify the register', async () => {
  vi.spyOn(api, 'getSavedCorporateInvoice').mockResolvedValue(null);
  vi.spyOn(api, 'saveCorporateInvoice').mockRejectedValue(new Error('Database unavailable'));
  const onInvoiceSaved = vi.fn();
  render(
    <CorporateInvoiceModal
      isOpen
      onClose={() => {}}
      contract={{
        id: 'contract-1',
        companyName: 'Alpha Industries',
        vehicleName: 'Innova Crysta',
        vehicleNumber: 'MH 12 AB 1234',
        includedMonthlyKm: 3000,
        monthlyBaseFare: 50000,
        extraRatePerKm: 15,
      }}
      selectedMonth="2026-10"
      onInvoiceSaved={onInvoiceSaved}
    />,
  );
  const invoiceNumber = await screen.findByLabelText('Invoice No');
  fireEvent.change(invoiceNumber, { target: { value: 'CORP-FAIL-001' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Invoice & View Preview' }));
  await waitFor(() => expect(api.saveCorporateInvoice).toHaveBeenCalled());
  expect(onInvoiceSaved).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Save Invoice & View Preview' })).toBeTruthy();
  expect(screen.getByText(/Unsaved customizations/)).toBeTruthy();
});

it('corporate invoice renders bank name and branch dynamically from settings', async () => {
  vi.spyOn(api, 'getSavedCorporateInvoice').mockResolvedValue(null);
  render(
    <CorporateInvoiceModal
      isOpen
      onClose={() => {}}
      contract={{
        id: 'contract-1',
        companyName: 'Alpha Industries',
        vehicleName: 'Innova Crysta',
        vehicleNumber: 'MH 12 AB 1234',
        includedMonthlyKm: 3000,
        monthlyBaseFare: 50000,
        extraRatePerKm: 15,
      }}
      selectedMonth="2026-10"
      settings={{
        bankName: 'AXIS Bank',
        bankBranch: 'Saswad Branch',
        phone: '9011507220',
        phone2: '8888094770',
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  expect(screen.getByText(/BANK -\s+AXIS Bank/)).toBeTruthy();
  expect(screen.getByText(/BRANCH -\s+Saswad Branch/)).toBeTruthy();
  expect(screen.getByText('9011507220')).toBeTruthy();
  expect(screen.getByText('8888094770')).toBeTruthy();
});
it('shows the configured payment QR only on corporate Non-GST invoices', () => {
  vi.spyOn(api, 'getSavedCorporateInvoice').mockResolvedValue(null);
  const contract = {
    id: 'contract-qr',
    companyName: 'Alpha Industries',
    vehicleName: 'Innova Crysta',
    vehicleNumber: 'MH 12 AB 1234',
    includedMonthlyKm: 3000,
    monthlyBaseFare: 50000,
    extraRatePerKm: 15,
  };
  const props = {
    isOpen: true,
    onClose: () => {},
    contract,
    selectedMonth: '2026-10',
    settings: { nonGstQrUrl: '/api/uploads/payment-qr.png' },
  };
  const nonGst = render(<CorporateInvoiceModal {...props} initialIsNonGst />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  expect(screen.getByAltText('Non-GST Payment QR').getAttribute('src')).toBe('/api/uploads/payment-qr.png');
  nonGst.unmount();

  const gst = render(<CorporateInvoiceModal {...props} initialIsNonGst={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  expect(screen.queryByAltText('Non-GST Payment QR')).toBeNull();
  gst.unmount();

  render(<CorporateInvoiceModal {...props} initialIsNonGst settings={{ nonGstQrUrl: 'none' }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  expect(screen.queryByAltText('Non-GST Payment QR')).toBeNull();
});
it('renders QuotationTable with empty and populated data without runtime error', () => {
  const { rerender } = render(
    <QuotationTable
      quotations={[]}
      onAddQuotation={() => {}}
      onViewQuotation={() => {}}
      onDeleteQuotation={() => {}}
      onUpdateStatus={() => {}}
    />,
  );
  expect(screen.getByText('No quotations found')).toBeTruthy();

  rerender(
    <QuotationTable
      quotations={[
        {
          id: 'q1',
          quotationNumber: 'Q-1001',
          customerName: 'Suresh Patil',
          tourTitle: 'Mahabaleshwar 3D Tour',
          vehicleType: 'Innova Crysta',
          totalAmount: 12500,
          status: 'Draft',
        },
      ]}
      onAddQuotation={() => {}}
      onViewQuotation={() => {}}
      onDeleteQuotation={() => {}}
      onUpdateStatus={() => {}}
    />,
  );
  expect(screen.getByText('Q-1001')).toBeTruthy();
  expect(screen.getByText('Suresh Patil')).toBeTruthy();
});

it('VehicleTable renders 30,000 KM progress, badges, and triggers daily KM and service callbacks', () => {
  const onDailyKm = vi.fn();
  const onService = vi.fn();
  const onAddVehicle = vi.fn();
  const onHistory = vi.fn();

  const vehicles = [
    {
      id: 'v1',
      name: 'Toyota Innova Crysta',
      vehicleNumber: 'MH 12 AB 1234',
      driverName: 'Ramesh Pawar',
      currentOdometer: 14500,
      lastServiceKm: 0,
      serviceIntervalKm: 30000,
      kmSinceLastService: 14500,
      targetServiceKm: 30000,
      kmRemaining: 15500,
      progressPercent: 48,
      status: 'Healthy',
    },
    {
      id: 'v2',
      name: 'Maruti Ertiga',
      vehicleNumber: 'MH 14 CD 5678',
      driverName: 'Sanjay Shinde',
      currentOdometer: 30200,
      lastServiceKm: 0,
      serviceIntervalKm: 30000,
      kmSinceLastService: 30200,
      targetServiceKm: 30000,
      kmRemaining: -200,
      progressPercent: 100,
      status: 'Service Due',
    },
  ];

  render(
    <VehicleTable
      vehicles={vehicles}
      onAddVehicle={onAddVehicle}
      onEditVehicle={() => {}}
      onDeleteVehicle={() => {}}
      onOpenDailyKm={onDailyKm}
      onOpenServiceRecord={onService}
      onOpenHistory={onHistory}
    />,
  );

  // Checks headers and vehicles
  expect(screen.getByText('Toyota Innova Crysta')).toBeTruthy();
  expect(screen.getByText('Maruti Ertiga')).toBeTruthy();
  expect(screen.getByText('MH 12 AB 1234')).toBeTruthy();
  expect(screen.getByText('MH 14 CD 5678')).toBeTruthy();

  // Overdue countdown alert
  expect(screen.getByText(/200 KM Overdue! Service immediately/i)).toBeTruthy();

  // Buttons trigger callbacks
  const logKmButtons = screen.getAllByRole('button', { name: /KM/i });
  fireEvent.click(logKmButtons[0]);
  expect(onDailyKm).toHaveBeenCalled();

  const serviceButtons = screen.getAllByRole('button', { name: /Service/i });
  fireEvent.click(serviceButtons[0]);
  expect(onService).toHaveBeenCalled();
});

it('DailyKmModal calculates cumulative odometer, warns on 30,000 KM threshold, and saves', async () => {
  const onSave = vi.fn().mockResolvedValue();
  const onClose = vi.fn();
  const vehicle = {
    id: 'v1',
    name: 'Toyota Innova Crysta',
    vehicleNumber: 'MH 12 AB 1234',
    currentOdometer: 29800,
    lastServiceKm: 0,
    serviceIntervalKm: 30000,
  };

  const { container } = render(
    <DailyKmModal
      isOpen={true}
      onClose={onClose}
      onSave={onSave}
      vehicles={[vehicle]}
      preselectedVehicle={vehicle}
    />,
  );

  expect(screen.getByText('Log Daily Vehicle KM')).toBeTruthy();
  expect(screen.getAllByText(/29,800/i).length).toBeGreaterThan(0);

  // Enter daily KM that crosses 30,000 KM threshold
  const kmInput = container.querySelector('input[placeholder="e.g. 180"]');
  fireEvent.change(kmInput, { target: { value: '350' } });

  // Verify new odometer preview: 29800 + 350 = 30150
  expect(screen.getByText('30,150 KM')).toBeTruthy();
  // Threshold warning triggered
  expect(
    screen.getByText(
      /Warning: This addition reaches\/exceeds the 30,000 KM interval. Servicing will be due./i,
    ),
  ).toBeTruthy();

  // Save entry
  fireEvent.click(screen.getByRole('button', { name: /Save Daily KM/i }));
  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith('v1', expect.objectContaining({ dailyKm: 350 }));
    expect(onClose).toHaveBeenCalled();
  });
});

it('ServiceRecordModal resets 30,000 KM cycle and submits garage details', async () => {
  const onSave = vi.fn().mockResolvedValue();
  const onClose = vi.fn();
  const vehicle = {
    id: 'v2',
    name: 'Maruti Ertiga',
    vehicleNumber: 'MH 14 CD 5678',
    currentOdometer: 30500,
    lastServiceKm: 0,
    serviceIntervalKm: 30000,
  };

  const { container } = render(
    <ServiceRecordModal isOpen={true} onClose={onClose} onSave={onSave} vehicle={vehicle} />,
  );

  expect(screen.getByText('Record Vehicle Servicing')).toBeTruthy();
  // Shows next cycle target (30500 + 30000 = 60500 KM)
  expect(screen.getByText(/Next Service Scheduled at 60,500 KM/i)).toBeTruthy();

  // Enter garage name and cost
  const garageInput = container.querySelector(
    'input[placeholder="e.g. Sai Service Centre, Wakad"]',
  );
  fireEvent.change(garageInput, { target: { value: 'Maruti Authorized Service' } });

  const costInput = container.querySelector('input[placeholder="e.g. 4500"]');
  fireEvent.change(costInput, { target: { value: '9200' } });

  fireEvent.click(screen.getByRole('button', { name: /Mark Serviced & Reset Cycle/i }));
  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      'v2',
      expect.objectContaining({
        garageName: 'Maruti Authorized Service',
        cost: 9200,
        serviceOdometer: 30500,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});

it('Dashboard displays 30,000 KM Service Due Reminder banner when maintenance is overdue', () => {
  const setActiveTab = vi.fn();
  const onOpenDailyKm = vi.fn();

  const dueVehicles = [
    {
      id: 'v2',
      name: 'Maruti Ertiga',
      vehicleNumber: 'MH 14 CD 5678',
      currentOdometer: 30200,
      lastServiceKm: 0,
      serviceIntervalKm: 30000,
      kmSinceLastService: 30200,
      targetServiceKm: 30000,
      kmRemaining: -200,
      progressPercent: 100,
      status: 'Service Due',
    },
  ];

  render(
    <Dashboard
      user={{ name: 'Admin', role: 'admin' }}
      customers={[]}
      drivers={[]}
      meterReadings={[]}
      bills={[]}
      quotations={[]}
      vehicles={dueVehicles}
      setActiveTab={setActiveTab}
      onOpenDailyKm={onOpenDailyKm}
    />,
  );

  // Banner should appear
  expect(screen.getByText(/Vehicle Maintenance Due Reminder!/i)).toBeTruthy();
  expect(screen.getByText(/Maruti Ertiga/i)).toBeTruthy();
  expect(screen.getByText(/has reached its/i)).toBeTruthy();

  // Clicking "Manage Service & Reset" changes tab to 'vehicles'
  const reviewButton = screen.getByRole('button', { name: /Manage Service & Reset/i });
  fireEvent.click(reviewButton);
  expect(setActiveTab).toHaveBeenCalledWith('vehicles');
});

it('MeterReadingTable renders vehicle documents button with badge and triggers onOpenDocuments', () => {
  const onOpenDocuments = vi.fn();
  const sampleReadings = [
    {
      id: 'slip-101',
      slipNumber: 'DS-2026-001',
      vehicleName: 'Toyota Innova Crysta',
      vehicleNumber: 'MH 12 QX 4589',
      driverName: 'Santosh Patil',
      tripSource: 'Pune',
      tripDestination: 'Mahabaleshwar',
      openingKm: 42150,
      closingKm: 42680,
      totalKm: 530,
      status: 'Completed',
      documents: [
        {
          id: 'doc-1',
          documentType: 'Registration Certificate (RC)',
          title: 'Innova RC Book',
          fileName: 'innova_rc.pdf',
          fileUrl: '/api/uploads/innova_rc.pdf',
          fileSize: 204800,
        },
      ],
    },
  ];

  render(
    <MeterReadingTable
      meterReadings={sampleReadings}
      onAddReading={vi.fn()}
      onEditReading={vi.fn()}
      onDeleteReading={vi.fn()}
      onCreateBillFromSlip={vi.fn()}
      onOpenDocuments={onOpenDocuments}
    />,
  );

  // Docs button with count badge "1" should be visible
  const docsButton = screen.getByRole('button', { name: /Docs/i });
  expect(docsButton).toBeTruthy();
  expect(docsButton.textContent).toContain('1');
  fireEvent.click(docsButton);
  expect(onOpenDocuments).toHaveBeenCalledWith(sampleReadings[0]);
});

it('MeterDocumentModal displays attached documents and supports switching to upload tab', async () => {
  vi.spyOn(api, 'getMeterDocuments').mockResolvedValue([
    {
      id: 'doc-1',
      documentType: 'Vehicle Insurance Policy',
      title: 'HDFC ERGO Comprehensive Policy',
      fileName: 'insurance_policy.pdf',
      fileUrl: '/api/uploads/test.pdf',
      fileSize: 524288,
      uploadedAt: '2026-09-15T09:00:00.000Z',
    },
  ]);

  const reading = {
    id: 'slip-101',
    slipNumber: 'DS-2026-001',
    vehicleName: 'Toyota Innova Crysta',
    vehicleNumber: 'MH 12 QX 4589',
    documents: [
      {
        id: 'doc-1',
        documentType: 'Vehicle Insurance Policy',
        title: 'HDFC ERGO Comprehensive Policy',
        fileName: 'insurance_policy.pdf',
        fileUrl: '/api/uploads/test.pdf',
        fileSize: 524288,
        uploadedAt: '2026-09-15T09:00:00.000Z',
      },
    ],
  };

  const onClose = vi.fn();
  const onDocumentsUpdated = vi.fn();

  render(
    <MeterDocumentModal
      isOpen
      onClose={onClose}
      reading={reading}
      onDocumentsUpdated={onDocumentsUpdated}
    />,
  );

  // Header should display slip and vehicle info
  expect(screen.getByText('DS-2026-001')).toBeTruthy();
  expect(screen.getByText('Toyota Innova Crysta')).toBeTruthy();
  expect(screen.getByText('MH 12 QX 4589')).toBeTruthy();

  // Document should be listed
  expect(screen.getByText('HDFC ERGO Comprehensive Policy')).toBeTruthy();
  expect(screen.getByText(/insurance_policy\.pdf/i)).toBeTruthy();

  // Switch to upload tab
  const uploadTabButton = screen.getByRole('button', { name: /Upload New Document/i });
  fireEvent.click(uploadTabButton);

  expect(screen.getByText(/Select Document File/i)).toBeTruthy();
  expect(screen.getByText(/Document Category/i)).toBeTruthy();
});

it('ConfirmModal renders in CRM theme with title, message, and responds to confirm/cancel', async () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  const { rerender } = render(
    <ConfirmModal
      isOpen
      title="Delete Vehicle"
      message="Delete this vehicle from fleet maintenance records?"
      confirmText="Delete Vehicle"
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );

  expect(screen.getByRole('heading', { name: 'Delete Vehicle' })).toBeTruthy();
  expect(screen.getByText('Delete this vehicle from fleet maintenance records?')).toBeTruthy();

  // Test Cancel button
  const cancelButton = screen.getByRole('button', { name: /cancel/i });
  fireEvent.click(cancelButton);
  expect(onClose).toHaveBeenCalledTimes(1);

  // Test Confirm button
  const confirmButton = screen.getByRole('button', { name: /delete vehicle/i });
  fireEvent.click(confirmButton);
  expect(onConfirm).toHaveBeenCalledTimes(1);

  // Test hidden when isOpen is false
  rerender(
    <ConfirmModal
      isOpen={false}
      title="Delete Vehicle"
      message="Delete this vehicle from fleet maintenance records?"
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  expect(screen.queryByText('Delete this vehicle from fleet maintenance records?')).toBeNull();
});

it('MeterDocumentModal opens themed ConfirmModal on delete and calls api.deleteMeterDocument on confirm', async () => {
  const deleteSpy = vi.spyOn(api, 'deleteMeterDocument').mockResolvedValue({ success: true });
  vi.spyOn(api, 'getMeterDocuments').mockResolvedValue([
    {
      id: 'doc-99',
      documentType: 'Fitness Certificate',
      title: 'Annual Fitness Certificate',
      fileName: 'fitness_2026.pdf',
      fileUrl: '/api/uploads/fitness.pdf',
      fileSize: 1048576,
      uploadedAt: '2026-09-15T10:00:00.000Z',
    },
  ]);

  const reading = {
    id: 'slip-200',
    slipNumber: 'DS-2026-002',
    vehicleName: 'Maruti Ertiga',
    vehicleNumber: 'MH 14 AB 1234',
    documents: [
      {
        id: 'doc-99',
        documentType: 'Fitness Certificate',
        title: 'Annual Fitness Certificate',
        fileName: 'fitness_2026.pdf',
        fileUrl: '/api/uploads/fitness.pdf',
        fileSize: 1048576,
        uploadedAt: '2026-09-15T10:00:00.000Z',
      },
    ],
  };

  const onDocumentsUpdated = vi.fn();

  render(
    <MeterDocumentModal
      isOpen
      onClose={() => {}}
      reading={reading}
      onDocumentsUpdated={onDocumentsUpdated}
    />,
  );

  // Click delete button for the document
  const deleteDocButton = screen.getByTitle('Delete Document');
  fireEvent.click(deleteDocButton);

  // Themed ConfirmModal dialog should appear
  const modalDialog = screen.getByRole('dialog', { name: 'Delete Vehicle Document' });
  expect(modalDialog).toBeTruthy();
  expect(
    within(modalDialog).getByText(/Are you sure you want to delete "Annual Fitness Certificate"/i),
  ).toBeTruthy();

  // Confirm deletion inside the themed modal
  const confirmBtn = within(modalDialog).getByRole('button', { name: /delete document/i });
  fireEvent.click(confirmBtn);

  await waitFor(() => {
    expect(deleteSpy).toHaveBeenCalledWith('slip-200', 'doc-99');
  });
  await waitFor(() => {
    expect(onDocumentsUpdated).toHaveBeenCalled();
  });
});

it('CorporateTripLogModal auto-calculates total KM, enforces employee count, and submits form', async () => {
  const onSave = vi.fn().mockResolvedValue({});
  const contracts = [
    {
      id: 'c1',
      companyName: 'Henkel Technologies',
      vehicleId: 'v1',
      vehicleNumber: 'MH 12 TP 7220',
      driverId: 'd1',
      driverName: 'Nikhil N. Kamble',
      status: 'Active',
    },
  ];
  const vehicles = [{ id: 'v1', name: 'Innova Crysta', vehicleNumber: 'MH 12 TP 7220', currentOdometer: 105000 }];
  const drivers = [{ id: 'd1', name: 'Nikhil N. Kamble' }];

  const { container } = render(
    <CorporateTripLogModal
      isOpen
      onClose={() => {}}
      onSave={onSave}
      contracts={contracts}
      vehicles={vehicles}
      drivers={drivers}
    />,
  );

  // Check initial employee count and pickup point
  const employeeCountInput = container.querySelector('input[type="number"][value="4"]');
  expect(employeeCountInput).toBeTruthy();

  // Enter Start KM and Close KM
  const startKmInput = container.querySelector('input[placeholder="e.g. 105000"]');
  const closeKmInput = container.querySelector('input[placeholder="e.g. 105038"]');
  fireEvent.change(startKmInput, { target: { value: '105000' } });
  fireEvent.change(closeKmInput, { target: { value: '105045' } });

  // Verify auto-calculated 45 KM badge appears
  expect(screen.getAllByText(/45 KM/i).length).toBeGreaterThanOrEqual(1);

  // Enter extra hours and toll
  const extraHoursInput = screen.getByLabelText(/Extra Hours/i);
  fireEvent.change(extraHoursInput, { target: { value: '1.5' } });

  const tollInput = screen.getByLabelText(/Toll \/ Parking/i);
  fireEvent.change(tollInput, { target: { value: '150' } });

  // Submit form
  const submitBtn = screen.getByRole('button', { name: /save log/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(onSave).toHaveBeenCalled();
  });
  const savedData = onSave.mock.calls[0][0];
  expect(savedData.placeFrom).toBe('Parking');
  expect(savedData.employeeCount).toBe(4);
  expect(Number(savedData.startKm)).toBe(105000);
  expect(Number(savedData.closeKm)).toBe(105045);
  expect(savedData.extraHours).toBe(1.5);
  expect(savedData.tollParking).toBe(150);
});

it('CorporateLogsheetView renders logsheet register with employee commutes and allows search filtering', async () => {
  const tripLogs = [
    {
      id: 'log1',
      tripLogNumber: 'LOG-2026-001',
      date: '2026-09-02',
      companyName: 'Henkel Technologies',
      vehicleNumber: 'MH 12 TP 7220',
      vehicleName: 'Innova Crysta',
      driverName: 'Nikhil N. Kamble',
      placeFrom: 'Parking',
      placeTo: 'Henkel',
      startKm: 105000,
      closeKm: 105038,
      totalKm: 38,
      startTime: '06:30 AM',
      closeTime: '08:00 AM',
      totalHours: 1.5,
      extraHours: 0,
      tollParking: 120,
      employeeCount: 5,
      signatureName: 'Shift Incharge',
    },
  ];

  render(
    <CorporateLogsheetView
      tripLogs={tripLogs}
      initialMonth="2026-09"
      contracts={[{ id: 'c1', companyName: 'Henkel Technologies' }]}
      onAddTripLog={() => {}}
      onEditTripLog={() => {}}
      onDeleteTripLog={() => {}}
    />,
  );

  // Check employee commutes count in KPI ribbon and table
  expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('38 KM').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/MH 12 TP 7220/i)).toBeTruthy();
  expect(screen.getByText(/Print Logsheet/i)).toBeTruthy();
  expect(screen.getByText(/Download PDF/i)).toBeTruthy();

  // Search for non-existent route
  const searchInput = screen.getByPlaceholderText(/Search route/i);
  fireEvent.change(searchInput, { target: { value: 'Nonexistent Place' } });
  expect(screen.getByText(/No trip logs found for this selection/i)).toBeTruthy();

  // Clear search
  fireEvent.change(searchInput, { target: { value: '' } });
  expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
});

it('CorporateContractTable switches to Daily KM Logsheets tab and displays employee counts', async () => {
  const contracts = [
    {
      id: 'c1',
      companyName: 'Henkel Technologies',
      vehicleNumber: 'MH 12 TP 7220',
      vehicleName: 'Innova Crysta',
      driverName: 'Nikhil N. Kamble',
      startDate: '2026-09-01',
      monthlyBaseFare: 50000,
      includedMonthlyKm: 2500,
      extraRatePerKm: 16,
      status: 'Active',
    },
  ];
  const tripLogs = [
    {
      id: 'log1',
      contractId: 'c1',
      date: '2026-09-02',
      totalKm: 50,
      employeeCount: 6,
      placeFrom: 'Parking',
      placeTo: 'Henkel',
    },
  ];

  render(
    <CorporateContractTable
      contracts={contracts}
      tripLogs={tripLogs}
      onAddContract={() => {}}
      onEditContract={() => {}}
      onDeleteContract={() => {}}
      onUpdateStatus={() => {}}
      onLogDailyKm={() => {}}
      onGenerateBill={() => {}}
      onAddTripLog={() => {}}
      onEditTripLog={() => {}}
      onDeleteTripLog={() => {}}
    />,
  );

  // In contracts view, verify contract is displayed
  expect(screen.getByText('Henkel Technologies')).toBeTruthy();

  // Click on "Daily KM Logsheet & Commute Register" tab
  const logsheetsTabBtn = screen.getByRole('button', { name: /Daily KM Logsheet & Commute Register/i });
  fireEvent.click(logsheetsTabBtn);

  // Should now render the digital logsheet view
  expect(screen.getByText(/Corporate Daily KM Logsheet & Employee Commute/i)).toBeTruthy();
  expect(screen.getByText(/Print Logsheet/i)).toBeTruthy();
  expect(screen.getByText(/Download PDF/i)).toBeTruthy();
});

it('CorporateLogsheetPrintView opens after mounting closed and renders the complete register', () => {
  const logs = [
    {
      id: 'log1',
      date: '2026-09-02',
      vehicleNumber: 'MH 12 TP 7220',
      placeFrom: 'Parking',
      placeTo: 'Henkel',
      startKm: 105000,
      closeKm: 105038,
      totalKm: 38,
      startTime: '06:30 AM',
      closeTime: '08:00 AM',
      totalHours: 1.5,
      tollParking: 120,
      employeeCount: 4,
      signatureName: 'Shift Incharge',
    },
  ];

  const view = render(
    <CorporateLogsheetPrintView
      isOpen={false}
      onClose={() => {}}
      selectedMonth="2026-09"
      currentContract={{
        companyName: 'Henkel Technologies',
        vehicleNumber: 'MH 12 TP 7220',
        driverName: 'Nikhil N. Kamble',
      }}
      logs={logs}
      totals={{
        trips: 1,
        totalKm: 38,
        totalHours: 1.5,
        extraHours: 0,
        tollParking: 120,
        employeeCount: 4,
      }}
    />,
  );

  view.rerender(
    <CorporateLogsheetPrintView
      isOpen={true}
      onClose={() => {}}
      selectedMonth="2026-09"
      currentContract={{
        companyName: 'Henkel Technologies',
        vehicleNumber: 'MH 12 TP 7220',
        driverName: 'Nikhil N. Kamble',
      }}
      logs={logs}
      totals={{
        trips: 1,
        totalKm: 38,
        totalHours: 1.5,
        extraHours: 0,
        tollParking: 120,
        employeeCount: 4,
      }}
    />,
  );

  expect(screen.getByText(/CORPORATE FLEET MANAGEMENT & DAILY VEHICLE LOGSHEET REGISTER/i)).toBeTruthy();
  expect(screen.getByText(/Henkel Technologies/i)).toBeTruthy();
  expect(screen.getByText('38 KM')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Download PDF/i })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Print/i })).toBeTruthy();
});
