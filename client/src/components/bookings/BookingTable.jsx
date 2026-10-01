import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Plus,
  CalendarCheck,
  Car,
  User,
  Phone,
  MapPin,
  Clock,
  Gauge,
  Receipt,
  PencilSimple,
  Trash,
  CheckCircle,
  CaretDown,
  Calendar,
  ListBullets,
  AirplaneTakeoff,
  Users,
} from '@phosphor-icons/react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function BookingTable({
  bookings = [],
  vehicles = [],
  drivers = [],
  onAddBooking,
  onEditBooking,
  onDeleteBooking,
  onUpdateStatus,
  onStartTrip,
  onGenerateBill,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (b.customerPhone || '').replace(/[^0-9]/g, '');

    const matchesSearch =
      !term ||
      (b.bookingNumber || '').toLowerCase().includes(term) ||
      (b.customerName || '').toLowerCase().includes(term) ||
      (b.customerPhone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      (b.pickupLocation || '').toLowerCase().includes(term) ||
      (b.dropLocation || '').toLowerCase().includes(term) ||
      (b.vehicleName || '').toLowerCase().includes(term) ||
      (b.vehicleNumber || '').toLowerCase().includes(term) ||
      (b.vehicleType || '').toLowerCase().includes(term) ||
      (b.driverName || '').toLowerCase().includes(term) ||
      (b.flightTrainNumber || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedBookings,
  } = usePagination({ items: filteredBookings, initialPageSize: 10 });

  // KPI stats
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const dispatchedCount = bookings.filter((b) => b.status === 'Dispatched').length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;

  const statusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Dispatched':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Group by date for calendar / timeline view
  const groupedByDate = filteredBookings.reduce((acc, b) => {
    const dateKey = b.startDate || 'No Date';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] w-full max-w-full">
      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">All Bookings</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md">
            <CalendarCheck size={20} weight="bold" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-blue-600 uppercase tracking-wider">Confirmed</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{confirmedCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-md">
            <Clock size={20} weight="bold" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-amber-600 uppercase tracking-wider">On Trip (Dispatched)</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{dispatchedCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-md">
            <Car size={20} weight="bold" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{completedCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-md">
            <CheckCircle size={20} weight="bold" />
          </div>
        </div>
      </div>

      {/* Header Controls Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Search Box */}
          <div className="w-full sm:w-72 lg:w-80 min-w-0">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MagnifyingGlass size={16} weight="bold" />
              </div>
              <input
                type="text"
                placeholder="Search by booking #, customer, mobile number, route, vehicle, driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0 max-w-full">
            {['ALL', 'Confirmed', 'Dispatched', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-start sm:justify-end shrink-0">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {/* View Toggle */}
          <div className="inline-flex rounded-md border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'list' ? 'bg-white text-navy-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <ListBullets size={15} weight="bold" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'calendar' ? 'bg-white text-navy-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <Calendar size={15} weight="bold" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Add Booking Button */}
          <button
            onClick={onAddBooking}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-sm transition-all active:scale-[0.99] whitespace-nowrap shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* View: List View */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                  <th className="py-3 px-4">Booking / Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Trip Route & Time</th>
                  <th className="py-3 px-4">Vehicle & Chauffeur</th>
                  <th className="py-3 px-4">Commercials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Dispatch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarCheck size={36} weight="thin" className="text-slate-300" />
                        <p className="font-semibold text-slate-600">No bookings found</p>
                        <p className="text-2xs text-slate-400">
                          Click "New Booking" to schedule an advance trip
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Booking # & Schedule */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-navy-950">{b.bookingNumber}</div>
                        <div className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          <span>{formatDate(b.startDate)}</span>
                          {b.endDate && b.endDate !== b.startDate && (
                            <span> to {formatDate(b.endDate)}</span>
                          )}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} />
                          <a href={`tel:${b.customerPhone}`} className="hover:text-navy-900 font-mono">
                            {b.customerPhone}
                          </a>
                        </div>
                        {b.passengerCount && (
                          <div className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Users size={12} />
                            <span>{b.passengerCount} Passengers</span>
                          </div>
                        )}
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{b.pickupLocation}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="text-amber-700">{b.dropLocation}</span>
                        </div>
                        {b.pickupTime && (
                          <div className="text-2xs text-slate-500 mt-0.5">
                            Pickup Time: <span className="font-semibold">{b.pickupTime}</span>
                          </div>
                        )}
                        {b.flightTrainNumber && (
                          <div className="text-2xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <AirplaneTakeoff size={12} />
                            <span>{b.flightTrainNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Vehicle & Chauffeur */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {b.vehicleNumber || b.vehicleName || b.vehicleType || 'Fleet Vehicle'}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {b.vehicleName || b.vehicleType || 'Tour Vehicle'}
                          {b.driverName && (
                            <span className="text-[10px] text-slate-400"> • {b.driverName}</span>
                          )}
                        </div>
                      </td>

                      {/* Commercials */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          Est: {formatCurrency(b.estimatedAmount || 0)}
                        </div>
                        {Number(b.advanceAmount) > 0 && (
                          <div className="text-2xs font-semibold text-emerald-700 mt-0.5">
                            Adv: {formatCurrency(b.advanceAmount)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <ThemedSelect
                          value={b.status}
                          onChange={(e) => onUpdateStatus(b.id, e.target.value)}
                          className={`text-2xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${statusBadge(
                            b.status,
                          )}`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </ThemedSelect>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Convert to Duty Slip / Start Trip */}
                          <button
                            onClick={() => onStartTrip(b)}
                            title="Start Trip (Create Duty Slip)"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1 text-2xs font-bold"
                          >
                            <Gauge size={14} weight="bold" />
                            <span className="hidden sm:inline">Duty Slip</span>
                          </button>

                          {/* Convert to Bill */}
                          <button
                            onClick={() => onGenerateBill(b)}
                            title="Generate Invoice"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-2xs font-bold"
                          >
                            <Receipt size={14} weight="bold" />
                            <span className="hidden sm:inline">Bill</span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditBooking(b)}
                            title="Edit Booking"
                            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteBooking(b.id, b.bookingNumber)}
                            title="Delete Booking"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredBookings.length}
            onPageChange={setPage}
            label="bookings"
          />
        </div>
      ) : (
        /* View: Timeline / Grouped by Date */
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="bg-white rounded-md p-12 text-center text-slate-400 border border-slate-200">
              No bookings matching filter
            </div>
          ) : (
            sortedDates.map((dateStr) => (
              <div
                key={dateStr}
                className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={18} weight="bold" className="text-navy-900" />
                    <h3 className="text-sm font-black text-slate-900">
                      {formatDate(dateStr)}
                    </h3>
                  </div>
                  <span className="text-2xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {groupedByDate[dateStr].length} Booking{groupedByDate[dateStr].length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedByDate[dateStr].map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xs font-bold text-navy-900">
                          {b.bookingNumber}
                        </span>
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-md border ${statusBadge(
                            b.status,
                          )}`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 text-xs">{b.customerName}</p>
                        <p className="text-2xs text-slate-500">{b.customerPhone}</p>
                      </div>

                      <div className="text-2xs font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <span>{b.pickupLocation}</span>
                          <span>➔</span>
                          <span className="text-amber-700">{b.dropLocation}</span>
                        </div>
                        {b.pickupTime && <p className="text-slate-500 mt-0.5">Time: {b.pickupTime}</p>}
                      </div>

                      <div className="flex items-center justify-between text-2xs pt-1 border-t border-slate-100">
                        <div className="text-slate-600 truncate max-w-[150px]">
                          🚗 {b.vehicleNumber || b.vehicleName || b.vehicleType}
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatCurrency(b.estimatedAmount || 0)}
                        </div>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => onStartTrip(b)}
                          className="flex-1 py-1 text-center text-2xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg"
                        >
                          Duty Slip
                        </button>
                        <button
                          onClick={() => onGenerateBill(b)}
                          className="flex-1 py-1 text-center text-2xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                        >
                          Bill
                        </button>
                        <button
                          onClick={() => onEditBooking(b)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <PencilSimple size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
