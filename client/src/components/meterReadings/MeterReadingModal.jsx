import React, { useState, useEffect } from 'react';
import { localDate, dateInput, roundMoney } from '../../utils/formatters';
import { X, Gauge, Car, User, MapPin, Calendar, AlertCircle } from 'lucide-react';
import ThemedSelect from '../ThemedSelect';

export default function MeterReadingModal({
  isOpen,
  onClose,
  onSave,
  readingToEdit = null,
  drivers = [],
  customers = [],
}) {
  const [formData, setFormData] = useState({
    slipNumber: '',
    vehicleName: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    customerId: '',
    customerName: '',
    tripSource: 'Pune',
    tripDestination: '',
    startDate: localDate(),
    endDate: localDate(),
    openingKm: '',
    closingKm: '',
    totalKm: 0,
    ratePerKm: 16,
    tollParking: 0,
    driverAllowance: 500,
    status: 'Completed',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (readingToEdit) {
      setFormData({
        slipNumber: readingToEdit.slipNumber || readingToEdit.slip_number || '',
        vehicleName: readingToEdit.vehicleName || readingToEdit.vehicle_name || '',
        vehicleNumber: readingToEdit.vehicleNumber || readingToEdit.vehicle_number || '',
        driverId: readingToEdit.driverId || readingToEdit.driver_id || '',
        driverName: readingToEdit.driverName || readingToEdit.driver_name || '',
        customerId: readingToEdit.customerId || readingToEdit.customer_id || '',
        customerName: readingToEdit.customerName || readingToEdit.customer_name || '',
        tripSource: readingToEdit.tripSource || readingToEdit.trip_source || 'Pune',
        tripDestination: readingToEdit.tripDestination || readingToEdit.trip_destination || '',
        startDate: dateInput(readingToEdit.startDate ?? readingToEdit.start_date) || localDate(),
        endDate: dateInput(readingToEdit.endDate ?? readingToEdit.end_date),
        openingKm: readingToEdit.openingKm ?? readingToEdit.opening_km ?? 0,
        closingKm:
          readingToEdit.status === 'Ongoing'
            ? ''
            : readingToEdit.closingKm ?? readingToEdit.closing_km ?? '',
        totalKm: readingToEdit.totalKm ?? readingToEdit.total_km ?? 0,
        ratePerKm: readingToEdit.ratePerKm ?? readingToEdit.rate_per_km ?? 16,
        tollParking: readingToEdit.tollParking ?? readingToEdit.toll_parking ?? 0,
        driverAllowance: readingToEdit.driverAllowance ?? readingToEdit.driver_allowance ?? 500,
        status: readingToEdit.status || 'Completed',
        notes: readingToEdit.notes || '',
      });
    } else {
      setFormData({
        slipNumber: '',
        vehicleName:
          drivers.length > 0
            ? drivers[0].vehicleAssigned || drivers[0].vehicle_assigned || 'Toyota Innova Crysta'
            : 'Toyota Innova Crysta',
        vehicleNumber:
          drivers.length > 0 ? drivers[0].vehicleNumber || drivers[0].vehicle_number || '' : '',
        driverId: drivers.length > 0 ? drivers[0].id : '',
        driverName: drivers.length > 0 ? drivers[0].name : '',
        customerId: '',
        customerName: '',
        tripSource: 'Pune',
        tripDestination: '',
        startDate: localDate(),
        endDate: localDate(),
        openingKm: '',
        closingKm: '',
        totalKm: 0,
        ratePerKm: 16,
        tollParking: 0,
        driverAllowance: 500,
        status: 'Completed',
        notes: '',
      });
    }
    setError('');
  }, [readingToEdit, isOpen]);

  // Always clear stale distance when the closing reading is invalid.
  useEffect(() => {
    const openKm = Number(formData.openingKm),
      closeKm = Number(formData.closingKm);
    const hasClose = formData.closingKm !== '' && formData.closingKm != null;
    setFormData((prev) => ({
      ...prev,
      totalKm: hasClose && closeKm >= openKm ? roundMoney(closeKm - openKm) : 0,
      status: prev.status === 'Billed' ? 'Billed' : hasClose ? 'Completed' : 'Ongoing',
    }));
  }, [formData.openingKm, formData.closingKm]);

  if (!isOpen) return null;

  const handleDriverSelect = (e) => {
    const dId = e.target.value;
    if (!dId) {
      setFormData((prev) => ({
        ...prev,
        driverId: '',
        driverName: '',
        vehicleName: '',
        vehicleNumber: '',
      }));
      return;
    }
    const found = drivers.find((d) => String(d.id) === String(dId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        driverId: found.id,
        driverName: found.name,
        vehicleName: found.vehicleAssigned || found.vehicle_assigned || prev.vehicleName,
        vehicleNumber: found.vehicleNumber || found.vehicle_number || prev.vehicleNumber,
      }));
    }
  };

  const handleCustomerSelect = (e) => {
    const cId = e.target.value;
    if (!cId) {
      setFormData((prev) => ({ ...prev, customerId: '', customerName: '' }));
      return;
    }
    const found = customers.find((c) => String(c.id) === String(cId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        customerId: found.id,
        customerName: found.name,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleName.trim() || !formData.driverName.trim()) {
      setError('Vehicle Model and Driver Name are required.');
      return;
    }
    if (formData.openingKm === '' || isNaN(formData.openingKm)) {
      setError('Opening KM reading is required.');
      return;
    }
    if (!formData.tripSource.trim() || !formData.tripDestination.trim()) {
      setError('Trip Pickup Source and Destination are required.');
      return;
    }

    if (
      formData.status === 'Completed' &&
      (formData.closingKm === '' || Number(formData.closingKm) < Number(formData.openingKm))
    ) {
      setError('Closing KM must be at least the opening KM.');
      return;
    }
    if (
      !formData.startDate ||
      (formData.endDate && formData.endDate < formData.startDate) ||
      (formData.status === 'Completed' && !formData.endDate)
    ) {
      setError('Enter valid trip dates. Completed trips require an end date.');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData, readingToEdit?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save meter reading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-md sm:rounded-md shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-navy-950 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>
                {readingToEdit ? 'Edit Meter Reading Slip' : 'Record Vehicle Meter Reading'}
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Jagtap Travels Fleet • Odometer logging and trip duty slip
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Vehicle & Driver */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-slate-600" />
              <span>1. Vehicle & Driver Assignment</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Driver <span className="text-rose-500">*</span>
                </label>
                <ThemedSelect
                  value={formData.driverId}
                  onChange={handleDriverSelect}
                  className="w-full form-input"
                  placeholder="-- Choose Driver --"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.vehicleAssigned || 'Fleet'})
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Client (Optional)
                </label>
                <ThemedSelect
                  value={formData.customerId}
                  onChange={handleCustomerSelect}
                  className="w-full form-input"
                  placeholder="-- Select Customer or Enter Below --"
                >
                  <option value="">-- Select Customer or Enter Below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Innova Crysta"
                  value={formData.vehicleName}
                  onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Plate Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 QX 4589"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 uppercase focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Trip Route & Dates */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span>2. Trip Route & Dates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Starting Point <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune City / Airport"
                  value={formData.tripSource}
                  onChange={(e) => setFormData({ ...formData, tripSource: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination / Route <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar - Panchgani"
                  value={formData.tripDestination}
                  onChange={(e) => setFormData({ ...formData, tripDestination: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Return Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Odometer Meter Readings */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-slate-600" />
              <span>3. Meter Readings (Opening & Closing KM)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening KM (Odometer Start) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 42150"
                  value={formData.openingKm}
                  onChange={(e) => setFormData({ ...formData, openingKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Closing KM (Odometer End)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 42680"
                  value={formData.closingKm}
                  onChange={(e) => setFormData({ ...formData, closingKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Run Distance (KM)
                </label>
                <div className="w-full px-3 py-2 bg-navy-900 text-white rounded-lg text-sm font-mono font-bold flex items-center justify-between">
                  <span>{formData.totalKm}</span>
                  <span className="text-xs text-blue-300">KM</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreed Rate / KM (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.ratePerKm}
                  onChange={(e) => setFormData({ ...formData, ratePerKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Toll & Parking Incurred (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.tollParking}
                  onChange={(e) => setFormData({ ...formData, tollParking: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Allowance (Batta) ₹
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.driverAllowance}
                  onChange={(e) => setFormData({ ...formData, driverAllowance: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duty Slip Status
              </label>
              <ThemedSelect
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full form-input"
              >
                <option value="Completed">Completed (Vehicle Returned)</option>
                <option value="Ongoing">Ongoing (Currently on Trip)</option>
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trip / Fuel Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Fuel receipt attached, highway toll verified"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-center"
            >
              <Gauge className="w-4 h-4 text-blue-300 shrink-0" />
              <span>
                {loading ? 'Saving...' : readingToEdit ? 'Update Meter Slip' : 'Save Meter Reading'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
