import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Printer,
  Trash,
  ShareNetwork,
  ArrowRight,
  FileText,
  CalendarCheck,
} from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';
import { shareQuote } from './QuotationPrintView';
import ThemedSelect from '../ThemedSelect';
import { toast } from '../../context/ToastContext';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function QuotationTable({
  settings = {},
  quotations,
  onAddQuotation,
  onViewQuotation,
  onUpdateStatus,
  onDeleteQuotation,
  onConvertToBooking,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (q.customerPhone || q.customer_phone || '').replace(/[^0-9]/g, '');
    const quoteNo = (q.quotationNumber || q.quotation_number || '').toLowerCase();

    const matchesSearch =
      !term ||
      quoteNo.includes(term) ||
      (q.customerName || q.customer_name || '').toLowerCase().includes(term) ||
      (q.customerPhone || q.customer_phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      (q.customerEmail || q.customer_email || '').toLowerCase().includes(term) ||
      (q.tourTitle || q.tour_title || '').toLowerCase().includes(term) ||
      (q.destination || q.tripDestination || '').toLowerCase().includes(term) ||
      (q.vehicleType || q.vehicle_type || '').toLowerCase().includes(term);

    const status = q.status;
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedQuotations,
  } = usePagination({ items: filteredQuotations, initialPageSize: 10 });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleQuickWhatsApp = (quote) => {
    try {
      shareQuote(quote, settings);
      toast.success('WhatsApp link opened', {
        description: `Sharing quotation #${quote.quotationNumber || quote.quotation_number || ''}`,
      });
    } catch (e) {
      toast.error('Failed to share via WhatsApp', {
        description: e.message,
      });
    }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Table Header Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="flex-1 sm:w-80 md:w-96">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MagnifyingGlass size={16} weight="bold" />
              </div>
              <input
                type="text"
                placeholder="Search by quote #, customer name, mobile number, tour package, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <ThemedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Draft">Draft</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </ThemedSelect>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {/* Add Quotation Button */}
          <button
            onClick={onAddQuotation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-sm transition-all active:scale-[0.99] shrink-0"
          >
            <FileText size={18} weight="bold" />
            <span>Create New Quotation</span>
          </button>
        </div>
      </div>

      {/* Quotations Data Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                <th className="py-3 px-4">Quote</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Tour Package</th>
                <th className="py-3 px-4">Vehicle & Duration</th>
                <th className="py-3 px-4 text-right">Quoted Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <p className="font-semibold text-slate-700">No quotations found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? 'Try adjusting your search criteria'
                          : 'Click "Create Tour Quotation" to draft your first estimate.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQuotations.map((quote) => {
                  const quoteNo = quote.quotationNumber || quote.quotation_number;
                  const custName = quote.customerName || quote.customer_name;
                  const custPhone = quote.customerPhone || quote.customer_phone;
                  const title = quote.tourTitle || quote.tour_title || 'Custom Tour';
                  const src = quote.sourceCity || quote.source_city || 'Pune';
                  const dest = quote.destinationCity || quote.destination_city;
                  const veh = quote.vehicleType || quote.vehicle_type;
                  const days = quote.durationDays || quote.duration_days || 1;
                  const total = quote.totalAmount || quote.total_amount;
                  const status = quote.status || 'Draft';

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Quote Number */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-navy-950 text-xs">{quoteNo}</span>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {formatDate(quote.createdAt || quote.created_at)}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{custName}</p>
                        <p className="text-[11px] text-slate-600 font-medium">{custPhone || '—'}</p>
                      </td>

                      {/* Tour Package */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-xs">{title}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-0.5">
                          <span>{src}</span>
                          <ArrowRight size={12} weight="bold" className="shrink-0 text-slate-400" />
                          <span className="truncate max-w-[120px]">{dest}</span>
                        </div>
                      </td>

                      {/* Vehicle & Duration */}
                      <td className="py-3 px-4 space-y-0.5">
                        <p className="font-semibold text-slate-800">{veh}</p>
                        <p className="text-[11px] text-slate-600 font-medium">{days} Days Tour</p>
                      </td>

                      {/* Quoted Price */}
                      <td className="py-3 px-4 text-right">
                        <p className="font-mono font-bold text-slate-900 text-xs">
                          {formatINR(total)}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium">Incl. 5% GST</p>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <ThemedSelect
                          value={status}
                          onChange={(e) => onUpdateStatus(quote.id, e.target.value)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${getStatusBadge(
                            status,
                          )}`}
                        >
                          <option value="Sent">Sent</option>
                          <option value="Draft">Draft</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                        </ThemedSelect>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* WhatsApp button */}
                          <button
                            onClick={() => handleQuickWhatsApp(quote)}
                            title="Share on WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                          >
                            <ShareNetwork size={14} weight="bold" />
                          </button>

                          {/* Convert to Booking */}
                          {onConvertToBooking && (
                            <button
                              onClick={() => onConvertToBooking(quote)}
                              title="Convert to Booking & Dispatch"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-2xs font-bold transition-all"
                            >
                              <CalendarCheck size={13} weight="bold" />
                              <span>Book</span>
                            </button>
                          )}

                          {/* Print / View */}
                          <button
                            onClick={() => onViewQuotation(quote)}
                            title="View / Print Quotation"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-bold transition-all shadow-sm"
                          >
                            <Printer size={13} weight="bold" />
                            <span>Preview</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteQuotation(quote.id)}
                            title="Delete Quotation"
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
          totalItems={filteredQuotations.length}
          onPageChange={setPage}
          label="tour quotations"
        />
      </div>
    </div>
  );
}
