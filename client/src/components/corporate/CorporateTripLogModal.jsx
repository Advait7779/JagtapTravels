import React, { useState, useEffect, useId } from 'react';
import {
  X,
  Buildings,
  Car,
  User,
  Calendar,
  Clock,
  Gauge,
  CurrencyInr,
  Users,
  MapPin,
  CheckCircle,
  Plus,
  Minus,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';
import { localDate } from '../../utils/formatters';

const EMPTY_LIST = Object.freeze([]);

export default function CorporateTripLogModal({
  isOpen,
  onClose,
  onSave,
  logToEdit = null,
  preselectedContract = null,
  contracts = EMPTY_LIST,
  customers = EMPTY_LIST,
  vehicles = EMPTY_LIST,
  drivers = EMPTY_LIST,
  existingLogs = EMPTY_LIST,
}) {
  const companySelectId = useId();
  const vehicleSelectId = useId();
  const driverSelectId = useId();
  const dateInputId = useId();
  const startTimeInputId = useId();
  const closeTimeInputId = useId();
  const startKmInputId = useId();
  const closeKmInputId = useId();
  const placeFromInputId = useId();
  const placeToInputId = useId();
  const employeeCountInputId = useId();
  const tollParkingInputId = useId();
  const extraHoursInputId = useId();
  const signatureNameInputId = useId();
  const remarksInputId = useId();

  const [formData, setFormData] = useState({
    contractId: '',
    companyId: '',
    companyName: '',
    vehicleId: '',
    vehicleName: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    date: localDate(),
    placeFrom: '',
    placeTo: '',
    startKm: '',
    closeKm: '',
    startTime: '',
    closeTime: '',
    totalHours: '',
    extraHours: '',
    tollParking: '',
    employeeCount: 4,
    signatureName: '',
    remarks: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate hours diff
  const calculateDurationHours = (start, close) => {
    if (!start || !close) return '';
    const parse = (t) => {
      const m = String(t).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (!m) return null;
      let hr = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const mer = m[3]?.toUpperCase();
      if (mer === 'PM' && hr < 12) hr += 12;
      if (mer === 'AM' && hr === 12) hr = 0;
      return hr * 60 + min;
    };
    const s = parse(start);
    const c = parse(close);
    if (s === null || c === null) return '';
    let diff = c - s;
    if (diff < 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (logToEdit) {
      setFormData({
        contractId: logToEdit.contractId || '',
        companyId: logToEdit.companyId || '',
        companyName: logToEdit.companyName || '',
        vehicleId: logToEdit.vehicleId || '',
        vehicleName: logToEdit.vehicleName || '',
        vehicleNumber: logToEdit.vehicleNumber || '',
        driverId: logToEdit.driverId || '',
        driverName: logToEdit.driverName || '',
        date: logToEdit.date || localDate(),
        placeFrom: logToEdit.placeFrom || '',
        placeTo: logToEdit.placeTo || '',
        startKm: logToEdit.startKm ?? '',
        closeKm: logToEdit.closeKm ?? '',
        startTime: logToEdit.startTime || '',
        closeTime: logToEdit.closeTime || '',
        totalHours:
          logToEdit.totalHours !== undefined && logToEdit.totalHours !== null
            ? logToEdit.totalHours
            : calculateDurationHours(logToEdit.startTime, logToEdit.closeTime),
        extraHours:
          logToEdit.extraHours !== undefined && logToEdit.extraHours !== null && logToEdit.extraHours !== 0
            ? String(logToEdit.extraHours)
            : '',
        tollParking:
          logToEdit.tollParking !== undefined && logToEdit.tollParking !== null && logToEdit.tollParking !== 0
            ? String(logToEdit.tollParking)
            : '',
        employeeCount: logToEdit.employeeCount ?? 4,
        signatureName: logToEdit.signatureName || '',
        remarks: logToEdit.remarks || '',
      });
    } else {
      const targetContract =
        preselectedContract ||
        contracts.find((c) => c.status === 'Active') ||
        contracts[0] ||
        null;

      const vehicle = targetContract
        ? vehicles.find(
            (v) =>
              String(v.id) === String(targetContract.vehicleId) ||
              v.vehicleNumber === targetContract.vehicleNumber,
          )
        : vehicles[0] || null;

      const driver = targetContract
        ? drivers.find(
            (d) =>
              String(d.id) === String(targetContract.driverId) ||
              d.name === targetContract.driverName,
          )
        : drivers[0] || null;

      const vehicleId = vehicle?.id || targetContract?.vehicleId;
      const vehicleNumber = vehicle?.vehicleNumber || targetContract?.vehicleNumber;
      const vehicleLogs = existingLogs.filter(
        (l) =>
          (vehicleId && String(l.vehicleId) === String(vehicleId)) ||
          (vehicleNumber && l.vehicleNumber === vehicleNumber),
      );
      const lastLog = vehicleLogs.length > 0 ? vehicleLogs[0] : null;
      const suggestedStartKm =
        lastLog && Number(lastLog.closeKm) > 0
          ? Number(lastLog.closeKm)
          : Number(vehicle?.currentOdometer || 0);

      setFormData({
        contractId: targetContract?.id || '',
        companyId: targetContract?.companyId || '',
        companyName: targetContract?.companyName || '',
        vehicleId: vehicle?.id || targetContract?.vehicleId || '',
        vehicleName: vehicle?.name || targetContract?.vehicleName || '',
        vehicleNumber: vehicle?.vehicleNumber || targetContract?.vehicleNumber || '',
        driverId: driver?.id || targetContract?.driverId || '',
        driverName: driver?.name || targetContract?.driverName || '',
        date: localDate(),
        placeFrom: 'Parking',
        placeTo: targetContract?.companyName || 'Company Site',
        startKm: suggestedStartKm > 0 ? suggestedStartKm : '',
        closeKm: '',
        startTime: '06:30',
        closeTime: '08:30',
        totalHours: 2,
        extraHours: '',
        tollParking: '',
        employeeCount: 4,
        signatureName: '',
        remarks: '',
      });
    }
    setError('');
  }, [logToEdit, isOpen, preselectedContract, contracts, vehicles, drivers, existingLogs]);

  if (!isOpen) return null;

  const handleContractChange = (contractId) => {
    const found = contracts.find((c) => String(c.id) === String(contractId));
    if (found) {
      const v = vehicles.find(
        (veh) =>
          String(veh.id) === String(found.vehicleId) || veh.vehicleNumber === found.vehicleNumber,
      );
      const d = drivers.find(
        (drv) => String(drv.id) === String(found.driverId) || drv.name === found.driverName,
      );

      const vLogs = existingLogs.filter(
        (l) =>
          (found.vehicleId && String(l.vehicleId) === String(found.vehicleId)) ||
          (found.vehicleNumber && l.vehicleNumber === found.vehicleNumber),
      );
      const last = vLogs[0];
      const suggestedKm =
        last && Number(last.closeKm) > 0
          ? Number(last.closeKm)
          : Number(v?.currentOdometer || 0);

      setFormData((prev) => ({
        ...prev,
        contractId: found.id,
        companyId: found.companyId || '',
        companyName: found.companyName || '',
        vehicleId: v?.id || found.vehicleId || '',
        vehicleName: v?.name || found.vehicleName || '',
        vehicleNumber: v?.vehicleNumber || found.vehicleNumber || '',
        driverId: d?.id || found.driverId || '',
        driverName: d?.name || found.driverName || '',
        placeTo: prev.placeTo || found.companyName,
        startKm: prev.startKm || (suggestedKm > 0 ? suggestedKm : ''),
      }));
    }
  };

  const handleTimeChange = (field, val) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      const computed = calculateDurationHours(
        field === 'startTime' ? val : next.startTime,
        field === 'closeTime' ? val : next.closeTime,
      );
      next.totalHours = computed !== '' ? computed : '';
      return next;
    });
  };

  const totalKm =
    formData.closeKm !== '' && formData.startKm !== '' && Number(formData.closeKm) >= Number(formData.startKm)
      ? Number(formData.closeKm) - Number(formData.startKm)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedContract = contracts.find(
      (contract) => String(contract.id) === String(formData.contractId),
    );
    if (!selectedContract) {
      setError('Select an active corporate contract.');
      return;
    }
    if (!logToEdit && selectedContract.status && selectedContract.status !== 'Active') {
      setError('Daily trips can only be added to an active corporate contract.');
      return;
    }
    if (!formData.vehicleId || !formData.driverId) {
      setError('The contract must have a vehicle and driver assigned.');
      return;
    }
    if (
      formData.date < selectedContract.startDate ||
      (selectedContract.endDate && formData.date > selectedContract.endDate) ||
      formData.date > localDate()
    ) {
      setError('Trip date must be within the active contract period and cannot be in the future.');
      return;
    }
    if (!formData.placeFrom?.trim()) {
      setError('Pickup location (From) is required.');
      return;
    }
    if (!formData.placeTo?.trim()) {
      setError('Destination (To) is required.');
      return;
    }
    const startNum = Number(formData.startKm || 0);
    const closeNum = Number(formData.closeKm || 0);
    if (closeNum < startNum) {
      setError('Close KM cannot be less than Start KM.');
      return;
    }
    if (!Number.isSafeInteger(Number(formData.employeeCount)) || Number(formData.employeeCount) < 0) {
      setError('Employee count must be a nonnegative whole number.');
      return;
    }
    const timePattern = /^(?:(?:[01]?\d|2[0-3]):[0-5]\d|(?:0?[1-9]|1[0-2]):[0-5]\d\s*(?:AM|PM))$/i;
    if (Boolean(formData.startTime) !== Boolean(formData.closeTime)) {
      setError('Enter both Start Time and Close Time.');
      return;
    }
    if (
      (formData.startTime && !timePattern.test(formData.startTime.trim())) ||
      (formData.closeTime && !timePattern.test(formData.closeTime.trim()))
    ) {
      setError('Enter valid times such as 06:30 or 06:30 AM.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(
        {
          ...formData,
          extraHours: formData.extraHours === '' ? 0 : Number(formData.extraHours) || 0,
          tollParking: formData.tollParking === '' ? 0 : Number(formData.tollParking) || 0,
        },
        logToEdit?.id,
      );
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save trip logsheet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-navy-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-400 text-navy-950 rounded-md shadow-xs">
              <Gauge size={20} weight="bold" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                {logToEdit ? 'Edit Daily Trip Log' : 'Daily KM Logsheet'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Record shift timings, odometers, tolls, and employee count
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>•</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Company, Vehicle & Driver Selection with clean grid spacing */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Buildings size={14} className="text-navy-900" />
                Company & Vehicle Assignment
              </span>
              {formData.companyName && (
                <span className="px-2 py-0.5 rounded-md bg-navy-950 text-amber-400 text-[10px] font-bold">
                  {formData.companyName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="w-full">
                <label htmlFor={companySelectId} className="block font-bold text-slate-700 mb-1">
                  Company / Contract *
                </label>
                <ThemedSelect
                  id={companySelectId}
                  value={formData.contractId}
                  required
                  onChange={(e) => handleContractChange(e.target.value)}
                  className="w-full form-input"
                  containerClassName="w-full"
                >
                  <option value="">Select Contract...</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.vehicleNumber || 'Cab'})
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              <div className="w-full">
                <label htmlFor={vehicleSelectId} className="block font-bold text-slate-700 mb-1">
                  Vehicle *
                </label>
                <ThemedSelect
                  id={vehicleSelectId}
                  value={formData.vehicleId}
                  required
                  onChange={(e) => {
                    const found = vehicles.find((v) => String(v.id) === String(e.target.value));
                    if (found) {
                      setFormData((prev) => ({
                        ...prev,
                        vehicleId: found.id,
                        vehicleNumber: found.vehicleNumber,
                        vehicleName: found.name,
                      }));
                    }
                  }}
                  className="w-full form-input"
                  containerClassName="w-full"
                >
                  <option value="">Select Vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.name || 'Cab'})
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              <div className="w-full">
                <label htmlFor={driverSelectId} className="block font-bold text-slate-700 mb-1">
                  Driver *
                </label>
                <ThemedSelect
                  id={driverSelectId}
                  value={formData.driverId}
                  required
                  onChange={(e) => {
                    const found = drivers.find((d) => String(d.id) === String(e.target.value));
                    if (found) {
                      setFormData((prev) => ({
                        ...prev,
                        driverId: found.id,
                        driverName: found.name,
                      }));
                    }
                  }}
                  className="w-full form-input"
                  containerClassName="w-full"
                >
                  <option value="">Select Driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </ThemedSelect>
              </div>
            </div>
          </div>

          {/* Date & Shift Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div>
              <label htmlFor={dateInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                Date *
              </label>
              <input
                id={dateInputId}
                type="date"
                required
                min={
                  contracts.find((contract) => String(contract.id) === String(formData.contractId))
                    ?.startDate || undefined
                }
                max={
                  [
                    localDate(),
                    contracts.find(
                      (contract) => String(contract.id) === String(formData.contractId),
                    )?.endDate,
                  ]
                    .filter(Boolean)
                    .sort()[0]
                }
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={startTimeInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                Start Time
              </label>
              <input
                id={startTimeInputId}
                type="text"
                placeholder="06:30 AM"
                value={formData.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={closeTimeInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                Close Time
              </label>
              <input
                id={closeTimeInputId}
                type="text"
                placeholder="08:30 PM"
                value={formData.closeTime}
                onChange={(e) => handleTimeChange('closeTime', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                Total Hours
              </label>
              <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md font-mono font-black text-xs text-emerald-800 flex items-center justify-between">
                <span>
                  {formData.totalHours !== '' && formData.totalHours !== undefined
                    ? `${formData.totalHours} hrs`
                    : '-- hrs'}
                </span>
                <span className="text-[10px] text-emerald-600 font-sans font-bold">Auto</span>
              </div>
            </div>

            <div>
              <label htmlFor={extraHoursInputId} className="block font-bold text-slate-700 mb-1">
                Extra Hours
              </label>
              <input
                id={extraHoursInputId}
                type="number"
                step="any"
                min="0"
                value={formData.extraHours}
                onChange={(e) => setFormData({ ...formData, extraHours: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Route: From -> To */}
          <div className="bg-slate-50/70 p-3.5 rounded-md border border-slate-200 space-y-2">
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-navy-900" />
                Route (From ➔ To) *
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={placeFromInputId} className="block font-bold text-slate-700 mb-1">From *</label>
                <input
                  id={placeFromInputId}
                  type="text"
                  required
                  placeholder="e.g. Parking"
                  value={formData.placeFrom}
                  onChange={(e) => setFormData({ ...formData, placeFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={placeToInputId} className="block font-bold text-slate-700 mb-1">To *</label>
                <input
                  id={placeToInputId}
                  type="text"
                  required
                  placeholder="e.g. Henkel / Company Site"
                  value={formData.placeTo}
                  onChange={(e) => setFormData({ ...formData, placeTo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Odometers: Start KM, Close KM, and Total KM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor={startKmInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge size={13} className="text-slate-400" />
                Start KM *
              </label>
              <input
                id={startKmInputId}
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 105000"
                value={formData.startKm}
                onChange={(e) => setFormData({ ...formData, startKm: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={closeKmInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge size={13} className="text-slate-400" />
                Close KM *
              </label>
              <input
                id={closeKmInputId}
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 105038"
                value={formData.closeKm}
                onChange={(e) => setFormData({ ...formData, closeKm: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Trip KM</label>
              <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md font-mono font-black text-xs text-emerald-800 flex items-center justify-between">
                <span>{totalKm} KM</span>
                <span className="text-[10px] text-emerald-600 font-sans font-bold">Auto</span>
              </div>
            </div>
          </div>

          {/* Employee Count, Toll & Sign (Clean, Minimal, No Noisy Text) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor={employeeCountInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Users size={13} className="text-slate-500" />
                Employee Count *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeCount: Math.max(0, (Number(prev.employeeCount) || 0) - 1),
                    }))
                  }
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-bold transition-colors"
                >
                  <Minus size={14} weight="bold" />
                </button>
                <input
                  id={employeeCountInputId}
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formData.employeeCount}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCount: Number(e.target.value) || 0 })
                  }
                  className="w-full text-center px-2 py-2 bg-slate-50 border border-slate-300 rounded-md font-black text-sm text-slate-900 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeCount: (Number(prev.employeeCount) || 0) + 1,
                    }))
                  }
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-bold transition-colors"
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={tollParkingInputId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CurrencyInr size={13} className="text-slate-400" />
                Toll / Parking (₹)
              </label>
              <input
                id={tollParkingInputId}
                type="number"
                step="any"
                min="0"
                value={formData.tollParking}
                onChange={(e) =>
                  setFormData({ ...formData, tollParking: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-bold text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={signatureNameInputId} className="block font-bold text-slate-700 mb-1">
                User / Signatory
              </label>
              <input
                id={signatureNameInputId}
                type="text"
                placeholder="e.g. Shift Incharge"
                value={formData.signatureName}
                onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Remarks (Optional) */}
          <div>
            <label htmlFor={remarksInputId} className="block font-bold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <input
              id={remarksInputId}
              type="text"
              placeholder="e.g. Morning pickup on time"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          {/* Summary Preview Strip */}
          <div className="p-2.5 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>
              Total: <strong className="text-slate-900">{totalKm} KM</strong> •{' '}
              <strong className="text-slate-900">{formData.totalHours || 0} Hours</strong> •{' '}
              <strong className="text-slate-900">{formData.employeeCount || 0} Employees</strong>
            </span>
            {Number(formData.tollParking) > 0 && (
              <span className="text-slate-900 font-bold">Toll: ₹{formData.tollParking}</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-5 py-2 rounded-md font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle size={16} weight="bold" />
              <span>{loading ? 'Saving...' : logToEdit ? 'Update Log' : 'Save Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
