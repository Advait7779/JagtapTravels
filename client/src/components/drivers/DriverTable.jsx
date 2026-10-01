import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Car,
  Phone,
  PencilSimple,
  Trash,
  UserPlus,
  Certificate,
  FileText,
  UploadSimple,
  ArrowSquareOut,
  CheckCircle,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';
import { formatDate } from '../../utils/formatters';
import { api } from '../../services/api';
import { usePagination, PageSizeSelector, TablePaginationFooter } from '../common/Pagination';

export default function DriverTable({
  drivers,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onUpdateStatus,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [uploadingDriverId, setUploadingDriverId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDirectLicenseUpload = async (driver, file) => {
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
      setUploadingDriverId(driver.id);
      setErrorMsg('');
      setSuccessMsg('');
      await api.uploadDriverDocument(driver.id, {
        file,
        documentType: "Driver's License",
        title: `${driver.name} Driving License`,
      });
      setSuccessMsg(`Driving license uploaded from system for ${driver.name}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload license document.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUploadingDriverId(null);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/gi, '');
    const phoneDigits = (d.phone || '').replace(/[^0-9]/g, '');
    const licNo = (d.licenseNumber || d.license_number || '').toLowerCase();
    const cleanLic = licNo.replace(/[^a-z0-9]/gi, '');

    const matchesSearch =
      !term ||
      (d.name || '').toLowerCase().includes(term) ||
      (d.phone || '').toLowerCase().includes(term) ||
      (cleanTerm && phoneDigits.includes(cleanTerm)) ||
      licNo.includes(term) ||
      (cleanTerm && cleanLic.includes(cleanTerm)) ||
      (d.vehicleAssigned || d.vehicle_assigned || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedDrivers,
  } = usePagination({ items: filteredDrivers, initialPageSize: 10 });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Trip':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Off Duty':
        return 'bg-slate-100 text-slate-600 border-slate-200';
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
                placeholder="Search by driver name, mobile number, license number, assigned cab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <ThemedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="On Trip">On Trip Only</option>
            <option value="Off Duty">Off Duty Only</option>
          </ThemedSelect>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />

          {/* Add Driver Button */}
          <button
            onClick={onAddDriver}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold shadow-sm transition-all active:scale-[0.99] shrink-0"
          >
            <UserPlus size={18} weight="bold" />
            <span>Add New Driver</span>
          </button>
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

      {/* Drivers Data Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold whitespace-nowrap">
                <th className="py-3 px-4">Chauffeur</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">License & Document</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <p className="font-semibold text-slate-700">No drivers registered</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? 'Try adjusting your search query'
                          : 'Click "Add New Driver" to onboard your fleet chauffeurs.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDrivers.map((driver) => {
                  const lic = driver.licenseNumber || driver.license_number || 'N/A';
                  const veh = driver.vehicleAssigned || driver.vehicle_assigned;
                  const plate = driver.vehicleNumber || driver.vehicle_number;
                  const exp = driver.experienceYears || driver.experience_years;
                  const hasDoc = Boolean(
                    driver.licenseDocumentUrl || (driver.documents && driver.documents.length > 0),
                  );
                  const docUrl = driver.licenseDocumentUrl || driver.documents?.[0]?.fileUrl;
                  const isUploading = uploadingDriverId === driver.id;

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Driver */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {driver.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{driver.name}</p>
                            <p className="text-[11px] text-slate-600 font-medium truncate max-w-[150px]">
                              {driver.address || 'Local Driver'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                          <Phone size={13} weight="bold" />
                          <span>{driver.phone}</span>
                        </div>
                        {driver.emergencyContact || driver.emergency_contact ? (
                          <div className="text-[11px] text-slate-600 font-medium">
                            Emerg: {driver.emergencyContact || driver.emergency_contact}
                          </div>
                        ) : null}
                      </td>

                      {/* License & Document */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
                          <Certificate size={13} weight="bold" />
                          <span>{lic}</span>
                        </div>
                        {driver.licenseExpiryDate && (
                          <div className="mt-1">
                            {driver.licenseStatus === 'Expired' ? (
                              <span className="text-2xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                Expired ({Math.abs(driver.licenseDaysRemaining)}d ago)
                              </span>
                            ) : driver.licenseStatus === 'Expiring Soon' ? (
                              <span className="text-2xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Expiring in {driver.licenseDaysRemaining}d
                              </span>
                            ) : (
                              <span className="text-2xs text-slate-500 font-mono">
                                Exp: {formatDate(driver.licenseExpiryDate)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* License File on System Status & Actions */}
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {hasDoc ? (
                            <div className="inline-flex items-center gap-1">
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs"
                                title="View uploaded driving license document"
                              >
                                <FileText size={11} weight="bold" />
                                <span>License Attached</span>
                                <ArrowSquareOut size={10} weight="bold" />
                              </a>
                              <label
                                className="p-1 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                                title="Upload new / replace license from system"
                              >
                                <UploadSimple size={12} weight="bold" />
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleDirectLicenseUpload(driver, f);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors shadow-2xs">
                              {isUploading ? (
                                <>
                                  <SpinnerGap size={12} className="animate-spin" />
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
                                  if (f) handleDirectLicenseUpload(driver, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        {plate ? (
                          <>
                            <div className="font-bold text-slate-900">{plate}</div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {veh || 'Fleet Car'}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">{veh || 'Not Assigned'}</span>
                        )}
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-semibold">
                          {exp ? `${exp} Years` : 'Fresher'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <ThemedSelect
                          value={driver.status || 'Available'}
                          onChange={(e) =>
                            onUpdateStatus(driver.id, { ...driver, status: e.target.value })
                          }
                          className={`px-2 py-1 rounded-md text-[11px] font-bold border ${getStatusBadge(
                            driver.status,
                          )}`}
                        >
                          <option value="Available">Available</option>
                          <option value="On Trip">On Trip</option>
                          <option value="Off Duty">Off Duty</option>
                        </ThemedSelect>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <label
                            className="p-1.5 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Upload License from System"
                          >
                            <UploadSimple size={14} weight="bold" />
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDirectLicenseUpload(driver, f);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          <button
                            onClick={() => onEditDriver(driver)}
                            title="Edit Driver Details"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>

                          <button
                            onClick={() => onDeleteDriver(driver.id)}
                            title="Delete Driver"
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
          totalItems={filteredDrivers.length}
          onPageChange={setPage}
          label="drivers"
        />
      </div>
    </div>
  );
}
