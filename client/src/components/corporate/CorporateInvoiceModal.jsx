import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Printer,
  FilePdf,
  Check,
  Plus,
  Trash,
  PencilSimple,
  Receipt,
  Eye,
} from '@phosphor-icons/react';
import { formatINR, formatDate, localDate, numberToWordsIndian } from '../../utils/formatters';

const MONTH_NAMES = [
  '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const defaultCompany = {
  companyName: 'JAGTAP TRAVELS',
  address: 'SIDDHI NIWAS, PURANDHAR COLONY,\nBHEKRAI NAGAR , PUNE - 412308',
  gstin: '27AKGPJ1825N1ZX',
  email: 'jagtap.travels1985@gmail.com',
  contact: '9011507220',
  bankName: 'AXIS BANK',
  bankBranch: 'SASWAD',
  bankAccountNo: '916020073533410',
  bankIfsc: 'UTIB0002985',
};

const emptyLineItem = () => ({
  id: Date.now() + Math.random(),
  particulars: '',
  packageKm: 3000,
  extraKmRate: 0,
  packageAmount: 0,
  extraKm: 0,
  extraAmount: 0,
  amount: 0,
});

const emptyTollItem = () => ({
  id: Date.now() + Math.random(),
  label: '',
  amount: 0,
});

export default function CorporateInvoiceModal({
  isOpen,
  onClose,
  contract = null,
  tripLogs = [],
  customers = [],
  vehicles = [],
  selectedMonth = '',
  settings = {},
}) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'preview'

  // Invoice header fields
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(localDate());
  const [period, setPeriod] = useState('');
  const [poNo, setPoNo] = useState('');

  // Vehicle info
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumbers, setVehicleNumbers] = useState('');

  // Party (client) info
  const [partyName, setPartyName] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyGstin, setPartyGstin] = useState('');

  // Company (self) info
  const [company, setCompany] = useState({ ...defaultCompany });

  // Line items
  const [lineItems, setLineItems] = useState([emptyLineItem()]);

  // Toll items
  const [tollItems, setTollItems] = useState([]);

  // Tax
  const [gstRate, setGstRate] = useState(9); // Each side (CGST = 9%, SGST = 9%)

  // Stamp & Signature toggles - synchronized with saved settings
  const [showStamp, setShowStamp] = useState(settings?.stampUrl !== 'none');
  const [showSignature, setShowSignature] = useState(settings?.signatureUrl !== 'none');

  // Populate from contract + trip logs
  useEffect(() => {
    if (!contract) return;

    // Period
    const [y, m] = (selectedMonth || localDate().slice(0, 7)).split('-').map(Number);
    setPeriod(MONTH_NAMES[m] || '');

    // Party info from contract or customers directory
    const matchedCustomer = customers.find(
      (c) =>
        (contract.companyId && String(c.id) === String(contract.companyId)) ||
        (contract.companyName && c.name?.toLowerCase() === contract.companyName?.toLowerCase()),
    );
    const matchedVehicle = vehicles.find(
      (v) =>
        (contract.vehicleId && String(v.id) === String(contract.vehicleId)) ||
        (contract.vehicleNumber && v.vehicleNumber === contract.vehicleNumber),
    );

    setPartyName(contract.companyName || matchedCustomer?.name || '');
    setPartyAddress(contract.partyAddress || matchedCustomer?.address || '');
    setPartyGstin(contract.partyGstin || matchedCustomer?.gstNumber || '');

    // Vehicle
    setVehicleType(
      contract.vehicleName || matchedVehicle?.name || matchedVehicle?.model || 'Commercial Vehicle',
    );
    setVehicleNumbers(contract.vehicleNumber || matchedVehicle?.vehicleNumber || '');

    // Line item from contract
    const monthStart = selectedMonth + '-01';
    const monthEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    const monthLogs = tripLogs.filter(
      (log) =>
        log.date &&
        log.date >= monthStart &&
        log.date <= monthEnd &&
        (log.contractId
          ? String(log.contractId) === String(contract.id)
          : (contract.vehicleId && String(log.vehicleId) === String(contract.vehicleId)) ||
            (contract.vehicleNumber && log.vehicleNumber === contract.vehicleNumber)),
    );

    const totalKmRun = monthLogs.reduce((acc, log) => acc + (Number(log.totalKm) || 0), 0);
    const totalToll = monthLogs.reduce((acc, log) => acc + (Number(log.tollParking) || 0), 0);
    const includedKm = Number(contract.includedMonthlyKm) || 0;
    const excessKm = Math.max(0, totalKmRun - includedKm);
    const extraRate = Number(contract.extraRatePerKm) || 0;
    const pkgAmount = Number(contract.monthlyBaseFare) || 0;
    const extraAmount = Math.round(excessKm * extraRate);

    const item = {
      id: Date.now(),
      particulars: `${contract.vehicleNumber || ''} - ${contract.vehicleName || 'Vehicle'}`.trim(),
      packageKm: includedKm,
      extraKmRate: extraRate,
      packageAmount: pkgAmount,
      extraKm: excessKm,
      extraAmount: extraAmount,
      amount: pkgAmount + extraAmount,
    };
    setLineItems([item]);

    if (totalToll > 0) {
      setTollItems([{
        id: Date.now() + 1,
        label: `${contract.vehicleNumber || 'Vehicle'} TOLL & PARKING`,
        amount: totalToll,
      }]);
    } else {
      setTollItems([]);
    }

    // Merge settings & synchronize stamp/signature toggles
    setCompany((prev) => ({ ...prev, ...settings }));
    if (settings?.stampUrl === 'none') {
      setShowStamp(false);
    } else if (settings?.stampUrl) {
      setShowStamp(true);
    }
    if (settings?.signatureUrl === 'none') {
      setShowSignature(false);
    } else if (settings?.signatureUrl) {
      setShowSignature(true);
    }
  }, [contract, selectedMonth, tripLogs, customers, vehicles, settings]);

  // Computed totals
  const computedTotals = useMemo(() => {
    const lineTotal = lineItems.reduce((acc, item) => {
      const pkgAmt = Number(item.packageAmount) || 0;
      const extAmt = Number(item.extraAmount) || 0;
      return acc + pkgAmt + extAmt;
    }, 0);
    const tollTotal = tollItems.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const taxableValue = lineTotal + tollTotal;
    const cgst = Math.round(taxableValue * (gstRate / 100));
    const sgst = Math.round(taxableValue * (gstRate / 100));
    const grandTotal = taxableValue + cgst + sgst;
    return { lineTotal, tollTotal, taxableValue, cgst, sgst, grandTotal };
  }, [lineItems, tollItems, gstRate]);

  // Line item handlers
  const updateLineItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Recompute extraAmount and amount
        const extraKm = Number(updated.extraKm) || 0;
        const extraRate = Number(updated.extraKmRate) || 0;
        updated.extraAmount = Math.round(extraKm * extraRate);
        updated.amount = (Number(updated.packageAmount) || 0) + updated.extraAmount;
        return updated;
      }),
    );
  };
  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);
  const removeLineItem = (id) => setLineItems((prev) => prev.filter((i) => i.id !== id));

  // Toll handlers
  const updateTollItem = (id, field, value) => {
    setTollItems((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };
  const addTollItem = () => setTollItems((prev) => [...prev, emptyTollItem()]);
  const removeTollItem = (id) => setTollItems((prev) => prev.filter((t) => t.id !== id));

  // Format number Indian style (without currency symbol)
  const fmtNum = (v) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  // PDF download
  const handleSavePdf = useCallback(async () => {
    const element = printRef.current;
    if (!element) return;
    setDownloading(true);
    setDownloaded(false);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const clientName = (partyName || 'Corporate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `Corporate-Invoice-${clientName}-${period || selectedMonth}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
      setDownloaded(true);
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }, [partyName, period, selectedMonth]);

  if (!isOpen) return null;

  // ──────── EDITOR VIEW ────────
  const renderEditor = () => (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Invoice Meta */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Receipt size={16} weight="bold" /> Invoice Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="form-label">Invoice No
            <input className="form-input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g. 390" />
          </label>
          <label className="form-label">Date
            <input className="form-input" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </label>
          <label className="form-label">Period
            <input className="form-input" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. AUGUST" />
          </label>
          <label className="form-label">PO No
            <input className="form-input" value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="e.g. 4593518741" />
          </label>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800">Vehicle Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-label">Type of Vehicle
            <input className="form-input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. 45 SEATER & 32 SEATER" />
          </label>
          <label className="form-label">Vehicle No(s)
            <input className="form-input" value={vehicleNumbers} onChange={(e) => setVehicleNumbers(e.target.value)} placeholder="e.g. MH 12 XN 7220, MH 12 WX 7223" />
          </label>
        </div>
      </div>

      {/* Party (Client) Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800">Party (Client) Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="form-label">Company Name
            <input className="form-input" value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="e.g. HENKEL ADHESIVE TECHNOLOGIES" />
          </label>
          <label className="form-label">Address
            <input className="form-input" value={partyAddress} onChange={(e) => setPartyAddress(e.target.value)} placeholder="Full billing address" />
          </label>
          <label className="form-label">Client GSTIN
            <input className="form-input" value={partyGstin} onChange={(e) => setPartyGstin(e.target.value)} placeholder="e.g. 27AAACL1954B1ZW" />
          </label>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Vehicle Package Line Items</h3>
          <button type="button" onClick={addLineItem} className="text-xs font-bold text-navy-900 hover:text-amber-600 flex items-center gap-1 cursor-pointer">
            <Plus size={14} weight="bold" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-50 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="p-2 text-left border border-slate-200">Particulars</th>
                <th className="p-2 text-right border border-slate-200 w-20">Pkg KM</th>
                <th className="p-2 text-right border border-slate-200 w-24">Pkg Amount</th>
                <th className="p-2 text-right border border-slate-200 w-20">Extra KM</th>
                <th className="p-2 text-right border border-slate-200 w-20">Extra Rate</th>
                <th className="p-2 text-right border border-slate-200 w-24">Extra Amt</th>
                <th className="p-2 text-right border border-slate-200 w-24">Total</th>
                <th className="p-2 text-center border border-slate-200 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="p-1 border border-slate-200">
                    <input className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded" value={item.particulars} onChange={(e) => updateLineItem(item.id, 'particulars', e.target.value)} placeholder="Route - Vehicle" />
                  </td>
                  <td className="p-1 border border-slate-200">
                    <input type="number" className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded" value={item.packageKm} onChange={(e) => updateLineItem(item.id, 'packageKm', Number(e.target.value))} />
                  </td>
                  <td className="p-1 border border-slate-200">
                    <input type="number" className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded" value={item.packageAmount} onChange={(e) => updateLineItem(item.id, 'packageAmount', Number(e.target.value))} />
                  </td>
                  <td className="p-1 border border-slate-200">
                    <input type="number" className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded" value={item.extraKm} onChange={(e) => updateLineItem(item.id, 'extraKm', Number(e.target.value))} />
                  </td>
                  <td className="p-1 border border-slate-200">
                    <input type="number" className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded" value={item.extraKmRate} onChange={(e) => updateLineItem(item.id, 'extraKmRate', Number(e.target.value))} />
                  </td>
                  <td className="p-1 border border-slate-200 text-right font-semibold px-2">
                    {fmtNum(item.extraAmount)}
                  </td>
                  <td className="p-1 border border-slate-200 text-right font-bold px-2">
                    {fmtNum(item.amount)}
                  </td>
                  <td className="p-1 border border-slate-200 text-center">
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLineItem(item.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                        <Trash size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toll & Parking Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Toll & Parking Reimbursements</h3>
          <button type="button" onClick={addTollItem} className="text-xs font-bold text-navy-900 hover:text-amber-600 flex items-center gap-1 cursor-pointer">
            <Plus size={14} weight="bold" /> Add Toll
          </button>
        </div>
        {tollItems.length > 0 ? (
          <div className="space-y-2">
            {tollItems.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input className="flex-1 form-input text-xs" value={t.label} onChange={(e) => updateTollItem(t.id, 'label', e.target.value)} placeholder="e.g. SASWAD 45 SEATER TOLL" />
                <input type="number" className="w-28 form-input text-xs text-right" value={t.amount} onChange={(e) => updateTollItem(t.id, 'amount', Number(e.target.value))} placeholder="Amount" />
                <button type="button" onClick={() => removeTollItem(t.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer p-1">
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No toll/parking entries. Click "Add Toll" to add.</p>
        )}
      </div>

      {/* Tax Rate */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800">GST Rate</h3>
        <div className="flex items-center gap-3">
          {[
            { label: '18% (9% + 9%)', value: 9 },
            { label: '5% (2.5% + 2.5%)', value: 2.5 },
            { label: '0% (Exempt)', value: 0 },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="radio" name="gstRate" checked={gstRate === opt.value} onChange={() => setGstRate(opt.value)} className="accent-navy-900" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Official Stamp & Signature Options */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800">Stamp & Signature on Invoice</h3>
        <div className="flex items-center gap-6 pt-0.5">
          <label className={`flex items-center gap-2 text-xs font-semibold ${
            settings?.stampUrl === 'none' || company.stampUrl === 'none'
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-700 cursor-pointer'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(showStamp && settings?.stampUrl !== 'none' && company.stampUrl !== 'none')}
              onChange={(e) => setShowStamp(e.target.checked)}
              disabled={settings?.stampUrl === 'none' || company.stampUrl === 'none'}
              className="accent-navy-900 rounded"
            />
            <span>Include Official Company Stamp</span>
            {(settings?.stampUrl === 'none' || company.stampUrl === 'none') && (
              <span className="text-[10px] text-rose-600 font-bold ml-1">(Removed in Settings)</span>
            )}
          </label>
          <label className={`flex items-center gap-2 text-xs font-semibold ${
            settings?.signatureUrl === 'none' || company.signatureUrl === 'none'
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-700 cursor-pointer'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(showSignature && settings?.signatureUrl !== 'none' && company.signatureUrl !== 'none')}
              onChange={(e) => setShowSignature(e.target.checked)}
              disabled={settings?.signatureUrl === 'none' || company.signatureUrl === 'none'}
              className="accent-navy-900 rounded"
            />
            <span>Include Authorized Signature</span>
            {(settings?.signatureUrl === 'none' || company.signatureUrl === 'none') && (
              <span className="text-[10px] text-rose-600 font-bold ml-1">(Removed in Settings)</span>
            )}
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Line Items Total:</span><span className="font-bold">{fmtNum(computedTotals.lineTotal)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Toll & Parking:</span><span className="font-bold">{fmtNum(computedTotals.tollTotal)}</span></div>
        <hr className="border-slate-200" />
        <div className="flex justify-between"><span className="text-slate-600">Taxable Value:</span><span className="font-bold">{fmtNum(computedTotals.taxableValue)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">CGST ({gstRate}%):</span><span className="font-semibold">{fmtNum(computedTotals.cgst)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">SGST ({gstRate}%):</span><span className="font-semibold">{fmtNum(computedTotals.sgst)}</span></div>
        <hr className="border-slate-300" />
        <div className="flex justify-between text-base"><span className="font-bold text-black">Grand Total:</span><span className="font-black text-black">₹ {fmtNum(computedTotals.grandTotal)}</span></div>
        <p className="text-[10px] text-slate-500 pt-1">INR : {numberToWordsIndian(computedTotals.grandTotal)}</p>
      </div>
    </div>
  );

  // ──────── INVOICE PREVIEW (Pixel-perfect match) ────────
  const renderPreview = () => {
    const { taxableValue, cgst, sgst, grandTotal } = computedTotals;
    const dateFormatted = invoiceDate
      ? new Date(invoiceDate + 'T12:00:00Z').toLocaleDateString('en-IN', {
          day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata',
        })
      : '';

    return (
      <div className="overflow-y-auto max-h-[calc(100vh-180px)] bg-slate-100 p-3 sm:p-6">
        <div ref={printRef} className="printable-area bg-white mx-auto shadow-lg" style={{ maxWidth: 820, padding: '28px 32px', fontFamily: "'Times New Roman', Times, serif", fontSize: 13, color: '#000', lineHeight: 1.4 }}>
          {/* Title */}
          <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#d00', marginBottom: 16, letterSpacing: 4 }}>
            Tax &nbsp; Invoice
          </h1>

          {/* Top Grid: Company Info | Invoice Meta */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000' }}>
            <tbody>
              <tr>
                {/* Left: Company Info */}
                <td style={{ border: '1.5px solid #000', padding: '6px 8px', verticalAlign: 'top', width: '48%' }} rowSpan={3}>
                  <div style={{ fontWeight: 'bold', color: '#d00', fontSize: 14 }}>{company.companyName}</div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: 12 }}>{company.address}</div>
                  <div style={{ fontWeight: 'bold', color: '#d00', fontSize: 12 }}>GSTIN/UIN: {company.gstin}</div>
                  <div style={{ fontSize: 11 }}>E-Mail :</div>
                  <div style={{ fontSize: 11 }}>{company.email}</div>
                  <div style={{ fontSize: 11 }}>Contact : {company.contact}</div>
                </td>
                {/* Right top: Invoice no */}
                <td style={{ border: '1.5px solid #000', padding: '4px 8px', fontSize: 12 }}>
                  <b>Invoice No :</b> &nbsp;&nbsp; {invoiceNo}
                </td>
                <td style={{ border: '1.5px solid #000', padding: '4px 8px', fontSize: 12 }}>
                  <b>Date :</b> &nbsp;&nbsp; {dateFormatted}<br />
                  <b>Period :</b> &nbsp;&nbsp; {period}<br />
                  <b>PO No :</b> &nbsp;&nbsp; {poNo}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ border: '1.5px solid #000', padding: '4px 8px', fontSize: 12 }}>
                  <b>Type of Vehicle :</b> &nbsp;&nbsp; {vehicleType}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ border: '1.5px solid #000', padding: '4px 8px', fontSize: 12 }}>
                  <b>Vehicle No :</b> &nbsp;&nbsp;&nbsp;&nbsp; {vehicleNumbers}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Party + Bank Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ border: '1.5px solid #000', padding: '6px 8px', verticalAlign: 'top', width: '48%' }}>
                  <div style={{ fontSize: 12 }}>Party Name :-</div>
                  <div style={{ fontWeight: 'bold', color: '#d00', fontSize: 13 }}>{partyName}</div>
                  <div style={{ fontSize: 11, whiteSpace: 'pre-line' }}>{partyAddress}</div>
                  {partyGstin && <div style={{ fontWeight: 'bold', color: '#d00', fontSize: 12 }}>GST – {partyGstin}</div>}
                </td>
                <td style={{ border: '1.5px solid #000', padding: '6px 8px', verticalAlign: 'top', fontSize: 12 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12 }}>{company.companyName} ACCOUNT DETAILS</div>
                  <div>BANK - &nbsp;&nbsp; {company.bankName}</div>
                  <div>BRANCH - &nbsp;&nbsp; {company.bankBranch}</div>
                  <div>AC NO - &nbsp;&nbsp; {company.bankAccountNo}</div>
                  <div>IFSC - &nbsp;&nbsp;&nbsp;&nbsp; {company.bankIfsc}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', borderTop: 'none' }}>
            <thead>
              <tr style={{ fontWeight: 'bold', fontSize: 11 }}>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center', width: 30 }}>No</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'left' }}>Particulars</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center' }}>PACKAGE<br />KM</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center' }}>PACKAGE<br />AMOUNT</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center' }}>EXTRA<br />KM</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center' }}>EXTRA<br />KM RATE</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center' }}>EXTRA KM -<br />HOURS AMOUNT</th>
                <th style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={item.id} style={{ fontSize: 12 }}>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', fontWeight: 'bold' }}>{item.particulars}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>{fmtNum(item.packageKm)}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>{fmtNum(item.packageAmount)}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>{fmtNum(item.extraKm)}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>{fmtNum(item.extraKmRate)}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>{fmtNum(item.extraAmount)}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{fmtNum(item.amount)}</td>
                </tr>
              ))}
              {/* Toll rows */}
              {tollItems.map((t) => (
                <tr key={t.id} style={{ fontSize: 12 }}>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px' }}></td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px' }} colSpan={4}></td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }} colSpan={2}>{t.label}</td>
                  <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{fmtNum(t.amount)}</td>
                </tr>
              ))}
              {/* Totals */}
              <tr style={{ fontSize: 12 }}>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px' }} colSpan={5}></td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }} colSpan={2}>TOTAL</td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{fmtNum(taxableValue)}</td>
              </tr>
              <tr style={{ fontSize: 12 }}>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px' }} colSpan={5}></td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }} colSpan={2}>C GST {gstRate}%</td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{fmtNum(cgst)}</td>
              </tr>
              <tr style={{ fontSize: 12 }}>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px' }} colSpan={5}></td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }} colSpan={2}>S GST {gstRate}%</td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{fmtNum(sgst)}</td>
              </tr>
              <tr style={{ fontSize: 13, fontWeight: 'bold' }}>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px' }} colSpan={5}></td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }} colSpan={2}>TOTAL</td>
                <td style={{ border: '1.5px solid #000', padding: '4px 6px', textAlign: 'right' }}>{fmtNum(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ border: '1.5px solid #000', padding: '6px 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12 }}>Amount Chargeable (in words)</div>
                  <div style={{ fontSize: 12 }}>INR : {numberToWordsIndian(grandTotal)}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* HSN/SAC Breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', borderTop: 'none', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }} rowSpan={2}>HSN/SAC code<br />996419</th>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }} rowSpan={2}>Taxable<br />Value</th>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }} colSpan={2}>Central Tax</th>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }} colSpan={2}>State Tax</th>
              </tr>
              <tr>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}>Rate</th>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}>Amount</th>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}>Rate</th>
                <th style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontSize: 12 }}>
                <td style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}></td>
                <td style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'right' }}>{fmtNum(taxableValue)}</td>
                <td style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}>{gstRate}%</td>
                <td style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'right' }}>{fmtNum(cgst)}</td>
                <td style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'center' }}>{gstRate}%</td>
                <td style={{ border: '1.5px solid #000', padding: '3px 6px', textAlign: 'right' }}>{fmtNum(sgst)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer: Certification + Signatory */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', borderTop: 'none', fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ border: '1.5px solid #000', padding: '8px', verticalAlign: 'top', width: '55%' }}>
                  <div style={{ fontWeight: 'bold' }}>This certified that the particulars given are true and correct and the amount indicated represents the price actually charged , and all dispute are subjects to pune jurisdiction</div>
                </td>
                <td style={{ border: '1.5px solid #000', padding: '8px', verticalAlign: 'top', position: 'relative' }}>
                  <div style={{ fontWeight: 'bold', color: '#d00', fontSize: 13 }}>For {company.companyName}</div>
                  <div style={{ minHeight: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative', padding: '4px 0' }}>
                    {showStamp &&
                      settings?.stampUrl !== 'none' &&
                      company.stampUrl !== 'none' && (
                        <img
                          src={
                            company.stampUrl && company.stampUrl !== 'none'
                              ? company.stampUrl
                              : settings?.stampUrl && settings?.stampUrl !== 'none'
                              ? settings.stampUrl
                              : '/stamp.jpg'
                          }
                          alt="Official Stamp"
                          style={{
                            height: 70,
                            width: 70,
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            opacity: 0.95,
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    {showSignature &&
                      settings?.signatureUrl !== 'none' &&
                      company.signatureUrl !== 'none' && (
                        <img
                          src={
                            company.signatureUrl && company.signatureUrl !== 'none'
                              ? company.signatureUrl
                              : settings?.signatureUrl && settings?.signatureUrl !== 'none'
                              ? settings.signatureUrl
                              : '/signature.jpg'
                          }
                          alt="Authorized Signature"
                          style={{
                            height: 52,
                            width: 'auto',
                            maxWidth: 150,
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
                    <span>Received sign</span>
                    <span style={{ fontWeight: 'bold', color: '#d00' }}>Authorized Signatory</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      className="print-overlay fixed inset-0 z-50 bg-slate-900/70 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
      aria-label="Corporate Tax Invoice"
    >
      <div className="print-shell bg-white max-w-5xl mx-auto h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 sm:p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <Receipt size={18} weight="bold" className="text-amber-400" />
              Corporate Tax Invoice
            </h2>
            {/* Tab Toggle */}
            <div className="flex bg-slate-800 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setActiveView('editor')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                  activeView === 'editor'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PencilSimple size={13} weight="bold" className="inline mr-1" />
                Customize
              </button>
              <button
                type="button"
                onClick={() => setActiveView('preview')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                  activeView === 'preview'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye size={13} weight="bold" className="inline mr-1" />
                Preview
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setActiveView('preview'); setTimeout(() => window.print(), 300); }}
              className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded text-xs shadow transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
            >
              <Printer size={15} weight="bold" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveView('preview'); setTimeout(handleSavePdf, 300); }}
              disabled={downloading}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs shadow transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer disabled:opacity-50"
            >
              <FilePdf size={15} weight="bold" />
              <span>{downloading ? 'Saving…' : downloaded ? 'Saved ✓' : 'Save PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-colors cursor-pointer flex items-center justify-center"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'editor' ? renderEditor() : renderPreview()}
        </div>
      </div>
    </div>
  );
}
