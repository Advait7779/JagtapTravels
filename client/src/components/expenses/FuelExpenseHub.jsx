import React, { useState } from 'react';
import {
  GasPump,
  Plus,
  MagnifyingGlass,
  Car,
  User,
  Trash,
  CurrencyInr,
  Calendar,
  PencilSimple,
  Drop,
  Fire,
} from '@phosphor-icons/react';
import { formatINR, formatDate, localDate } from '../../utils/formatters';
import ThemedMonthPicker from '../ThemedMonthPicker';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function FuelExpenseHub({
  fuelLogs = [],
  vehicles = [],
  drivers = [],
  onAddFuelLog,
  onEditFuelLog,
  onDeleteFuelLog,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(() => localDate().slice(0, 7));

  // Filter by month
  const monthLogs = fuelLogs.filter((log) => log.date && log.date.startsWith(selectedMonth));

  // KPI Calculations
  const totalCost = monthLogs.reduce((acc, l) => acc + (Number(l.totalCost) || 0), 0);

  const dieselLogs = monthLogs.filter((l) => l.fuelType === 'Diesel');
  const dieselCost = dieselLogs.reduce((acc, l) => acc + (Number(l.totalCost) || 0), 0);
  const dieselQty = dieselLogs.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

  const petrolLogs = monthLogs.filter((l) => l.fuelType === 'Petrol');
  const petrolCost = petrolLogs.reduce((acc, l) => acc + (Number(l.totalCost) || 0), 0);
  const petrolQty = petrolLogs.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

  const cngLogs = monthLogs.filter((l) => l.fuelType === 'CNG');
  const cngCost = cngLogs.reduce((acc, l) => acc + (Number(l.totalCost) || 0), 0);
  const cngQty = cngLogs.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

  // Table filter
  const filteredLogs = monthLogs.filter((l) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const vNo = (l.vehicleNumber || '').toLowerCase();
    const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

    const matchSearch =
      !term ||
      (l.fuelNumber || '').toLowerCase().includes(term) ||
      vNo.includes(term) ||
      (cleanTerm && cleanVNo.includes(cleanTerm)) ||
      (l.driverName || '').toLowerCase().includes(term) ||
      (l.petrolPumpName || '').toLowerCase().includes(term) ||
      (l.receiptNumber || '').toLowerCase().includes(term) ||
      (l.fuelType || '').toLowerCase().includes(term);

    const matchType = fuelTypeFilter === 'ALL' || l.fuelType === fuelTypeFilter;
    return matchSearch && matchType;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedLogs,
  } = usePagination({ items: filteredLogs, initialPageSize: 10 });

  const getFuelBadge = (type) => {
    switch (type) {
      case 'Diesel':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Petrol':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'CNG':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-navy-950 text-amber-400 rounded-md shadow-xs">
              <GasPump size={22} weight="bold" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Fleet Fuel Expense Tracker
              </h2>
              <p className="text-xs text-slate-500">
                Daily and monthly spending breakdown across Diesel, Petrol, and CNG fuels.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs h-9 shrink-0">
            <span className="text-slate-500 font-semibold px-1 leading-tight sm:leading-normal">Expense Month:</span>
            <ThemedMonthPicker
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1 text-xs h-7 flex items-center"
            />
          </div>

          <button
            onClick={onAddFuelLog}
            className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2.5 rounded-md font-bold text-[11px] sm:text-xs h-9 leading-tight shrink-0 shadow-xs active:scale-[0.99]"
          >
            <Plus size={15} weight="bold" className="shrink-0" />
            <span className="text-center sm:text-left leading-tight">
              <span className="sm:hidden leading-tight">Log Fuel<br className="leading-none" />Entry</span>
              <span className="hidden sm:inline">Log Fuel Entry</span>
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total, Diesel, Petrol, CNG */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spend */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Fuel Spend</span>
            <CurrencyInr size={18} className="text-navy-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(totalCost)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{monthLogs.length} fuel entries in {selectedMonth}</p>
        </div>

        {/* Diesel */}
        <div className="bg-amber-50/70 p-4 rounded-md border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Diesel Spend</span>
            <Drop size={18} weight="bold" className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950">{formatINR(dieselCost)}</div>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
            {dieselQty.toLocaleString()} Litres ({dieselLogs.length} fills)
          </p>
        </div>

        {/* CNG */}
        <div className="bg-emerald-50/70 p-4 rounded-md border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">CNG Spend</span>
            <Fire size={18} weight="bold" className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{formatINR(cngCost)}</div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
            {cngQty.toLocaleString()} Kg ({cngLogs.length} fills)
          </p>
        </div>

        {/* Petrol */}
        <div className="bg-rose-50/70 p-4 rounded-md border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Petrol Spend</span>
            <GasPump size={18} weight="bold" className="text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950">{formatINR(petrolCost)}</div>
          <p className="text-[11px] text-rose-800 font-semibold mt-0.5">
            {petrolQty.toLocaleString()} Litres ({petrolLogs.length} fills)
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-md shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 md:w-96">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by fuel entry #, vehicle plate, driver, petrol pump, receipt #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {['ALL', 'Diesel', 'Petrol', 'CNG'].map((type) => (
              <button
                key={type}
                onClick={() => setFuelTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  fuelTypeFilter === type
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Fuel Logs Table */}
      <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Ref</th>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Quantity & Rate</th>
                <th className="py-3 px-4">Total Cost (₹)</th>
                <th className="py-3 px-4">Odometer & Pump</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GasPump size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No fuel entries found for {selectedMonth}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Log Fuel Entry" to record daily Diesel, Petrol, or CNG fill-ups
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatDate(l.date)}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {l.fuelNumber || 'FUEL'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {l.vehicleNumber}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {vehicles.find((v) => v.vehicleNumber === l.vehicleNumber)?.name ||
                          l.vehicleName ||
                          'Fleet Vehicle'}
                        {l.driverName && (
                          <span className="text-[10px] text-slate-400"> • {l.driverName}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${getFuelBadge(l.fuelType)}`}>
                        {l.fuelType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {l.quantity} {l.fuelType === 'CNG' ? 'Kg' : 'Litres'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        @ ₹{l.ratePerUnit} / {l.fuelType === 'CNG' ? 'kg' : 'L'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 text-sm">
                        {formatINR(l.totalCost)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-semibold">
                        {Number(l.odometerReading) > 0 ? `${Number(l.odometerReading).toLocaleString()} KM` : '—'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px] mt-0.5">
                        {l.petrolPumpName || l.receiptNumber ? `${l.petrolPumpName || ''} ${l.receiptNumber ? `#${l.receiptNumber}` : ''}` : 'Local Pump'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditFuelLog(l)}
                          title="Edit Fuel Entry"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        >
                          <PencilSimple size={14} weight="bold" />
                        </button>
                        <button
                          onClick={() => onDeleteFuelLog(l)}
                          title="Delete Fuel Entry"
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

        {/* Footer */}
        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredLogs.length}
          onPageChange={setPage}
          label="fuel logs"
        />
      </div>
    </div>
  );
}
