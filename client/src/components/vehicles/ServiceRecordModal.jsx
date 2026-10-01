import React, { useState, useEffect } from 'react';
import { X, Wrench, Calendar, Building, IndianRupee, FileText, CheckCircle2 } from 'lucide-react';
import { localDate, formatINR } from '../../utils/formatters';

export default function ServiceRecordModal({ isOpen, onClose, onSave, vehicle = null }) {
  const [serviceDate, setServiceDate] = useState(localDate());
  const [serviceOdometer, setServiceOdometer] = useState('');
  const [garageName, setGarageName] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setServiceOdometer(vehicle.currentOdometer || '');
      setGarageName('');
      setCost('');
      setNotes(
        `Periodic ${Number(vehicle.serviceIntervalKm || 30000).toLocaleString(
          'en-IN',
        )} KM maintenance: engine oil, filters and brake inspection.`,
      );
      setServiceDate(localDate());
      setError('');
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const odoNum = Number(serviceOdometer) || Number(vehicle.currentOdometer || 0);
  const nextTarget = odoNum + Number(vehicle.serviceIntervalKm || 30000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (odoNum <= 0) {
      setError('Please enter a valid service odometer reading.');
      return;
    }

    setSaving(true);
    try {
      await onSave(vehicle.id, {
        serviceDate,
        serviceOdometer: odoNum,
        garageName,
        cost: Number(cost) || 0,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record vehicle maintenance.');
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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Record Vehicle Servicing</h3>
              <p className="text-[11px] text-slate-300">
                Mark maintenance done and reset this vehicle's service cycle
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

          {/* Vehicle Snapshot Header */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
            <div>
              <p className="font-extrabold text-navy-950 text-sm">{vehicle.name}</p>
              <p className="text-slate-500 font-medium">
                Assigned:{' '}
                <strong className="text-slate-700">{vehicle.driverName || 'Fleet Shared'}</strong>
              </p>
            </div>
            <span className="px-2.5 py-1 bg-navy-950 text-white font-mono font-bold text-xs rounded-lg">
              {vehicle.vehicleNumber}
            </span>
          </div>

          {/* Date & Service Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Service Date <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Odometer at Service <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 30000"
                value={serviceOdometer}
                onChange={(e) => setServiceOdometer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          {/* Garage & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>Garage / Workshop</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sai Service Centre, Wakad"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                <span>Total Cost (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 4500"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          {/* Maintenance Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Work Done & Checklist Remarks</span>
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Engine oil replaced (5W-30), oil filter, air filter, brake pads check, wheel alignment."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          {/* Next Milestone Summary Callout */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-md text-xs text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Next Service Scheduled at {nextTarget.toLocaleString('en-IN')} KM
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Submitting clears the alert and restarts the{' '}
                {Number(vehicle.serviceIntervalKm || 30000).toLocaleString('en-IN')} KM tracking
                cycle.
              </p>
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
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-md shadow-md transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>{saving ? 'Recording...' : 'Mark Serviced & Reset Cycle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
