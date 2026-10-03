import React, { useState } from 'react';
import { Printer, FilePdf, WhatsappLogo, X } from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';

export function quoteMessage(quote, company = {}) {
  return [
    'Greetings from ' + (company.companyName || 'Jagtap Travels') + '!',
    'Dear ' + quote.customerName + ',',
    'Tour: ' + quote.tourTitle,
    'Vehicle: ' + quote.vehicleType,
    'Duration: ' + quote.durationDays + ' days',
    'Route: ' + quote.pickupLocation + ' to ' + quote.dropLocation,
    quote.travelDate ? 'Travel date: ' + formatDate(quote.travelDate) : '',
    'Total: ' + formatINR(quote.totalAmount) + ' (including GST)',
    quote.inclusions ? 'Inclusions: ' + quote.inclusions : '',
    quote.exclusions ? 'Exclusions: ' + quote.exclusions : '',
    quote.validityDate ? 'Valid until: ' + formatDate(quote.validityDate) : '',
    company.phone ? 'Contact: ' + company.phone : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function shareQuote(quote, settings = {}) {
  const raw = (quote.customerPhone || '').replace(/\D/g, ''),
    phone = raw.length === 10 ? '91' + raw : raw;
  if (phone && !/^\d{11,15}$/.test(phone))
    throw new Error('Correct the customer phone number before sharing.');
  window.open(
    'https://wa.me/' +
      phone +
      '?text=' +
      encodeURIComponent(quoteMessage(quote, quote.company || settings)),
    '_blank',
    'noopener,noreferrer',
  );
}

export default function QuotationPrintView({ quote, onClose, settings = {} }) {
  if (!quote) return null;
  const [downloading, setDownloading] = useState(false);
  const defaultCompany = {
    companyName: 'Jagtap Travels',
    address: 'SIDDHI NIWAS, PURANDHAR COLONY, BHEKRAI NAGAR , PUNE - 412308',
    phone: '9011507220',
    phone2: '8888094770',
    email: 'jagtap.travels1985@gmail.com',
  };

  const pickFirst = (...vals) => {
    for (const v of vals) {
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (v != null && v !== '') return v;
    }
    return '';
  };

  const qComp = quote.company || {};
  const company = {
    ...defaultCompany,
    ...settings,
    ...qComp,
    companyName: pickFirst(qComp.companyName, settings.companyName, defaultCompany.companyName),
    address: pickFirst(qComp.address, settings.address, defaultCompany.address),
    phone: pickFirst(qComp.phone, settings.phone, defaultCompany.phone),
    phone2: pickFirst(qComp.phone2, settings.phone2, defaultCompany.phone2),
    email: pickFirst(qComp.email, settings.email, defaultCompany.email),
  };

  const handleSavePdf = async () => {
    const element = document.querySelector('.printable-area');
    if (!element) return;
    setDownloading(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Quotation-${quote.quotationNumber || 'JTT'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.printable-area');
            if (el) {
              el.style.margin = '0';
              el.style.boxShadow = 'none';
            }
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Direct PDF export failed, opening print dialogue:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="print-overlay fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto p-2 sm:p-4 md:p-6 font-['Plus_Jakarta_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
      aria-label="Quotation preview"
    >
      <div className="print-shell bg-white max-w-4xl mx-auto rounded-none sm:rounded-lg shadow-2xl overflow-hidden my-2 sm:my-4">
        {/* Top Action Bar (Hidden in Print / PDF) */}
        <div className="no-print flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-3.5 sm:p-4 bg-slate-900 text-white rounded-t-none sm:rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base tracking-wide">
              Quotation · {quote.quotationNumber}
            </h2>
            <span className="text-xs text-slate-400 font-normal">| Print & PDF</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={() => {
                try {
                  shareQuote(quote, settings);
                } catch (e) {
                  window.alert(e.message);
                }
              }}
              className="px-3 py-2 text-xs sm:text-sm font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
            >
              <WhatsappLogo size={15} weight="bold" />
              <span>WhatsApp</span>
            </button>

            {/* Dedicated Print Button */}
            <button
              type="button"
              onClick={() => {
                const originalTitle = document.title;
                document.title = '';
                window.print();
                setTimeout(() => { document.title = originalTitle; }, 500);
              }}
              className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded text-xs sm:text-sm shadow transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
            >
              <Printer size={15} weight="bold" />
              <span>Print</span>
            </button>

            {/* Dedicated Save as PDF Button */}
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={downloading}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs sm:text-sm shadow transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer disabled:opacity-50"
            >
              <FilePdf size={15} weight="bold" />
              <span>{downloading ? 'Saving PDF…' : 'Save as PDF'}</span>
            </button>

            {/* Close Button with Cross Icon */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quotation"
              title="Close"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-colors cursor-pointer flex items-center justify-center"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <article className="printable-area p-6 sm:p-10 md:p-12 text-black bg-white">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-black">
            <div className="space-y-1 max-w-md">
              <span className="inline-block text-[11px] uppercase tracking-widest font-black text-slate-600">
                Official Travel Quotation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                {company.companyName || 'Jagtap Travels'}
              </h1>
              {company.ownerName && (
                <p className="text-xs font-semibold text-slate-700">Proprietor: {company.ownerName}</p>
              )}
              {company.address && (
                <p className="text-xs text-slate-700 leading-relaxed">{company.address}</p>
              )}
              <div className="text-xs text-slate-700 space-x-2 pt-0.5">
                {company.phone && <span>Tel: <strong>{company.phone}</strong></span>}
                {company.email && <span>| Email: <strong>{company.email}</strong></span>}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 text-right">
              <img
                src="/jagtap-brand-logo.png"
                alt="Jagtap Travels"
                className="h-16 w-auto object-contain max-w-[200px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="text-left sm:text-right mt-1">
                <span className="inline-block bg-black text-white px-2.5 py-0.5 text-xs font-black tracking-widest uppercase">
                  Quotation
                </span>
                <p className="text-sm font-bold text-black mt-1">
                  #{quote.quotationNumber || 'QUOTE'}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border border-black border-t-0 text-xs">
            <div className="p-3 border-b sm:border-b-0 sm:border-r border-black">
              <p className="font-bold uppercase text-[10px] text-slate-600 mb-1">Prepared For</p>
              <p className="font-extrabold text-sm text-black">{quote.customerName}</p>
              <p className="text-slate-800 mt-0.5">{quote.customerPhone}</p>
              {quote.customerEmail && <p className="text-slate-700">{quote.customerEmail}</p>}
            </div>

            <div className="p-3 border-b sm:border-b-0 sm:border-r border-black">
              <p className="font-bold uppercase text-[10px] text-slate-600 mb-1">Tour Overview</p>
              <p className="font-bold text-black">{quote.tourTitle}</p>
              <p className="text-slate-800 mt-0.5">
                {quote.pickupLocation} → {quote.dropLocation}
              </p>
              <p className="text-slate-700 mt-0.5">
                Vehicle: <strong>{quote.vehicleType}</strong> ({quote.durationDays} days)
              </p>
            </div>

            <div className="p-3">
              <p className="font-bold uppercase text-[10px] text-slate-600 mb-1">Quotation Details</p>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Date:</span>
                <span className="font-bold text-black">{formatDate(quote.createdAt)}</span>
              </div>
              {quote.travelDate && (
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Travel date:</span>
                  <span className="font-bold text-black">{formatDate(quote.travelDate)}</span>
                </div>
              )}
              {quote.validityDate && (
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Valid until:</span>
                  <span className="font-bold text-black">{formatDate(quote.validityDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details / Sections */}
          {[
            ['Itinerary', quote.itinerary],
            ['Inclusions', quote.inclusions],
            ['Exclusions', quote.exclusions],
            ['Notes & Conditions', quote.notes],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} className="mt-4 border border-black">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-black">
                  <h3 className="text-xs font-black uppercase tracking-wider text-black">{label}</h3>
                </div>
                <div className="p-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {value}
                </div>
              </div>
            ))}

          {/* Pricing Box */}
          <div className="mt-6 flex flex-col sm:flex-row justify-end">
            <div className="w-full sm:w-80 border border-black text-xs">
              <div className="flex justify-between px-3 py-2 border-b border-black">
                <span className="text-slate-700">Base Fare:</span>
                <span className="font-bold text-black">{formatINR(quote.baseAmount)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 border-b border-black">
                <span className="text-slate-700">GST (5%):</span>
                <span className="font-bold text-black">{formatINR(quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-black text-white text-sm font-black">
                <span>TOTAL ESTIMATE:</span>
                <span>{formatINR(quote.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Signature */}
          <div className="mt-8 pt-4 border-t border-black text-xs text-slate-600 space-y-2">
            <p>
              <strong>Note:</strong> Subject to vehicle availability and the inclusions and
              exclusions stated above. Please contact us to confirm your booking and schedule.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs text-black">
            <div>
              <p className="text-slate-500 mb-10">Client Acceptance:</p>
              <div className="border-t border-black pt-1 w-48 font-bold">Customer Signature</div>
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-slate-500 mb-10">
                For <strong>{company.companyName || 'Jagtap Travels'}</strong>
              </p>
              <div className="border-t border-black pt-1 w-48 font-bold text-center">
                Authorized Signatory
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
