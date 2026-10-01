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
  FloppyDisk,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { formatINR, formatDate, localDate, numberToWordsIndian } from '../../utils/formatters';
import { toast } from '../../context/ToastContext';
import { api } from '../../services/api';
import ThemedSelect from '../ThemedSelect';

const MONTH_NAMES = [
  '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
const EMPTY_LIST = Object.freeze([]);
const EMPTY_SETTINGS = Object.freeze({});

const defaultCompany = {
  companyName: 'JAGTAP TRAVELS',
  address: 'SIDDHI NIWAS, PURANDHAR COLONY,\nBHEKRAI NAGAR , PUNE - 412308',
  gstin: '27AKGPJ1825N1ZX',
  email: 'jagtap.travels1985@gmail.com',
  contact: '9011507220',
  hsnSac: '996419',
  bankName: 'AXIS BANK',
  bankBranch: 'SASWAD',
  bankAccountNo: '916020073533410',
  bankIfsc: 'UTIB0002985',
};

const mergeCompanySettings = (current, settings = {}) => ({
  ...current,
  ...settings,
  gstin: settings.gstNumber || settings.gstin || current.gstin || '',
  contact: settings.phone || settings.contact || current.contact || '',
  hsnSac: settings.hsnSac || settings.hsnCode || current.hsnSac || '996419',
  bankAccountNo: settings.accountNumber || settings.bankAccountNo || current.bankAccountNo || '',
  bankIfsc: settings.ifsc || settings.bankIfsc || current.bankIfsc || '',
});

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

const emptyTollItem = (defaultVehicle = '') => ({
  id: Date.now() + Math.random(),
  vehicle: defaultVehicle,
  type: 'TOLL',
  label: '',
  amount: '',
});

export default function CorporateInvoiceModal({
  isOpen,
  onClose,
  contract = null,
  tripLogs = EMPTY_LIST,
  customers = EMPTY_LIST,
  vehicles = EMPTY_LIST,
  selectedMonth = '',
  settings = EMPTY_SETTINGS,
  initialIsNonGst = false,
  initialInvoiceData = null,
  onInvoiceSaved = null,
}) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'preview'

  // Invoice format state
  const [isNonGst, setIsNonGst] = useState(Boolean(initialIsNonGst));
  const [invoiceTitle, setInvoiceTitle] = useState(initialIsNonGst ? 'INVOICE' : 'Tax Invoice');

  // Invoice header fields
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(localDate());
  const [period, setPeriod] = useState('');
  const [poNo, setPoNo] = useState('');

  // Synchronize format state whenever initialIsNonGst or modal opens
  useEffect(() => {
    setIsNonGst(Boolean(initialIsNonGst));
    setInvoiceTitle(initialIsNonGst ? 'INVOICE' : 'Tax Invoice');
  }, [initialIsNonGst, isOpen]);

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
  const [gstRate, setGstRate] = useState(initialIsNonGst ? 0 : 9); // Each side (CGST = 9%, SGST = 9%, or 0% for Non-GST)

  // Stamp & Signature toggles - synchronized with saved settings
  const [showStamp, setShowStamp] = useState(settings?.stampUrl !== 'none');
  const [showSignature, setShowSignature] = useState(settings?.signatureUrl !== 'none');

  // Resolved stamp and signature URLs (authoritative settings take precedence over stale invoice cache)
  const isStampRemoved = settings?.stampUrl === 'none';
  const effectiveStampUrl = useMemo(() => {
    if (isStampRemoved) return null;
    if (settings?.stampUrl && settings.stampUrl !== 'none') return settings.stampUrl;
    if (company?.stampUrl && company.stampUrl !== 'none') return company.stampUrl;
    return '/stamp.jpg';
  }, [isStampRemoved, settings?.stampUrl, company?.stampUrl]);

  const isSignatureRemoved = settings?.signatureUrl === 'none';
  const effectiveSignatureUrl = useMemo(() => {
    if (isSignatureRemoved) return null;
    if (settings?.signatureUrl && settings.signatureUrl !== 'none') return settings.signatureUrl;
    if (company?.signatureUrl && company.signatureUrl !== 'none') return company.signatureUrl;
    return '/signature.jpg';
  }, [isSignatureRemoved, settings?.signatureUrl, company?.signatureUrl]);

  // Keep company profile and stamp/signature synchronized whenever settings prop updates
  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) return;
    setCompany((prev) => ({
      ...mergeCompanySettings(prev, settings),
      stampUrl: (settings.stampUrl !== undefined && settings.stampUrl !== 'none') ? settings.stampUrl : prev.stampUrl,
      signatureUrl: (settings.signatureUrl !== undefined && settings.signatureUrl !== 'none') ? settings.signatureUrl : prev.signatureUrl,
    }));
    if (settings.stampUrl === 'none') {
      setShowStamp(false);
    } else if (settings.stampUrl) {
      setShowStamp(true);
    }
    if (settings.signatureUrl === 'none') {
      setShowSignature(false);
    } else if (settings.signatureUrl) {
      setShowSignature(true);
    }
  }, [settings?.stampUrl, settings?.signatureUrl, settings]);

  // Persistence state
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);

  // Populate from contract + trip logs (default initializer)
  const initializeFromContractAndLogs = useCallback(() => {
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
    const monthStart = selectedMonth ? `${selectedMonth}-01` : `${localDate().slice(0, 7)}-01`;
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

    // Extract clean short vehicle name (e.g. 'INNOVA', 'ERTIGA', etc.)
    const rawVeh = contract.vehicleName || matchedVehicle?.name || matchedVehicle?.model || 'INNOVA';
    const shortVeh = rawVeh
      .replace(/Toyota /i, '')
      .replace(/ Crysta/i, '')
      .replace(/Maruti /i, '')
      .replace(/Suzuki /i, '')
      .trim()
      .split(' ')[0]
      .toUpperCase() || 'INNOVA';

    if (totalToll > 0) {
      setTollItems([{
        id: Date.now() + 1,
        vehicle: shortVeh,
        type: 'TOLL & PARKING',
        label: `${contract.vehicleNumber || 'Vehicle'} TOLL & PARKING`,
        amount: totalToll,
      }]);
    } else {
      setTollItems([]);
    }

    // Merge settings & synchronize stamp/signature toggles
    setCompany((prev) => mergeCompanySettings(prev, settings));
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

    if (initialIsNonGst) {
      setGstRate(0);
      setInvoiceTitle('INVOICE');
      setIsNonGst(true);
    } else {
      setGstRate(9);
      setInvoiceTitle('Tax Invoice');
      setIsNonGst(false);
    }
  }, [contract, selectedMonth, tripLogs, customers, vehicles, settings, initialIsNonGst]);

  // Apply saved invoice payload into state
  const applySavedInvoiceData = useCallback((data) => {
    if (!data) return false;
    if (data.isNonGst !== undefined) {
      setIsNonGst(Boolean(data.isNonGst));
    }
    if (data.invoiceTitle !== undefined) {
      setInvoiceTitle(data.invoiceTitle || (data.isNonGst ? 'INVOICE' : 'Tax Invoice'));
    } else if (data.isNonGst) {
      setInvoiceTitle('INVOICE');
    } else {
      setInvoiceTitle('Tax Invoice');
    }
    if (data.invoiceNo !== undefined) setInvoiceNo(data.invoiceNo || '');
    if (data.invoiceDate !== undefined) setInvoiceDate(data.invoiceDate || localDate());
    if (data.period !== undefined) setPeriod(data.period || '');
    if (data.poNo !== undefined) setPoNo(data.poNo || '');
    if (data.vehicleType !== undefined) setVehicleType(data.vehicleType || '');
    if (data.vehicleNumbers !== undefined) setVehicleNumbers(data.vehicleNumbers || '');
    if (data.partyName !== undefined) setPartyName(data.partyName || '');
    if (data.partyAddress !== undefined) setPartyAddress(data.partyAddress || '');
    if (data.partyGstin !== undefined) setPartyGstin(data.partyGstin || '');
    if (data.company && typeof data.company === 'object') {
      setCompany((prev) =>
        mergeCompanySettings(
          {
            ...prev,
            ...data.company,
            stampUrl: data.company.stampUrl || prev.stampUrl,
            signatureUrl: data.company.signatureUrl || prev.signatureUrl,
          },
          settings,
        ),
      );
    }
    if (Array.isArray(data.lineItems) && data.lineItems.length > 0) {
      setLineItems(data.lineItems);
    }
    if (Array.isArray(data.tollItems)) {
      setTollItems(data.tollItems);
    }
    if (data.gstRate !== undefined) setGstRate(Number(data.gstRate) || 0);

    if (settings?.stampUrl && settings.stampUrl !== 'none') {
      setShowStamp(true);
    } else if (settings?.stampUrl === 'none') {
      setShowStamp(false);
    } else if (data.showStamp !== undefined) {
      setShowStamp(Boolean(data.showStamp));
    }

    if (settings?.signatureUrl && settings.signatureUrl !== 'none') {
      setShowSignature(true);
    } else if (settings?.signatureUrl === 'none') {
      setShowSignature(false);
    } else if (data.showSignature !== undefined) {
      setShowSignature(Boolean(data.showSignature));
    }

    setIsSaved(true);
    setSavedInvoiceId(data.id || null);
    setSavedAt(data.updatedAt || new Date().toISOString());
    return true;
  }, [settings]);

  // Computed totals
  const computedTotals = useMemo(() => {
    const lineTotal = lineItems.reduce((acc, item) => {
      const pkgAmt = Number(item.packageAmount) || 0;
      const extAmt = Number(item.extraAmount) || 0;
      const amt = item.amount !== undefined && item.amount !== '' ? Number(item.amount) : pkgAmt + extAmt;
      return acc + amt;
    }, 0);
    const tollTotal = tollItems.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const taxableValue = lineTotal + tollTotal;
    const effectiveGstRate = isNonGst ? 0 : gstRate;
    const cgst = Math.round(taxableValue * (effectiveGstRate / 100));
    const sgst = Math.round(taxableValue * (effectiveGstRate / 100));
    const grandTotal = taxableValue + cgst + sgst;
    return { lineTotal, tollTotal, taxableValue, cgst, sgst, grandTotal };
  }, [lineItems, tollItems, gstRate, isNonGst]);

  // Load an explicitly selected invoice, or initialize from the contract and sync from the server.
  useEffect(() => {
    if (!contract || !isOpen) return;

    // 0. If direct invoice record passed from Corporate Invoices table, apply immediately
    if (initialInvoiceData) {
      applySavedInvoiceData(initialInvoiceData);
      setActiveView('preview');
      return;
    }

    setSavedInvoiceId(null);
    initializeFromContractAndLogs();
    setIsSaved(false);
    setSavedAt(null);

    // PostgreSQL/JSON repository is authoritative; browser storage is never treated as a save.
    let isCancelled = false;
    api.getSavedCorporateInvoice(contract.id, selectedMonth, initialIsNonGst)
      .then((serverData) => {
        if (!isCancelled && serverData && serverData.id) {
          applySavedInvoiceData(serverData);
          setActiveView('preview');
        }
      })
      .catch((err) => {
        if (!isCancelled)
          toast.error('Unable to load saved invoice', { description: err.message });
      });

    return () => {
      isCancelled = true;
    };
  }, [contract, selectedMonth, isOpen, initialIsNonGst, initialInvoiceData, applySavedInvoiceData, initializeFromContractAndLogs]);

  // Save current invoice changes to the authoritative server repository.
  const handleSaveInvoice = async () => {
    if (!contract) return;
    if (!invoiceNo.trim()) {
      toast.error('Invoice number is required.');
      return;
    }
    if (!invoiceDate) {
      toast.error('Invoice date is required.');
      return;
    }
    if (!partyName.trim()) {
      toast.error('Party name is required.');
      return;
    }
    if (!lineItems.length || lineItems.some((item) => !String(item.particulars || '').trim())) {
      toast.error('Every invoice line requires particulars.');
      return;
    }
    setSaving(true);
    const invoicePayload = {
      ...(savedInvoiceId ? { id: savedInvoiceId } : {}),
      contractId: String(contract.id),
      month: selectedMonth || '',
      isNonGst,
      invoiceTitle,
      invoiceType: isNonGst ? 'nongst' : 'gst',
      invoiceNo,
      invoiceDate,
      period,
      poNo,
      vehicleType,
      vehicleNumbers,
      partyName,
      partyAddress,
      partyGstin,
      company: {
        ...company,
        stampUrl: effectiveStampUrl || company.stampUrl,
        signatureUrl: effectiveSignatureUrl || company.signatureUrl,
      },
      lineItems,
      tollItems,
      gstRate,
      lineTotal: computedTotals.lineTotal,
      tollTotal: computedTotals.tollTotal,
      taxableValue: computedTotals.taxableValue,
      cgst: computedTotals.cgst,
      sgst: computedTotals.sgst,
      grandTotal: computedTotals.grandTotal,
      totalAmount: computedTotals.grandTotal,
      showStamp,
      showSignature,
    };
    try {
      const savedResult = await api.saveCorporateInvoice(contract.id, invoicePayload);
      applySavedInvoiceData(savedResult);
      toast.success(isNonGst ? 'Corporate Non-GST invoice saved successfully!' : 'Corporate Tax invoice saved successfully!');
      setActiveView('preview');
      if (onInvoiceSaved) await onInvoiceSaved(savedResult);
    } catch (err) {
      console.error('Server save error:', err);
      setIsSaved(false);
      toast.error('Invoice was not saved', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Reset to original contract defaults
  const handleResetToDefaults = () => {
    initializeFromContractAndLogs();
    setIsSaved(false);
    setSavedAt(null);
    toast.info('Invoice reset to contract defaults.');
  };


  // Line item handlers
  const updateLineItem = (id, field, value) => {
    setIsSaved(false);
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'packageKm' || field === 'extraKm' || field === 'extraKmRate' || field === 'packageAmount') {
          const extraKm = Number(updated.extraKm) || 0;
          const extraRate = Number(updated.extraKmRate) || 0;
          updated.extraAmount = Math.round(extraKm * extraRate);
          updated.amount = (Number(updated.packageAmount) || 0) + updated.extraAmount;
        } else if (field === 'extraAmount') {
          updated.amount = (Number(updated.packageAmount) || 0) + Number(value || 0);
        }
        return updated;
      }),
    );
  };
  const addLineItem = () => {
    setIsSaved(false);
    setLineItems((prev) => [...prev, emptyLineItem()]);
  };
  const removeLineItem = (id) => {
    setIsSaved(false);
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Toll handlers
  const updateTollItem = (id, field, value) => {
    setIsSaved(false);
    setTollItems((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };
  const addTollItem = () => {
    setIsSaved(false);
    const rawVehicle = vehicleType || contract?.vehicleName || 'INNOVA';
    const shortVeh = rawVehicle
      .replace(/Toyota /i, '')
      .replace(/ Crysta/i, '')
      .replace(/Maruti /i, '')
      .replace(/Suzuki /i, '')
      .trim()
      .split(' ')[0]
      .toUpperCase() || 'INNOVA';

    setTollItems((prev) => [
      ...prev,
      emptyTollItem(shortVeh),
    ]);
  };
  const removeTollItem = (id) => {
    setIsSaved(false);
    setTollItems((prev) => prev.filter((t) => t.id !== id));
  };

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
      const prefix = isNonGst ? 'Corporate-NonGST-Invoice' : 'Corporate-Tax-Invoice';
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `${prefix}-${clientName}-${period || selectedMonth}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
      setDownloaded(true);
    } catch (err) {
      console.error('PDF export failed:', err);
      handlePrint();
    } finally {
      setDownloading(false);
    }
  }, [partyName, period, selectedMonth, isNonGst]);

  // Dedicated Print handler: switches to preview, temporarily silences document.title to eliminate browser print headers
  const handlePrint = useCallback(() => {
    setActiveView('preview');
    setTimeout(() => {
      const originalTitle = document.title;
      document.title = '';
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 500);
    }, 250);
  }, []);

  // Listen for Ctrl+P while invoice modal is open to switch to preview and suppress browser header artifacts
  useEffect(() => {
    if (!isOpen) return;
    let savedTitle = '';
    const handleBeforePrint = () => {
      setActiveView('preview');
      savedTitle = document.title;
      document.title = '';
    };
    const handleAfterPrint = () => {
      if (savedTitle) {
        document.title = savedTitle;
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (savedTitle) {
        document.title = savedTitle;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ──────── EDITOR VIEW ────────
  const renderEditor = () => (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Invoice Meta */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Receipt size={16} weight="bold" /> Invoice Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <label className="form-label">Invoice No
            <input className="form-input" required maxLength={100} value={invoiceNo} onChange={(e) => { setInvoiceNo(e.target.value); setIsSaved(false); }} placeholder="e.g. 390" />
          </label>
          <label className="form-label">Date
            <input className="form-input" required type="date" value={invoiceDate} onChange={(e) => { setInvoiceDate(e.target.value); setIsSaved(false); }} />
          </label>
          <label className="form-label">Period
            <input className="form-input" required maxLength={100} value={period} onChange={(e) => { setPeriod(e.target.value); setIsSaved(false); }} placeholder="e.g. AUGUST" />
          </label>
          <label className="form-label">PO No
            <input className="form-input" value={poNo} onChange={(e) => { setPoNo(e.target.value); setIsSaved(false); }} placeholder="e.g. 4593518741" />
          </label>
          <label className="form-label">HSN/SAC Code
            <input
              className="form-input"
              value={company.hsnSac || '996419'}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, hsnSac: e.target.value }));
                setIsSaved(false);
              }}
              placeholder="996419"
            />
          </label>
        </div>
      </div>


      {/* Party (Client) Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800">Party (Client) Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="form-label">Company Name
            <input className="form-input" required maxLength={200} value={partyName} onChange={(e) => { setPartyName(e.target.value); setIsSaved(false); }} placeholder="e.g. HENKEL ADHESIVE TECHNOLOGIES" />
          </label>
          <label className="form-label">Address
            <input className="form-input" value={partyAddress} onChange={(e) => { setPartyAddress(e.target.value); setIsSaved(false); }} placeholder="Full billing address" />
          </label>
          <label className="form-label">Client GSTIN
            <input className="form-input" value={partyGstin} onChange={(e) => { setPartyGstin(e.target.value); setIsSaved(false); }} placeholder="e.g. 27AAACL1954B1ZW" />
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
                  <td className="p-1 border border-slate-200 text-right font-semibold">
                    <input type="number" className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded font-semibold" value={item.extraAmount ?? ''} onChange={(e) => updateLineItem(item.id, 'extraAmount', e.target.value === '' ? '' : Number(e.target.value))} />
                  </td>
                  <td className="p-1 border border-slate-200 text-right font-bold">
                    <input type="number" className="w-full px-1.5 py-1 text-xs text-right border border-slate-200 rounded font-bold" value={item.amount ?? ''} onChange={(e) => updateLineItem(item.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))} />
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
          <div>
            <h3 className="text-sm font-bold text-slate-800">Toll & Parking Charges</h3>
            <p className="text-[11px] text-slate-500">Each entry appears as its own line above the TOTAL row on the invoice (Vehicle, Toll Type, Amount)</p>
          </div>
          <button
            type="button"
            onClick={addTollItem}
            className="text-xs font-bold text-navy-900 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus size={14} weight="bold" /> Add Toll / Parking Row
          </button>
        </div>
        {tollItems.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-md shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2 text-left w-48">Vehicle</th>
                  <th className="p-2 text-left w-52">Toll Type</th>
                  <th className="p-2 text-right w-40">Amount (₹)</th>
                  <th className="p-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {tollItems.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-1.5">
                      <input
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-semibold uppercase focus:border-navy-900"
                        value={t.vehicle || ''}
                        onChange={(e) => updateTollItem(t.id, 'vehicle', e.target.value.toUpperCase())}
                        placeholder="e.g. INNOVA"
                      />
                    </td>
                    <td className="p-1.5">
                      <ThemedSelect
                        value={t.type || 'TOLL'}
                        onChange={(e) => updateTollItem(t.id, 'type', e.target.value)}
                        className="text-xs font-bold"
                      >
                        <option value="TOLL">TOLL</option>
                        <option value="TOLL & PARKING">TOLL & PARKING</option>
                        <option value="PARKING">PARKING</option>
                        <option value="FASTAG">FASTAG</option>
                      </ThemedSelect>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        className="w-full px-2 py-1 text-xs text-right font-bold border border-slate-200 rounded text-slate-900 focus:border-navy-900"
                        value={t.amount ?? ''}
                        onChange={(e) => updateTollItem(t.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeTollItem(t.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Remove row"
                      >
                        <Trash size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-md p-3 text-center">
            <p className="text-xs text-slate-500">
              No toll or parking entries added yet. Click <span className="font-semibold text-slate-700">"+ Add Toll / Parking Row"</span> to add toll charges above the total.
            </p>
          </div>
        )}
      </div>

      {/* Tax Rate (Only shown for GST Tax Invoice) */}
      {!isNonGst && (
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">GST Rate</h3>
          <div className="flex items-center gap-3">
            {[
              { label: '18% (9% + 9%)', value: 9 },
              { label: '5% (2.5% + 2.5%)', value: 2.5 },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="gstRate"
                  checked={gstRate === opt.value}
                  onChange={() => {
                    setGstRate(opt.value);
                    setIsSaved(false);
                  }}
                  className="accent-navy-900"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Official Stamp & Signature Options */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-800">Stamp & Signature on Invoice</h3>
        <div className="flex items-center gap-6 pt-0.5">
          <label className={`flex items-center gap-2 text-xs font-semibold ${
            isStampRemoved
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-700 cursor-pointer'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(showStamp && !isStampRemoved)}
              onChange={(e) => { setShowStamp(e.target.checked); setIsSaved(false); }}
              disabled={isStampRemoved}
              className="accent-navy-900 rounded"
            />
            <span>Include Official Company Stamp</span>
            {isStampRemoved && (
              <span className="text-[10px] text-rose-600 font-bold ml-1">(Removed in Settings)</span>
            )}
          </label>
          <label className={`flex items-center gap-2 text-xs font-semibold ${
            isSignatureRemoved
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-700 cursor-pointer'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(showSignature && !isSignatureRemoved)}
              onChange={(e) => { setShowSignature(e.target.checked); setIsSaved(false); }}
              disabled={isSignatureRemoved}
              className="accent-navy-900 rounded"
            />
            <span>Include Authorized Signature</span>
            {isSignatureRemoved && (
              <span className="text-[10px] text-rose-600 font-bold ml-1">(Removed in Settings)</span>
            )}
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Line Items Total:</span><span className="font-bold">{fmtNum(computedTotals.lineTotal)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Toll & Parking Total:</span><span className="font-bold text-amber-700">₹ {fmtNum(computedTotals.tollTotal)}</span></div>
        <hr className="border-slate-200" />
        {!isNonGst ? (
          <>
            <div className="flex justify-between"><span className="text-slate-600">Taxable Value (Items + Toll):</span><span className="font-bold">{fmtNum(computedTotals.taxableValue)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">CGST ({gstRate}%):</span><span className="font-semibold">{fmtNum(computedTotals.cgst)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">SGST ({gstRate}%):</span><span className="font-semibold">{fmtNum(computedTotals.sgst)}</span></div>
            <hr className="border-slate-300" />
            <div className="flex justify-between text-base"><span className="font-bold text-black">Grand Total:</span><span className="font-black text-black">₹ {fmtNum(computedTotals.grandTotal)}</span></div>
          </>
        ) : (
          <div className="flex justify-between text-base pt-1"><span className="font-bold text-black">Total Amount:</span><span className="font-black text-black">₹ {fmtNum(computedTotals.grandTotal)}</span></div>
        )}
        <p className="text-[11px] text-slate-600 pt-1" style={{ wordSpacing: '3.5px', letterSpacing: '0.2px' }}>
          <span className="font-semibold text-slate-800">INR :</span> {numberToWordsIndian(computedTotals.grandTotal)}
        </p>
      </div>

      {/* Save Action Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isSaved ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-amber-400 ring-2 ring-amber-400/30'}`} />
          <div className="text-xs">
            {isSaved ? (
              <span className="text-emerald-400 font-semibold">
                Invoice Saved {savedAt ? `(${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : '✓'}
              </span>
            ) : (
              <span className="text-amber-300 font-medium">Unsaved customizations & vehicle rows</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 sm:flex-initial"
            title="Reset all rows and rates back to contract defaults"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>Reset to Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSaveInvoice}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 sm:flex-initial disabled:opacity-50"
          >
            <FloppyDisk size={15} weight="bold" />
            <span>{saving ? 'Saving…' : 'Save Invoice & View Preview'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ──────── INVOICE PREVIEW (Pixel-perfect match) ────────
  const renderPreview = () => {
    const { lineTotal, taxableValue, cgst, sgst, grandTotal } = computedTotals;
    const dateFormatted = invoiceDate
      ? new Date(invoiceDate + 'T12:00:00Z').toLocaleDateString('en-IN', {
          day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata',
        })
      : '';

    return (
      <div className="print-preview-container overflow-y-auto max-h-[calc(100vh-180px)] bg-slate-100 p-3 sm:p-6 print:overflow-visible print:max-h-none print:h-auto print:bg-white print:p-0 print:m-0 print:shadow-none">
        <div
          ref={printRef}
          className="printable-area bg-white mx-auto shadow-lg print:shadow-none print:m-0 print:max-w-none"
          style={{ maxWidth: 820, padding: '28px 32px', fontFamily: "'Times New Roman', Times, serif", fontSize: 13, color: '#000', lineHeight: 1.4 }}
        >
          {/* Title */}
          <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 16, letterSpacing: 4 }}>
            {invoiceTitle ? invoiceTitle.replace(/\s+/g, ' \u00a0 ') : (isNonGst ? 'INVOICE' : 'Tax \u00a0 Invoice')}
          </h1>

          {/* Top Grid: Company Info | Invoice Meta */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <tbody>
              <tr>
                {/* Left: Company Info & Official Logo */}
                <td style={{ border: '1px solid #000', padding: '8px 10px', verticalAlign: 'top', width: '48%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', color: '#000', fontSize: 14 }}>{company.companyName}</div>
                      <div style={{ whiteSpace: 'pre-line', fontSize: 12 }}>{company.address}</div>
                      <div style={{ fontWeight: 'bold', color: '#000', fontSize: 12 }}>GSTIN/UIN: {company.gstin}</div>
                      <div style={{ fontSize: 11 }}>E-Mail :</div>
                      <div style={{ fontSize: 11 }}>{company.email}</div>
                      <div style={{ fontSize: 11 }}>Contact : {company.contact}</div>
                      <div style={{ fontSize: 11 }}>HSN/SAC code : {company.hsnSac || '996419'}</div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 4, marginTop: 12 }}>
                      <img
                        src="/jagtap-logo.png"
                        alt="Jagtap Travels Logo"
                        style={{ height: 92, maxHeight: 100, maxWidth: 180, objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </td>
                {/* Right top: Invoice no */}
                <td style={{ border: '1px solid #000', padding: '8px 10px', fontSize: 12, verticalAlign: 'top', width: '26%' }}>
                  <b>Invoice No :</b> &nbsp;&nbsp; {invoiceNo}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px 10px', fontSize: 12, verticalAlign: 'top', lineHeight: 1.6, width: '26%' }}>
                  <b>Date :</b> &nbsp;&nbsp; {dateFormatted}<br />
                  <b>Period :</b> &nbsp;&nbsp; {period}<br />
                  <b>PO No :</b> &nbsp;&nbsp; {poNo}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Party + Bank Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px 10px', verticalAlign: 'top', width: '48%' }}>
                  <div style={{ fontSize: 12 }}>Party Name :-</div>
                  <div style={{ fontWeight: 'bold', color: '#000', fontSize: 13 }}>{partyName}</div>
                  <div style={{ fontSize: 11, whiteSpace: 'pre-line' }}>{partyAddress}</div>
                  {partyGstin && <div style={{ fontWeight: 'bold', color: '#000', fontSize: 12 }}>GST – {partyGstin}</div>}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px 10px', verticalAlign: 'top', fontSize: 12 }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
            <thead>
              <tr style={{ fontWeight: 'bold', fontSize: 10.5, lineHeight: 1.25 }}>
                <th style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', width: 30 }}>No</th>
                <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'left', verticalAlign: 'middle' }}>Particulars</th>
                <th style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>PACKAGE<br />KM</th>
                <th style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>PACKAGE<br />AMOUNT</th>
                <th style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>EXTRA<br />KM</th>
                <th style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>EXTRA<br />KM RATE</th>
                <th style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>EXTRA KM -<br />HOURS AMOUNT</th>
                <th style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'right', verticalAlign: 'middle' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={item.id} style={{ fontSize: 12 }}>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {item.particulars || item.packageKm ? idx + 1 : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                    {item.particulars}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>
                    {item.packageKm ? fmtNum(item.packageKm) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>
                    {item.packageAmount ? fmtNum(item.packageAmount) : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>
                    {item.extraKm ? fmtNum(item.extraKm) : (item.packageKm ? '0' : '')}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>
                    {item.extraKmRate ? fmtNum(item.extraKmRate) : (item.packageKm ? '0' : '')}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>
                    {item.extraAmount ? fmtNum(item.extraAmount) : (item.packageKm ? '0' : '')}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>
                    {fmtNum(item.amount)}
                  </td>
                </tr>
              ))}
              {/* Vehicle Subtotal row - visible before adding Toll & Parking */}
              {tollItems.length > 0 && (
                <tr style={{ fontSize: 12 }}>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>TOTAL</td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>{fmtNum(lineTotal)}</td>
                </tr>
              )}
              {/* Toll rows - Rendered directly above the final TOTAL row */}
              {tollItems.map((t) => {
                const vehicle = (t.vehicle || '').trim();
                const tollType = (
                  t.type ||
                  (t.label && t.label.toUpperCase().includes('PARKING') ? 'TOLL & PARKING' : t.label ? t.label.toUpperCase() : 'TOLL')
                ).trim();

                return (
                  <tr key={t.id} style={{ fontSize: 12 }}>
                    {vehicle ? (
                      <>
                        <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={4}></td>
                        <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }} colSpan={2}>
                          {vehicle}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>
                          {tollType}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                        <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>
                          {tollType}
                        </td>
                      </>
                    )}
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>
                      {fmtNum(t.amount)}
                    </td>
                  </tr>
                );
              })}
              {/* Totals */}
              {gstRate > 0 ? (
                <>
                  <tr style={{ fontSize: 12 }}>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>TOTAL</td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>{fmtNum(taxableValue)}</td>
                  </tr>
                  <tr style={{ fontSize: 12 }}>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>CGST {gstRate}%</td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>{fmtNum(cgst)}</td>
                  </tr>
                  <tr style={{ fontSize: 12 }}>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>SGST {gstRate}%</td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>{fmtNum(sgst)}</td>
                  </tr>
                  <tr style={{ fontSize: 13, fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>TOTAL</td>
                    <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>{fmtNum(grandTotal)}</td>
                  </tr>
                </>
              ) : (
                <tr style={{ fontSize: 13, fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', verticalAlign: 'middle' }} colSpan={6}></td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle' }}>TOTAL</td>
                  <td style={{ border: '1px solid #000', padding: '6px 6px', textAlign: 'right', verticalAlign: 'middle' }}>{fmtNum(grandTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Amount in words */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px 10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 3 }}>Amount Chargeable (in words)</div>
                  <div style={{ fontSize: 12, wordSpacing: '4.5px', letterSpacing: '0.3px', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 4 }}>INR :</span>
                    {numberToWordsIndian(grandTotal)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>


          {/* Footer: Certification + Signatory */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none', fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px', verticalAlign: 'top', width: '55%' }}>
                  <div style={{ fontWeight: 'bold' }}>This certified that the particulars given are true and correct and the amount indicated represents the price actually charged , and all dispute are subjects to pune jurisdiction</div>
                </td>
                <td style={{ border: '1.5px solid #000', padding: '8px', verticalAlign: 'top', position: 'relative' }}>
                  <div style={{ fontWeight: 'bold', color: '#000', fontSize: 13 }}>For {company.companyName}</div>
                  <div style={{ minHeight: 125, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '4px 6px 2px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 128, flexShrink: 0 }}>
                      {showStamp && !isStampRemoved && effectiveStampUrl && (
                        <img
                          src={effectiveStampUrl}
                          alt="Official Stamp"
                          style={{
                            height: 125,
                            width: 125,
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            opacity: 0.95,
                          }}
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith('/stamp.jpg')) {
                              e.currentTarget.src = '/stamp.jpg';
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 160, flexShrink: 0, paddingRight: 4 }}>
                      {showSignature && !isSignatureRemoved && effectiveSignatureUrl && (
                        <img
                          src={effectiveSignatureUrl}
                          alt="Authorized Signature"
                          style={{
                            height: 68,
                            width: 'auto',
                            maxWidth: 180,
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                          }}
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith('/signature.jpg')) {
                              e.currentTarget.src = '/signature.jpg';
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
                    <span>Received sign</span>
                    <span style={{ fontWeight: 'bold', color: '#000' }}>Authorized Signatory</span>
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
      aria-label={isNonGst ? 'Corporate Non-GST Invoice' : 'Corporate Tax Invoice'}
    >
      <div className="print-shell bg-white max-w-5xl mx-auto h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print print:hidden flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 sm:p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <Receipt size={18} weight="bold" className={isNonGst ? 'text-teal-400' : 'text-amber-400'} />
              {isNonGst ? 'Corporate Non-GST Invoice' : 'Corporate Tax Invoice'}
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
              onClick={handleSaveInvoice}
              disabled={saving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer disabled:opacity-50"
              title="Save current invoice changes, vehicle rows, and preview"
            >
              <FloppyDisk size={15} weight="bold" />
              <span>{saving ? 'Saving…' : isSaved ? 'Invoice Saved ✓' : 'Save Invoice'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
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
