import React, { useState, useEffect } from 'react';
import { X, Gauge, Calendar, AlertTriangle, User, FileText, CheckCircle } from 'lucide-react';
import { localDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';

export default function DailyKmModal({
  isOpen,
  onClose,
  onSave,
  vehicles = [],
  preselectedVehicle = null,
}) {
  const [selectedId, setSelectedId] = useState('');
  const [date, setDate] = useState(localDate());
  const [dailyKm, setDailyKm] = useState('');
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preselectedVehicle) {
      setSelectedId(preselectedVehicle.id);
      setDriverName(preselectedVehicle.driverName || '');
    } else if (vehicles.length > 0 && !selectedId) {
      setSelectedId(vehicles[0].id);
      setDriverName(vehicles[0].driverName || '');
    }
    setDate(localDate());
    setDailyKm('');
    setNotes('');
    setError('');
  }, [isOpen, preselectedVehicle, vehicles]);

  if (!isOpen) return null;

  const vehicle =
    vehicles.find((v) => String(v.id) === String(selectedId)) || preselectedVehicle || vehicles[0];
  const kmNum = Number(dailyKm) || 0;
  const currentOdo = Number(vehicle?.currentOdometer || 0);
  const newOdometer = currentOdo + kmNum;
  const lastService = Number(vehicle?.lastServiceKm || 0);
  const interval = Number(vehicle?.serviceIntervalKm || 30000);
  const targetKm = lastService + interval;
  const remaining = targetKm - newOdometer;
  const willBeDue = remaining <= 0;

  const handleVehicleChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const found = vehicles.find((v) => String(v.id) === String(id));
    if (found) setDriverName(found.driverName || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vehicle) {
      setError('Please select a vehicle.');
      return;
    }
    if (kmNum <= 0) {
      setError('Daily KM driven must be greater than 0.');
      return;
    }

    setSaving(true);
    try {
      await onSave(vehicle.id, {
        date,
        dailyKm: kmNum,
        driverName,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save daily KM log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Log Daily Vehicle KM</h3>
              <p className="text-[11px] text-slate-300">
                Update mileage towards this vehicle's {interval.toLocaleString('en-IN')} KM
                milestone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Fleet Vehicle <span className="text-rose-500">*</span>
            </label>
            <ThemedSelect
              value={selectedId}
              onChange={handleVehicleChange}
              className="w-full form-input"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} • {v.vehicleNumber} (
                  {Number(v.currentOdometer || 0).toLocaleString('en-IN')} KM)
                </option>
              ))}
            </ThemedSelect>
          </div>

          {/* Date & Daily KM Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Date Logged <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Daily KM Run <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 180"
                value={dailyKm}
                onChange={(e) => setDailyKm(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          {/* Live Milestone Impact Card */}
          {vehicle && (
            <div
              className={`p-3.5 rounded-md border transition-all text-xs ${
                willBeDue && kmNum > 0
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-semibold">
                <span>Current Odometer:</span>
                <span className="font-mono text-slate-900">
                  {currentOdo.toLocaleString('en-IN')} KM
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60 font-semibold">
                <span>Adding Today:</span>
                <span className="font-mono font-bold text-amber-600">
                  +{kmNum.toLocaleString('en-IN')} KM
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold">
                <span>New Total Odometer:</span>
                <span className="font-mono text-sm text-navy-950">
                  {newOdometer.toLocaleString('en-IN')} KM
                </span>
              </div>

              {kmNum > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200/60">
                  {willBeDue ? (
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        🚨 Warning: This addition reaches/exceeds the{' '}
                        {interval.toLocaleString('en-IN')} KM interval. Servicing will be due.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{remaining.toLocaleString('en-IN')} KM remaining</strong> until the
                        next {interval.toLocaleString('en-IN')} KM service.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Driver & Trip Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Driver (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Driver who drove today"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Trip Route / Notes (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Pune - Lonavala roundtrip"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-md shadow-md transition-all flex items-center gap-2"
            >
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>{saving ? 'Saving...' : 'Save Daily KM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
