import React, { useState } from 'react';
import {
  MagnifyingGlass,
  UserPlus,
  Phone,
  EnvelopeSimple,
  MapPin,
  PencilSimple,
  Trash,
  Receipt,
  PaperPlaneTilt,
  Buildings,
} from '@phosphor-icons/react';
import { formatDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function CustomerTable({
  customers,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onGenerateBillForCustomer,
  onGenerateQuoteForCustomer,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');

  // Unique cities list for filtering
  const cities = ['ALL', ...new Set(customers.map((c) => c.city).filter(Boolean))];

  // Filter customers by search and city
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (c.phone || '').replace(/[^0-9]/g, '');

    const matchesSearch =
      !term ||
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.city || '').toLowerCase().includes(term) ||
      (c.company || '').toLowerCase().includes(term) ||
      (c.address || '').toLowerCase().includes(term) ||
      (c.gstNumber || '').toLowerCase().includes(term);

    const matchesCity = selectedCity === 'ALL' || c.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedCustomers,
  } = usePagination({ items: filteredCustomers, initialPageSize: 10 });

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
                placeholder="Search by customer name, mobile number, company, city, email, GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* City Filter */}
          {cities.length > 1 && (
            <ThemedSelect
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === 'ALL' ? 'All Cities' : city}
                </option>
              ))}
            </ThemedSelect>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {/* Add Customer Button */}
          <button
            onClick={onAddCustomer}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-sm transition-all active:scale-[0.99] shrink-0"
          >
            <UserPlus size={18} weight="bold" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Location / Address</th>
                <th className="py-3 px-4">GST / Tax Info</th>
                <th className="py-3 px-4">Total Trips</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <p className="font-semibold text-slate-700">No customers found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? 'Try adjusting your search criteria'
                          : 'Click "Add New Customer" to register your first client.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {(customer.name || 'C').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{customer.name}</p>
                          <p className="text-[11px] text-slate-600 font-medium">
                            Added {formatDate(customer.createdAt || customer.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                        <Phone size={13} weight="bold" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                          <EnvelopeSimple size={13} weight="bold" />
                          <span className="truncate max-w-[170px]">{customer.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-1.5 max-w-xs">
                        <MapPin size={13} weight="bold" className="shrink-0 mt-0.5 text-slate-500" />
                        <div>
                          <span className="font-semibold text-slate-800">
                            {customer.city || '—'}
                          </span>
                          {customer.address && (
                            <p
                              className="text-[11px] text-slate-600 font-medium truncate max-w-[200px]"
                              title={customer.address}
                            >
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* GST */}
                    <td className="py-3 px-4">
                      {customer.gstNumber || customer.gst_number ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200 font-medium">
                          <Buildings size={12} weight="bold" />
                          {customer.gstNumber || customer.gst_number}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-medium">Individual</span>
                      )}
                    </td>

                    {/* Total Trips */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {customer.totalTrips || customer.total_trips || 0} Trips
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        {/* Generate Bill */}
                        <button
                          onClick={() => onGenerateBillForCustomer(customer)}
                          title="Generate Bill for this customer"
                          className="p-1.5 rounded-lg text-navy-800 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                          <Receipt size={14} weight="bold" />
                        </button>

                        {/* Send Quotation */}
                        <button
                          onClick={() => onGenerateQuoteForCustomer(customer)}
                          title="Create Quotation for this customer"
                          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <PaperPlaneTilt size={14} weight="bold" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditCustomer(customer)}
                          title="Edit Customer Details"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <PencilSimple size={14} weight="bold" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteCustomer(customer.id)}
                          title="Delete Customer"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredCustomers.length}
          onPageChange={setPage}
          label="registered customers"
        />
      </div>
    </div>
  );
}
