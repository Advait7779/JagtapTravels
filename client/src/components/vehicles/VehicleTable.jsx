import React, { useState } from 'react';
import {
  Wrench,
  Car,
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  ClockCounterClockwise,
  Warning,
  Gauge,
  CheckCircle,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function VehicleTable({
  vehicles = [],
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onOpenDailyKm,
  onOpenServiceRecord,
  onOpenHistory,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    const vPlate = (v.vehicleNumber || '').toLowerCase();
    const cleanPlate = vPlate.replace(/[^a-z0-9]/gi, '');

    const matchesSearch =
      !q ||
      (v.name || '').toLowerCase().includes(q) ||
      vPlate.includes(q) ||
      (cleanQ && cleanPlate.includes(cleanQ)) ||
      (v.driverName || '').toLowerCase().includes(q) ||
      (v.fuelType || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.insurancePolicyNumber || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return v.status === statusFilter;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedVehicles,
  } = usePagination({ items: filteredVehicles, initialPageSize: 10 });

  const dueCount = vehicles.filter((v) => v.status === 'Service Due').length;
  const approachingCount = vehicles.filter((v) => v.status === 'Approaching').length;
  const healthyCount = vehicles.filter((v) => v.status === 'Healthy').length;

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner & KPI Snapshot */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Wrench size={24} className="text-amber-600" weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-navy-950 tracking-tight">
                Fleet Servicing & Maintenance
              </h2>
              <p className="text-xs text-slate-500">
                Track daily odometer logs and per-vehicle service intervals (default 30,000 KM)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onOpenDailyKm()}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold rounded-md shadow-xs transition-all"
            >
              <Plus size={16} weight="bold" />
              <span>Log Daily KM</span>
            </button>
            <button
              onClick={onAddVehicle}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-md shadow-xs transition-all"
            >
              <Plus size={16} weight="bold" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Fleet
            </p>
            <p className="text-xl font-extrabold text-navy-950 mt-0.5">{vehicles.length}</p>
          </div>

          <div
            className={`p-3 rounded-md border transition-all ${
              dueCount > 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider">Service Due</p>
              {dueCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-extrabold mt-0.5">
              {dueCount}{' '}
              <span className="text-xs font-semibold text-rose-600">
                {dueCount === 1 ? 'vehicle' : 'vehicles'}
              </span>
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md text-amber-950">
            <p className="text-[11px] font-bold uppercase tracking-wider">Approaching Service</p>
            <p className="text-xl font-extrabold mt-0.5">
              {approachingCount}{' '}
              <span className="text-xs font-semibold text-amber-700">
                {approachingCount === 1 ? 'vehicle' : 'vehicles'}
              </span>
            </p>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-emerald-950">
            <p className="text-[11px] font-bold uppercase tracking-wider">Healthy Status</p>
            <p className="text-xl font-extrabold mt-0.5">
              {healthyCount}{' '}
              <span className="text-xs font-semibold text-emerald-700">
                {healthyCount === 1 ? 'vehicle' : 'vehicles'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Search by vehicle model, plate number, fuel type, assigned driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 shrink-0">Filter Status:</label>
            <ThemedSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
            >
              <option value="all">All Status ({vehicles.length})</option>
              <option value="Service Due">🚨 Service Due ({dueCount})</option>
              <option value="Approaching">⚠️ Approaching ({approachingCount})</option>
              <option value="Healthy">✓ Healthy ({healthyCount})</option>
            </ThemedSelect>
          </div>

          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Vehicles Table / Cards */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Vehicle Number & Model</th>
                <th className="py-3 px-4">Assigned Driver</th>
                <th className="py-3 px-4">Current Odometer</th>
                <th className="py-3 px-4 w-64">Maintenance Progress</th>
                <th className="py-3 px-4">RTO Compliance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Car
                      size={36}
                      weight="duotone"
                      className="mx-auto mb-2 opacity-40 text-slate-400"
                    />
                    <p className="font-semibold text-sm text-slate-600">No vehicles found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add a vehicle or adjust your search filter
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((v) => {
                  const isDue = v.status === 'Service Due';
                  const isApproaching = v.status === 'Approaching';
                  const interval = v.serviceIntervalKm || 30000;
                  const cycleKm =
                    v.kmSinceLastService ??
                    Math.max(0, (v.currentOdometer || 0) - (v.lastServiceKm || 0));
                  const progress = Math.min(100, Math.round((cycleKm / interval) * 100));

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Vehicle Name & License Plate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                              isDue
                                ? 'bg-rose-100 border-rose-300 text-rose-700'
                                : isApproaching
                                ? 'bg-amber-100 border-amber-300 text-amber-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <Gauge className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                              {v.vehicleNumber}
                            </div>
                            <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                              {v.name}
                              {v.fuelType && (
                                <span className="text-[10px] text-slate-400">
                                  {' '}• {v.fuelType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {v.driverName || 'Fleet Shared'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {v.notes || 'Tour Fleet Vehicle'}
                        </p>
                      </td>

                      {/* Current Odometer */}
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-navy-950 text-sm">
                          {Number(v.currentOdometer || 0).toLocaleString('en-IN')} KM
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Last serviced at {Number(v.lastServiceKm || 0).toLocaleString('en-IN')} KM
                        </p>
                      </td>

                      {/* 30,000 KM Progress Meter */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-slate-700">
                              Cycle:{' '}
                              <strong className="font-mono text-slate-900">
                                {cycleKm.toLocaleString('en-IN')}
                              </strong>{' '}
                              / {interval.toLocaleString('en-IN')} KM
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                isDue
                                  ? 'text-rose-600'
                                  : isApproaching
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {progress}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isDue
                                  ? 'bg-rose-600 animate-pulse'
                                  : isApproaching
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Distance to next service */}
                          <p className="text-[11px] font-medium">
                            {isDue ? (
                              <span className="text-rose-700 font-bold flex items-center gap-1">
                                <Warning size={14} weight="bold" className="shrink-0" />
                                {Math.abs(v.kmRemaining || 0).toLocaleString('en-IN')} KM Overdue!
                                Service immediately
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                <strong className="font-mono text-navy-950 font-bold">
                                  {Number(v.kmRemaining || 0).toLocaleString('en-IN')} KM
                                </strong>{' '}
                                until {Number(interval).toLocaleString('en-IN')} KM service
                              </span>
                            )}
                          </p>
                        </div>
                      </td>

                      {/* RTO Compliance / Docs Expiries */}
                      <td className="py-3.5 px-4">
                        {v.docAlerts && v.docAlerts.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {v.docAlerts.map((alert, idx) => (
                              <div
                                key={idx}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-bold w-max ${
                                  alert.status === 'Expired'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                <span>{alert.label}:</span>
                                <span>
                                  {alert.status === 'Expired'
                                    ? `Expired (${Math.abs(alert.daysRemaining)}d ago)`
                                    : `Due in ${alert.daysRemaining}d`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-2xs font-bold">
                            <CheckCircle size={12} weight="bold" /> All Docs Valid
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Log Daily KM Button */}
                          <button
                            onClick={() => onOpenDailyKm(v)}
                            title="Log Daily KM for this vehicle"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 text-xs font-bold rounded-lg border border-slate-300 hover:border-amber-400 transition-colors"
                          >
                            <Plus size={14} weight="bold" />
                            <span>KM</span>
                          </button>

                          {/* Mark Serviced Button */}
                          <button
                            onClick={() => onOpenServiceRecord(v)}
                            title="Record workshop maintenance and reset service cycle"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border ${
                              isDue
                                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            }`}
                          >
                            <Wrench size={14} weight="bold" />
                            <span className="hidden sm:inline">Service</span>
                          </button>

                          {/* History Button */}
                          <button
                            onClick={() => onOpenHistory(v)}
                            title="View KM log history and past maintenance receipts"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-colors"
                          >
                            <ClockCounterClockwise size={16} weight="bold" />
                          </button>

                          {/* Edit Vehicle */}
                          <button
                            onClick={() => onEditVehicle(v)}
                            title="Edit Vehicle Details"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-colors"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>

                          {/* Delete Vehicle */}
                          <button
                            onClick={() => onDeleteVehicle(v.id)}
                            title="Delete Vehicle"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash size={16} weight="bold" />
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
          totalItems={filteredVehicles.length}
          onPageChange={setPage}
          label="fleet vehicles"
        />
      </div>
    </div>
  );
}
