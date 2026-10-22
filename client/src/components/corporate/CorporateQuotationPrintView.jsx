import React, { useState } from 'react';
import { FilePdf, Printer, X } from '@phosphor-icons/react';
import { formatDate, formatINR } from '../../utils/formatters';

export default function CorporateQuotationPrintView({ quotation, onClose, settings = {} }) {
  const [revisionIndex, setRevisionIndex] = useState(-1);
  const [downloading, setDownloading] = useState(false);
  const cleanCompanyName = (name) => {
    if (!name) return 'Jagtap Travels';
    if (/jagtap\s+tours(\s+and|\s+&)?\s+travels/i.test(name.trim())) {
      return 'Jagtap Travels';
    }
    return name.trim();
  };
  const quote = revisionIndex < 0 ? quotation : quotation.revisions[revisionIndex];
  const dailyPricing = quote.pricingBasis === 'daily';
  const rawCompanyName = (quote?.company && quote.company.companyName) || settings.companyName || 'Jagtap Travels';
  const company = { ...settings, ...(quote?.company || {}), companyName: cleanCompanyName(rawCompanyName) };

  const savePdf = async () => {
    const element = document.querySelector('.corporate-quotation-printable');
    if (!element) return;
    setDownloading(true);
    try {
      const module = await import('html2pdf.js');
      const html2pdf = module.default || module;
      await html2pdf().set({
        margin: [8, 8, 8, 8],
        filename: `Corporate-Quotation-${quote.quotationNumber}-Rev-${quote.revision}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(element).save();
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="print-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Corporate quotation preview">
      <div className="print-shell mx-auto my-2 max-w-4xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="no-print flex flex-wrap items-center justify-end gap-3 bg-navy-950 p-4 text-white">
          <div className="flex flex-wrap items-center gap-2">
            {quotation.revisions?.length > 0 && <select aria-label="Quotation revision" value={revisionIndex} onChange={(event) => setRevisionIndex(Number(event.target.value))} className="rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-xs text-white">
              <option value={-1}>Current revision {quotation.revision}</option>
              {quotation.revisions.map((revision, index) => <option key={index} value={index}>Revision {revision.revision} · {formatDate(revision.quotationDate)}</option>)}
            </select>}
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-3 py-2 text-xs font-bold hover:bg-slate-800"><Printer size={16} /> Print</button>
            <button type="button" disabled={downloading} onClick={savePdf} className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-2 text-xs font-bold text-navy-950 hover:bg-amber-400"><FilePdf size={16} /> {downloading ? 'Preparing…' : 'Save PDF'}</button>
            <button type="button" onClick={onClose} aria-label="Close quotation preview" className="rounded-md border border-slate-600 p-2 hover:bg-slate-800"><X size={18} /></button>
          </div>
        </div>

        <article className="printable-area corporate-quotation-printable bg-white p-6 text-slate-900 sm:p-10">
          <header className="flex items-start justify-between gap-5 border-b-2 border-navy-950 pb-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase text-navy-950">{company.companyName || 'Jagtap Travels'}</h1>
              {company.address && <p className="max-w-md text-xs text-slate-600">{company.address}</p>}
              <p className="text-xs text-slate-600">{company.phone || company.contact || ''} {company.email ? `· ${company.email}` : ''}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <img src="/jagtap-brand-logo.png" alt="Jagtap Travels" className="h-20 w-auto object-contain sm:h-24" />
              <p className="text-xs font-semibold text-slate-700">Date: {formatDate(quote.quotationDate || quote.createdAt)}</p>
            </div>
          </header>

          <div className="border-b border-slate-300 py-5 text-xs">
            <p className="text-base font-extrabold">{quote.companyName}</p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-navy-950 text-white">
                  <th className="p-2">Type of Vehicle</th>
                  <th className="p-2 text-center">Days</th>
                  <th className="p-2 text-center">Per Day Package km</th>
                  <th className="p-2 text-right">Per Day Package Amount</th>
                  <th className="p-2 text-right">Extra km Rate</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((line) => (
                  <tr key={line.id} className="border-b border-slate-300">
                    <td className="p-2 font-bold">{line.vehicleType}</td>
                    <td className="p-2 text-center">{line.packageDays || '—'}</td>
                    <td className="p-2 text-center">{dailyPricing ? line.includedDailyKm : line.includedMonthlyKm}</td>
                    <td className="p-2 text-right">{formatINR(dailyPricing ? line.dailyBaseFare : line.monthlyBaseFare)}</td>
                    <td className="p-2 text-right">{formatINR(line.extraRatePerKm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 ml-auto w-full max-w-sm border border-slate-400 text-xs">
            <div className="flex justify-between border-b border-slate-300 p-2"><span>{dailyPricing ? '1day charges' : 'Package charges'}</span><strong>{formatINR(dailyPricing ? quote.fixedDailyTotal : quote.fixedMonthlyTotal)}</strong></div>
            {Number(quote.estimatedExcessTotal) > 0 && <div className="flex justify-between border-b border-slate-300 p-2"><span>Estimated excess KM</span><strong>{formatINR(quote.estimatedExcessTotal)}</strong></div>}
            {Number(quote.estimatedOtherCharges) > 0 && <div className="flex justify-between border-b border-slate-300 p-2"><span>Estimated other charges</span><strong>{formatINR(quote.estimatedOtherCharges)}</strong></div>}
            {(Number(quote.estimatedExcessTotal) > 0 || Number(quote.estimatedOtherCharges) > 0) && <div className="flex justify-between border-b border-slate-300 p-2"><span>Subtotal</span><strong>{formatINR(quote.estimatedSubtotal)}</strong></div>}
            <div className="flex justify-between border-b border-slate-300 p-2"><span>{quote.taxMode === 'gst' ? `GST (${quote.gstRate}%)` : 'Non-GST'}</span><strong>{formatINR(quote.estimatedTax)}</strong></div>
            <div className="flex justify-between bg-navy-950 p-2 text-sm font-black text-white"><span>TOTAL AMOUNT</span><span>{formatINR(quote.estimatedTotal)}</span></div>
          </div>
          <ul className="mt-6 list-disc space-y-1 border-t border-slate-300 pt-4 pl-5 text-xs text-slate-700">
            <li>KM calculated from Hadapsar to Hadapsar.</li>
            <li>Toll, parking and RTO permit charges extra.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
