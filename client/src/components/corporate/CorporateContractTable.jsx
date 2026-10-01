import React, { useState } from 'react';
import {
  Buildings,
  Car,
  User,
  Plus,
  MagnifyingGlass,
  Gauge,
  Receipt,
  PencilSimple,
  Trash,
  CheckCircle,
  Warning,
  TrendUp,
  Clock,
  ArrowRight,
  CurrencyInr,
  FileText,
  Users,
} from '@phosphor-icons/react';
import { formatINR, formatDate, localDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import ThemedMonthPicker from '../ThemedMonthPicker';
import CorporateLogsheetView from './CorporateLogsheetView';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function CorporateContractTable({
  contracts = [],
  vehicles = [],
  drivers = [],
  customers = [],
  tripLogs = [],
  onAddContract,
  onEditContract,
  onDeleteContract,
  onUpdateStatus,
  onLogDailyKm,
  onGenerateBill,
  onAddTripLog,
  onEditTripLog,
  onDeleteTripLog,
  onGenerateInvoice,
}) {
  const [activeTab, setActiveTab] = useState('contracts');
  const [logsheetContractId, setLogsheetContractId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(() => localDate().slice(0, 7));

  // Calculate monthly stats
  const activeContracts = contracts.filter((c) => c.status === 'Active');
  const totalMonthlyBase = activeContracts.reduce(
    (acc, c) => acc + (Number(c.monthlyBaseFare) || 0),
    0,
  );

  // Compute month-to-date KM and excess for each contract
  const enrichedContracts = contracts.map((contract) => {
    const vehicle = vehicles.find(
      (v) => String(v.id) === String(contract.vehicleId) || v.vehicleNumber === contract.vehicleNumber,
    );
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = selectedMonth + '-01';
    const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
    const periodStart = contract.startDate > monthStart ? contract.startDate : monthStart;
    const periodEnd =
      contract.endDate && contract.endDate < monthEnd ? contract.endDate : monthEnd;
    const inContractPeriod =
      contract.startDate <= monthEnd && (!contract.endDate || contract.endDate >= monthStart);
    const monthLogs = (vehicle?.kmLogs || []).filter(
      (log) =>
        inContractPeriod && log.date && log.date >= periodStart && log.date <= periodEnd,
    );
    const contractTripLogs = tripLogs.filter(
      (log) =>
        inContractPeriod &&
        log.date &&
        log.date >= periodStart &&
        log.date <= periodEnd &&
        (log.contractId
          ? String(log.contractId) === String(contract.id)
          : (contract.vehicleId && String(log.vehicleId) === String(contract.vehicleId)) ||
            (contract.vehicleNumber && log.vehicleNumber === contract.vehicleNumber)),
    );
    const tripKm = contractTripLogs.reduce((acc, log) => acc + (Number(log.totalKm) || 0), 0);
    const totalKmRun =
      contractTripLogs.length > 0
        ? tripKm
        : monthLogs.reduce((acc, log) => acc + (Number(log.dailyKm) || 0), 0);
    const totalEmployees = contractTripLogs.reduce(
      (acc, log) => acc + (Number(log.employeeCount) || 0),
      0,
    );
    const totalToll = contractTripLogs.reduce((acc, log) => acc + (Number(log.tollParking) || 0), 0);
    const includedKm = Number(contract.includedMonthlyKm) || 0;
    const excessKm = Math.max(0, totalKmRun - includedKm);
    const extraRate = Number(contract.extraRatePerKm) || 0;
    const excessCharge = Math.round(excessKm * extraRate);
    const progressPercent =
      includedKm > 0 ? Math.min(100, Math.round((totalKmRun / includedKm) * 100)) : 0;

    return {
      ...contract,
      vehicle,
      monthLogsCount: contractTripLogs.length > 0 ? contractTripLogs.length : monthLogs.length,
      tripLogsCount: contractTripLogs.length,
      totalEmployees,
      totalToll,
      totalKmRun,
      includedKm,
      excessKm,
      excessCharge,
      progressPercent,
      estimatedTotalBill: (Number(contract.monthlyBaseFare) || 0) + excessCharge,
    };
  });

  const totalExcessKm = enrichedContracts.reduce((acc, c) => acc + c.excessKm, 0);
  const totalExcessRevenue = enrichedContracts.reduce((acc, c) => acc + c.excessCharge, 0);

  // Filter
  const filteredContracts = enrichedContracts.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (c.contactPhone || c.contact_phone || '').replace(/[^0-9]/g, '');
    const vNo = (c.vehicleNumber || '').toLowerCase();
    const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

    const matchSearch =
      !term ||
      (c.contractNumber || '').toLowerCase().includes(term) ||
      (c.companyName || '').toLowerCase().includes(term) ||
      (c.contactPerson || '').toLowerCase().includes(term) ||
      (c.contactPhone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      vNo.includes(term) ||
      (cleanTerm && cleanVNo.includes(cleanTerm)) ||
      (c.driverName || '').toLowerCase().includes(term);

    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedContracts,
  } = usePagination({ items: filteredContracts, initialPageSize: 10 });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Terminated':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (activeTab === 'logsheets') {
    return (
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-xs border border-slate-200">
          <button
            onClick={() => setActiveTab('contracts')}
            className="px-4 py-2 rounded-md text-xs font-bold text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <Buildings size={16} />
            <span>Corporate Contracts ({contracts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logsheets')}
            className="px-4 py-2 rounded-md text-xs font-bold bg-navy-950 text-amber-400 shadow-xs flex items-center gap-2"
          >
            <FileText size={16} weight="bold" />
            <span>Daily KM Logsheet & Commute Register ({tripLogs.length})</span>
          </button>
        </div>

        <CorporateLogsheetView
          tripLogs={tripLogs}
          contracts={contracts}
          vehicles={vehicles}
          drivers={drivers}
          customers={customers}
          initialContractId={logsheetContractId}
          initialMonth={selectedMonth}
          onAddTripLog={onAddTripLog}
          onEditTripLog={onEditTripLog}
          onDeleteTripLog={onDeleteTripLog}
          onGenerateInvoice={onGenerateInvoice}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-xs border border-slate-200">
        <button
          onClick={() => setActiveTab('contracts')}
          className="px-4 py-2 rounded-md text-xs font-bold bg-navy-950 text-amber-400 shadow-xs flex items-center gap-2"
        >
          <Buildings size={16} weight="bold" />
          <span>Corporate Contracts ({contracts.length})</span>
        </button>
        <button
          onClick={() => {
            setLogsheetContractId('ALL');
            setActiveTab('logsheets');
          }}
          className="px-4 py-2 rounded-md text-xs font-bold text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-all flex items-center gap-2"
        >
          <FileText size={16} />
          <span>Daily KM Logsheet & Commute Register ({tripLogs.length})</span>
        </button>
      </div>
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-navy-950 text-amber-400 rounded-md shadow-xs">
              <Buildings size={22} weight="bold" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Corporate Monthly Contracts & Daily KM
              </h2>
              <p className="text-xs text-slate-500">
                Track long-term company vehicle tie-ups, monthly included KM, daily usage, and overage billing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs h-9 shrink-0">
            <span className="text-slate-500 font-semibold px-1 leading-tight sm:leading-normal">Billing Month:</span>
            <ThemedMonthPicker
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1 text-xs h-7 flex items-center"
            />
          </div>

          <button
            onClick={onAddContract}
            className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2.5 rounded-md font-bold text-[11px] sm:text-xs h-9 leading-tight shrink-0 shadow-xs active:scale-[0.99]"
          >
            <Plus size={15} weight="bold" className="shrink-0" />
            <span className="text-center sm:text-left leading-tight">
              <span className="sm:hidden leading-tight">New Company<br className="leading-none" />Contract</span>
              <span className="hidden sm:inline">New Company Contract</span>
            </span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Contracts</span>
            <Buildings size={18} className="text-navy-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeContracts.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Vehicles deployed in corporate fleets</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Base Revenue</span>
            <CurrencyInr size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatINR(totalMonthlyBase)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Fixed monthly contracted billing</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Excess KM</span>
            <Gauge size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{totalExcessKm.toLocaleString()} KM</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Beyond monthly packages in {selectedMonth}</p>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Excess KM Billable</span>
            <TrendUp size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">+{formatINR(totalExcessRevenue)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Extra revenue to bill this month</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-md shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="w-full sm:w-80 md:w-96">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by contract #, company, contact person, vehicle plate, chauffeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'Active', 'Paused', 'Terminated'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-navy-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Top-Right Page Size Selector */}
        <div className="shrink-0 flex items-center justify-end">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Contract / Company</th>
                <th className="py-3 px-4">Vehicle & Chauffeur</th>
                <th className="py-3 px-4">Monthly Package</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Buildings size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No corporate contracts found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ New Company Contract" to register a monthly cab tie-up
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Contract / Company */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Buildings size={16} className="text-navy-900 shrink-0" />
                        <span>{c.companyName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {c.contractNumber || 'CORP-CONTRACT'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Since {formatDate(c.startDate)}
                      </div>
                    </td>

                    {/* Vehicle & Chauffeur */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {c.vehicleNumber || c.vehicleName || 'Fleet Vehicle'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {c.vehicleName || 'Corporate Fleet'}
                        {c.driverName && (
                          <span className="text-[10px] text-slate-400"> • {c.driverName}</span>
                        )}
                      </div>
                    </td>

                    {/* Monthly Package */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {formatINR(c.monthlyBaseFare)} / mo
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        <strong className="text-slate-900">{c.includedKm.toLocaleString()} KM</strong> included
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Extra: ₹{c.extraRatePerKm} / KM
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <ThemedSelect
                        value={c.status}
                        onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadge(
                          c.status,
                        )}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Terminated">Terminated</option>
                      </ThemedSelect>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Invoice */}
                        <button
                          onClick={() => onGenerateInvoice && onGenerateInvoice(c, selectedMonth)}
                          title="Generate Tax Invoice"
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <Receipt size={15} weight="bold" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditContract(c)}
                          title="Edit Contract"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteContract(c.id)}
                          title="Delete Contract"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash size={15} weight="bold" />
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
          totalItems={filteredContracts.length}
          onPageChange={setPage}
          label="corporate company vehicle contracts"
        />
      </div>
    </div>
  );
}
