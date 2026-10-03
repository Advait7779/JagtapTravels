import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Printer, FilePdf, X, Check, FileText } from '@phosphor-icons/react';
import { formatINR, formatDate, localDate } from '../../utils/formatters';

export default function CorporateLogsheetPrintView({
  isOpen,
  onClose,
  autoDownload = false,
  selectedMonth = '',
  currentContract = null,
  logs = [],
  totals = {
    trips: 0,
    totalKm: 0,
    totalHours: 0,
    extraHours: 0,
    tollParking: 0,
    employeeCount: 0,
  },
  settings = {},
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const printableAreaRef = useRef(null);
  const hasAutoDownloadedRef = useRef(false);

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

  const company = {
    ...defaultCompany,
    ...settings,
    companyName: pickFirst(settings.companyName, defaultCompany.companyName),
    address: pickFirst(settings.address, defaultCompany.address),
    phone: pickFirst(settings.phone, defaultCompany.phone),
    phone2: pickFirst(settings.phone2, defaultCompany.phone2),
    email: pickFirst(settings.email, defaultCompany.email),
  };

  const handleSavePdf = useCallback(async () => {
    const element = printableAreaRef.current || document.querySelector('.printable-area');
    if (!element) return;
    setDownloading(true);
    setDownloaded(false);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const clientName = (currentContract?.companyName || 'Corporate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Logsheet-${clientName}-${selectedMonth || localDate().slice(0, 7)}.pdf`,
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
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      };
      await html2pdf().set(opt).from(element).save();
      setDownloaded(true);
    } catch (err) {
      console.error('Logsheet PDF export error, falling back to print dialogue:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }, [currentContract?.companyName, selectedMonth]);

  useEffect(() => {
    if (!isOpen) {
      hasAutoDownloadedRef.current = false;
      return undefined;
    }
    if (autoDownload && !hasAutoDownloadedRef.current) {
      hasAutoDownloadedRef.current = true;
      // Small timeout to allow styles to finish painting
      const timer = setTimeout(() => {
        handleSavePdf();
      }, 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoDownload, handleSavePdf, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="print-overlay fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 md:p-6 font-['Plus_Jakarta_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
      aria-label="Corporate Daily KM Logsheet Preview"
    >
      <div className="print-shell bg-white max-w-6xl mx-auto rounded-md shadow-2xl overflow-hidden my-2 sm:my-4">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 sm:p-4 bg-navy-950 text-white border-b border-navy-900">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-400 text-navy-950 rounded shadow-xs">
              <FileText size={18} weight="bold" />
            </span>
            <div>
              <h2 className="font-bold text-sm sm:text-base tracking-wide text-white">
                Daily KM Logsheet · {currentContract?.companyName || 'Corporate Client'}
              </h2>
              <p className="text-xs text-slate-300">
                Month: {selectedMonth} · {logs.length} trip entries
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={downloading}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-navy-950 font-bold rounded text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer disabled:opacity-50"
            >
              {downloaded ? (
                <>
                  <Check size={16} weight="bold" className="text-emerald-900" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <FilePdf size={16} weight="bold" />
                  <span>{downloading ? 'Generating PDF…' : 'Download PDF'}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => {
                const originalTitle = document.title;
                document.title = '';
                window.print();
                setTimeout(() => { document.title = originalTitle; }, 500);
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
            >
              <Printer size={16} weight="bold" />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Preview"
              title="Close Preview"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer flex items-center justify-center"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Printable Area - Official Corporate Vehicle Logsheet */}
        <article
          ref={printableAreaRef}
          className="printable-area p-6 sm:p-8 md:p-10 text-black bg-white"
        >
          {/* Company & Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-950">
                  {company.companyName}
                </h1>
                <p className="text-xs font-bold text-slate-700 tracking-wide mt-0.5">
                  CORPORATE FLEET MANAGEMENT & DAILY VEHICLE LOGSHEET REGISTER
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {company.address} {company.phone ? `• Tel: ${company.phone}` : ''}
                </p>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="inline-block bg-slate-100 px-3 py-1 rounded border border-slate-300 font-bold text-slate-900">
                  Month: <span className="text-sm font-black">{selectedMonth}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Generated: {localDate()}
                </p>
              </div>
            </div>
          </div>



          {/* Detailed Daily Trip Logs Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center w-8">#</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Date</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Vehicle</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Route (From ➔ To)</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">
                    Start KM
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">
                    Close KM
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center bg-slate-200/60 font-black">
                    Total KM
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">
                    Timings
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">
                    Total Hrs
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-right">
                    Toll (₹)
                  </th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center font-black">
                    Employees
                  </th>
                  <th className="py-2 px-2.5 text-left">Sign / User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 italic">
                      No daily trip entries recorded for this month.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono text-slate-500 text-[10px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 whitespace-nowrap font-medium text-slate-900">
                        {formatDate(log.date)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 whitespace-nowrap font-mono font-bold text-slate-800 text-[10px]">
                        {log.vehicleNumber || '--'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-slate-800 font-medium">
                        <span>{log.placeFrom}</span>
                        <span className="mx-1 text-slate-400 font-bold">➔</span>
                        <span className="font-semibold text-slate-950">{log.placeTo}</span>
                        {log.remarks && (
                          <span className="block text-[9px] text-slate-500 italic">
                            {log.remarks}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono text-slate-700">
                        {Number(log.startKm || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono text-slate-700">
                        {Number(log.closeKm || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono font-black text-slate-950 bg-slate-50">
                        {Number(log.totalKm || 0)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center whitespace-nowrap text-slate-600 text-[10px]">
                        {log.startTime && log.closeTime ? `${log.startTime} - ${log.closeTime}` : '--'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-semibold text-slate-800">
                        {log.totalHours ? `${log.totalHours} hrs` : '--'}
                        {Number(log.extraHours) > 0 && (
                          <span className="text-[9px] text-amber-700 block">
                            (+{log.extraHours} ex)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-right font-medium text-slate-900">
                        {Number(log.tollParking) > 0 ? formatINR(log.tollParking) : '0'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-center font-black text-slate-900 bg-slate-50">
                        {log.employeeCount || 0}
                      </td>
                      <td className="py-2 px-2.5 text-slate-800 whitespace-nowrap">
                        <span className="font-medium">{log.signatureName || '--'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Table Footer with Verified Totals */}
              {logs.length > 0 && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-950 text-xs">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 border-r border-slate-300 uppercase tracking-wider font-black">
                      Total ({selectedMonth}) — {totals.trips} Trips Recorded
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-300 text-center font-mono font-black text-sm bg-slate-200/80">
                      {totals.totalKm.toLocaleString()} KM
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-300 text-center text-slate-500">
                      --
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-300 text-center font-bold">
                      {Math.round(totals.totalHours * 10) / 10} hrs
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-300 text-right font-black">
                      {formatINR(totals.tollParking)}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-300 text-center font-black text-sm bg-slate-200/80">
                      {totals.employeeCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-500 text-[10px]">
                      Verified Duty
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>


        </article>
      </div>
    </div>
  );
}
