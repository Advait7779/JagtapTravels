import React, { useState, useEffect, useCallback } from 'react';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import CustomerTable from './components/customers/CustomerTable';
import CustomerModal from './components/customers/CustomerModal';
import DriverTable from './components/drivers/DriverTable';
import DriverModal from './components/drivers/DriverModal';
import MeterReadingTable from './components/meterReadings/MeterReadingTable';
import MeterReadingModal from './components/meterReadings/MeterReadingModal';
import MeterDocumentModal from './components/meterReadings/MeterDocumentModal';
import BillTable from './components/bills/BillTable';
import BillModal from './components/bills/BillModal';
import BillPrintView from './components/bills/BillPrintView';
import PaymentModal from './components/bills/PaymentModal';
import QuotationTable from './components/quotations/QuotationTable';
import QuotationModal from './components/quotations/QuotationModal';
import QuotationPrintView from './components/quotations/QuotationPrintView';
import VehicleTable from './components/vehicles/VehicleTable';
import DailyKmModal from './components/vehicles/DailyKmModal';
import ServiceRecordModal from './components/vehicles/ServiceRecordModal';
import VehicleModal from './components/vehicles/VehicleModal';
import VehicleHistoryModal from './components/vehicles/VehicleHistoryModal';
import BookingTable from './components/bookings/BookingTable';
import BookingModal from './components/bookings/BookingModal';
import InquiryTable from './components/inquiries/InquiryTable';
import CorporateContractTable from './components/corporate/CorporateContractTable';
import CorporateContractModal from './components/corporate/CorporateContractModal';
import CorporateTripLogModal from './components/corporate/CorporateTripLogModal';
import CorporateInvoiceModal from './components/corporate/CorporateInvoiceModal';
import FuelExpenseHub from './components/expenses/FuelExpenseHub';
import FuelModal from './components/expenses/FuelModal';
import TyreManagementHub from './components/expenses/TyreManagementHub';
import TyreModal from './components/expenses/TyreModal';
import DriverPayrollTable from './components/payroll/DriverPayrollTable';
import AdvanceModal from './components/payroll/AdvanceModal';
import PayslipModal from './components/payroll/PayslipModal';
import ConfirmModal from './components/ConfirmModal';
import ToursWebsite from './website/ToursWebsite';
import { api } from './services/api';
import { localDate } from './utils/formatters';
import { toast } from './context/ToastContext';

