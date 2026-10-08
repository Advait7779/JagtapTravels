import React, { useState } from 'react';
import { MagnifyingGlass, PencilSimple, Plus, Printer, Trash } from '@phosphor-icons/react';
import { formatDate, formatINR } from '../../utils/formatters';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import ConfirmModal from '../ConfirmModal';
import CorporateQuotationEditor from './CorporateQuotationEditor';

export default function CorporateQuotationHub({ quotations = [], customers = [], onRefresh, onView, onOpenContracts }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [discarding, setDiscarding] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const filtered = quotations.filter((quote) => {
    const term = search.trim().toLowerCase();
    const matches = !term || [quote.quotationNumber, quote.companyName, quote.contactName, quote.contactPhone]
      .some((value) => String(value || '').toLowerCase().includes(term));
    const converted = Boolean(quote.contractIds?.length);
    return matches && (statusFilter === 'ALL' || (statusFilter === 'Converted' ? converted : !converted));
  });
  const action = async (id, fn, success) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
      await onRefresh();
      toast.success(success);
    } catch (err) {
      setError(err.message || 'Action failed.');
      toast.error('Corporate quotation action failed', { description: err.message });
      throw err;
    } finally {
      setBusyId('');
    }
  };
  const save = async (form) => action(form.id || 'new',
    () => form.id ? api.updateCorporateQuotation(form.id, form) : api.addCorporateQuotation(form),
    form.id ? 'Corporate quotation updated.' : 'Corporate quotation saved.');
  const discard = async () => {
    try {
      await action(discarding.id, () => api.deleteCorporateQuotation(discarding.id), 'Draft quotation discarded.');
      setDiscarding(null);
    } catch { /* Keep the confirmation open to show the error. */ }
  };

  return <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Corporate quotations</p><p className="mt-1 text-2xl font-black text-navy-950">{quotations.length}</p></div>
      <div className="rounded-md border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Open quotations</p><p className="mt-1 text-2xl font-black text-blue-700">{quotations.filter((quote) => !quote.contractIds?.length).length}</p></div>
      <div className="rounded-md border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Converted to contracts</p><p className="mt-1 text-2xl font-black text-emerald-700">{quotations.filter((quote) => quote.contractIds?.length).length}</p></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-1 flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1"><MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search corporate quotations" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, contact or quote #" className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs" /></div>
        <select aria-label="Filter corporate quotation status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs"><option value="ALL">All quotations</option><option value="Open">Open</option><option value="Converted">Converted</option></select>
      </div>
      <button type="button" onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2"><Plus size={17} /> New corporate quotation</button>
    </div>
    {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full min-w-[850px] text-left text-xs">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600"><tr><th className="p-3">Quotation</th><th className="p-3">Company</th><th className="p-3">Proposal</th><th className="p-3">Estimated monthly</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-sm text-slate-500">No corporate quotations found.</td></tr>}
          {filtered.map((quote) => <tr key={quote.id} className="align-top">
            <td className="p-3"><strong className="text-navy-950">{quote.quotationNumber}</strong><p className="text-slate-500">Rev {quote.revision} · {formatDate(quote.quotationDate)}</p></td>
            <td className="p-3"><strong>{quote.companyName}</strong><p className="text-slate-500">{quote.contactPhone}</p></td>
            <td className="p-3">{quote.lineItems.length} vehicle{quote.lineItems.length === 1 ? '' : 's'}<p className="text-slate-500">From {formatDate(quote.proposedStartDate)}</p></td>
            <td className="p-3"><strong>{formatINR(quote.estimatedTotal)}</strong><p className="text-slate-500">Fixed {formatINR(quote.fixedMonthlyTotal)} · {quote.taxMode === 'gst' ? `GST ${quote.gstRate}%` : 'Non-GST'}</p></td>
            <td className="p-3"><span className={`inline-block rounded-md border px-2 py-1 font-bold ${quote.contractIds?.length ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>{quote.contractIds?.length ? 'Converted' : 'Open'}</span>{quote.contractIds?.length > 0 && <p className="mt-1 text-emerald-700">{quote.contractIds.length} contract{quote.contractIds.length === 1 ? '' : 's'}</p>}</td>
            <td className="p-3"><div className="flex max-w-[240px] flex-wrap gap-1.5">
              <button type="button" onClick={() => onView(quote)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 font-bold text-slate-700 hover:bg-slate-50"><Printer size={14} /> View / PDF</button>
              {!quote.contractIds?.length && <button type="button" onClick={() => setEditing(quote)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 font-bold text-slate-700 hover:bg-slate-50"><PencilSimple size={14} /> Edit</button>}
              {quote.contractIds?.length > 0 && <button type="button" onClick={onOpenContracts} className="rounded-md border border-emerald-300 px-2 py-1.5 font-bold text-emerald-800">Open contracts</button>}
              {quote.status === 'Draft' && !(quote.revisions || []).some((revision) => revision.status !== 'Draft') && <button type="button" aria-label={`Discard draft ${quote.quotationNumber}`} onClick={() => setDiscarding(quote)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash size={16} /></button>}
            </div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {(creating || editing) && <CorporateQuotationEditor quotation={editing} customers={customers} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} />}
    <ConfirmModal isOpen={!!discarding} onClose={() => setDiscarding(null)} onConfirm={discard} title="Discard draft quotation" heading="Delete this draft?" message={discarding ? `${discarding.quotationNumber} will be permanently removed. Sent and accepted quotations remain in the CRM.` : ''} confirmText="Discard draft" loading={busyId === discarding?.id} />
  </div>;
}
