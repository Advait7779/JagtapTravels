import React, { useState } from 'react';
import {
  CurrencyInr,
  Plus,
  MagnifyingGlass,
  User,
  Car,
  FileText,
  ClockCounterClockwise,
  CheckCircle,
  Warning,
  Coins,
  CaretDown,
  CaretUp,
  Trash,
  PencilSimple,
  Printer,
  UploadSimple,
  ArrowSquareOut,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';
import { api } from '../../services/api';
import ThemedMonthPicker from '../ThemedMonthPicker';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function DriverPayrollTable({
  payrollData = [],
  drivers = [],
  selectedMonth,
  onMonthChange,
  onAddAdvance,
  onDeleteAdvance,
  onOpenPayslip,
  onEditDriverSalary,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const [uploadingDriverId, setUploadingDriverId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDirectLicenseUpload = async (driverId, driverName, file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Only genuine PDF, JPEG, PNG and WebP files are allowed.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('License document file size must be less than 10 MB.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    try {
      setUploadingDriverId(driverId);
      setErrorMsg('');
      setSuccessMsg('');
      await api.uploadDriverDocument(driverId, {
        file,
        documentType: "Driver's License",
        title: `${driverName} Driving License`,
      });
      setSuccessMsg(`Driving license uploaded from system for ${driverName}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload license document.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUploadingDriverId(null);
    }
  };

  // Totals
  const totalBasePayroll = payrollData.reduce((acc, p) => acc + (Number(p.baseSalary) || 0), 0);
  const totalAdvancesPaid = payrollData.reduce((acc, p) => acc + (Number(p.totalAdvances) || 0), 0);
  const totalRemainingPayable = payrollData.reduce((acc, p) => acc + (Number(p.remainingSalary) || 0), 0);

  // Filter list
  const filtered = payrollData.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (p.phone || '').replace(/[^0-9]/g, '');
    const vNo = (p.vehicleNumber || '').toLowerCase();
    const cleanVNo = vNo.replace(/[^a-z0-9]/gi, '');

    const matchSearch =
      !term ||
      (p.driverName || '').toLowerCase().includes(term) ||
      (p.phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      vNo.includes(term) ||
      (cleanTerm && cleanVNo.includes(cleanTerm)) ||
      (p.vehicleAssigned || '').toLowerCase().includes(term);

    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedPayroll,
  } = usePagination({ items: filtered, initialPageSize: 10 });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Settled':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Partial Advance':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Unpaid':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const toggleExpand = (driverId) => {
    setExpandedDriverId(expandedDriverId === driverId ? null : driverId);
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-navy-950 text-amber-400 rounded-md shadow-xs">
            <Coins size={24} weight="bold" />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
              Driver Payroll & Advance Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Set base salaries, deduct mid-month advances, calculate remaining balance, and generate salary slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs h-9 shrink-0">
            <span className="text-slate-500 font-semibold px-1 leading-tight sm:leading-normal">Salary Month:</span>
            <ThemedMonthPicker
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="px-2 py-1 text-xs h-7 flex items-center"
            />
          </div>

          <button
            onClick={() => onAddAdvance(null)}
            className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2.5 rounded-md font-bold text-[11px] sm:text-xs h-9 leading-tight shrink-0 shadow-xs active:scale-[0.99]"
          >
            <Plus size={15} weight="bold" className="shrink-0" />
            <span className="text-center sm:text-left leading-tight">
              <span className="sm:hidden leading-tight">Record<br className="leading-none" />Advance</span>
              <span className="hidden sm:inline">Record Advance</span>
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Base Payroll */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Base Payroll</span>
            <CurrencyInr size={18} className="text-navy-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(totalBasePayroll)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Base salary budget for {payrollData.length} drivers</p>
        </div>

        {/* Advances Disbursed */}
        <div className="bg-amber-50/70 p-4 rounded-md border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Advances Given</span>
            <Coins size={18} weight="bold" className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950">{formatINR(totalAdvancesPaid)}</div>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
            Deducted from monthly earnings
          </p>
        </div>

        {/* Remaining Net Payable */}
        <div className="bg-emerald-50/70 p-4 rounded-md border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Net Balance Payable</span>
            <CurrencyInr size={18} weight="bold" className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{formatINR(totalRemainingPayable)}</div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
            Remaining amount after subtracting advances
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
              placeholder="Search by driver name, mobile number, assigned cab, vehicle plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {['ALL', 'Unpaid', 'Partial Advance', 'Settled'].map((st) => (
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

          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Success / Error Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="bold" className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-md flex items-center gap-2 animate-in fade-in">
          <WarningCircle size={18} weight="bold" className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Payroll Ledger Table */}
      <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Driver & Assigned Vehicle</th>
                <th className="py-3 px-4">Base Salary (₹)</th>
                <th className="py-3 px-4">Advances Taken (₹)</th>
                <th className="py-3 px-4">Remaining Payable (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payroll Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Coins size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No driver payroll records found for {selectedMonth}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ensure drivers exist in the Driver directory with base salaries set.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPayroll.map((item) => {
                  const isExpanded = expandedDriverId === item.driverId;
                  const hasAdvances = (item.advances || []).length > 0;
                  const driverObj = drivers.find((d) => d.id === item.driverId) || {};
                  const hasLicense = Boolean(
                    item.licenseDocumentUrl ||
                      driverObj.licenseDocumentUrl ||
                      (item.documents && item.documents.length > 0) ||
                      (driverObj.documents && driverObj.documents.length > 0),
                  );
                  const licenseDocUrl =
                    item.licenseDocumentUrl ||
                    driverObj.licenseDocumentUrl ||
                    item.documents?.[0]?.fileUrl ||
                    driverObj.documents?.[0]?.fileUrl;
                  const isUploading = uploadingDriverId === item.driverId;

                  return (
                    <React.Fragment key={item.driverId}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <User size={15} className="text-navy-900" />
                            <span>{item.driverName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{item.phone}</span>
                            {item.vehicleNumber && (
                              <span className="text-navy-950 font-semibold flex items-center gap-1">
                                <Car size={12} /> {item.vehicleNumber}
                              </span>
                            )}
                          </div>
                          {/* License Document on file or direct upload from system */}
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {hasLicense ? (
                              <div className="inline-flex items-center gap-1">
                                <a
                                  href={licenseDocUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                                  title="View License Document"
                                >
                                  <FileText size={11} weight="bold" />
                                  <span>License Attached</span>
                                  <ArrowSquareOut size={9} weight="bold" />
                                </a>
                                <label
                                  className="p-0.5 text-slate-400 hover:text-navy-900 cursor-pointer transition-colors"
                                  title="Upload / Replace License from system"
                                >
                                  <UploadSimple size={11} weight="bold" />
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleDirectLicenseUpload(item.driverId, item.driverName, f);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors shadow-2xs">
                                {isUploading ? (
                                  <>
                                    <SpinnerGap size={11} className="animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <UploadSimple size={11} weight="bold" />
                                    <span>Upload License</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleDirectLicenseUpload(item.driverId, item.driverName, f);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {formatINR(item.baseSalary)}
                          </div>
                          <button
                            onClick={() => onEditDriverSalary(item)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <PencilSimple size={11} /> Edit Base
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-amber-900 text-sm">
                            {formatINR(item.totalAdvances)}
                          </div>
                          {hasAdvances ? (
                            <button
                              onClick={() => toggleExpand(item.driverId)}
                              className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-0.5 mt-0.5 hover:underline"
                            >
                              <span>{item.advances.length} Advance(s)</span>
                              {isExpanded ? <CaretUp size={11} /> : <CaretDown size={11} />}
                            </button>
                          ) : (
                            <div className="text-[10px] text-slate-400">0 advances</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div
                            className={`text-base font-black ${
                              item.remainingSalary <= 0
                                ? 'text-emerald-600'
                                : 'text-navy-950'
                            }`}
                          >
                            {formatINR(item.remainingSalary)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {item.remainingSalary <= 0
                              ? 'Fully Settled'
                              : `To Disburse: ${formatINR(item.remainingSalary)}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onAddAdvance(item)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                              title="Give Salary Advance"
                            >
                              <Plus size={13} weight="bold" />
                              <span>Advance</span>
                            </button>

                            <button
                              onClick={() => onOpenPayslip(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-bold text-xs flex items-center gap-1 transition-colors"
                              title="View & Print Salary Slip"
                            >
                              <FileText size={14} weight="bold" />
                              <span>Payslip</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Advance Transactions Drawer */}
                      {isExpanded && hasAdvances && (
                        <tr className="bg-amber-50/40">
                          <td colSpan={6} className="p-3 sm:px-6 py-3 border-y border-amber-100">
                            <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                              <ClockCounterClockwise size={14} weight="bold" />
                              <span>Advance History for {item.driverName} ({selectedMonth})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {item.advances.map((adv) => (
                                <div
                                  key={adv.id}
                                  className="bg-white p-2.5 rounded-md border border-amber-200/80 shadow-2xs flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {formatINR(adv.amount)}
                                      <span className="text-[10px] font-normal text-slate-500 ml-1.5">
                                        ({adv.paymentMode || 'Cash'})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {formatDate(adv.date)} {adv.notes ? `• ${adv.notes}` : ''}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onDeleteAdvance(adv)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                                    title="Delete this advance entry"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
          totalItems={filtered.length}
          onPageChange={setPage}
          label="drivers"
        />
      </div>
    </div>
  );
}
