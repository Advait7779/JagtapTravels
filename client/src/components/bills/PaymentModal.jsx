import React, { useState } from 'react';
import { formatINR, localDate } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';
import ThemedDatePicker from '../ThemedDatePicker';
export default function PaymentModal({ bill, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: bill.balanceDue,
    date: localDate(),
    mode: 'Cash',
    reference: '',
    requestId: crypto.randomUUID(),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto p-2 sm:p-4 grid place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Record payment"
    >
      <form
        className="bg-white rounded-md sm:rounded-md p-4 sm:p-6 w-full max-w-lg space-y-4 my-auto shadow-2xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await onSave(bill.id, form);
            onClose();
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-bold text-lg">Record payment · {bill.billNumber}</h2>
        <p className="text-sm">
          Balance due: <strong>{formatINR(bill.balanceDue)}</strong>
        </p>
        {error && (
          <p role="alert" className="text-rose-700 text-sm">
            {error}
          </p>
        )}
        <label className="form-label">
          Amount received
          <input
            className="form-input"
            type="number"
            required
            min="0"
            max={bill.balanceDue}
            step="any"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <label className="form-label">
          Payment date
          <ThemedDatePicker
            className="form-input"
            containerClassName="w-full"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="form-label">
          Payment mode
          <ThemedSelect
            className="form-input"
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value })}
          >
            {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </ThemedSelect>
        </label>
        <label className="form-label">
          Reference / receipt
          <input
            className="form-input"
            maxLength={200}
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </label>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-center border border-slate-200 sm:border-transparent"
          >
            Cancel
          </button>
          <button className="btn-primary w-full sm:w-auto text-center justify-center" disabled={busy}>
            {busy ? 'Saving…' : 'Save payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
