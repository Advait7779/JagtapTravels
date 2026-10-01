import React, { useState } from 'react';
import {
  MagnifyingGlass,
  ChatCircleDots,
  Phone,
  EnvelopeSimple,
  WhatsappLogo,
  FileText,
  CalendarCheck,
  UserPlus,
  Trash,
  Clock,
  Car,
  MapPin,
  CaretDown,
  CheckCircle,
  XCircle,
  Eye,
} from '@phosphor-icons/react';
import { formatDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function InquiryTable({
  inquiries = [],
  onUpdateStatus,
  onDeleteInquiry,
  onCreateQuote,
  onCreateBooking,
  onAddCustomer,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (inq.phone || '').replace(/[^0-9]/g, '');

    const matchesSearch =
      !term ||
      (inq.inquiryNumber || '').toLowerCase().includes(term) ||
      (inq.name || '').toLowerCase().includes(term) ||
      (inq.phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      (inq.email || '').toLowerCase().includes(term) ||
      (inq.tripType || '').toLowerCase().includes(term) ||
      (inq.vehicle || '').toLowerCase().includes(term) ||
      (inq.message || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedInquiries,
  } = usePagination({ items: filteredInquiries, initialPageSize: 10 });

  // KPI counters
  const totalLeads = inquiries.length;
  const newLeads = inquiries.filter((i) => i.status === 'New').length;
  const contactedLeads = inquiries.filter((i) => i.status === 'Contacted').length;
  const convertedLeads = inquiries.filter((i) => i.status === 'Converted').length;

  const statusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Quoted':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCleanPhone = (phone) => {
    return (phone || '').replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Enquiries</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalLeads}</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md">
            <ChatCircleDots size={20} weight="bold" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-blue-600 uppercase tracking-wider">New Leads</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{newLeads}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-md">
            <Clock size={20} weight="bold" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-purple-600 uppercase tracking-wider">In Follow-Up</p>
            <p className="text-xl font-black text-purple-700 mt-0.5">{contactedLeads}</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-md">
            <FileText size={20} weight="bold" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-emerald-600 uppercase tracking-wider">Converted</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{convertedLeads}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-md">
            <CheckCircle size={20} weight="bold" />
          </div>
        </div>
      </div>

      {/* Header Controls Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
          {/* Search Box */}
          <div className="flex-1 sm:w-72 md:w-96">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MagnifyingGlass size={16} weight="bold" />
              </div>
              <input
                type="text"
                placeholder="Search by lead #, customer name, mobile number, tour type, vehicle, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'New', 'Contacted', 'Quoted', 'Converted', 'Lost'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-navy-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Leads' : st}
                </button>
              ))}
            </div>

            <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                <th className="py-3 px-4">Lead / Received</th>
                <th className="py-3 px-4">Inquirer Details</th>
                <th className="py-3 px-4">Trip Requirements</th>
                <th className="py-3 px-4">Customer Message</th>
                <th className="py-3 px-4">Lead Status</th>
                <th className="py-3 px-4 text-center">Convert & Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ChatCircleDots size={36} weight="thin" className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No leads found</p>
                      <p className="text-2xs text-slate-400">
                        Website enquiries from the public contact form will appear here in real-time
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInquiries.map((inq) => {
                  const phoneDigits = getCleanPhone(inq.phone);
                  const whatsappPhone = phoneDigits.startsWith('91')
                    ? phoneDigits
                    : `91${phoneDigits}`;
                  const whatsappMsg = encodeURIComponent(
                    `Namaste ${inq.name}! Thank you for reaching out to Jagtap Travels Pune regarding your ${inq.tripType || 'tour enquiry'}. How can we assist you with your booking today?`,
                  );

                  return (
                    <tr key={inq.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Lead # and timestamp */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-navy-950">
                          {inq.inquiryNumber || 'INQ-NEW'}
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          {inq.createdAt ? formatDate(inq.createdAt) : 'Recent'}
                        </div>
                        <span className="inline-block mt-1 text-2xs font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {inq.source || 'Website'}
                        </span>
                      </td>

                      {/* Inquirer Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inq.name}</div>
                        <div className="text-2xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone size={12} />
                          <a href={`tel:${inq.phone}`} className="hover:text-navy-900 font-mono font-medium">
                            {inq.phone}
                          </a>
                        </div>
                        {inq.email && (
                          <div className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <EnvelopeSimple size={12} />
                            <span>{inq.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <MapPin size={13} className="text-amber-600 shrink-0" />
                          <span>{inq.tripType || 'Tour Package / Cab Rental'}</span>
                        </div>
                        {inq.vehicle && (
                          <div className="text-2xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <Car size={12} />
                            <span>{inq.vehicle}</span>
                          </div>
                        )}
                        {inq.travelDate && (
                          <div className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            <span>Date: {formatDate(inq.travelDate)}</span>
                          </div>
                        )}
                      </td>

                      {/* Message */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-2xs text-slate-600 line-clamp-2 italic">
                          "{inq.message || 'No special requirements noted.'}"
                        </p>
                        {inq.message && inq.message.length > 60 && (
                          <button
                            onClick={() => setSelectedLead(inq)}
                            className="text-2xs font-bold text-navy-900 hover:underline mt-0.5"
                          >
                            View Full Note
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <ThemedSelect
                          value={inq.status || 'New'}
                          onChange={(e) => onUpdateStatus(inq.id, e.target.value)}
                          className={`text-2xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${statusBadge(
                            inq.status || 'New',
                          )}`}
                        >
                          <option value="New">New Lead</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Quoted">Quoted</option>
                          <option value="Converted">Converted</option>
                          <option value="Lost">Lost</option>
                        </ThemedSelect>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Direct WhatsApp button */}
                          {phoneDigits && (
                            <a
                              href={`https://wa.me/${whatsappPhone}?text=${whatsappMsg}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <WhatsappLogo size={16} weight="fill" />
                            </a>
                          )}

                          {/* Convert to Quotation */}
                          <button
                            onClick={() => onCreateQuote(inq)}
                            title="Generate Custom Quotation"
                            className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1 text-2xs font-bold"
                          >
                            <FileText size={14} weight="bold" />
                            <span className="hidden sm:inline">Quote</span>
                          </button>

                          {/* Convert to Booking */}
                          <button
                            onClick={() => onCreateBooking(inq)}
                            title="Convert to Booking"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 text-2xs font-bold"
                          >
                            <CalendarCheck size={14} weight="bold" />
                            <span className="hidden sm:inline">Book</span>
                          </button>

                          {/* Save as CRM Customer */}
                          <button
                            onClick={() => onAddCustomer(inq)}
                            title="Add to Customer Directory"
                            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <UserPlus size={15} weight="bold" />
                          </button>

                          {/* Delete Lead */}
                          <button
                            onClick={() => onDeleteInquiry(inq.id, inq.name)}
                            title="Delete Lead"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash size={15} weight="bold" />
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
        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredInquiries.length}
          onPageChange={setPage}
          label="inquiries"
        />
      </div>

      {/* Modal for viewing full message / lead detail */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Lead Message & Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p>
                <span className="font-bold text-slate-700">Client:</span> {selectedLead.name}
              </p>
              <p>
                <span className="font-bold text-slate-700">Phone:</span> {selectedLead.phone}
              </p>
              <p>
                <span className="font-bold text-slate-700">Trip:</span> {selectedLead.tripType}
              </p>
              <p>
                <span className="font-bold text-slate-700">Vehicle:</span> {selectedLead.vehicle}
              </p>
              <p>
                <span className="font-bold text-slate-700">Travel Date:</span>{' '}
                {selectedLead.travelDate}
              </p>
              <div className="pt-2">
                <span className="font-bold text-slate-700 block mb-1">Full Note / Requirement:</span>
                <p className="bg-slate-50 p-3 rounded-md border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedLead.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="w-full py-2 bg-navy-900 text-white rounded-md text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
