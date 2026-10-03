import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Receipt,
  Printer,
  Trash,
  CalendarBlank,
  Eye,
  Plus,
  ArrowsClockwise,
  X,
} from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

const searchableDate = (value) => {
  const iso = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return String(value || '').toLowerCase();
  const [year, month, day] = iso.split('-');
  return [iso, `${day}/${month}/${year}`, formatDate(iso)].join(' ').toLowerCase();
};

export default function CorporateInvoiceTable({
  invoices = [],
  contracts = [],
  onViewInvoice,
  onDeleteInvoice,
  onGenerateNew,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'GST' | 'NONGST'

  // Comprehensive filter supporting date, party name, invoice #, vehicle, period
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const targetDate = dateFilter.trim().toLowerCase();

    return invoices.filter((inv) => {
      // 1. Type Filter
      const isNonGst = Boolean(inv.isNonGst || inv.invoiceType === 'nongst');
      if (typeFilter === 'GST' && isNonGst) return false;
      if (typeFilter === 'NONGST' && !isNonGst) return false;

      // 2. Date Filter (explicit date picker / search)
      if (targetDate) {
        const invDate = searchableDate(inv.invoiceDate);
        const invMonth = String(inv.month || '').toLowerCase();
        const invUpdated = searchableDate(inv.updatedAt);
        const dateMatches =
          invDate.includes(targetDate) ||
          invMonth.includes(targetDate) ||
          invUpdated.includes(targetDate);
        if (!dateMatches) return false;
      }

      // 3. Search Term (Name, Date, Invoice No, Period, Vehicles, PO No)
      if (!term) return true;

      const partyName = (inv.partyName || '').toLowerCase();
      const partyAddress = (inv.partyAddress || '').toLowerCase();
      const partyGstin = (inv.partyGstin || '').toLowerCase();
      const invNo = (inv.invoiceNo || '').toLowerCase();
      const period = (inv.period || '').toLowerCase();
      const month = (inv.month || '').toLowerCase();
      const poNo = (inv.poNo || '').toLowerCase();
      const invoiceDate = searchableDate(inv.invoiceDate);
      const vehicleType = (inv.vehicleType || '').toLowerCase();
      const vehicleNumbers = (inv.vehicleNumbers || '').toLowerCase();

      // Check particulars across line items
      const lineItemMatches = Array.isArray(inv.lineItems)
        ? inv.lineItems.some((item) =>
            (item.particulars || '').toLowerCase().includes(term),
          )
        : false;

      // Also check toll items
      const tollItemMatches = Array.isArray(inv.tollItems)
        ? inv.tollItems.some((t) =>
            (t.label || t.vehicle || '').toLowerCase().includes(term),
          )
        : false;

      return (
        partyName.includes(term) ||
        partyAddress.includes(term) ||
        partyGstin.includes(term) ||
        invNo.includes(term) ||
        period.includes(term) ||
        month.includes(term) ||
        poNo.includes(term) ||
        invoiceDate.includes(term) ||
        vehicleType.includes(term) ||
        vehicleNumbers.includes(term) ||
        lineItemMatches ||
        tollItemMatches
      );
    });
  }, [invoices, searchTerm, dateFilter, typeFilter]);

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedInvoices,
  } = usePagination({ items: filteredInvoices, initialPageSize: 10 });

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search & Date Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Main Search Input with MagnifyingGlass */}
          <div className="relative flex-1 min-w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Search by party name, date, invoice #, period, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Date Search Input */}
          <div className="relative w-full sm:w-44">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <CalendarBlank size={15} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Filter Date (YYYY-MM)"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
              title="Filter by invoice date or month (e.g. 2026-10 or 01/10/2026)"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear date"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>

          {/* Format / Type Filter */}
          <ThemedSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="ALL">All Invoices</option>
            <option value="GST">GST Tax Invoices</option>
            <option value="NONGST">Non-GST Invoices</option>
          </ThemedSelect>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between sm:justify-end shrink-0">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs transition-colors cursor-pointer"
              title="Refresh Invoices"
            >
              <ArrowsClockwise size={15} weight="bold" />
            </button>
          )}

          {onGenerateNew && (
            <button
              type="button"
              onClick={onGenerateNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} weight="bold" />
              <span>New Corporate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-3.5">Invoice #</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Period</th>
                <th className="py-3 px-3.5">Party / Client</th>
                <th className="py-3 px-3.5">Particulars / Vehicles</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Receipt size={24} weight="bold" />
                      </div>
                      <p className="font-bold text-sm text-slate-700">No corporate invoices found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchTerm || dateFilter || typeFilter !== 'ALL'
                          ? 'Try clearing your search or filters to see more invoices.'
                          : 'Save corporate invoices from the Corporate Contracts section to store and track them here.'}
                      </p>
                      {(searchTerm || dateFilter || typeFilter !== 'ALL') ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setDateFilter('');
                            setTypeFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      ) : onGenerateNew ? (
                        <button
                          type="button"
                          onClick={onGenerateNew}
                          className="mt-3 px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Generate from Contracts
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv, idx) => {
                  const isNonGst = Boolean(inv.isNonGst || inv.invoiceType === 'nongst');
                  const amt = Number(inv.grandTotal ?? inv.totalAmount ?? 0);
                  const itemsCount = Array.isArray(inv.lineItems) ? inv.lineItems.length : 0;
                  const firstParticular = inv.lineItems?.[0]?.particulars || inv.vehicleType || 'Corporate Commute';

                  return (
                    <tr
                      key={inv.id || `${inv.contractId}_${inv.month}_${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3 px-3.5 text-center text-slate-400 font-medium">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Invoice Number & Badge */}
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-extrabold text-navy-950">
                            {inv.invoiceNo ? inv.invoiceNo : `INV-${inv.contractId || idx + 1}`}
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-sm border ${
                              !isNonGst
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {!isNonGst ? 'GST Tax Invoice' : 'Non-GST'}
                          </span>
                        </div>
                      </td>

                      {/* Invoice Date */}
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarBlank size={14} className="text-slate-400" />
                          <span>{inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}</span>
                        </div>
                      </td>

                      {/* Period / Month */}
                      <td className="py-3 px-3.5 text-slate-800 font-semibold whitespace-nowrap">
                        {inv.period || inv.month || '—'}
                      </td>

                      {/* Party / Client Details */}
                      <td className="py-3 px-3.5 min-w-[200px]">
                        <div className="font-bold text-slate-900">
                          {inv.partyName || 'Corporate Client'}
                        </div>
                        {inv.partyGstin && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            GST: {inv.partyGstin}
                          </div>
                        )}
                        {inv.partyAddress && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {inv.partyAddress}
                          </div>
                        )}
                      </td>

                      {/* Particulars & Vehicles */}
                      <td className="py-3 px-3.5 min-w-[220px]">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {firstParticular}
                        </div>
                        {itemsCount > 1 && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200">
                            +{itemsCount - 1} more vehicle row{itemsCount - 1 > 1 ? 's' : ''}
                          </span>
                        )}
                        {inv.poNo && (
                          <div className="text-[10.5px] text-slate-500 mt-0.5">
                            PO: {inv.poNo}
                          </div>
                        )}
                      </td>

                      {/* Grand Total Amount */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="font-extrabold text-sm text-navy-950">
                          {formatINR(amt)}
                        </div>
                        {inv.taxableValue && !isNonGst && (
                          <div className="text-[10px] text-slate-500">
                            Taxable: {formatINR(inv.taxableValue)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewInvoice && onViewInvoice(inv)}
                            className="p-1.5 rounded text-navy-900 hover:bg-navy-50 hover:text-navy-950 transition-colors cursor-pointer"
                            title="View / Edit Invoice"
                            aria-label="View and edit corporate invoice"
                          >
                            <Eye size={16} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewInvoice && onViewInvoice(inv)}
                            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Print / Save PDF"
                            aria-label="Print or export invoice to PDF"
                          >
                            <Printer size={16} weight="bold" />
                          </button>
                          {onDeleteInvoice && (
                            <button
                              type="button"
                              onClick={() => onDeleteInvoice(inv)}
                              className="p-1.5 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Delete Invoice"
                              aria-label="Delete saved corporate invoice"
                            >
                              <Trash size={16} weight="bold" />
                            </button>
                          )}
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
        {filteredInvoices.length > 0 && (
          <TablePaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredInvoices.length}
            pageSize={pageSize}
          />
        )}
      </div>
    </div>
  );
}
