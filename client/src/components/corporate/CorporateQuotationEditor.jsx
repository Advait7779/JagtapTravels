import React, { useMemo, useState } from 'react';
import { Buildings, Plus, Trash, X } from '@phosphor-icons/react';
import { formatINR, localDate, roundMoney } from '../../utils/formatters';

const newLine = () => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  vehicleType: '',
  monthlyBaseFare: '',
  includedMonthlyKm: '',
  extraRatePerKm: '',
  estimatedExtraKm: '0',
});

const newForm = () => ({
  companyId: '', companyName: '', companyAddress: '', companyGstin: '',
  contactName: '', contactPhone: '', contactEmail: '',
  proposedStartDate: localDate(15), proposedEndDate: '', validityDate: localDate(30),
  taxMode: 'gst', gstRate: 18, lineItems: [newLine()], estimatedOtherCharges: '0',
  paymentTerms: '', serviceTerms: '', tollParkingTerms: '', notes: '',
});

const fieldClass = 'form-input bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-900';

export default function CorporateQuotationEditor({ quotation, customers = [], onClose, onSave }) {
  const [form, setForm] = useState(() => quotation
    ? { ...quotation, lineItems: quotation.lineItems.map((line) => ({ ...line })) }
    : newForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const totals = useMemo(() => {
    const fixed = roundMoney(form.lineItems.reduce((sum, line) => sum + (Number(line.monthlyBaseFare) || 0), 0));
    const excess = roundMoney(form.lineItems.reduce((sum, line) =>
      sum + (Number(line.estimatedExtraKm) || 0) * (Number(line.extraRatePerKm) || 0), 0));
    const subtotal = roundMoney(fixed + excess + (Number(form.estimatedOtherCharges) || 0));
    const tax = form.taxMode === 'gst' ? roundMoney(subtotal * Number(form.gstRate) / 100) : 0;
    return { fixed, excess, subtotal, tax, total: roundMoney(subtotal + tax) };
  }, [form]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateLine = (id, key, value) => setForm((current) => ({
    ...current,
    lineItems: current.lineItems.map((line) => line.id === id ? { ...line, [key]: value } : line),
  }));
  const selectCompany = (name) => {
    const customer = customers.find((item) => item.name?.trim().toLowerCase() === name.trim().toLowerCase());
    setForm((current) => ({
      ...current,
      companyId: customer?.id || '',
      companyName: name,
      companyAddress: customer?.address || '',
      companyGstin: customer?.gstNumber || '',
      contactPhone: customer?.phone || current.contactPhone,
      contactEmail: customer?.email || '',
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ ...form, validityDate: form.validityDate < localDate(30) ? localDate(30) : form.validityDate });
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to save this corporate quotation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/70 p-3 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]" role="dialog" aria-modal="true" aria-label={quotation ? 'Edit corporate quotation' : 'New corporate quotation'}>
      <div className="mx-auto my-3 max-w-4xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 bg-navy-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-400/15 p-2 text-amber-400"><Buildings size={23} weight="bold" /></div>
            <div>
              <h2 className="text-base font-bold">{quotation ? `Edit ${quotation.quotationNumber}` : 'New Corporate Quotation'}</h2>
              <p className="text-xs text-slate-300">Monthly vehicle package proposal</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close quotation editor" className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-navy-950">Company and contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="form-label">Company name *<input className={fieldClass} required maxLength={200} list="corporate-quotation-companies" value={form.companyName} onChange={(event) => selectCompany(event.target.value)} /></label>
              <datalist id="corporate-quotation-companies">{customers.map((customer) => <option key={customer.id} value={customer.name} />)}</datalist>
              <label className="form-label">Phone *<input className={fieldClass} type="tel" required maxLength={50} value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} /></label>
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-navy-950">Service and tax</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="form-label">Proposed start *<input className={fieldClass} type="date" required value={form.proposedStartDate} onChange={(event) => update('proposedStartDate', event.target.value)} /></label>
              <label className="form-label">Tax treatment
                <select className={fieldClass} value={form.taxMode} onChange={(event) => update('taxMode', event.target.value)}>
                  <option value="gst">GST quotation</option>
                  <option value="nongst">Non-GST quotation</option>
                </select>
              </label>
              {form.taxMode === 'gst' && <label className="form-label">GST rate
                <select className={fieldClass} value={form.gstRate} onChange={(event) => update('gstRate', Number(event.target.value))}>
                  <option value={5}>5%</option><option value={18}>18%</option>
                </select>
              </label>}
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-navy-950">Monthly vehicle offers</h3>
              <button type="button" disabled={form.lineItems.length >= 20} onClick={() => update('lineItems', [...form.lineItems, newLine()])} className="inline-flex items-center gap-1 rounded-md border border-navy-900 px-3 py-2 text-xs font-bold text-navy-950 hover:bg-slate-50"><Plus size={15} /> Add vehicle</button>
            </div>
            <div className="space-y-3">
              {form.lineItems.map((line, index) => (
                <div key={line.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-bold text-slate-700">Vehicle offer {index + 1}</h4><button type="button" aria-label={`Remove vehicle offer ${index + 1}`} disabled={form.lineItems.length === 1} onClick={() => update('lineItems', form.lineItems.filter((item) => item.id !== line.id))} className="text-rose-600 hover:text-rose-800"><Trash size={17} /></button></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="form-label">Vehicle type *<input className={fieldClass} required maxLength={200} placeholder="Innova Crysta" value={line.vehicleType} onChange={(event) => updateLine(line.id, 'vehicleType', event.target.value)} /></label>
                    <label className="form-label">Monthly fixed fare ₹ *<input className={fieldClass} type="number" required min="0.01" step="0.01" value={line.monthlyBaseFare} onChange={(event) => updateLine(line.id, 'monthlyBaseFare', event.target.value)} /></label>
                    <label className="form-label">Included KM/month<input className={fieldClass} type="number" min="0" step="0.01" value={line.includedMonthlyKm} onChange={(event) => updateLine(line.id, 'includedMonthlyKm', event.target.value)} /></label>
                    <label className="form-label">Excess rate ₹/KM<input className={fieldClass} type="number" min="0" step="0.01" value={line.extraRatePerKm} onChange={(event) => updateLine(line.id, 'extraRatePerKm', event.target.value)} /></label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-md bg-navy-950 p-4 text-white">
            <div className="grid gap-2 text-xs sm:grid-cols-3">
              <div>Monthly package <strong className="block text-sm">{formatINR(totals.subtotal)}</strong></div>
              <div>{form.taxMode === 'gst' ? `GST ${form.gstRate}%` : 'No GST'}<strong className="block text-sm">{formatINR(totals.tax)}</strong></div>
              <div className="text-amber-300">Monthly total<strong className="block text-lg">{formatINR(totals.total)}</strong></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : quotation ? 'Save changes' : 'Save quotation'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
