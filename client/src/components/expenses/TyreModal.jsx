import React, { useState, useEffect } from 'react';
import {
  X,
  CircleNotch,
  Car,
  Calendar,
  CurrencyInr,
  Gauge,
  Storefront,
  FileText,
  Tag,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';
import ThemedDatePicker from '../ThemedDatePicker';
import { localDate } from '../../utils/formatters';

const TYRE_BRANDS = [
  'MRF',
  'Apollo',
  'Bridgestone',
  'CEAT',
  'Goodyear',
  'JK Tyre',
  'Michelin',
  'Continental',
  'Yokohama',
  'Other',
];

const TYRE_POSITIONS = [
  'All 4 Tyres',
  'Front Left',
  'Front Right',
  'Rear Left',
  'Rear Right',
  'Both Front',
  'Both Rear',
  'Spare / Stepney',
];

export default function TyreModal({
  isOpen,
  onClose,
  onSave,
  tyreLogToEdit = null,
  vehicles = [],
}) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleNumber: '',
    date: localDate(),
    tyreBrand: 'MRF',
    tyreSize: '185/65 R15',
    tyrePosition: 'All 4 Tyres',
    quantity: 4,
    costPerTyre: 3800,
    totalCost: 15200,
    odometerAtChange: '',
    oldTyreKmRun: '',
    vendorName: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tyreLogToEdit) {
      setFormData({
        vehicleId: tyreLogToEdit.vehicleId || '',
        vehicleNumber: tyreLogToEdit.vehicleNumber || '',
        date: tyreLogToEdit.date || localDate(),
        tyreBrand: tyreLogToEdit.tyreBrand || 'MRF',
        tyreSize: tyreLogToEdit.tyreSize || '',
        tyrePosition: tyreLogToEdit.tyrePosition || 'All 4 Tyres',
        quantity: tyreLogToEdit.quantity ?? 4,
        costPerTyre: tyreLogToEdit.costPerTyre ?? '',
        totalCost: tyreLogToEdit.totalCost ?? '',
        odometerAtChange: tyreLogToEdit.odometerAtChange ?? '',
        oldTyreKmRun: tyreLogToEdit.oldTyreKmRun ?? '',
        vendorName: tyreLogToEdit.vendorName || '',
        notes: tyreLogToEdit.notes || '',
      });
    } else {
      const defaultVehicle = vehicles[0] || null;
      setFormData({
        vehicleId: defaultVehicle?.id || '',
        vehicleNumber: defaultVehicle?.vehicleNumber || '',
        date: localDate(),
        tyreBrand: 'MRF',
        tyreSize: '185/65 R15',
        tyrePosition: 'All 4 Tyres',
        quantity: 4,
        costPerTyre: 3800,
        totalCost: 15200,
        odometerAtChange: defaultVehicle?.currentOdometer || '',
        oldTyreKmRun: defaultVehicle?.currentOdometer ? Math.min(defaultVehicle.currentOdometer, 45000) : '',
        vendorName: '',
        notes: '',
      });
    }
    setError('');
  }, [tyreLogToEdit, isOpen, vehicles]);

  if (!isOpen) return null;

  const handleVehicleSelect = (e) => {
    const id = e.target.value;
    const found = vehicles.find((v) => String(v.id) === String(id));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicleId: found.id,
        vehicleNumber: found.vehicleNumber,
        odometerAtChange: found.currentOdometer || prev.odometerAtChange,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicleId: '',
        vehicleNumber: id,
      }));
    }
  };

  const handlePositionChange = (position) => {
    let defaultQty = 1;
    if (position === 'All 4 Tyres') defaultQty = 4;
    else if (position === 'Both Front' || position === 'Both Rear') defaultQty = 2;

    const cost = parseFloat(formData.costPerTyre) || 0;
    setFormData((prev) => ({
      ...prev,
      tyrePosition: position,
      quantity: defaultQty,
      totalCost: defaultQty * cost,
    }));
  };

  const handleQtyOrCostChange = (qtyVal, costVal) => {
    const qty = parseInt(qtyVal, 10);
    const cost = parseFloat(costVal);
    if (!isNaN(qty) && !isNaN(cost) && qty >= 0 && cost >= 0) {
      setFormData((prev) => ({
        ...prev,
        quantity: qtyVal,
        costPerTyre: costVal,
        totalCost: Math.round(qty * cost * 100) / 100,
      }));
    } else {
      setFormData((prev) => ({ ...prev, quantity: qtyVal, costPerTyre: costVal }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNumber) {
      setError('Please select or enter a vehicle.');
      return;
    }
    if (!formData.tyreBrand) {
      setError('Please specify the tyre brand.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Please enter a valid tyre quantity.');
      return;
    }
    if (!formData.costPerTyre || Number(formData.costPerTyre) <= 0) {
      setError('Please enter a valid cost per tyre.');
      return;
    }
    if (!formData.odometerAtChange || Number(formData.odometerAtChange) <= 0) {
      setError('Please enter the current odometer reading.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        ...formData,
        quantity: Number(formData.quantity),
        costPerTyre: Number(formData.costPerTyre) || 0,
        totalCost: Number(formData.totalCost) || 0,
        odometerAtChange: Number(formData.odometerAtChange) || 0,
        oldTyreKmRun: Number(formData.oldTyreKmRun) || 0,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save tyre replacement record.');
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
              <CircleNotch size={24} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {tyreLogToEdit ? 'Edit Tyre Replacement Entry' : 'Record Tyre Replacement'}
              </h2>
              <p className="text-xs text-slate-300">
                Log new tyres, purchase cost, odometer reading, and old tyre lifespan.
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

          {/* Vehicle & Date */}
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
                    {v.vehicleNumber} - {v.name}
                  </option>
                ))}
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-navy-900" /> Replacement Date <span className="text-rose-500">*</span>
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

          {/* Brand & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={14} className="text-navy-900" /> Tyre Brand <span className="text-rose-500">*</span>
              </label>
              <ThemedSelect
                value={formData.tyreBrand}
                onChange={(e) => setFormData((p) => ({ ...p, tyreBrand: e.target.value }))}
                className="w-full form-input"
                required
              >
                {TYRE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tyre Size / Profile
              </label>
              <input
                type="text"
                placeholder="e.g. 185/65 R15 or 205/65 R16"
                value={formData.tyreSize}
                onChange={(e) => setFormData((p) => ({ ...p, tyreSize: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tyre Position Replaced
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYRE_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => handlePositionChange(pos)}
                  className={`py-1.5 px-2 text-[11px] font-bold rounded-md border transition-all truncate ${
                    formData.tyrePosition === pos
                      ? 'bg-navy-950 text-amber-400 border-navy-950 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity, Cost per Tyre, Total Cost */}
          <div className="p-3.5 bg-slate-50/80 rounded-md border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qty (Tyres) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={(e) => handleQtyOrCostChange(e.target.value, formData.costPerTyre)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cost Per Tyre (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 3800"
                  value={formData.costPerTyre}
                  onChange={(e) => handleQtyOrCostChange(formData.quantity, e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CurrencyInr size={12} /> Total Cost (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 15200"
                  value={formData.totalCost}
                  readOnly
                  className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-navy-950"
                  required
                />
              </div>
            </div>
          </div>

          {/* Odometer at change & Old Tyre KM Lifespan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gauge size={14} className="text-navy-900" /> Current Odometer at Change (KM) <span className="text-rose-500">*</span>
              </label>
              <input
                 type="number"
                 min="0"
                 step="any"
                placeholder="e.g. 52000"
                value={formData.odometerAtChange}
                onChange={(e) => setFormData((p) => ({ ...p, odometerAtChange: e.target.value }))}
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                 required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gauge size={14} className="text-emerald-700" /> Old Tyre Lifespan Run (KM)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 48000"
                value={formData.oldTyreKmRun}
                onChange={(e) => setFormData((p) => ({ ...p, oldTyreKmRun: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Vendor Name & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Storefront size={14} className="text-navy-900" /> Tyre Dealer / Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. Apollo Tyre Zone, Wakad"
                value={formData.vendorName}
                onChange={(e) => setFormData((p) => ({ ...p, vendorName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-navy-900" /> Notes & Warranty Info
              </label>
              <input
                type="text"
                placeholder="e.g. 3-year unconditional warranty, wheel alignment included"
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
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
              <CircleNotch size={16} weight="bold" />
              <span>{loading ? 'Saving...' : tyreLogToEdit ? 'Update Tyre Log' : 'Save Tyre Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
