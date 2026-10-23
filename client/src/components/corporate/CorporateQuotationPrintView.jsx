import React, { useState } from 'react';
import { FilePdf, Printer, X } from '@phosphor-icons/react';
import { formatDate, formatINR } from '../../utils/formatters';
import CorporateQuotationStamp, { corporateQuotationStampUrl } from './CorporateQuotationStamp';

export default function CorporateQuotationPrintView({ quotation, onClose, settings = {} }) {
  const [downloading, setDownloading] = useState(false);
  const cleanCompanyName = (name) => {
    if (!name) return 'Jagtap Travels';
    if (/jagtap\s+tours(\s+and|\s+&)?\s+travels/i.test(name.trim())) {
      return 'Jagtap Travels';
    }
    return name.trim();
  };
  const quote = quotation;
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
        filename: `Corporate-Quotation-${quote.quotationNumber}.pdf`,
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
    <div className="print-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Corporate quotation preview">
      <div className="print-shell mx-auto my-2 max-w-4xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="no-print flex flex-wrap items-center justify-end gap-3 bg-[#E2CCAC] p-4 text-[#3F2B1D]">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-[#AE885E] px-3 py-2 text-xs font-bold hover:bg-[#D3B58E]"><Printer size={16} /> Print</button>
            <button type="button" disabled={downloading} onClick={savePdf} className="inline-flex items-center gap-1 rounded-md bg-[#D4A870] px-3 py-2 text-xs font-bold text-[#3F2B1D] hover:bg-[#C8955C]"><FilePdf size={16} /> {downloading ? 'Preparing…' : 'Save PDF'}</button>
            <button type="button" onClick={onClose} aria-label="Close quotation preview" className="rounded-md border border-[#AE885E] p-2 hover:bg-[#D3B58E]"><X size={18} /></button>
          </div>
        </div>

        <article className="printable-area corporate-quotation-printable bg-white p-6 text-[#372A20] sm:p-10 font-['Plus_Jakarta_Sans',sans-serif]">
          <header className="flex items-start justify-between gap-5 border-b-2 border-[#AE885E] pb-5" style={{ borderBottom: '2px solid #AE885E' }}>
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase text-[#794416]">{company.companyName || 'Jagtap Travels'}</h1>
              {company.address && <p className="max-w-md text-xs text-[#594838]">{company.address}</p>}
              <p className="text-xs text-[#594838]">{company.phone || company.contact || ''} {company.email ? `· ${company.email}` : ''}</p>
              <a className="block text-xs text-[#794416] hover:underline" href="https://jagtaptravels.com/" target="_blank" rel="noreferrer">Website - jagtaptravels.com</a>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <img src="/jagtap-brand-logo.png" alt="Jagtap Travels" className="h-20 w-auto object-contain sm:h-24" />
              <p className="text-xs font-semibold text-[#4C3725]">Date: {formatDate(quote.quotationDate || quote.createdAt)}</p>
            </div>
          </header>

          <div className="pt-10 pb-4 text-xs">
            <p className="text-base font-black uppercase text-[#794416] tracking-wide">{quote.companyName}</p>
          </div>

          <div className="mt-16 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#D4B992] text-[#3F2B1D]">
                  <th className="p-2 font-bold bg-[#D4B992] text-[#3F2B1D]" style={{ backgroundColor: '#D4B992', color: '#3F2B1D' }}>Type of Vehicle</th>
                  <th className="p-2 text-center font-bold bg-[#D4B992] text-[#3F2B1D]" style={{ backgroundColor: '#D4B992', color: '#3F2B1D' }}>Days</th>
                  <th className="p-2 text-center font-bold bg-[#D4B992] text-[#3F2B1D]" style={{ backgroundColor: '#D4B992', color: '#3F2B1D' }}>Per Day Package km</th>
                  <th className="p-2 text-right font-bold bg-[#D4B992] text-[#3F2B1D]" style={{ backgroundColor: '#D4B992', color: '#3F2B1D' }}>Per Day Package Amount</th>
                  <th className="p-2 text-right font-bold bg-[#D4B992] text-[#3F2B1D]" style={{ backgroundColor: '#D4B992', color: '#3F2B1D' }}>Extra km Rate</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((line) => (
                  <tr key={line.id} className="border-b border-[#C29F75]">
                    <td className="p-2 font-bold border-b border-[#C29F75]" style={{ borderBottom: '1px solid #C29F75' }}>{line.vehicleType}</td>
                    <td className="p-2 text-center font-medium border-b border-[#C29F75]" style={{ borderBottom: '1px solid #C29F75' }}>{line.packageDays || '—'}</td>
                    <td className="p-2 text-center font-medium border-b border-[#C29F75]" style={{ borderBottom: '1px solid #C29F75' }}>{dailyPricing ? line.includedDailyKm : line.includedMonthlyKm}</td>
                    <td className="p-2 text-right font-semibold border-b border-[#C29F75]" style={{ borderBottom: '1px solid #C29F75' }}>{formatINR(dailyPricing ? line.dailyBaseFare : line.monthlyBaseFare)}</td>
                    <td className="p-2 text-right font-semibold border-b border-[#C29F75]" style={{ borderBottom: '1px solid #C29F75' }}>{formatINR(line.extraRatePerKm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 ml-auto w-full max-w-sm border border-[#AE885E] text-xs" style={{ border: '1px solid #AE885E' }}>
            <div className="flex justify-between border-b border-[#C29F75] p-2" style={{ borderBottom: '1px solid #C29F75' }}><span>{dailyPricing ? '1day charges' : 'Package charges'}</span><strong>{formatINR(dailyPricing ? quote.fixedDailyTotal : quote.fixedMonthlyTotal)}</strong></div>
            {Number(quote.estimatedExcessTotal) > 0 && <div className="flex justify-between border-b border-[#C29F75] p-2" style={{ borderBottom: '1px solid #C29F75' }}><span>Estimated excess KM</span><strong>{formatINR(quote.estimatedExcessTotal)}</strong></div>}
            {Number(quote.estimatedOtherCharges) > 0 && <div className="flex justify-between border-b border-[#C29F75] p-2" style={{ borderBottom: '1px solid #C29F75' }}><span>Estimated other charges</span><strong>{formatINR(quote.estimatedOtherCharges)}</strong></div>}
            {(Number(quote.estimatedExcessTotal) > 0 || Number(quote.estimatedOtherCharges) > 0) && <div className="flex justify-between border-b border-[#C29F75] p-2" style={{ borderBottom: '1px solid #C29F75' }}><span>Subtotal</span><strong>{formatINR(quote.estimatedSubtotal)}</strong></div>}
            <div className="flex justify-between border-b border-[#C29F75] p-2" style={{ borderBottom: '1px solid #C29F75' }}><span>{quote.taxMode === 'gst' ? `GST (${quote.gstRate}%)` : 'Non-GST'}</span><strong>{formatINR(quote.estimatedTax)}</strong></div>
            <div className="flex justify-between bg-[#CCA474] p-2 text-sm font-black text-[#3F2B1D]" style={{ backgroundColor: '#CCA474', color: '#3F2B1D' }}><span>TOTAL AMOUNT</span><span>{formatINR(quote.estimatedTotal)}</span></div>
          </div>
          <ul className="mt-28 list-disc space-y-1.5 pl-5 text-xs text-[#594838] font-medium">
            <li>KM calculated from Hadapsar to Hadapsar.</li>
            <li>Toll, parking and RTO permit charges extra.</li>
          </ul>
          <div className="mt-20 ml-auto flex w-full max-w-sm justify-end">
            <div className="relative h-32 w-48">
              <p className="absolute top-4 left-0 text-sm font-bold text-[#794416]">Thanks,</p>
              <p className="absolute bottom-5 left-0 text-sm font-bold uppercase text-[#794416]">Jagtap Travels</p>
              {corporateQuotationStampUrl(settings.corporateQuotationStampUrl) && (
                <div className="absolute inset-y-0 right-0">
                  <CorporateQuotationStamp url={settings.corporateQuotationStampUrl} />
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
