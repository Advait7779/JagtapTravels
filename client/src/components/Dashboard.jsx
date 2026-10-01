import React from 'react';
import {
  Users,
  Car,
  Gauge,
  Receipt,
  FileText,
  CurrencyInr,
  Plus,
  ArrowUpRight,
  Printer,
  Wrench,
  Warning,
  CalendarCheck,
  ChatCircleDots,
  Clock,
  WhatsappLogo,
  ShieldWarning,
  TrendUp,
  CheckCircle,
  ArrowSquareOut,
  Certificate,
} from '@phosphor-icons/react';
import StatCard from './StatCard';
import { formatINR, formatDate } from '../utils/formatters';

export default function Dashboard({
  user,
  customers = [],
  drivers = [],
  meterReadings = [],
  bills = [],
  quotations = [],
  vehicles = [],
  bookings = [],
  inquiries = [],
  onOpenAddCustomer,
  onOpenAddDriver,
  onOpenAddMeterReading,
  onOpenAddBill,
  onOpenAddQuotation,
  onOpenAddBooking,
  onStartTripFromBooking,
  onViewBill,
  onViewQuotation,
  setActiveTab,
}) {
  // Calculations
  const availableDrivers = drivers.filter((d) => d.status === 'Available').length;
  const onTripDrivers = drivers.filter((d) => d.status === 'On Trip').length;
  const totalBilled = bills
    .filter((b) => !b.voidedAt)
    .reduce((acc, b) => acc + (Number(b.totalAmount || b.total_amount) || 0), 0);
  const pendingCollection = bills.reduce(
    (acc, b) => acc + (Number(b.balanceDue || b.balance_due) || 0),
    0,
  );
  const activeQuotes = quotations.filter((q) => q.status === 'Sent' || q.status === 'Draft').length;

  // Maintenance & Compliance calculations
  const vehiclesDue = vehicles.filter((v) => v.status === 'Service Due');
  const vehiclesApproaching = vehicles.filter((v) => v.status === 'Approaching');

  // Overdue bills calculation
  const overdueBills = bills.filter((b) => b.isOverdue && !b.voidedAt);
  const overdueAmount = overdueBills.reduce((sum, b) => sum + (Number(b.balanceDue) || 0), 0);

  // Profit tracking
  const billsWithExpenses = bills.filter((b) => !b.voidedAt && (b.totalExpense || 0) > 0);
  const totalRecordedProfit = billsWithExpenses.reduce((sum, b) => sum + (Number(b.netProfit) || 0), 0);

  // Document Expiries alerts (vehicles + drivers)
  const vehicleDocAlerts = [];
  for (const v of vehicles) {
    if (v.docAlerts && v.docAlerts.length > 0) {
      for (const a of v.docAlerts) {
        vehicleDocAlerts.push({
          vehicleName: v.name,
          vehicleNumber: v.vehicleNumber,
          label: a.label,
          days: a.daysRemaining,
          status: a.status,
        });
      }
    }
  }

  const driverDocAlerts = [];
  for (const d of drivers) {
    if (d.licenseStatus === 'Expired' || d.licenseStatus === 'Expiring Soon') {
      driverDocAlerts.push({
        driverName: d.name,
        label: 'Driver License',
        days: d.licenseDaysRemaining,
        status: d.licenseStatus,
      });
    }
  }

  const allDocAlerts = [...vehicleDocAlerts, ...driverDocAlerts];

  // Dispatches / Bookings for today or upcoming
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingBookings = bookings
    .filter((b) => b.status !== 'Cancelled')
    .slice(0, 5);

  // New Inquiries from website
  const newInquiries = inquiries.filter((i) => i.status === 'New').slice(0, 4);

  const recentBills = bills.slice(0, 5);
  const recentCustomers = customers.slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-navy-950 text-white p-4 sm:p-6 rounded-md shadow-lg border border-navy-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            Welcome back, Admin
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 sm:mt-1 font-normal">
            Fleet operations, trip dispatches, website inquiries, and financial tracking.
          </p>
        </div>

        {/* Right End Letters & Information */}
        <div className="relative z-10 text-left md:text-right space-y-1">
          <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
            Jagtap Travels
          </h3>
          <p className="text-xs text-slate-300 font-medium">
            Pune, Maharashtra • 24/7 Operations Desk
          </p>
        </div>

        {/* Subtle Decorative Background Letters Watermark */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-6xl sm:text-7xl md:text-8xl font-black text-white/[0.04] tracking-tighter select-none pointer-events-none uppercase">
          JAGTAP
        </div>
      </div>

      {/* 🚨 Overdue Invoices Alert Banner */}
      {overdueBills.length > 0 && (
        <div className="p-4 rounded-md bg-rose-50 border-2 border-rose-300/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-rose-600 flex items-center justify-center shrink-0 text-white shadow-xs">
              <Warning size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] uppercase rounded tracking-wider">
                  Payment Overdue
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  {overdueBills.length} Client Invoices Past Due Date!
                </h4>
              </div>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                Total overdue collection of{' '}
                <strong className="font-bold text-rose-700">{formatINR(overdueAmount)}</strong> requires follow-up.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('bills')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-all shadow-xs shrink-0"
          >
            Review Overdue Bills
          </button>
        </div>
      )}

      {/* ⚠️ RTO & Chauffeur Document Expiry Alert Banner */}
      {allDocAlerts.length > 0 && (
        <div className="p-4 rounded-md bg-amber-50 border-2 border-amber-300/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-600 flex items-center justify-center shrink-0 text-white shadow-xs">
              <ShieldWarning size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-600 text-white font-black text-[10px] uppercase rounded tracking-wider">
                  Compliance Warning
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  {allDocAlerts.length} Document Expiration Alerts!
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {allDocAlerts.slice(0, 3).map((alert, idx) => (
                  <span
                    key={idx}
                    className={`text-2xs font-bold px-2 py-0.5 rounded border ${
                      alert.status === 'Expired'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-white text-amber-900 border-amber-300'
                    }`}
                  >
                    {alert.vehicleNumber || alert.driverName}: {alert.label}{' '}
                    {alert.days <= 0 ? `Expired (${Math.abs(alert.days)}d ago)` : `expires in ${alert.days}d`}
                  </span>
                ))}
                {allDocAlerts.length > 3 && (
                  <span className="text-2xs text-amber-800 font-semibold self-center">
                    +{allDocAlerts.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('vehicles')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold transition-all shadow-xs shrink-0"
          >
            Review Fleet Docs
          </button>
        </div>
      )}

      {/* 🚨 30,000 KM Periodic Maintenance Reminder Banner */}
      {vehiclesDue.length > 0 && (
        <div className="p-4 sm:p-5 rounded-md bg-rose-50 border-2 border-rose-300/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-md bg-rose-600 border border-rose-700 flex items-center justify-center shrink-0 shadow-xs text-white">
              <Warning size={24} weight="bold" className="text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-rose-600 text-white font-black text-[10px] uppercase rounded-md tracking-wider shadow-2xs">
                  Action Required
                </span>
                <h3 className="font-black text-sm sm:text-base tracking-tight text-slate-950">
                  Vehicle Maintenance Due Reminder!
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 mt-1 font-medium leading-relaxed">
                {vehiclesDue.length === 1 ? (
                  <>
                    <strong className="text-slate-950 font-black">
                      {vehiclesDue[0].name} ({vehiclesDue[0].vehicleNumber})
                    </strong>{' '}
                    is currently at{' '}
                    <strong className="inline-block font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs mx-1">
                      {Number(vehiclesDue[0].currentOdometer || 0).toLocaleString('en-IN')} KM
                    </strong>{' '}
                    and has reached its{' '}
                    {Number(vehiclesDue[0].serviceIntervalKm || 30000).toLocaleString('en-IN')} KM
                    service interval.
                  </>
                ) : (
                  <>
                    <strong className="text-rose-900 font-bold">
                      {vehiclesDue.length} vehicles
                    </strong>{' '}
                    have reached their configured maintenance intervals and require workshop
                    servicing.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('vehicles')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Wrench size={16} weight="bold" className="text-white" />
              <span>Manage Service & Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Active Bookings"
          value={bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Dispatched').length}
          subtext={`${bookings.length} total scheduled`}
          icon={CalendarCheck}
          color="indigo"
        />
        <StatCard
          title="Website Leads"
          value={newInquiries.length > 0 ? `${newInquiries.length} New` : 'All Followed Up'}
          subtext={`${inquiries.length} total website inquiries`}
          icon={ChatCircleDots}
          color={newInquiries.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Fleet Vehicles"
          value={`${vehicles.length} Cabs`}
          subtext={
            vehiclesDue.length > 0
              ? `${vehiclesDue.length} service due • ${vehicles.length - vehiclesDue.length} active`
              : `${vehicles.length} cabs ready for duty`
          }
          icon={Car}
          color="emerald"
        />
        <StatCard
          title="Available Chauffeurs"
          value={`${availableDrivers} Ready`}
          subtext={
            onTripDrivers > 0
              ? `${onTripDrivers} on trip • ${drivers.length} total roster`
              : `${drivers.length} total drivers registered`
          }
          icon={Users}
          color="blue"
        />
      </div>

      {/* Interactive Middle Row: Today's Bookings & Website Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's & Upcoming Bookings */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} weight="bold" className="text-navy-900" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Dispatches & Bookings</h3>
                <p className="text-2xs text-slate-500">Scheduled passenger pickups and tours</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('bookings')}
              className="text-xs font-bold text-navy-800 hover:text-red-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          <div className="space-y-2">
            {upcomingBookings.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No active bookings scheduled. Click below to add one.
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-950 text-2xs">
                        {b.bookingNumber}
                      </span>
                      <span className="font-bold text-slate-900">{b.customerName}</span>
                      <span className="text-2xs text-slate-500">• {b.customerPhone}</span>
                    </div>
                    <div className="text-2xs text-slate-600 mt-0.5">
                      <span className="font-semibold text-slate-800">{b.pickupLocation}</span> ➔{' '}
                      <span className="font-semibold text-amber-800">{b.dropLocation}</span> |{' '}
                      <span>{formatDate(b.startDate)}</span> {b.pickupTime ? `at ${b.pickupTime}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded ${
                        b.status === 'Dispatched'
                          ? 'bg-amber-100 text-amber-800'
                          : b.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {b.status}
                    </span>
                    <button
                      onClick={() => onStartTripFromBooking?.(b)}
                      title="Create Duty Slip"
                      className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-2xs font-bold text-slate-800"
                    >
                      Duty Slip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {onOpenAddBooking && (
            <button
              onClick={onOpenAddBooking}
              className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={14} weight="bold" />
              <span>Create New Booking</span>
            </button>
          )}
        </div>

        {/* Real-time Website Leads */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ChatCircleDots size={18} weight="bold" className="text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Website Enquiries (Leads Inbox)</h3>
                <p className="text-2xs text-slate-500">Instant inquiries from the public booking form</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inquiries')}
              className="text-xs font-bold text-navy-800 hover:text-red-700 flex items-center gap-1"
            >
              <span>View Table</span>
              <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          <div className="space-y-2">
            {newInquiries.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No new unhandled leads. All customer enquiries have been contacted!
              </div>
            ) : (
              newInquiries.map((inq) => {
                const phoneDigits = (inq.phone || '').replace(/[^0-9]/g, '');
                const waNum = phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`;
                return (
                  <div
                    key={inq.id}
                    className="p-3 rounded-md bg-blue-50/50 border border-blue-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{inq.name}</p>
                        <span className="font-mono text-2xs text-slate-500 font-medium">
                          {inq.phone}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-600 mt-0.5">
                        <span className="font-semibold text-slate-800">{inq.tripType}</span> •{' '}
                        <span>{inq.vehicle || 'Fleet Car'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                          `Namaste ${inq.name}, thank you for contacting Jagtap Travels Pune regarding your ${inq.tripType}. How can we assist you?`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        title="Chat on WhatsApp"
                      >
                        <WhatsappLogo size={15} weight="fill" />
                      </a>
                      <button
                        onClick={() => setActiveTab('inquiries')}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-2xs font-bold rounded-lg"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Grid: Recent Bills and Driver Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Bills (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Trip Invoices</h3>
              <p className="text-xs text-slate-600 font-normal">
                Latest customer bills and trip settlements
              </p>
            </div>
            <button
              onClick={() => setActiveTab('bills')}
              className="text-xs font-bold text-navy-800 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="text-slate-700 font-bold border-b border-slate-200">
                  <th className="pb-2">Bill</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Route</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentBills.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <span>No invoices yet.</span>
                        <button
                          type="button"
                          onClick={onOpenAddBill}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-navy-800"
                        >
                          <Receipt size={14} weight="bold" />
                          Generate Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-navy-950">
                        {b.billNumber || b.bill_number}
                      </td>
                      <td className="py-3 text-slate-900 font-semibold">
                        {b.customerName || b.customer_name}
                      </td>
                      <td className="py-3 text-slate-600 truncate max-w-[150px]">
                        {b.tripDestination || b.trip_destination}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(b.totalAmount || b.total_amount)}
                        {b.isOverdue && (
                          <span className="block text-[10px] text-rose-600 font-bold">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            (b.paymentStatus || b.payment_status) === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {b.paymentStatus || b.payment_status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onViewBill(b)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
                        >
                          <Printer size={13} weight="bold" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet & Quick Drivers Status (1 Column) */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fleet Availability</h3>
              <p className="text-xs text-slate-600 font-normal">
                Current drivers and assigned vehicles
              </p>
            </div>
            <button
              onClick={() => setActiveTab('drivers')}
              className="text-xs font-bold text-navy-800 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          <div className="space-y-3">
            {drivers.map((d) => {
              const hasDoc = Boolean(d.licenseDocumentUrl || (d.documents && d.documents.length > 0));
              const docUrl = d.licenseDocumentUrl || d.documents?.[0]?.fileUrl;

              return (
                <div
                  key={d.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{d.name}</p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {d.vehicleAssigned || d.vehicle_assigned || 'Unassigned'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {hasDoc ? (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="View driving license"
                        >
                          <FileText size={10} weight="bold" />
                          <span>License Attached</span>
                          <ArrowSquareOut size={9} weight="bold" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveTab('drivers')}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:underline"
                        >
                          <Certificate size={11} weight="bold" />
                          <span>Upload License</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.status === 'On Trip'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Customers preview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Quick Client Directory</span>
              <button
                onClick={() => setActiveTab('customers')}
                className="text-xs font-bold text-navy-800 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowUpRight size={13} weight="bold" />
              </button>
            </div>
            <div className="space-y-1.5">
              {recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs py-1">
                  <span className="font-medium text-slate-800 truncate max-w-[130px]">
                    {c.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 font-medium">
                    {c.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
