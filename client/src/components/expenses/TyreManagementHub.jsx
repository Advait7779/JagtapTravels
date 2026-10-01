import React, { useState } from 'react';
import {
  CircleNotch,
  Plus,
  MagnifyingGlass,
  Car,
  Trash,
  CurrencyInr,
  Calendar,
  PencilSimple,
  Receipt,
} from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function TyreManagementHub({
  tyreLogs = [],
  vehicles = [],
  onAddTyreLog,
  onEditTyreLog,
  onDeleteTyreLog,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');

  const totalTyresReplacedAll = tyreLogs.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
  const totalTyreSpendAll = tyreLogs.reduce((acc, l) => acc + (Number(l.totalCost) || 0), 0);

  // Filter logs
  const filteredLogs = tyreLogs.filter((l) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const vNo = (l.vehicleNumber || '').toLowerCase();
    const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

    const matchSearch =
      !term ||
      (l.tyreNumber || '').toLowerCase().includes(term) ||
      vNo.includes(term) ||
      (cleanTerm && cleanVNo.includes(cleanTerm)) ||
      (l.tyreBrand || '').toLowerCase().includes(term) ||
      (l.vendorName || '').toLowerCase().includes(term) ||
      (l.tyrePosition || '').toLowerCase().includes(term) ||
      (l.notes || '').toLowerCase().includes(term);

    const matchVehicle =
      selectedVehicleFilter === 'ALL' ||
      String(l.vehicleId) === String(selectedVehicleFilter) ||
      l.vehicleNumber === selectedVehicleFilter;

    return matchSearch && matchVehicle;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedLogs,
  } = usePagination({ items: filteredLogs, initialPageSize: 10 });

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-navy-950 text-amber-400 rounded-md shadow-xs">
            <CircleNotch size={24} weight="bold" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Fleet Tyre Expense Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Log tyre purchases, replacement bills, and costs across your fleet.
            </p>
          </div>
        </div>

        <button
          onClick={onAddTyreLog}
          className="btn-primary flex items-center gap-2 py-2.5 px-4 rounded-md font-bold text-xs"
        >
          <Plus size={16} weight="bold" />
          <span>Record Tyre Replacement</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Spend */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tyre Spend</span>
            <CurrencyInr size={18} className="text-navy-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(totalTyreSpendAll)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{tyreLogs.length} replacement entries logged</p>
        </div>

        {/* Tyres Replaced */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tyres Replaced</span>
            <CircleNotch size={18} className="text-navy-900" weight="bold" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTyresReplacedAll} Tyres</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {vehicles.length} fleet vehicles</p>
        </div>

        {/* Total Entries */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
            <Receipt size={18} className="text-navy-900" weight="bold" />
          </div>
          <div className="text-2xl font-black text-slate-900">{filteredLogs.length} Entries</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tyre invoices & change logs</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-md shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 md:w-96">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tyre ref #, vehicle plate, brand, wheel position, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Vehicle:</span>
            <ThemedSelect
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            >
              <option value="ALL">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.vehicleNumber}>
                  {v.vehicleNumber} - {v.name}
                </option>
              ))}
            </ThemedSelect>
          </div>

          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Single Tyre Logs Table */}
      <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Ref</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Tyre Brand & Position</th>
                <th className="py-3 px-4">Quantity & Rate</th>
                <th className="py-3 px-4">Total Cost (₹)</th>
                <th className="py-3 px-4">Odometer (KM)</th>
                <th className="py-3 px-4">Vendor & Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CircleNotch size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No tyre replacement records found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Record Tyre Replacement" to log new tyres, cost, and odometer reading
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatDate(log.date)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.tyreNumber || log.id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-500">
                        {vehicles.find((v) => v.vehicleNumber === log.vehicleNumber)?.name ||
                          'Fleet Car'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-navy-950 flex items-center gap-1.5">
                        <span>{log.tyreBrand}</span>
                        {log.tyreSize && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                            {log.tyreSize}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {log.tyrePosition || 'All 4 Tyres'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.quantity} Tyre(s)</div>
                      <div className="text-[10px] text-slate-500">
                        @ {formatINR(log.costPerTyre)} each
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-navy-950">
                        {formatINR(log.totalCost)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {Number(log.odometerAtChange) > 0
                          ? `${Number(log.odometerAtChange).toLocaleString()} KM`
                          : '—'}
                      </div>
                      {log.oldTyreKmRun && Number(log.oldTyreKmRun) > 0 && (
                        <div className="text-[10px] text-slate-500">
                          Old tyre ran: {Number(log.oldTyreKmRun).toLocaleString()} KM
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-semibold text-slate-800">
                        {log.vendorName || 'Local Tyre Shop'}
                      </div>
                      {log.notes && (
                        <div className="text-[10px] text-slate-500 truncate">{log.notes}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditTyreLog(log)}
                          className="p-1.5 text-slate-500 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Tyre Log"
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteTyreLog(log)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Tyre Log"
                        >
                          <Trash size={15} />
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
          totalItems={filteredLogs.length}
          onPageChange={setPage}
          label="records"
        />
      </div>
    </div>
  );
}
