import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { formatDate, formatINR, localDate } from '../../utils/formatters';
import ThemedDatePicker from '../ThemedDatePicker';

export default function CorporateInvoicePaymentModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: '',
    date: localDate(),
    requestId: crypto.randomUUID(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const totalCents = Math.round(Number(invoice.grandTotal ?? invoice.totalAmount ?? 0) * 100);
  const paidCents = payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount || 0) * 100), 0);
  const balance = Math.max(0, totalCents - paidCents) / 100;
  const tdsAmount = Math.round(Math.round(Number(form.amount || 0) * 100) * 0.01) / 100;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(invoice.id, form);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to record payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/65 p-3 sm:p-5" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <div className="w-full max-w-lg rounded-md bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={`Payments for corporate invoice ${invoice.invoiceNo}`}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment record · {invoice.invoiceNo}</h2>
            <p className="mt-1 text-xs text-slate-600">Outstanding: <strong>{formatINR(balance)}</strong></p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close payment record" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          {payments.length > 0 && (
            <section aria-label="Recorded payments" className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700">Recorded payments</h3>
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-600">{formatDate(payment.date)}</span>
                  <span className="text-right font-semibold text-slate-900">
                    {formatINR(payment.amount)}
                    <span className="block font-normal text-slate-600">TDS deducted: {formatINR(payment.tdsAmount)}</span>
                  </span>
                </div>
              ))}
            </section>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p role="alert" className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
              <label className="form-label">Payment amount before TDS
                <input type="number" className="form-input" required min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              </label>
              <label className="form-label">Payment date
                <ThemedDatePicker className="form-input" containerClassName="w-full" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </label>
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">TDS deducted (1%): {formatINR(tdsAmount)}</p>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} disabled={saving} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-navy-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save payment'}</button>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
}
