import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Receipt,
  Printer,
  Trash,
  CalendarBlank,
  ArrowRight,
} from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function BillTable({ bills, onAddBill, onViewBill, onRecordPayment, onDeleteBill }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredBills = bills.filter((b) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (b.customerPhone || b.customer_phone || '').replace(/[^0-9]/g, '');
    const billNo = (b.billNumber || b.bill_number || '').toLowerCase();
    const vNo = (b.vehicleNumber || b.vehicle_number || '').toLowerCase();
    const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

    const matchesSearch =
      !term ||
      billNo.includes(term) ||
      (b.customerName || b.customer_name || '').toLowerCase().includes(term) ||
      (b.customerPhone || b.customer_phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      (b.tripDestination || b.trip_destination || '').toLowerCase().includes(term) ||
      (b.startLocation || b.start_location || '').toLowerCase().includes(term) ||
      (b.vehicleName || b.vehicle_name || '').toLowerCase().includes(term) ||
      vNo.includes(term) ||
      (cleanTerm && cleanVNo.includes(cleanTerm)) ||
      (b.driverName || b.driver_name || '').toLowerCase().includes(term);

    const status = b.paymentStatus || b.payment_status;
    let matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    if (statusFilter === 'Overdue') {
      matchesStatus = b.isOverdue === true;
    }
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedBills,
  } = usePagination({ items: filteredBills, initialPageSize: 10 });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Table Header Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="flex-1 sm:w-80 md:w-96">
             <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <MagnifyingGlass size={16} weight="bold" />
               </div>
               <input
                 type="text"
                 placeholder="Search by bill #, customer name, mobile number, destination, vehicle, driver..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
               />
             </div>
           </div>

          {/* Payment Status Filter */}
          <ThemedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Payments</option>
            <option value="Overdue">⚠️ Overdue Invoices</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </ThemedSelect>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {/* Generate Bill Button */}
          <button
            onClick={onAddBill}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-sm transition-all active:scale-[0.99] shrink-0"
          >
            <Receipt size={16} weight="bold" />
            <span>Generate Customer Bill</span>
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Trip Route & Dates</th>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Total KM</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <p className="font-semibold text-slate-700">No bills or invoices found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? 'Try adjusting your search criteria'
                          : 'Click "Generate Customer Bill" to bill your first trip.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBills.map((bill) => {
                  const billNo = bill.billNumber || bill.bill_number;
                  const custName = bill.customerName || bill.customer_name;
                  const custPhone = bill.customerPhone || bill.customer_phone;
                  const src = bill.tripSource || bill.trip_source;
                  const dest = bill.tripDestination || bill.trip_destination;
                  const startD = bill.startDate || bill.start_date;
                  const endD = bill.endDate || bill.end_date;
                  const veh = bill.vehicleName || bill.vehicle_name;
                  const plate = bill.vehicleNumber || bill.vehicle_number;
                  const drv = bill.driverName || bill.driver_name;
                  const km = bill.totalKm || bill.total_km || 0;
                  const total = bill.totalAmount || bill.total_amount;
                  const bal = bill.balanceDue || bill.balance_due || 0;
                  const status = bill.paymentStatus || bill.payment_status || 'Pending';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Bill Number */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-navy-950 text-xs">{billNo}</span>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {formatDate(bill.createdAt || bill.created_at || startD)}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{custName}</p>
                        <p className="text-[11px] text-slate-600 font-medium">{custPhone || '—'}</p>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                          <span>{src}</span>
                          <ArrowRight size={12} weight="bold" className="shrink-0 text-slate-400" />
                          <span className="truncate max-w-[130px]">{dest}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-0.5">
                          <CalendarBlank size={13} weight="bold" className="text-slate-400" />
                          <span>{formatDate(startD)}</span>
                        </div>
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {plate || veh || 'Fleet Car'}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {veh || 'Tour Vehicle'}
                          {drv && <span className="text-[10px] text-slate-400"> • {drv}</span>}
                        </div>
                      </td>

                      {/* Total KM */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-800">{km} KM</span>
                      </td>

                      {/* Total Amount & Profit */}
                      <td className="py-3 px-4 text-right">
                        <p className="font-mono font-bold text-slate-900 text-xs">
                          {formatINR(total)}
                        </p>
                        {Number(bal) > 0 ? (
                          <p className="font-mono text-[10px] text-rose-600 font-semibold">
                            Due: {formatINR(bal)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-semibold">Cleared</p>
                        )}
                        {bill.totalExpense > 0 && (
                          <p className="text-2xs text-emerald-700 font-semibold mt-0.5">
                            Profit: {formatINR(bill.netProfit)}
                          </p>
                        )}
                      </td>

                      {/* Status & Due Date */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                        {bill.dueDate && (
                          <div className="mt-1">
                            {bill.isOverdue ? (
                              <span className="inline-block text-2xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                Overdue ({bill.daysOverdue}d)
                              </span>
                            ) : (
                              <span className="text-2xs text-slate-500 font-mono">
                                Due: {formatDate(bill.dueDate)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewBill(bill)}
                            title="Print / View Invoice"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-bold transition-all shadow-sm"
                          >
                            <Printer size={13} weight="bold" />
                            <span>Print</span>
                          </button>

                          {!bill.voidedAt && Number(bill.balanceDue) > 0 && (
                            <button
                              onClick={() => onRecordPayment(bill)}
                              title="Record payment"
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-bold"
                            >
                              Payment
                            </button>
                          )}
                          {/* Cancel unpaid invoice */}
                          <button
                            onClick={() => onDeleteBill(bill.id)}
                            title="Cancel unpaid invoice"
                            disabled={
                              !!bill.voidedAt || Number(bill.totalPaid ?? bill.advancePaid ?? 0) > 0
                            }
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredBills.length}
          onPageChange={setPage}
          label="invoices generated"
        />
      </div>
    </div>
  );
}
