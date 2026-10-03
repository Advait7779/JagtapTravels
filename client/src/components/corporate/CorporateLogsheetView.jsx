import React, { useState, useMemo } from 'react';
import {
  Buildings,
  Car,
  User,
  Plus,
  MagnifyingGlass,
  Users,
  Printer,
  FilePdf,
  PencilSimple,
  Trash,
  ArrowRight,
  FileText,
  Calendar,
  CheckCircle,
  Receipt,
} from '@phosphor-icons/react';
import { formatINR, formatDate, localDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import ThemedMonthPicker from '../ThemedMonthPicker';
import CorporateLogsheetPrintView from './CorporateLogsheetPrintView';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function CorporateLogsheetView({
  tripLogs = [],
  contracts = [],
  vehicles = [],
  drivers = [],
  customers = [],
  onAddTripLog,
  onEditTripLog,
  onDeleteTripLog,
  onGenerateInvoice,
  initialContractId = '',
  initialMonth = '',
}) {
  const [selectedMonth, setSelectedMonth] = useState(
    () => initialMonth || localDate().slice(0, 7),
  );
  const [selectedContractId, setSelectedContractId] = useState(initialContractId || 'ALL');
  const [selectedVehicleId, setSelectedVehicleId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [autoDownloadPdf, setAutoDownloadPdf] = useState(false);

  // Active contract object if selected
  const currentContract = useMemo(() => {
    if (selectedContractId === 'ALL') return null;
    return contracts.find((c) => String(c.id) === String(selectedContractId));
  }, [selectedContractId, contracts]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return tripLogs.filter((log) => {
      // Month match
      if (selectedMonth && log.date && !log.date.startsWith(selectedMonth)) {
        return false;
      }
      // Contract match
      if (selectedContractId !== 'ALL') {
        const matchesContract = log.contractId
          ? String(log.contractId) === String(selectedContractId)
          : Boolean(
              (currentContract?.vehicleId &&
                String(log.vehicleId) === String(currentContract.vehicleId)) ||
                (currentContract?.vehicleNumber &&
                  log.vehicleNumber === currentContract.vehicleNumber),
            );
        if (!matchesContract) return false;
      }
      // Vehicle match
      if (selectedVehicleId !== 'ALL' && String(log.vehicleId) !== String(selectedVehicleId)) {
        return false;
      }
      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
        const vNo = (log.vehicleNumber || '').toLowerCase();
        const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

        const matches =
          (log.tripLogNumber || '').toLowerCase().includes(term) ||
          (log.placeFrom || '').toLowerCase().includes(term) ||
          (log.placeTo || '').toLowerCase().includes(term) ||
          vNo.includes(term) ||
          (cleanTerm && cleanVNo.includes(cleanTerm)) ||
          (log.companyName || '').toLowerCase().includes(term) ||
          (log.driverName || '').toLowerCase().includes(term) ||
          (log.employeeNames || '').toLowerCase().includes(term) ||
          (log.signatureName || '').toLowerCase().includes(term) ||
          (log.notes || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [tripLogs, selectedMonth, selectedContractId, selectedVehicleId, searchTerm, currentContract]);

  // Sort logs by date ascending or descending
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [filteredLogs]);

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedLogs,
  } = usePagination({ items: sortedLogs, initialPageSize: 10 });

  // Totals & KPI aggregation
  const totals = useMemo(() => {
    return sortedLogs.reduce(
      (acc, log) => {
        acc.trips += 1;
        acc.totalKm += Number(log.totalKm || 0);
        acc.totalHours += Number(log.totalHours || 0);
        acc.extraHours += Number(log.extraHours || 0);
        acc.tollParking += Number(log.tollParking || 0);
        acc.employeeCount += Number(log.employeeCount || 0);
        return acc;
      },
      {
        trips: 0,
        totalKm: 0,
        totalHours: 0,
        extraHours: 0,
        tollParking: 0,
        employeeCount: 0,
      },
    );
  }, [sortedLogs]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-md shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-navy-950 text-amber-400 rounded-md shadow-xs">
              <FileText size={22} weight="bold" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Corporate Daily KM Logsheet & Employee Commute
              </h2>
              <p className="text-xs text-slate-500">
                Daily kilometer register and employee headcount tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold px-1">Month:</span>
            <ThemedMonthPicker
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1 text-xs font-bold"
            />
          </div>

          {/* Company Contract Filter */}
          <ThemedSelect
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-md"
          >
            <option value="ALL">All Company Contracts</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.vehicleNumber || 'Cab'})
              </option>
            ))}
          </ThemedSelect>

          {/* Generate Tax Invoice (GST) Button */}
          <button
            type="button"
            onClick={() => {
              if (onGenerateInvoice) {
                onGenerateInvoice(currentContract || contracts[0] || null, selectedMonth, { isNonGst: false });
              }
            }}
            title="Generate Monthly Corporate Tax Invoice (GST 18%)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Receipt size={16} weight="bold" />
            <span>Generate Invoice</span>
          </button>

          {/* Generate Non-GST Invoice Button */}
          <button
            type="button"
            onClick={() => {
              if (onGenerateInvoice) {
                onGenerateInvoice(currentContract || contracts[0] || null, selectedMonth, { isNonGst: true });
              }
            }}
            title="Generate Monthly Corporate Non-GST Invoice (0% Tax)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Receipt size={16} weight="bold" className="text-amber-300" />
            <span>Non-GST Invoice</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={() => {
              setAutoDownloadPdf(true);
              setShowPrintModal(true);
            }}
            title="Download Monthly Logsheet as PDF"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FilePdf size={16} weight="bold" />
            <span>Download PDF</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => {
              setAutoDownloadPdf(false);
              setShowPrintModal(true);
            }}
            title="Print Monthly Logsheet Register"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer size={16} weight="bold" />
            <span className="hidden sm:inline">Print Logsheet</span>
          </button>

          {/* Add Trip Log Button */}
          <button
            type="button"
            onClick={() => onAddTripLog(currentContract)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-md font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Log Daily Trip</span>
          </button>
        </div>
      </div>



      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-md shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="w-full sm:w-80 md:w-96">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search route, vehicle plate, driver, company, or passenger names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Printable Sheet Header (Visible when printed) */}
      <div className="hidden print:block mb-4 p-4 border border-black text-black">
        <div className="flex justify-between items-start border-b border-black pb-2 mb-2">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">JAGTAP TRAVELS</h1>
            <p className="text-xs">Corporate Fleet Management & Daily Vehicle Logsheet</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Month: {selectedMonth}</p>
            <p>Printed: {localDate()}</p>
          </div>
        </div>

      </div>

      {/* Main Digital Register Table */}
      <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden print:border-black print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 print:text-[10px] print:text-black">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] print:bg-slate-100 print:border-black">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Vehicle & Driver</th>
                <th className="py-2.5 px-3">Route (From ➔ To)</th>
                <th className="py-2.5 px-3">Odometers (Start / Close / Total)</th>
                <th className="py-2.5 px-3">Time (Start / Close / Hours)</th>
                <th className="py-2.5 px-3">Toll / Parking</th>
                <th className="py-2.5 px-3">Employees</th>
                <th className="py-2.5 px-3">Sign / User</th>
                <th className="py-2.5 px-3 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium print:divide-black">
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No trip logs found for this selection</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Log Daily Trip" to record daily kilometers and employee commute
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors print:hover:bg-transparent"
                  >
                    {/* Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900 print:text-black">
                      {formatDate(log.date)}
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.tripLogNumber || ''}
                      </div>
                    </td>

                    {/* Vehicle Plate 1st in bold & Driver */}
                    <td className="py-2.5 px-3 min-w-[140px]">
                      <div className="font-bold text-slate-900 print:text-black">
                        {log.vehicleNumber || 'Fleet Cab'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {log.vehicleName || ''}
                        {log.driverName && (
                          <span className="text-[10px] text-slate-400"> • {log.driverName}</span>
                        )}
                      </div>
                    </td>

                    {/* Route: From -> To */}
                    <td className="py-2.5 px-3 min-w-[160px]">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 print:text-black">
                        <span className="truncate">{log.placeFrom}</span>
                        <ArrowRight size={12} weight="bold" className="text-slate-400 shrink-0" />
                        <span className="truncate text-navy-950 font-black">{log.placeTo}</span>
                      </div>
                      {log.remarks && (
                        <div className="text-[10px] text-slate-400 truncate italic">
                          {log.remarks}
                        </div>
                      )}
                    </td>

                    {/* Odometers: Start / Close / Total KM */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 text-[11px]">
                          {Number(log.startKm || 0).toLocaleString()} ➔{' '}
                          {Number(log.closeKm || 0).toLocaleString()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-black text-xs">
                          {Number(log.totalKm || 0)} KM
                        </span>
                      </div>
                    </td>

                    {/* Time: Start / Close / Total Hours */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {log.startTime || '--'} - {log.closeTime || '--'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">
                        {log.totalHours ? `${log.totalHours} hrs` : '--'}
                        {Number(log.extraHours) > 0 && (
                          <span className="text-amber-700 font-bold">
                            {' '}
                            (+{log.extraHours} extra)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Toll / Parking */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {Number(log.tollParking || 0) > 0 ? (
                        <span className="font-bold text-slate-900">
                          {formatINR(log.tollParking)}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono">₹0</span>
                      )}
                    </td>

                    {/* Employee Count */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-xs">
                        <Users size={13} weight="bold" />
                        {log.employeeCount || 0}
                      </span>
                    </td>

                    {/* Sign / User Name */}
                    <td className="py-2.5 px-3 text-[11px] text-slate-700">
                      <div className="font-semibold">{log.signatureName || '--'}</div>
                      <div className="text-[10px] text-slate-400">{log.companyName || ''}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right print:hidden whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTripLog(log)}
                          title="Edit Log"
                          className="p-1.5 rounded-md text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        >
                          <PencilSimple size={14} weight="bold" />
                        </button>
                        <button
                          onClick={() => onDeleteTripLog(log.id)}
                          title="Delete Log"
                          className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer with Monthly Totals */}
            {sortedLogs.length > 0 && (
              <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900 text-xs print:border-black print:bg-transparent">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 font-black uppercase text-slate-800">
                    Monthly Total ({selectedMonth})
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-emerald-800 text-sm">
                    {totals.totalKm.toLocaleString()} KM
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {Math.round(totals.totalHours * 10) / 10} hrs
                  </td>
                  <td className="py-2.5 px-3 font-black text-slate-900">
                    {formatINR(totals.tollParking)}
                  </td>
                  <td className="py-2.5 px-3 bg-amber-100/60 print:bg-transparent">
                    <span className="font-black text-amber-950 text-sm">
                      {totals.employeeCount} Total Commutes
                    </span>
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-slate-500 text-[11px] print:hidden">
                    {totals.trips} trips verified
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="print:hidden">
          <TablePaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedLogs.length}
            onPageChange={setPage}
            label="trips"
          />
        </div>


      </div>

      {/* Official Printable & PDF Export Modal */}
      <CorporateLogsheetPrintView
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setAutoDownloadPdf(false);
        }}
        autoDownload={autoDownloadPdf}
        selectedMonth={selectedMonth}
        currentContract={currentContract}
        logs={sortedLogs}
        totals={totals}
      />
    </div>
  );
}
