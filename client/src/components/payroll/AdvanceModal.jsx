import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  User,
  Calendar,
  CurrencyInr,
  CreditCard,
  FileText,
  Warning,
  CheckCircle,
} from '@phosphor-icons/react';
import { formatINR, localDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import ThemedMonthPicker from '../ThemedMonthPicker';
import ThemedDatePicker from '../ThemedDatePicker';

export default function AdvanceModal({
  isOpen,
  onClose,
  onSave,
  driver = null,
  drivers = [],
  currentMonth = localDate().slice(0, 7),
  payrollData = [],
}) {
  const [formData, setFormData] = useState({
    driverId: '',
    driverName: '',
    date: localDate(),
    month: currentMonth,
    amount: '',
    paymentMode: 'Cash',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (driver) {
      setFormData({
        driverId: driver.driverId || driver.id || '',
        driverName: driver.driverName || driver.name || '',
        date: localDate(),
        month: currentMonth,
        amount: '',
        paymentMode: 'Cash',
        notes: '',
      });
    } else {
      const defaultDriver = drivers[0] || null;
      setFormData({
        driverId: defaultDriver?.id || '',
        driverName: defaultDriver?.name || '',
        date: localDate(),
        month: currentMonth,
        amount: '',
        paymentMode: 'Cash',
        notes: '',
      });
    }
    setError('');
  }, [driver, drivers, currentMonth, isOpen]);

  if (!isOpen) return null;

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

  // Find payroll details for this driver to show live calculation
  const currentDriverPayroll = payrollData.find(
    (p) => String(p.driverId) === String(formData.driverId) || p.driverName === formData.driverName,
  );
  const baseSalary = currentDriverPayroll ? currentDriverPayroll.baseSalary : 20000;
  const currentAdvances = currentDriverPayroll ? currentDriverPayroll.totalAdvances : 0;
  const enteredAmount = Number(formData.amount) || 0;
  const newTotalAdvances = currentAdvances + enteredAmount;
  const newRemainingSalary = Math.max(0, baseSalary - newTotalAdvances);
  const isOverAdvancing = newTotalAdvances > baseSalary;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.driverName) {
      setError('Please select a driver.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid advance amount.');
      return;
    }
    if (isOverAdvancing) {
      setError('This advance would exceed the driver base salary for the selected month.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        ...formData,
        amount: Number(formData.amount),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record driver advance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-md shadow-xs">
              <Coins size={24} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Record Driver Salary Advance
              </h2>
              <p className="text-xs text-slate-300">
                Disburse mid-month advance and automatically deduct from net monthly salary.
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

          {/* Driver & Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-navy-900" /> Driver <span className="text-rose-500">*</span>
              </label>
              <ThemedSelect
                value={formData.driverId || formData.driverName}
                onChange={handleDriverSelect}
                className="w-full form-input"
                required
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-navy-900" /> Salary Month <span className="text-rose-500">*</span>
              </label>
              <ThemedMonthPicker
                value={formData.month}
                onChange={(e) => setFormData((p) => ({ ...p, month: e.target.value }))}
                className="w-full py-2 bg-slate-50 border border-slate-200"
                containerClassName="w-full"
                required
              />
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CurrencyInr size={14} className="text-navy-900" /> Advance Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 10000"
                value={formData.amount}
                onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-sm font-black text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-navy-900" /> Disbursement Date <span className="text-rose-500">*</span>
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

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CreditCard size={14} className="text-navy-900" /> Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, paymentMode: mode }))}
                  className={`py-2 text-xs font-bold rounded-md border transition-all truncate ${
                    formData.paymentMode === mode
                      ? 'bg-navy-950 text-amber-400 border-navy-950 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Salary Impact Preview */}
          <div className="p-3.5 bg-slate-50/80 rounded-md border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Salary Calculation Preview for {formData.month}:
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Driver Base Monthly Salary:</span>
              <span className="font-bold text-slate-900">{formatINR(baseSalary)}</span>
            </div>
            <div className="flex justify-between text-amber-800">
              <span>Previous Advances Taken This Month:</span>
              <span className="font-bold">{formatINR(currentAdvances)}</span>
            </div>
            <div className="flex justify-between text-amber-900 font-bold border-t border-slate-200 pt-1">
              <span>This Advance:</span>
              <span>- {formatINR(enteredAmount)}</span>
            </div>
            <div className="flex justify-between text-navy-950 font-black text-sm border-t border-slate-300 pt-1.5">
              <span>Remaining Balance Payable:</span>
              <span className={isOverAdvancing ? 'text-rose-600' : 'text-emerald-700'}>
                {formatINR(newRemainingSalary)}
              </span>
            </div>

            {isOverAdvancing && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-1.5 text-[11px] font-semibold">
                <Warning size={14} weight="bold" />
                <span>Notice: Total advances ({formatINR(newTotalAdvances)}) exceed base monthly salary!</span>
              </div>
            )}
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-navy-900" /> Reason / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Festival advance, emergency medical aid, family function"
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
              disabled={loading || isOverAdvancing}
              className="btn-primary py-2 px-5 rounded-md font-bold text-xs flex items-center gap-2 shadow-xs"
            >
              <Coins size={16} weight="bold" />
              <span>{loading ? 'Recording...' : 'Disburse Advance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