export default function App() {
  const [viewMode, setViewMode] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('/admin') || hash.includes('admin') || hash.includes('crm')) {
      return 'crm';
    }
    return 'website';
  });

  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('dashboard'),
    [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState({
    customers: [],
    drivers: [],
    meterReadings: [],
    bills: [],
    quotations: [],
    vehicles: [],
    bookings: [],
    inquiries: [],
    corporateContracts: [],
    fuelLogs: [],
    tyreLogs: [],
    driverAdvances: [],
    corporateTripLogs: [],
    settings: {},
    health: {},
  });

  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState(() =>
    localDate().slice(0, 7),
  );
  const [payrollData, setPayrollData] = useState([]);

  const [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [modal, setModal] = useState(null),
    [viewBill, setViewBill] = useState(null),
    [viewQuote, setViewQuote] = useState(null),
    [corporateInvoice, setCorporateInvoice] = useState(null),
    [confirmDialog, setConfirmDialog] = useState(null),
    [confirmLoading, setConfirmLoading] = useState(false);

  const checkSession = async () => {
    setChecking(true);
    setAuthError('');
    try {
      const result = await api.me();
      setUser(result.user);
    } catch (err) {
      if (err.status !== 401)
        setAuthError('Unable to verify your session. Check the server connection.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem('jagtap_crm_user');
    sessionStorage.removeItem('jagtap_crm_user');
    const expire = () => {
      setUser(null);
      setModal(null);
      setViewBill(null);
      setViewQuote(null);
      toast.warning('Session expired', {
        description: 'Your CRM session has timed out. Please sign in again.',
      });
    };
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);

  useEffect(() => {
    if (viewMode === 'crm') checkSession();
    else setChecking(false);
  }, [viewMode]);

  useEffect(() => {
    if (!user || viewMode !== 'crm') return undefined;
    let lastRefresh = Date.now();
    let refreshing = false;
    const refreshAfterActivity = () => {
      if (
        refreshing ||
        document.visibilityState !== 'visible' ||
        Date.now() - lastRefresh < 4 * 60 * 1000
      )
        return;
      lastRefresh = Date.now();
      refreshing = true;
      api
        .me()
        .catch((err) => {
          if (err.status === 401) window.dispatchEvent(new Event('session-expired'));
        })
        .finally(() => {
          refreshing = false;
        });
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((name) =>
      window.addEventListener(name, refreshAfterActivity, { passive: true }),
    );
    document.addEventListener('visibilitychange', refreshAfterActivity);
    return () => {
      events.forEach((name) => window.removeEventListener(name, refreshAfterActivity));
      document.removeEventListener('visibilitychange', refreshAfterActivity);
    };
  }, [user, viewMode]);

  useEffect(() => {
    const followBrowserHistory = () =>
      setViewMode(window.location.pathname.toLowerCase().includes('/admin') ? 'crm' : 'website');
    window.addEventListener('popstate', followBrowserHistory);
    return () => window.removeEventListener('popstate', followBrowserHistory);
  }, []);

  const switchView = (mode) => {
    window.history.pushState({}, '', mode === 'crm' ? '/admin' : '/');
    setViewMode(mode);
  };

  const refreshPayroll = useCallback(async (month) => {
    try {
      const p = await api.getPayroll(month);
      if (Array.isArray(p)) setPayrollData(p);
    } catch {
      // Non-fatal if payroll fails
    }
  }, []);

  const refresh = async () => {
    setLoading(true);
    const keys = [
      'customers',
      'drivers',
      'meterReadings',
      'bills',
      'quotations',
      'vehicles',
      'bookings',
      'inquiries',
      'corporateContracts',
      'fuelLogs',
      'tyreLogs',
      'driverAdvances',
      'corporateTripLogs',
      'settings',
      'health',
    ];
    const results = await Promise.allSettled([
      api.getCustomers(),
      api.getDrivers(),
      api.getMeterReadings(),
      api.getBills(),
      api.getQuotations(),
      api.getVehicles(),
      api.getBookings(),
      api.getInquiries(),
      api.getCorporateContracts(),
      api.getFuelLogs(),
      api.getTyreLogs(),
      api.getDriverAdvances(),
      api.getCorporateTripLogs(),
      api.getSettings(),
      api.getHealth(),
    ]);
    const failed = keys.filter((_, i) => results[i].status === 'rejected');
    setData((prev) => ({
      ...prev,
      ...Object.fromEntries(
        keys.flatMap((key, i) =>
          results[i].status === 'fulfilled' ? [[key, results[i].value]] : [],
        ),
      ),
    }));

    await refreshPayroll(selectedPayrollMonth);

    setError(
      failed.length
        ? 'Could not load ' +
            failed.join(', ') +
            '. Records may be out of date. Retry before making changes.'
        : '',
    );
    setLoading(false);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  useEffect(() => {
    if (user) refreshPayroll(selectedPayrollMonth);
  }, [selectedPayrollMonth, user, refreshPayroll]);

  const navigate = (next) => {
    setTab(next);
    setMobileOpen(false);
  };

  const open = (type) => setModal({ type });

  const actions = {
    onOpenAddCustomer: () => open('customer'),
    onOpenAddDriver: () => open('driver'),
    onOpenAddMeterReading: () => open('meter'),
    onOpenAddBill: () => open('bill'),
    onOpenAddQuotation: () => open('quote'),
    onOpenAddBooking: (initialData) => setModal({ type: 'booking', initialData }),
    onOpenDailyKm: (record) => setModal({ type: 'dailyKm', record }),
    onOpenAddCorporateContract: () => open('corporateContract'),
    onOpenAddFuelLog: () => open('fuelLog'),
    onOpenAddTyreLog: () => open('tyreLog'),
    onOpenAddAdvance: (driver) => setModal({ type: 'advance', driver }),
  };

  const save = async (type, form, id) => {
    const methods = {
      customer: ['addCustomer', 'updateCustomer'],
      driver: ['addDriver', 'updateDriver'],
      meter: ['addMeterReading', 'updateMeterReading'],
      bill: ['addBill'],
      quote: ['addQuotation'],
      vehicle: ['addVehicle', 'updateVehicle'],
      booking: ['addBooking', 'updateBooking'],
      corporateContract: ['addCorporateContract', 'updateCorporateContract'],
      corporateTripLog: ['addCorporateTripLog', 'updateCorporateTripLog'],
      fuelLog: ['addFuelLog', 'updateFuelLog'],
      tyreLog: ['addTyreLog', 'updateTyreLog'],
      driverAdvance: ['addDriverAdvance', 'updateDriverAdvance'],
    };

    if (
      type === 'booking' &&
      !id &&
      !form.customerId &&
      form.customerName &&
      form.customerPhone &&
      form.saveToCustomers !== false
    ) {
      const existing = (data.customers || []).find((c) => c.phone === form.customerPhone);
      if (existing) {
        form.customerId = existing.id;
      } else {
        try {
          const newCust = await api.addCustomer({
            name: form.customerName,
            phone: form.customerPhone,
            email: form.customerEmail || '',
            address: form.pickupAddress || form.pickupLocation || '',
            notes: 'Auto-saved from trip booking',
          });
          if (newCust?.id) {
            form.customerId = newCust.id;
          }
        } catch {
          // If customer creation fails, still proceed with booking
        }
      }
    }

    try {
      const result = await (id ? api[methods[type][1]](id, form) : api[methods[type][0]](form));
      await refresh();
      if (type === 'bill') setViewBill(result);
      if (type === 'quote') setViewQuote(result);

      const isEdit = !!id;
      const typeLabels = {
        customer: form.name ? `Customer: ${form.name}` : 'Customer',
        driver: form.name ? `Driver: ${form.name}` : 'Driver',
        meter: 'Duty slip recorded',
        bill: `Invoice #${result?.billNumber || form.billNumber || ''}`,
        quote: `Quotation #${result?.quotationNumber || form.quotationNumber || ''}`,
        vehicle: `Vehicle: ${form.vehicleNumber || form.name || 'Fleet'}`,
        booking: `Booking #${result?.bookingNumber || form.bookingNumber || ''}`,
        corporateContract: `Contract: ${form.companyName || 'Corporate'}`,
        corporateTripLog: 'Daily trip log saved',
        fuelLog: 'Fuel log saved',
        tyreLog: 'Tyre log saved',
        driverAdvance: 'Advance recorded',
      };

      const title = isEdit ? 'Successfully updated' : 'Successfully created';
      const desc = typeLabels[type] || (isEdit ? 'Record updated' : 'Record created');

      toast.success(title, { description: desc });
      return result;
    } catch (err) {
      toast.error('Failed to save', { description: err.message || 'Please check inputs.' });
      throw err;
    }
  };

  const handleConvertQuoteToBooking = (quote) => {
    setModal({
      type: 'booking',
      initialData: {
        customerId: quote.customerId || '',
        customerName: quote.customerName || quote.customer_name || '',
        customerPhone: quote.customerPhone || quote.customer_phone || '',
        customerEmail: quote.customerEmail || quote.customer_email || '',
        vehicleType: quote.vehicleType || quote.vehicle_type || 'Innova Crysta',
        pickupLocation: quote.pickupLocation || 'Pune',
        dropLocation: quote.dropLocation || quote.tourTitle || '',
        startDate: quote.travelDate || localDate(),
        estimatedAmount: quote.totalAmount || 0,
        notes: `Converted from Quotation #${quote.quotationNumber || quote.quotation_number || ''}`,
      },
    });
    toast.info('Converting quotation', {
      description: `Quote #${quote.quotationNumber || quote.quotation_number || ''}`,
    });
  };

  const handleStartTripFromBooking = (booking) => {
    setModal({
      type: 'meter',
      record: {
        customerId: booking.customerId,
        customerName: booking.customerName,
        vehicleId: booking.vehicleId,
        vehicleName: booking.vehicleName || booking.vehicleType,
        vehicleNumber: booking.vehicleNumber,
        driverId: booking.driverId,
        driverName: booking.driverName,
        tripSource: booking.pickupLocation || 'Pune',
        tripDestination: booking.dropLocation || '',
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: 'Ongoing',
        notes: `Duty slip for Booking #${booking.bookingNumber || ''}`,
      },
    });
    toast.info('Starting trip', {
      description: `Booking #${booking.bookingNumber || ''}`,
    });
  };

  const handleGenerateBillFromBooking = (booking) => {
    setModal({
      type: 'bill',
      booking,
    });
  };

  const handleGenerateCorporateBill = async (contract, month) => {
    try {
      setLoading(true);
      const res = await api.generateCorporateBill(contract.id, month);
      await refresh();
      if (res?.bill) setViewBill(res.bill);
      toast.success('Corporate invoice generated', {
        description: contract.companyName || 'Corporate Client',
      });
    } catch (err) {
      setError(err.message || 'Failed to generate corporate contract bill.');
      toast.error('Invoice generation failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuoteFromInquiry = (inq) => {
    setModal({
      type: 'quote',
      customer: {
        name: inq.name,
        phone: inq.phone,
        email: inq.email,
        tripType: inq.tripType,
        vehicle: inq.vehicle,
        notes: inq.message ? `Website Lead: ${inq.message}` : '',
      },
    });
    toast.info('Creating quotation', {
      description: inq.name || 'Website Lead',
    });
  };

  const handleCreateBookingFromInquiry = (inq) => {
    setModal({
      type: 'booking',
      initialData: {
        customerName: inq.name,
        customerPhone: inq.phone,
        customerEmail: inq.email,
        vehicleType: inq.vehicle || 'Innova Crysta',
        notes: inq.message ? `Website Lead (${inq.tripType || 'Trip'}): ${inq.message}` : '',
      },
    });
    toast.info('Creating booking', {
      description: inq.name || 'Website Lead',
    });
  };

  const handleAddCustomerFromInquiry = (inq) => {
    setModal({
      type: 'customer',
      record: {
        name: inq.name,
        phone: inq.phone,
        email: inq.email,
        notes: `Lead ref: ${inq.inquiryNumber || ''}`,
      },
    });
    toast.info('Adding customer', {
      description: inq.name || 'Website Lead',
    });
  };

  const act = async (fn, successMsg) => {
    try {
      await fn();
      await refresh();
      if (successMsg) {
        toast.success(successMsg);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Action failed', { description: err.message });
    }
  };

  const remove = (method, id, label, title = 'Confirm Deletion', confirmText = 'Delete Record') => {
    setConfirmDialog({
      method,
      id,
      label,
      title,
      confirmText,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await api[confirmDialog.method](confirmDialog.id);
      await refresh();
      toast.delete('Successfully deleted', {
        description: confirmDialog.label ? `${confirmDialog.label} removed` : 'Record removed',
      });
      setConfirmDialog(null);
    } catch (err) {
      setError(err.message || 'Operation failed.');
      toast.error('Deletion failed', { description: err.message || 'Unable to delete record.' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setModal(null);
      setViewBill(null);
      setViewQuote(null);
      toast.info('Signed out successfully');
    } catch (err) {
      setError(err.message);
      toast.error('Sign out error', { description: err.message });
    }
  };

  const signedOut = () => {
    setUser(null);
    setModal(null);
    setViewBill(null);
    setViewQuote(null);
    toast.info('Signed out');
  };

  // If public website mode is active, render the ToursWebsite landing page
  if (viewMode === 'website') {
    return <ToursWebsite onOpenAdmin={() => switchView('crm')} />;
  }

  if (checking)
    return (
      <main
        className="min-h-screen bg-navy-950 text-white grid place-items-center p-6"
        role="status"
      >
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Verifying secure CRM session…</p>
        </div>
      </main>
    );

  if (authError)
    return (
      <main className="min-h-screen bg-navy-950 text-white grid place-items-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-md max-w-md text-center space-y-4">
          <p role="alert" className="text-rose-400 text-sm">
            {authError}
          </p>
          <div className="flex gap-2 justify-center">
            <button className="btn-primary" onClick={checkSession}>
              Retry connection
            </button>
            <button
              onClick={() => switchView('website')}
              className="px-4 py-2 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800"
            >
              Back to Website
            </button>
          </div>
        </div>
      </main>
    );

  if (!user) {
    return <LoginForm onLoginSuccess={setUser} onBackToWebsite={() => switchView('website')} />;
  }

  const {
    customers = [],
    drivers = [],
    meterReadings = [],
    bills = [],
    quotations = [],
    vehicles = [],
    bookings = [],
    inquiries = [],
    corporateContracts = [],
    fuelLogs = [],
    tyreLogs = [],
    driverAdvances = [],
    corporateTripLogs = [],
    settings = {},
    health = {},
  } = data;

  const common = {
    customers,
    drivers,
    meterReadings,
    bills,
    quotations,
    vehicles,
    bookings,
    inquiries,
    corporateContracts,
    fuelLogs,
    tyreLogs,
    driverAdvances,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {mobileOpen && (
        <button
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        activeTab={tab}
        setActiveTab={navigate}
        counts={{
          customers: customers.length,
          drivers: drivers.length,
          meterReadings: meterReadings.length,
          bills: bills.length,
          quotations: quotations.length,
          vehicles: vehicles.length,
          corporateContracts: corporateContracts.filter((c) => c.status === 'Active').length,
          fuel: fuelLogs.length,
          tyres: tyreLogs.length,
          payroll: drivers.length,
          vehiclesDue: vehicles.filter((v) => v.status === 'Service Due').length,
          bookings: bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Dispatched')
            .length,
          inquiries: inquiries.filter((i) => i.status === 'New').length,
        }}
        pgStatus={health.postgres}
        storage={health.storage}
        user={user}
        mobileOpen={mobileOpen}
        onLogout={logout}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenWebsite={() => switchView('website')}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={user}
          activeTab={tab}
          onLogout={logout}
          onToggleMenu={() => setMobileOpen((v) => !v)}
          {...actions}
        />
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 rounded bg-rose-50 text-rose-800 border border-rose-200 text-sm"
              >
                {error}
                <button className="ml-3 underline font-bold" onClick={refresh}>
                  Retry / Refresh
                </button>
              </div>
            )}
            {loading && (
              <p role="status" className="mb-3 text-sm text-slate-500">
                Refreshing records…
              </p>
            )}

            {/* 1. Dashboard */}
            {tab === 'dashboard' && (
              <Dashboard
                {...common}
                {...actions}
                vehicles={vehicles}
                bookings={bookings}
                inquiries={inquiries}
                user={user}
                onViewBill={setViewBill}
                onViewQuotation={setViewQuote}
                onStartTripFromBooking={handleStartTripFromBooking}
                setActiveTab={navigate}
              />
            )}

            {/* 2. Bookings */}
            {tab === 'bookings' && (
              <BookingTable
                bookings={bookings}
                vehicles={vehicles}
                drivers={drivers}
                onAddBooking={() => open('booking')}
                onEditBooking={(record) => setModal({ type: 'booking', bookingToEdit: record })}
                onDeleteBooking={(id) =>
                  remove(
                    'deleteBooking',
                    id,
                    'Cancel this booking? It will be permanently removed.',
                    'Cancel Booking',
                    'Delete Booking',
                  )
                }
                onUpdateStatus={(id, status) =>
                  act(() => api.updateBookingStatus(id, status), `Booking status updated to "${status}".`)
                }
                onStartTrip={handleStartTripFromBooking}
                onGenerateBill={handleGenerateBillFromBooking}
              />
            )}

            {/* 3. Corporate Vehicle Contracts & Monthly Excess KM */}
            {tab === 'corporateContracts' && (
              <CorporateContractTable
                contracts={corporateContracts}
                vehicles={vehicles}
                drivers={drivers}
                customers={customers}
                tripLogs={corporateTripLogs}
                onAddContract={() => open('corporateContract')}
                onEditContract={(record) => setModal({ type: 'corporateContract', record })}
                onDeleteContract={(id) =>
                  remove(
                    'deleteCorporateContract',
                    id,
                    'Delete this corporate contract and billing parameters?',
                    'Delete Corporate Contract',
                    'Delete Contract',
                  )
                }
                onUpdateStatus={(id, status) =>
                  act(() => api.updateCorporateContractStatus(id, status), `Contract status updated to "${status}".`)
                }
                onLogDailyKm={(record) => setModal({ type: 'dailyKm', record })}
                onGenerateBill={handleGenerateCorporateBill}
                onAddTripLog={(preselectedContract) =>
                  setModal({ type: 'corporateTripLog', preselectedContract })
                }
                onEditTripLog={(record) => setModal({ type: 'corporateTripLog', record })}
                onDeleteTripLog={(id) =>
                  remove(
                    'deleteCorporateTripLog',
                    id,
                    'Delete this daily trip log entry?',
                    'Delete Daily Trip Log',
                    'Delete Trip Log',
                  )
                }
                onGenerateInvoice={(contract, month, options = {}) =>
                  setCorporateInvoice({ contract, month, ...options })
                }
              />
            )}

            {/* 4. Leads & Enquiries */}
            {tab === 'inquiries' && (
              <InquiryTable
                inquiries={inquiries}
                onUpdateStatus={(id, status) =>
                  act(() => api.updateInquiryStatus(id, status), `Lead status updated to "${status}".`)
                }
                onDeleteInquiry={(id) =>
                  remove(
                    'deleteInquiry',
                    id,
                    'Delete this website enquiry lead?',
                    'Delete Lead',
                    'Delete Lead',
                  )
                }
                onCreateQuote={handleCreateQuoteFromInquiry}
                onCreateBooking={handleCreateBookingFromInquiry}
                onAddCustomer={handleAddCustomerFromInquiry}
              />
            )}

            {/* 5. Meter Readings */}
            {tab === 'meterReadings' && (
              <MeterReadingTable
                meterReadings={meterReadings}
                onAddReading={() => open('meter')}
                onEditReading={(record) => setModal({ type: 'meter', record })}
                onDeleteReading={(id) =>
                  remove(
                    'deleteMeterReading',
                    id,
                    'Delete this duty slip from fleet records?',
                    'Delete Duty Slip',
                    'Delete Slip',
                  )
                }
                onCreateBillFromSlip={(slip) => setModal({ type: 'bill', slip })}
                onOpenDocuments={(reading) => setModal({ type: 'meterDocuments', reading })}
              />
            )}

            {/* 6. Quotations */}
            {tab === 'quotations' && (
              <QuotationTable
                quotations={quotations}
                settings={settings}
                onAddQuotation={() => open('quote')}
                onViewQuotation={setViewQuote}
                onConvertToBooking={handleConvertQuoteToBooking}
                onUpdateStatus={(id, status) =>
                  act(() => api.updateQuotationStatus(id, status), `Quotation marked as "${status}".`)
                }
                onDeleteQuotation={(id) =>
                  remove(
                    'deleteQuotation',
                    id,
                    'Delete this quotation from sales records?',
                    'Delete Quotation',
                    'Delete Quotation',
                  )
                }
              />
            )}

            {/* 7. Bills & Invoices */}
            {tab === 'bills' && (
              <BillTable
                bills={bills}
                onAddBill={() => open('bill')}
                onViewBill={setViewBill}
                onRecordPayment={(bill) => setModal({ type: 'payment', bill })}
                onDeleteBill={(id) =>
                  remove(
                    'deleteBill',
                    id,
                    'Cancel this unpaid invoice? Its number and history will be retained. Invoices with payments cannot be cancelled.',
                    'Cancel Invoice',
                    'Cancel Invoice',
                  )
                }
              />
            )}

            {/* 8. Driver Payroll & Advance Tracking */}
            {tab === 'payroll' && (
              <DriverPayrollTable
                payrollData={payrollData}
                drivers={drivers}
                selectedMonth={selectedPayrollMonth}
                onMonthChange={setSelectedPayrollMonth}
                onAddAdvance={(driver) => setModal({ type: 'advance', driver })}
                onDeleteAdvance={(adv) =>
                  remove(
                    'deleteDriverAdvance',
                    adv.id,
                    `Delete advance of ₹${adv.amount} given on ${adv.date}?`,
                    'Delete Advance Record',
                    'Delete Advance',
                  )
                }
                onOpenPayslip={(item) => setModal({ type: 'payslip', payrollItem: item })}
                onEditDriverSalary={(item) => {
                  const driverObj = drivers.find((d) => d.id === item.driverId);
                  setModal({ type: 'driver', record: driverObj || item });
                }}
                onRefresh={refresh}
              />
            )}

            {/* 9. Fuel Expenses (Diesel, Petrol, CNG) */}
            {tab === 'fuel' && (
              <FuelExpenseHub
                fuelLogs={fuelLogs}
                vehicles={vehicles}
                drivers={drivers}
                onAddFuelLog={() => open('fuelLog')}
                onEditFuelLog={(record) => setModal({ type: 'fuelLog', record })}
                onDeleteFuelLog={(record) =>
                  remove(
                    'deleteFuelLog',
                    record.id,
                    `Delete fuel record #${record.fuelNumber || record.id} for ${record.vehicleNumber}?`,
                    'Delete Fuel Entry',
                    'Delete Log',
                  )
                }
              />
            )}

            {/* 10. Vehicle Tyres & Wear Tracking */}
            {tab === 'tyres' && (
              <TyreManagementHub
                tyreLogs={tyreLogs}
                vehicles={vehicles}
                onAddTyreLog={() => open('tyreLog')}
                onEditTyreLog={(record) => setModal({ type: 'tyreLog', record })}
                onDeleteTyreLog={(record) =>
                  remove(
                    'deleteTyreLog',
                    record.id,
                    `Delete tyre record #${record.tyreNumber || record.id} for ${record.vehicleNumber}?`,
                    'Delete Tyre Record',
                    'Delete Record',
                  )
                }
              />
            )}

            {/* 11. Vehicles & Maintenance */}
            {tab === 'vehicles' && (
              <VehicleTable
                vehicles={vehicles}
                onAddVehicle={() => open('vehicle')}
                onEditVehicle={(record) => setModal({ type: 'vehicle', record })}
                onDeleteVehicle={(id) =>
                  remove(
                    'deleteVehicle',
                    id,
                    'Delete this vehicle from fleet maintenance records?',
                    'Delete Vehicle',
                    'Delete Vehicle',
                  )
                }
                onOpenDailyKm={(record) => setModal({ type: 'dailyKm', record })}
                onOpenServiceRecord={(record) => setModal({ type: 'serviceRecord', record })}
                onOpenHistory={(record) => setModal({ type: 'vehicleHistory', record })}
              />
            )}

            {/* 12. Drivers */}
            {tab === 'drivers' && (
              <DriverTable
                drivers={drivers}
                onAddDriver={() => open('driver')}
                onEditDriver={(record) => setModal({ type: 'driver', record })}
                onDeleteDriver={(id) =>
                  remove(
                    'deleteDriver',
                    id,
                    'Delete this driver? Drivers with trip history are retained.',
                    'Delete Driver',
                    'Delete Driver',
                  )
                }
                onUpdateStatus={(id, record) =>
                  act(() => api.updateDriverStatus(id, record.status), `Driver status changed to "${record.status}".`)
                }
                onRefresh={refresh}
              />
            )}

            {/* 13. Customers */}
            {tab === 'customers' && (
              <CustomerTable
                customers={customers}
                onAddCustomer={() => open('customer')}
                onEditCustomer={(record) => setModal({ type: 'customer', record })}
                onDeleteCustomer={(id) =>
                  remove(
                    'deleteCustomer',
                    id,
                    'Delete this customer? Customers with trip history are retained.',
                    'Delete Customer',
                    'Delete Customer',
                  )
                }
                onGenerateBillForCustomer={(customer) => setModal({ type: 'bill', customer })}
                onGenerateQuoteForCustomer={(customer) => setModal({ type: 'quote', customer })}
              />
            )}

            {/* 14. Settings */}
            {tab === 'settings' && (
              <Settings
                settings={settings}
                onSignedOut={signedOut}
                onSave={async (form) => {
                  try {
                    await api.saveSettings(form);
                    await refresh();
                    toast.success('Settings saved', {
                      description: 'Company profile and parameters saved successfully.',
                    });
                  } catch (err) {
                    toast.error('Failed to save settings', { description: err.message });
                    throw err;
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {modal?.type === 'customer' && (
        <CustomerModal
          isOpen
          onClose={() => setModal(null)}
          customerToEdit={modal.record}
          onSave={(form, id) => save('customer', form, id)}
        />
      )}

      {modal?.type === 'driver' && (
        <DriverModal
          isOpen
          onClose={() => setModal(null)}
          driverToEdit={modal.record}
          onSave={(form, id) => save('driver', form, id)}
        />
      )}

      {modal?.type === 'meter' && (
        <MeterReadingModal
          isOpen
          onClose={() => setModal(null)}
          readingToEdit={modal.record}
          {...common}
          onSave={(form, id) => save('meter', form, id)}
        />
      )}

      {modal?.type === 'bill' && (
        <BillModal
          isOpen
          onClose={() => setModal(null)}
          {...common}
          preselectedCustomer={modal.customer}
          preselectedSlip={modal.slip}
          preselectedBooking={modal.booking}
          onSave={(form) => save('bill', form)}
        />
      )}

      {modal?.type === 'booking' && (
        <BookingModal
          isOpen
          onClose={() => setModal(null)}
          bookingToEdit={modal.bookingToEdit}
          initialData={modal.initialData}
          customers={customers}
          drivers={drivers}
          vehicles={vehicles}
          settings={settings}
          onSave={(form, id) => save('booking', form, id)}
        />
      )}

      {modal?.type === 'quote' && (
        <QuotationModal
          isOpen
          onClose={() => setModal(null)}
          customers={customers}
          preselectedCustomer={modal.customer}
          onSave={(form) => save('quote', form)}
        />
      )}

      {modal?.type === 'payment' && (
        <PaymentModal
          bill={modal.bill}
          onClose={() => setModal(null)}
          onSave={async (id, form) => {
            try {
              const bill = await api.addPayment(id, form);
              setViewBill(bill);
              await refresh();
              toast.success('Payment recorded', {
                description: `Payment of ₹${Number(form.amount || 0).toLocaleString('en-IN')} recorded against invoice.`,
              });
              setModal(null);
            } catch (err) {
              toast.error('Payment recording failed', { description: err.message });
              throw err;
            }
          }}
        />
      )}

      {modal?.type === 'vehicle' && (
        <VehicleModal
          isOpen
          onClose={() => setModal(null)}
          vehicleToEdit={modal.record}
          drivers={drivers}
          onSave={(form, id) => save('vehicle', form, id)}
        />
      )}

      {modal?.type === 'dailyKm' && (
        <DailyKmModal
          isOpen
          onClose={() => setModal(null)}
          vehicles={vehicles}
          preselectedVehicle={modal.record}
          onSave={async (id, form) => {
            try {
              await api.addDailyKm(id, form);
              await refresh();
              toast.success('Daily KM logged', {
                description: `Odometer reading of ${Number(form.km || 0).toLocaleString('en-IN')} KM recorded.`,
              });
              setModal(null);
            } catch (err) {
              toast.error('Failed to log KM', { description: err.message });
              throw err;
            }
          }}
        />
      )}

      {modal?.type === 'serviceRecord' && (
        <ServiceRecordModal
          isOpen
          onClose={() => setModal(null)}
          vehicle={modal.record}
          onSave={async (id, form) => {
            try {
              await api.recordVehicleService(id, form);
              await refresh();
              toast.success('Service record saved', {
                description: 'Vehicle workshop service logged and service interval reset.',
              });
              setModal(null);
            } catch (err) {
              toast.error('Failed to record service', { description: err.message });
              throw err;
            }
          }}
        />
      )}

      {modal?.type === 'vehicleHistory' && (
        <VehicleHistoryModal
          isOpen
          onClose={() => setModal(null)}
          vehicle={modal.record}
          onOpenDailyKm={(v) => setModal({ type: 'dailyKm', record: v })}
          onOpenServiceRecord={(v) => setModal({ type: 'serviceRecord', record: v })}
        />
      )}

      {modal?.type === 'meterDocuments' && (
        <MeterDocumentModal
          isOpen
          reading={modal.reading}
          onClose={() => setModal(null)}
          onDocumentsUpdated={refresh}
        />
      )}

      {modal?.type === 'corporateContract' && (
        <CorporateContractModal
          isOpen
          onClose={() => setModal(null)}
          contractToEdit={modal.record}
          customers={customers}
          vehicles={vehicles}
          drivers={drivers}
          onSave={(form, id) => save('corporateContract', form, id)}
        />
      )}

      {modal?.type === 'corporateTripLog' && (
        <CorporateTripLogModal
          isOpen
          onClose={() => setModal(null)}
          logToEdit={modal.record}
          preselectedContract={modal.preselectedContract}
          contracts={corporateContracts}
          customers={customers}
          vehicles={vehicles}
          drivers={drivers}
          existingLogs={corporateTripLogs}
          onSave={(form, id) => save('corporateTripLog', form, id)}
        />
      )}

      {modal?.type === 'fuelLog' && (
        <FuelModal
          isOpen
          onClose={() => setModal(null)}
          fuelLogToEdit={modal.record}
          vehicles={vehicles}
          drivers={drivers}
          onSave={(form, id) => save('fuelLog', form, id)}
        />
      )}

      {modal?.type === 'tyreLog' && (
        <TyreModal
          isOpen
          onClose={() => setModal(null)}
          tyreLogToEdit={modal.record}
          vehicles={vehicles}
          onSave={(form, id) => save('tyreLog', form, id)}
        />
      )}

      {modal?.type === 'advance' && (
        <AdvanceModal
          isOpen
          onClose={() => setModal(null)}
          driver={modal.driver}
          drivers={drivers}
          currentMonth={selectedPayrollMonth}
          payrollData={payrollData}
          onSave={(form) => save('driverAdvance', form)}
        />
      )}

      {modal?.type === 'payslip' && (
        <PayslipModal
          isOpen
          onClose={() => setModal(null)}
          payrollItem={modal.payrollItem}
          selectedMonth={selectedPayrollMonth}
          company={settings}
        />
      )}

      {viewBill && (
        <BillPrintView bill={viewBill} settings={settings} onClose={() => setViewBill(null)} />
      )}

      {viewQuote && (
        <QuotationPrintView
          quote={viewQuote}
          settings={settings}
          onClose={() => setViewQuote(null)}
        />
      )}

      {corporateInvoice && (
        <CorporateInvoiceModal
          isOpen={!!corporateInvoice}
          onClose={() => setCorporateInvoice(null)}
          contract={corporateInvoice.contract}
          tripLogs={corporateTripLogs}
          customers={customers}
          vehicles={vehicles}
          selectedMonth={corporateInvoice.month || ''}
          settings={settings}
          initialIsNonGst={Boolean(corporateInvoice.isNonGst)}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          isOpen={!!confirmDialog}
          onClose={() => {
            if (!confirmLoading) setConfirmDialog(null);
          }}
          onConfirm={handleConfirmAction}
          title={confirmDialog.title}
          message={confirmDialog.label}
          confirmText={confirmDialog.confirmText}
          loading={confirmLoading}
        />
      )}
    </div>
  );
}
