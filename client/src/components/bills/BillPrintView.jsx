import React, { useState } from 'react';
import { Printer, FilePdf, X } from '@phosphor-icons/react';
import { formatINR, formatDate } from '../../utils/formatters';

export default function BillPrintView({ bill, onClose, settings = {} }) {
  if (!bill) return null;
  const [downloading, setDownloading] = useState(false);

  const defaultCompany = {
    companyName: 'Jagtap Travels',
    address: 'SIDDHI NIWAS, PURANDHAR COLONY,\nBHEKRAI NAGAR , PUNE - 412308',
    phone: '9011507220',
    phone2: '8888094770',
    email: 'jagtap.travels1985@gmail.com',
    gstNumber: '27AKGPJ1825N1ZX',
    bankName: 'AXIS Bank',
    bankBranch: 'Saswad Branch',
    accountName: 'Jagtap Travels',
    accountNumber: '916020073533410',
    ifsc: 'UTIB0002985',
    upi: '',
  };

  const pickFirst = (...vals) => {
    for (const v of vals) {
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (v != null && v !== '') return v;
    }
    return '';
  };

  const billCompany = bill.company || {};
  const company = {
    ...defaultCompany,
    ...settings,
    ...billCompany,
    companyName: pickFirst(billCompany.companyName, settings.companyName, defaultCompany.companyName),
    address: pickFirst(billCompany.address, settings.address, defaultCompany.address),
    phone: pickFirst(billCompany.phone, settings.phone, defaultCompany.phone),
    phone2: pickFirst(billCompany.phone2, settings.phone2, defaultCompany.phone2),
    email: pickFirst(billCompany.email, settings.email, defaultCompany.email),
    gstNumber: pickFirst(billCompany.gstNumber, billCompany.gstin, settings.gstNumber, defaultCompany.gstNumber),
    bankName: pickFirst(billCompany.bankName, settings.bankName, defaultCompany.bankName),
    bankBranch: pickFirst(billCompany.bankBranch, settings.bankBranch, defaultCompany.bankBranch),
    accountName: pickFirst(billCompany.accountName, settings.accountName, defaultCompany.accountName),
    accountNumber: pickFirst(billCompany.accountNumber, billCompany.bankAccountNo, settings.accountNumber, defaultCompany.accountNumber),
    ifsc: pickFirst(billCompany.ifsc, billCompany.bankIfsc, settings.ifsc, defaultCompany.ifsc),
    upi: pickFirst(billCompany.upi, settings.upi, defaultCompany.upi),
  };
  const totalPaid = bill.totalPaid ?? bill.advancePaid ?? 0;

  const handleSavePdf = async () => {
    const element = document.querySelector('.printable-area');
    if (!element) return;
    setDownloading(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Invoice-${bill.billNumber || 'JTT'}.pdf`,
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
            const clonedStamp = clonedDoc.querySelector('img[alt="Company Stamp"]');
            if (clonedStamp) {
              const nw = clonedStamp.naturalWidth;
              const nh = clonedStamp.naturalHeight;
              const maxDim = 56;
              if (nw && nh) {
                if (nw > nh) {
                  clonedStamp.style.width = `${maxDim}px`;
                  clonedStamp.style.height = `${Math.round(maxDim * (nh / nw))}px`;
                } else {
                  clonedStamp.style.height = `${maxDim}px`;
                  clonedStamp.style.width = `${Math.round(maxDim * (nw / nh))}px`;
                }
              }
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
      aria-label="Invoice preview"
    >
      <div className="print-shell bg-white max-w-4xl mx-auto rounded-none sm:rounded-lg shadow-2xl overflow-hidden my-2 sm:my-4">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 sm:p-4 bg-slate-900 text-white rounded-t-none sm:rounded-t-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base tracking-wide">
              Invoice · {bill.billNumber}
            </h2>
            <span className="text-xs text-slate-400 font-normal">| Print & PDF</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
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
              aria-label="Close invoice"
              title="Close"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-colors cursor-pointer flex items-center justify-center"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Printable Area - Real Business Invoice */}
        <article className="printable-area p-6 sm:p-10 md:p-12 text-black bg-white">
          {/* Header Section: INVOICE Title & Business Info on Left, LOGO on Right */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
                {Number(bill.taxPercent) > 0 ? 'TAX INVOICE' : 'INVOICE'}
              </h1>
              <div className="mt-2 text-xs text-slate-800 space-y-0.5 font-medium">
                <p className="font-bold text-sm text-black">{company.companyName}</p>
                {company.ownerName && <p className="text-slate-600">{company.ownerName}</p>}
                {company.email && <p>{company.email}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.phone2 && <p>{company.phone2}</p>}
                {company.address && <p>{company.address}</p>}
                {company.gstNumber && <p className="font-semibold">GSTIN: {company.gstNumber}</p>}
              </div>
            </div>

            {/* Top Right Logo */}
            <div className="shrink-0 self-start sm:self-center">
              <img
                src="/jagtap-brand-logo.png"
                alt="Logo"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </div>
          </div>

          {/* Clean Black Horizontal Rule */}
          <hr className="border-t-2 border-black my-5" />

          {/* 3-Column Metadata: Bill to | Trip details | Invoice details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Column 1: Bill to */}
            <div>
              <h3 className="font-bold text-black text-sm mb-1.5">Bill to</h3>
              <div className="space-y-0.5 text-slate-800">
                <p className="font-bold text-slate-950 text-xs sm:text-sm">{bill.customerName}</p>
                {bill.customerPhone && <p>{bill.customerPhone}</p>}
                {bill.paymentMode && <p className="text-slate-600">Payment mode: {bill.paymentMode}</p>}
              </div>
            </div>

            {/* Column 2: Trip details */}
            <div>
              <h3 className="font-bold text-black text-sm mb-1.5">Trip details</h3>
              <div className="space-y-0.5 text-slate-800">
                <p className="font-semibold text-black">
                  {bill.tripSource} → {bill.tripDestination}
                </p>
                <p>
                  {formatDate(bill.startDate)} to {formatDate(bill.endDate)}
                </p>
                <p>
                  {bill.vehicleName} {bill.vehicleNumber && `(${bill.vehicleNumber})`}
                </p>
                {bill.driverName && <p>Driver: {bill.driverName}</p>}
              </div>
            </div>

            {/* Column 3: Invoice details */}
            <div className="sm:text-right">
              <div className="inline-block text-left sm:text-right space-y-0.5 text-slate-800">
                <p>
                  <span className="font-semibold text-black">Invoice no.:</span>{' '}
                  <span className="font-mono font-bold text-black">{bill.billNumber}</span>
                </p>
                <p>
                  <span className="font-semibold text-black">Invoice date:</span>{' '}
                  {formatDate(bill.invoiceDate || bill.createdAt)}
                </p>
                <p>
                  <span className="font-semibold text-black">Status:</span>{' '}
                  <strong className="uppercase">{bill.voidedAt ? 'Cancelled' : bill.paymentStatus}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Real Invoice Table with Black Header Bar & Grid Borders */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-black min-w-[520px]">
              <thead>
                <tr className="bg-black text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="border border-black p-2.5 text-left">DESCRIPTION</th>
                  <th className="border border-black p-2.5 text-right w-24">RATE (₹)</th>
                  <th className="border border-black p-2.5 text-center w-36">QTY / KM</th>
                  <th className="border border-black p-2.5 text-center w-20">TAX %</th>
                  <th className="border border-black p-2.5 text-right w-28">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* Main Trip Charges Row */}
                <tr className="border-b border-black">
                  <td className="border border-black p-2.5 align-top">
                    <p className="font-bold text-black text-xs">
                      {bill.billingType === 'distance'
                        ? 'Vehicle running charges'
                        : 'Package / trip fare'}
                    </p>
                    {bill.billingType === 'distance' ? (
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Opening: {bill.startKm} KM · Closing: {bill.endKm} KM
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Fixed tour package: {bill.tripSource} → {bill.tripDestination}
                      </p>
                    )}
                  </td>
                  <td className="border border-black p-2.5 text-right font-mono align-top">
                    {bill.billingType === 'distance'
                      ? formatINR(bill.ratePerKm)
                      : formatINR(bill.kmAmount)}
                  </td>
                  <td className="border border-black p-2.5 text-center font-mono align-top">
                    {bill.billingType === 'distance' ? `${bill.totalKm} KM` : '1 Trip'}
                  </td>
                  <td className="border border-black p-2.5 text-center font-mono align-top">
                    {bill.taxPercent ?? 0}%
                  </td>
                  <td className="border border-black p-2.5 text-right font-mono font-bold text-black align-top">
                    {formatINR(bill.kmAmount)}
                  </td>
                </tr>

                {/* Additional Charges Rows */}
                {[
                  ['Driver allowance', bill.driverAllowance, '1 Duty'],
                  ['Toll & parking', bill.tollParking, 'As per receipts'],
                  ['Other charges', bill.otherCharges, '1'],
                ]
                  .filter(([, v]) => Number(v) > 0)
                  .map(([label, v, qty]) => (
                    <tr key={label} className="border-b border-black">
                      <td className="border border-black p-2.5 font-medium text-black">
                        {label}
                      </td>
                      <td className="border border-black p-2.5 text-right font-mono">
                        {formatINR(v)}
                      </td>
                      <td className="border border-black p-2.5 text-center font-mono text-slate-600">
                        {qty}
                      </td>
                      <td className="border border-black p-2.5 text-center font-mono">0%</td>
                      <td className="border border-black p-2.5 text-right font-mono font-bold text-black">
                        {formatINR(v)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Left Instructions / History & Right Summary Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mt-5 text-xs">
            {/* Left 7 Columns: Payment details & Notes */}
            <div className="sm:col-span-7 space-y-4">
              <div>
                <h4 className="font-bold text-black uppercase text-xs mb-1">
                  Payment details
                </h4>
                <div className="text-slate-800 space-y-0.5 text-xs">
                  {company.bankName && <p><span className="font-medium text-slate-600">Bank:</span> {company.bankName}</p>}
                  {company.bankBranch && <p><span className="font-medium text-slate-600">Branch:</span> {company.bankBranch}</p>}
                  {company.accountName && <p><span className="font-medium text-slate-600">Account holder:</span> {company.accountName}</p>}
                  {company.accountNumber && <p><span className="font-medium text-slate-600">Account number:</span> <strong className="font-mono">{company.accountNumber}</strong></p>}
                  {company.ifsc && <p><span className="font-medium text-slate-600">IFSC:</span> <strong className="font-mono">{company.ifsc}</strong></p>}
                  {company.upi && <p><span className="font-medium text-slate-600">UPI:</span> <strong className="font-mono">{company.upi}</strong></p>}
                </div>
              </div>

              {/* Payment History Table (if recorded) */}
              {!!bill.payments?.length && (
                <div className="pt-2">
                  <h4 className="font-bold text-black uppercase text-xs mb-1">
                    Payment history
                  </h4>
                  {Number(bill.advancePaid) > 0 && (
                    <p className="text-slate-600 mb-1">Initial advance: {formatINR(bill.advancePaid)}</p>
                  )}
                  <table className="w-full text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                        <th className="p-1.5 text-left">Date</th>
                        <th className="p-1.5 text-left">Mode / reference</th>
                        <th className="p-1.5 text-right">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.payments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-200">
                          <td className="p-1.5">{formatDate(p.date)}</td>
                          <td className="p-1.5 font-mono">
                            {p.mode} {p.reference ? `(${p.reference})` : ''}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold">
                            {formatINR(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Notes */}
              <div>
                <h4 className="font-bold text-black text-xs">Notes:</h4>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {bill.notes || 'Thank you for traveling with Jagtap Travels.'}
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Classic Accounting Totals Box */}
            <div className="sm:col-span-5">
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 text-slate-700 font-medium">Subtotal</td>
                    <td className="p-2 text-right font-mono font-semibold text-black">
                      {formatINR(bill.subtotal)}
                    </td>
                  </tr>

                  {Number(bill.discount) > 0 && (
                    <tr className="border-b border-slate-200">
                      <td className="p-2 text-slate-700 font-medium">Discount (−)</td>
                      <td className="p-2 text-right font-mono font-semibold text-black">
                        −{formatINR(bill.discount)}
                      </td>
                    </tr>
                  )}

                  <tr className="border-b border-slate-200">
                    <td className="p-2 text-slate-700 font-medium">
                      GST ({bill.taxPercent ?? 0}%)
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-black">
                      {formatINR(bill.taxAmount)}
                    </td>
                  </tr>

                  {/* Total Black Bar */}
                  <tr className="bg-black text-white font-bold">
                    <td className="p-2.5 text-white uppercase tracking-wide">
                      Invoice total
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm text-white">
                      {formatINR(bill.totalAmount)}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2 text-slate-700 font-medium">Total received (−)</td>
                    <td className="p-2 text-right font-mono font-bold text-black">
                      −{formatINR(totalPaid)}
                    </td>
                  </tr>

                  {/* Balance Due Black Bar */}
                  <tr className="bg-black text-white font-bold">
                    <td className="p-2.5 text-white uppercase tracking-wide">
                      Balance due
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm text-white">
                      {formatINR(bill.balanceDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Section at Bottom */}
          <div className="mt-14 pt-4 flex justify-between items-end text-xs">
            <div className="text-center">
              <div className="w-48 border-b border-black mb-1" />
              <p className="font-semibold text-black">Client signature</p>
              <p className="text-[11px] text-slate-600">Customer signature</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {settings?.stampUrl !== 'none' && company.stampUrl !== 'none' && (
                  <img
                    src={
                      company.stampUrl && company.stampUrl !== 'none'
                        ? company.stampUrl
                        : settings?.stampUrl && settings?.stampUrl !== 'none'
                        ? settings.stampUrl
                        : '/stamp.jpg'
                    }
                    alt="Company Stamp"
                    className="h-14 w-auto max-w-[3.5rem] object-contain"
                    style={{ mixBlendMode: 'multiply', opacity: 0.9 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                {settings?.signatureUrl !== 'none' && company.signatureUrl !== 'none' && (
                  <img
                    src={
                      company.signatureUrl && company.signatureUrl !== 'none'
                        ? company.signatureUrl
                        : settings?.signatureUrl && settings?.signatureUrl !== 'none'
                        ? settings.signatureUrl
                        : '/signature.jpg'
                    }
                    alt="Authorized Signature"
                    className="h-10 w-auto object-contain"
                    style={{ mixBlendMode: 'multiply' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="w-48 border-b border-black mb-1" />
              <p className="font-semibold text-black">Business signature</p>
              <p className="text-[11px] text-slate-600">Authorized signatory</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
