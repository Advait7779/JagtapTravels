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
    <div className="print-overlay fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Corporate quotation preview">
      <div className="print-shell mx-auto my-2 max-w-4xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="no-print flex flex-wrap items-center justify-end gap-3 bg-[#FFF1E6] p-4 text-[#7C2D12]">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-[#FB923C] px-3 py-2 text-xs font-bold hover:bg-[#FFEDD5]"><Printer size={16} /> Print</button>
            <button type="button" disabled={downloading} onClick={savePdf} className="inline-flex items-center gap-1 rounded-md bg-[#FB923C] px-3 py-2 text-xs font-bold text-[#431407] hover:bg-[#F97316]"><FilePdf size={16} /> {downloading ? 'Preparing…' : 'Save PDF'}</button>
            <button type="button" onClick={onClose} aria-label="Close quotation preview" className="rounded-md border border-[#FB923C] p-2 hover:bg-[#FFEDD5]"><X size={18} /></button>
          </div>
        </div>

        <article className="printable-area corporate-quotation-printable bg-white p-6 text-[#431407] sm:p-10">
          <header className="flex items-start justify-between gap-5 border-b-2 border-[#F97316] pb-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase text-[#C2410C]">{company.companyName || 'Jagtap Travels'}</h1>
              {company.address && <p className="max-w-md text-xs text-[#7C4A32]">{company.address}</p>}
              <p className="text-xs text-[#7C4A32]">{company.phone || company.contact || ''} {company.email ? `· ${company.email}` : ''}</p>
              <a className="block text-xs text-[#C2410C]" href="https://jagtaptravels.com/" target="_blank" rel="noreferrer">jagtaptravels.com</a>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <img src="/jagtap-brand-logo.png" alt="Jagtap Travels" className="h-20 w-auto object-contain sm:h-24" />
              <p className="text-xs font-semibold text-[#7C4A32]">Date: {formatDate(quote.quotationDate || quote.createdAt)}</p>
            </div>
          </header>

          <div className="py-5 text-xs">
            <p className="text-base font-bold text-[#7C2D12]">{quote.companyName}</p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#FED7AA] text-[#7C2D12]">
                  <th className="p-2">Type of Vehicle</th>
                  <th className="p-2 text-center">Days</th>
                  <th className="p-2 text-center">Per Day Package km</th>
                  <th className="p-2 text-right">Per Day Package Amount</th>
                  <th className="p-2 text-right">Extra km Rate</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((line) => (
                  <tr key={line.id} className="border-b border-[#FDBA74]">
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
          <div className="mt-8 ml-auto w-full max-w-sm border border-[#FB923C] text-xs">
            <div className="flex justify-between border-b border-[#FDBA74] p-2"><span>{dailyPricing ? '1day charges' : 'Package charges'}</span><strong>{formatINR(dailyPricing ? quote.fixedDailyTotal : quote.fixedMonthlyTotal)}</strong></div>
            {Number(quote.estimatedExcessTotal) > 0 && <div className="flex justify-between border-b border-[#FDBA74] p-2"><span>Estimated excess KM</span><strong>{formatINR(quote.estimatedExcessTotal)}</strong></div>}
            {Number(quote.estimatedOtherCharges) > 0 && <div className="flex justify-between border-b border-[#FDBA74] p-2"><span>Estimated other charges</span><strong>{formatINR(quote.estimatedOtherCharges)}</strong></div>}
            {(Number(quote.estimatedExcessTotal) > 0 || Number(quote.estimatedOtherCharges) > 0) && <div className="flex justify-between border-b border-[#FDBA74] p-2"><span>Subtotal</span><strong>{formatINR(quote.estimatedSubtotal)}</strong></div>}
            <div className="flex justify-between border-b border-[#FDBA74] p-2"><span>{quote.taxMode === 'gst' ? `GST (${quote.gstRate}%)` : 'Non-GST'}</span><strong>{formatINR(quote.estimatedTax)}</strong></div>
            <div className="flex justify-between bg-[#FDBA74] p-2 text-sm font-black text-[#431407]"><span>TOTAL AMOUNT</span><span>{formatINR(quote.estimatedTotal)}</span></div>
          </div>
          <ul className="mt-6 list-disc space-y-1 pl-5 text-xs text-[#7C4A32]">
            <li>KM calculated from Hadapsar to Hadapsar.</li>
            <li>Toll, parking and RTO permit charges extra.</li>
          </ul>
          <div className="mt-4 border-t border-[#FDBA74]" />
          {corporateQuotationStampUrl(settings.corporateQuotationStampUrl) && (
            <div className="mt-3 ml-auto flex w-full max-w-sm justify-end">
              <CorporateQuotationStamp url={settings.corporateQuotationStampUrl} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
