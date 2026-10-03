import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Gauge,
  Car,
  ArrowRight,
  PencilSimple,
  Trash,
  Receipt,
  Plus,
  FilePdf,
} from '@phosphor-icons/react';
import { formatDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function MeterReadingTable({
  meterReadings = [],
  onAddReading,
  onEditReading,
  onDeleteReading,
  onCreateBillFromSlip,
  onOpenDocuments,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredReadings = meterReadings.filter((r) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (r.customerPhone || r.customer_phone || '').replace(/[^0-9]/g, '');
    const slipNo = (r.slipNumber || r.slip_number || '').toLowerCase();
    const vNo = (r.vehicleNumber || r.vehicle_number || '').toLowerCase();
    const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

    const matchesSearch =
      !term ||
      slipNo.includes(term) ||
      (r.vehicleName || r.vehicle_name || '').toLowerCase().includes(term) ||
      vNo.includes(term) ||
      (cleanTerm && cleanVNo.includes(cleanTerm)) ||
      (r.driverName || r.driver_name || '').toLowerCase().includes(term) ||
      (r.customerName || r.customer_name || '').toLowerCase().includes(term) ||
      (r.customerPhone || r.customer_phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      (r.startLocation || r.start_location || '').toLowerCase().includes(term) ||
      (r.tripDestination || r.trip_destination || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedReadings,
  } = usePagination({ items: filteredReadings, initialPageSize: 10 });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ongoing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Billed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
                placeholder="Search by duty slip #, vehicle plate, customer, driver, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <ThemedSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Duty Slips</option>
            <option value="Completed">Completed Only</option>
            <option value="Ongoing">Ongoing Only</option>
            <option value="Billed">Billed Only</option>
          </ThemedSelect>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {/* Add Meter Reading Button */}
          <button
            onClick={onAddReading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-sm transition-all active:scale-[0.99] shrink-0"
          >
            <Gauge size={18} weight="bold" />
            <span>Record Meter Reading</span>
          </button>
        </div>
      </div>

      {/* Meter Readings Data Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                <th className="py-3 px-4">Duty Slip</th>
                <th className="py-3 px-4">Vehicle Details</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Client & Route</th>
                <th className="py-3 px-4">KM Readings</th>
                <th className="py-3 px-4">Total KM</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <p className="font-semibold text-slate-700">No duty slips found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? 'Try adjusting your search criteria'
                          : 'Click "Add Duty Slip" to log your first trip reading.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReadings.map((reading) => {
                  const slipNo = reading.slipNumber || reading.slip_number;
                  const veh = reading.vehicleName || reading.vehicle_name;
                  const plate = reading.vehicleNumber || reading.vehicle_number;
                  const drv = reading.driverName || reading.driver_name;
                  const cust = reading.customerName || reading.customer_name;
                  const src = reading.tripSource || reading.trip_source;
                  const dest = reading.tripDestination || reading.trip_destination;
                  const openKm = reading.openingKm || reading.opening_km || 0;
                  const closeKm = reading.closingKm || reading.closing_km || 0;
                  const totalKm = reading.totalKm || reading.total_km || 0;
                  const status = reading.status || 'Completed';

                  return (
                    <tr key={reading.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Slip # */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-navy-950 text-xs">{slipNo}</span>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {formatDate(reading.startDate || reading.start_date)}
                        </p>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {plate || veh || 'Fleet Vehicle'}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {veh || 'Tour Vehicle'}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{drv}</p>
                      </td>

                      {/* Client & Route */}
                      <td className="py-3 px-4">
                        {cust && <p className="font-bold text-slate-900 text-xs mb-0.5">{cust}</p>}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <span>{src}</span>
                          <ArrowRight size={12} weight="bold" className="shrink-0" />
                          <span className="truncate max-w-[130px] font-medium text-slate-800">
                            {dest}
                          </span>
                        </div>
                      </td>

                      {/* Meter Readings */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs space-y-0.5">
                          <p className="text-slate-600">
                            Start: <span className="font-bold text-slate-900">{openKm}</span>
                          </p>
                          <p className="text-slate-600">
                            End:{' '}
                            <span className="font-bold text-slate-900">
                              {closeKm > 0 ? closeKm : 'In Trip'}
                            </span>
                          </p>
                        </div>
                      </td>

                      {/* Total Run KM */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            Number(totalKm) > 0
                              ? 'bg-navy-100 text-navy-950 border border-navy-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {totalKm} KM
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* Upload / View Vehicle Documents */}
                          {onOpenDocuments && <button
                            onClick={() => onOpenDocuments && onOpenDocuments(reading)}
                            title="Vehicle and trip documents"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors shadow-2xs"
                          >
                            <FilePdf size={13} weight="bold" />
                            <span>Docs</span>
                            {(reading.documents || []).length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white">
                                {reading.documents.length}
                              </span>
                            )}
                          </button>}

                          {/* Create Bill From Slip */}
                          {onCreateBillFromSlip && <button
                            onClick={() => onCreateBillFromSlip(reading)}
                            disabled={status !== 'Completed'}
                            title="Generate Customer Bill from this slip"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-[11px] font-bold transition-all shadow-sm"
                          >
                            <Receipt size={13} weight="bold" />
                            <span>Bill</span>
                          </button>}

                          <button
                            onClick={() => onEditReading(reading)}
                            disabled={status === 'Billed'}
                            title="Edit Meter Reading"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>

                          <button
                            onClick={() => onDeleteReading(reading.id)}
                            title="Delete Meter Reading"
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
          totalItems={filteredReadings.length}
          onPageChange={setPage}
          label="meter reading slips"
        />
      </div>
    </div>
  );
}
