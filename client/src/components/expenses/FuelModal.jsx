import React, { useState, useEffect } from 'react';
import {
  X,
  GasPump,
  Car,
  User,
  Calendar,
  CurrencyInr,
  Gauge,
  Receipt,
  FileText,
  Drop,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';
import ThemedDatePicker from '../ThemedDatePicker';
import { localDate } from '../../utils/formatters';

export default function FuelModal({
  isOpen,
  onClose,
  onSave,
  fuelLogToEdit = null,
  vehicles = [],
  drivers = [],
}) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    date: localDate(),
    fuelType: 'Diesel',
    quantity: '',
    ratePerUnit: '',
    totalCost: '',
    odometerReading: '',
    petrolPumpName: '',
    receiptNumber: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fuelLogToEdit) {
      setFormData({
        vehicleId: fuelLogToEdit.vehicleId || '',
        vehicleNumber: fuelLogToEdit.vehicleNumber || '',
        driverId: fuelLogToEdit.driverId || '',
        driverName: fuelLogToEdit.driverName || '',
        date: fuelLogToEdit.date || localDate(),
        fuelType: fuelLogToEdit.fuelType || 'Diesel',
        quantity: fuelLogToEdit.quantity ?? '',
        ratePerUnit: fuelLogToEdit.ratePerUnit ?? '',
        totalCost: fuelLogToEdit.totalCost ?? '',
        odometerReading: fuelLogToEdit.odometerReading ?? '',
        petrolPumpName: fuelLogToEdit.petrolPumpName || '',
        receiptNumber: fuelLogToEdit.receiptNumber || '',
        notes: fuelLogToEdit.notes || '',
      });
    } else {
      const defaultVehicle = vehicles[0] || null;
      const defaultDriver = drivers[0] || null;
      setFormData({
        vehicleId: defaultVehicle?.id || '',
        vehicleNumber: defaultVehicle?.vehicleNumber || '',
        driverId: defaultDriver?.id || '',
        driverName: defaultDriver?.name || '',
        date: localDate(),
        fuelType: defaultVehicle?.fuelType || 'Diesel',
        quantity: '',
        ratePerUnit: '',
        totalCost: '',
        odometerReading: defaultVehicle?.currentOdometer || '',
        petrolPumpName: '',
        receiptNumber: '',
        notes: '',
      });
    }
    setError('');
  }, [fuelLogToEdit, isOpen, vehicles, drivers]);

  if (!isOpen) return null;

  const handleVehicleSelect = (e) => {
    const id = e.target.value;
    const found = vehicles.find((v) => String(v.id) === String(id));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicleId: found.id,
        vehicleNumber: found.vehicleNumber,
        fuelType: found.fuelType || prev.fuelType,
        odometerReading: found.currentOdometer || prev.odometerReading,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicleId: '',
        vehicleNumber: id,
      }));
    }
  };

  const handleDriverSelect = (e) => {
    const id = e.target.value;
    const found = drivers.find((d) => String(d.id) === String(id));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        driverId: found.id,
        driverName: found.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        driverId: '',
        driverName: id,
      }));
    }
  };

  // Recalculate total cost when quantity or rate changes
  const handleQuantityOrRateChange = (qtyVal, rateVal) => {
    const qty = parseFloat(qtyVal);
    const rate = parseFloat(rateVal);
    if (!isNaN(qty) && !isNaN(rate) && qty >= 0 && rate >= 0) {
      const computed = Math.round(qty * rate * 100) / 100;
      setFormData((prev) => ({ ...prev, quantity: qtyVal, ratePerUnit: rateVal, totalCost: computed }));
    } else {
      setFormData((prev) => ({ ...prev, quantity: qtyVal, ratePerUnit: rateVal }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNumber) {
      setError('Please select or specify a vehicle registration number.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Please enter a valid fuel quantity.');
      return;
    }
    if (!formData.ratePerUnit || Number(formData.ratePerUnit) <= 0) {
      setError('Please enter a valid rate per unit.');
      return;
    }
    if (!formData.odometerReading || Number(formData.odometerReading) <= 0) {
      setError('Please enter the current odometer reading.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        ...formData,
        quantity: Number(formData.quantity),
        ratePerUnit: Number(formData.ratePerUnit) || 0,
        totalCost: Number(formData.totalCost),
        odometerReading: Number(formData.odometerReading) || 0,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save fuel expense log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-md shadow-xs">
              <GasPump size={24} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {fuelLogToEdit ? 'Edit Fuel Expense Entry' : 'Log Daily Fuel Fill-up'}
              </h2>
              <p className="text-xs text-slate-300">
                Track Diesel, Petrol, or CNG expenses, pump receipts, and vehicle mileage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Vehicle & Fuel Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Car size={14} className="text-navy-900" /> Vehicle <span className="text-rose-500">*</span>
              </label>
              <ThemedSelect
                value={formData.vehicleId || formData.vehicleNumber}
                onChange={handleVehicleSelect}
                className="w-full form-input"
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} - {v.name} ({v.fuelType || 'Diesel'})
                  </option>
                ))}
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Drop size={14} className="text-navy-900" /> Fuel Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Diesel', 'Petrol', 'CNG'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, fuelType: type }))}
                    className={`py-2 text-xs font-bold rounded-md border transition-all ${
                      formData.fuelType === type
                        ? 'bg-navy-950 text-amber-400 border-navy-950 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Driver & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-navy-900" /> Driver / Refueled By
              </label>
              <ThemedSelect
                value={formData.driverId || formData.driverName}
                onChange={handleDriverSelect}
                className="w-full form-input"
              >
                <option value="">Select driver (Optional)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-navy-900" /> Fill Date <span className="text-rose-500">*</span>
              </label>
              <ThemedDatePicker
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                className="w-full py-2 bg-slate-50 border border-slate-200"
                containerClassName="w-full"
                required
              />
            </div>
          </div>

          {/* Quantity, Rate, Total Cost */}
          <div className="p-3.5 bg-slate-50/80 rounded-md border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qty ({formData.fuelType === 'CNG' ? 'Kg' : 'Litres'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 35.5"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityOrRateChange(e.target.value, formData.ratePerUnit)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rate (₹ per {formData.fuelType === 'CNG' ? 'Kg' : 'L'})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 94.50"
                  value={formData.ratePerUnit}
                  onChange={(e) => handleQuantityOrRateChange(formData.quantity, e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CurrencyInr size={12} /> Total Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 3350"
                  value={formData.totalCost}
                  readOnly
                  className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-navy-950"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Total cost is calculated from quantity × rate and verified again by the server.
            </p>
          </div>

          {/* Odometer, Pump Name, Receipt # */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Gauge size={13} className="text-navy-900" /> Odometer (KM) <span className="text-rose-500">*</span>
              </label>
              <input
                 type="number"
                 step="any"
                 min="0"
                placeholder="e.g. 64250"
                value={formData.odometerReading}
                onChange={(e) => setFormData((p) => ({ ...p, odometerReading: e.target.value }))}
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                 required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <GasPump size={13} className="text-navy-900" /> Petrol Pump
              </label>
              <input
                type="text"
                placeholder="e.g. Indian Oil, Wakad"
                value={formData.petrolPumpName}
                onChange={(e) => setFormData((p) => ({ ...p, petrolPumpName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Receipt size={13} className="text-navy-900" /> Receipt / Bill #
              </label>
              <input
                type="text"
                placeholder="e.g. REC-8492"
                value={formData.receiptNumber}
                onChange={(e) => setFormData((p) => ({ ...p, receiptNumber: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText size={13} className="text-navy-900" /> Notes / Trip Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Tank full before Mumbai corporate run"
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2 px-5 rounded-md font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <GasPump size={16} weight="bold" />
              <span>{loading ? 'Saving...' : fuelLogToEdit ? 'Update Fuel Log' : 'Save Fuel Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
