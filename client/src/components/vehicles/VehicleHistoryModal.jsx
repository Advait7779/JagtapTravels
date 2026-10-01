import React, { useState } from 'react';
import { X, History, Wrench, Gauge, Calendar, Building, IndianRupee, Plus } from 'lucide-react';
import { formatDate, formatINR } from '../../utils/formatters';

export default function VehicleHistoryModal({
  isOpen,
  onClose,
  vehicle = null,
  onOpenDailyKm,
  onOpenServiceRecord,
}) {
  const [activeTab, setActiveTab] = useState('kmLogs'); // 'kmLogs' | 'services'

  if (!isOpen || !vehicle) return null;

  const logs = vehicle.kmLogs || [];
  const services = vehicle.serviceHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                  {vehicle.vehicleNumber}
                </h3>
                <span className="text-xs text-slate-300 font-medium">
                  {vehicle.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Current Odometer:{' '}
                <strong className="font-mono text-white">
                  {Number(vehicle.currentOdometer || 0).toLocaleString('en-IN')} KM
                </strong>{' '}
                • Interval: {Number(vehicle.serviceIntervalKm || 30000).toLocaleString('en-IN')} KM
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

        {/* Tab Selection & Actions Bar */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('kmLogs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'kmLogs'
                  ? 'bg-navy-950 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Daily KM Logs ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-navy-950 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service Records ({services.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                onOpenDailyKm(vehicle);
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Daily KM</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenServiceRecord(vehicle);
              }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>+ Record Service</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'kmLogs' ? (
            logs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <Gauge className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                <p className="font-semibold text-slate-600">No daily KM logs recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "+ Daily KM" to add daily distance for this vehicle
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {logs.map((l, i) => (
                  <div
                    key={l.id || i}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{formatDate(l.date)}</p>
                          {l.driverName && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              • Driver: {l.driverName}
                            </span>
                          )}
                        </div>
                        {l.notes && <p className="text-[11px] text-slate-600 mt-0.5">{l.notes}</p>}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200">
                      <p className="font-mono font-extrabold text-amber-600 text-sm">
                        +{Number(l.dailyKm || 0).toLocaleString('en-IN')} KM
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Odometer: {Number(l.odometerReading || 0).toLocaleString('en-IN')} KM
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : services.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="font-semibold text-slate-600">No maintenance records logged yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When this vehicle reaches its{' '}
                {Number(vehicle.serviceIntervalKm || 30000).toLocaleString('en-IN')} KM interval,
                click "+ Record Service"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((s, i) => (
                <div
                  key={s.id || i}
                  className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-md space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-slate-900">{formatDate(s.serviceDate)}</span>
                      {s.garageName && (
                        <span className="text-emerald-800 font-medium">• {s.garageName}</span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-navy-950 text-sm">
                      {formatINR(s.cost || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>
                      Odometer at Servicing:{' '}
                      <strong className="font-mono text-slate-900">
                        {Number(s.serviceOdometer || 0).toLocaleString('en-IN')} KM
                      </strong>
                    </span>
                    <span className="text-emerald-700 font-semibold">✓ Service cycle reset</span>
                  </div>

                  {s.notes && (
                    <p className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-emerald-100 italic">
                      "{s.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
