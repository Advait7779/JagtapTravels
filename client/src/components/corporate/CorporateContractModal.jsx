import React, { useState, useEffect } from 'react';
import {
  X,
  Buildings,
  Car,
  User,
  Calendar,
  CurrencyInr,
  Gauge,
  CheckCircle,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';
import { localDate } from '../../utils/formatters';

export default function CorporateContractModal({
  isOpen,
  onClose,
  onSave,
  contractToEdit = null,
  customers = [],
  vehicles = [],
  drivers = [],
}) {
  const [formData, setFormData] = useState({
    companyId: '',
    companyName: '',
    vehicleId: '',
    vehicleName: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    startDate: localDate(),
    endDate: '',
    monthlyBaseFare: 45000,
    includedMonthlyKm: 2500,
    extraRatePerKm: 14,
    status: 'Active',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contractToEdit) {
      setFormData({
        companyId: contractToEdit.companyId || '',
        companyName: contractToEdit.companyName || '',
        vehicleId: contractToEdit.vehicleId || '',
        vehicleName: contractToEdit.vehicleName || '',
        vehicleNumber: contractToEdit.vehicleNumber || '',
        driverId: contractToEdit.driverId || '',
        driverName: contractToEdit.driverName || '',
        startDate: contractToEdit.startDate || localDate(),
        endDate: contractToEdit.endDate || '',
        monthlyBaseFare: contractToEdit.monthlyBaseFare || 45000,
        includedMonthlyKm: contractToEdit.includedMonthlyKm || 2500,
        extraRatePerKm: contractToEdit.extraRatePerKm || 14,
        status: contractToEdit.status || 'Active',
        notes: contractToEdit.notes || '',
      });
    } else {
      setFormData({
        companyId: '',
        companyName: '',
        vehicleId: vehicles[0]?.id || '',
        vehicleName: vehicles[0]?.name || '',
        vehicleNumber: vehicles[0]?.vehicleNumber || '',
        driverId: drivers[0]?.id || '',
        driverName: drivers[0]?.name || '',
        startDate: localDate(),
        endDate: '',
        monthlyBaseFare: 45000,
        includedMonthlyKm: 2500,
        extraRatePerKm: 14,
        status: 'Active',
        notes: '',
      });
    }
    setError('');
  }, [contractToEdit, isOpen, vehicles, drivers]);

  if (!isOpen) return null;

  const handleCompanySelect = (e) => {
    const id = e.target.value;
    if (!id) {
      setFormData((prev) => ({ ...prev, companyId: '' }));
      return;
    }
    const found = customers.find((c) => String(c.id) === String(id));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        companyId: found.id,
        companyName: found.name,
      }));
    }
  };

  const handleVehicleSelect = (e) => {
    const id = e.target.value;
    if (!id) {
      setFormData((prev) => ({ ...prev, vehicleId: '', vehicleName: '', vehicleNumber: '' }));
      return;
    }
    const found = vehicles.find((v) => String(v.id) === String(id));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicleId: found.id,
        vehicleName: found.name,
        vehicleNumber: found.vehicleNumber,
        driverId: found.driverId || prev.driverId,
        driverName: found.driverName || prev.driverName,
      }));
    }
  };

  const handleDriverSelect = (e) => {
    const id = e.target.value;
    if (!id) {
      setFormData((prev) => ({ ...prev, driverId: '', driverName: '' }));
      return;
    }
    const found = drivers.find((d) => String(d.id) === String(id));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        driverId: found.id,
        driverName: found.name,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName) {
      setError('Please provide a company name.');
      return;
    }
    if (!formData.vehicleNumber) {
      setError('Please assign a vehicle to this contract.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(formData, contractToEdit?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save corporate contract.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-950 text-amber-400 rounded-md">
              <Buildings size={22} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {contractToEdit ? 'Edit Corporate Contract' : 'New Corporate Vehicle Tie-Up'}
              </h2>
              <p className="text-xs text-slate-500">
                Monthly vehicle deployment, included KM package and extra KM rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-md">
              {error}
            </div>
          )}

          {/* Company Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Company / Client Name <span className="text-rose-500">*</span>
              </label>
              {customers.length > 0 && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>Pick from clients:</span>
                  <ThemedSelect
                    value={formData.companyId || ''}
                    onChange={handleCompanySelect}
                  >
                    <option value="">-- Choose Corporate Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.gstNumber ? `(${c.gstNumber})` : ''}
                      </option>
                    ))}
                  </ThemedSelect>
                </div>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Infosys Limited (Phase 2, Hinjawadi)"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Vehicle & Chauffeur */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Vehicle <span className="text-rose-500">*</span>
              </label>
              <ThemedSelect
                value={formData.vehicleId || ''}
                onChange={handleVehicleSelect}
                required
                className="w-full form-input"
              >
                <option value="">-- Select Fleet Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vehicleNumber})
                  </option>
                ))}
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Chauffeur
              </label>
              <ThemedSelect
                value={formData.driverId || ''}
                onChange={handleDriverSelect}
                className="w-full form-input"
              >
                <option value="">-- Select Dedicated Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </ThemedSelect>
            </div>
          </div>

          {/* Package Pricing & KM Terms */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3 pt-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CurrencyInr size={15} className="text-navy-900" />
              Monthly Package & Excess KM Terms
            </h4>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="flex flex-col justify-end">
                <label className="block text-2xs sm:text-xs font-bold text-slate-600 mb-1 whitespace-nowrap">
                  Monthly Base Fare (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="45000"
                  value={formData.monthlyBaseFare}
                  onChange={(e) => setFormData({ ...formData, monthlyBaseFare: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-2xs sm:text-xs font-bold text-slate-600 mb-1 whitespace-nowrap">
                  Included Monthly KM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="2500"
                  value={formData.includedMonthlyKm}
                  onChange={(e) => setFormData({ ...formData, includedMonthlyKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-2xs sm:text-xs font-bold text-slate-600 mb-1 whitespace-nowrap">
                  Excess Rate (₹/KM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="14"
                  value={formData.extraRatePerKm}
                  onChange={(e) => setFormData({ ...formData, extraRatePerKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Contract Dates & Status */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-2">
            <div className="flex flex-col justify-end">
              <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">Status</label>
              <ThemedSelect
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full form-input"
              >
                <option value="Active">Active Deployment</option>
                <option value="Paused">Paused / Under Maintenance</option>
                <option value="Terminated">Terminated / Expired</option>
              </ThemedSelect>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes & Contract Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 12-hour daily shift, toll/parking billed at actuals, backup vehicle guaranteed within 45 mins..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-5 rounded-md font-bold text-xs"
            >
              {loading ? 'Saving...' : contractToEdit ? 'Save Changes' : 'Activate Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
