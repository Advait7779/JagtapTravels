import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  User,
  Car,
  Calculator,
  Calendar,
  MapPin,
  AlertCircle,
  IndianRupee,
  Gauge,
} from 'lucide-react';
import { formatINR, localDate, dateInput, roundMoney } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';

export default function BillModal({
  isOpen,
  onClose,
  onSave,
  customers = [],
  drivers = [],
  meterReadings = [],
  preselectedCustomer = null,
  preselectedSlip = null,
  preselectedBooking = null,
}) {
  const newForm = () => ({
    billNumber: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    driverId: '',
    driverName: '',
    vehicleName: '',
    vehicleNumber: '',
    tripSource: '',
    tripDestination: '',
    invoiceDate: localDate(),
    startDate: localDate(),
    endDate: localDate(),
    dueDate: localDate(15),
    startKm: 0,
    endKm: 0,
    totalKm: 0,
    ratePerKm: 16,
    baseFare: 5000,
    driverAllowance: 500,
    tollParking: 1200,
    otherCharges: 0,
    taxPercent: 5,
    taxAmount: 835,
    discount: 0,
    totalAmount: 17535,
    advancePaid: 2000,
    balanceDue: 15535,
    fuelExpense: 6000,
    tollExpense: 1200,
    driverBattaExpense: 500,
    otherExpense: 0,
    totalExpense: 0,
    netProfit: 5775,
    paymentStatus: 'Pending',
    paymentMode: 'Cash',
    notes: '',
  });
  const [formData, setFormData] = useState(newForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill customer, slip, or booking when opening modal
  useEffect(() => {
    if (!isOpen) return;
    setFormData(newForm());
    setError('');
    if (preselectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customerId: preselectedCustomer.id,
        customerName: preselectedCustomer.name,
        customerPhone: preselectedCustomer.phone,
      }));
    }
    if (preselectedSlip) {
      applySlipData(preselectedSlip);
    }
    if (preselectedBooking) {
      setFormData((prev) => ({
        ...prev,
        customerId: preselectedBooking.customerId || '',
        customerName: preselectedBooking.customerName || '',
        customerPhone: preselectedBooking.customerPhone || '',
        driverId: preselectedBooking.driverId || '',
        driverName: preselectedBooking.driverName || '',
        vehicleName: preselectedBooking.vehicleName || preselectedBooking.vehicleType || '',
        vehicleNumber: preselectedBooking.vehicleNumber || '',
        tripSource: preselectedBooking.pickupLocation || '',
        tripDestination: preselectedBooking.dropLocation || '',
        startDate: dateInput(preselectedBooking.startDate) || localDate(),
        endDate: dateInput(preselectedBooking.endDate) || localDate(),
        baseFare: Number(preselectedBooking.estimatedAmount) || 0,
        advancePaid: Number(preselectedBooking.advanceAmount) || 0,
        notes: preselectedBooking.notes ? `Booking #${preselectedBooking.bookingNumber}: ${preselectedBooking.notes}` : `Booking #${preselectedBooking.bookingNumber || ''}`,
      }));
    }
  }, [preselectedCustomer, preselectedSlip, preselectedBooking, isOpen]);

  const applySlipData = (slip) => {
    const customer = customers.find((c) => String(c.id) === String(slip.customerId));
    setFormData((prev) => ({
      ...prev,
      linkedSlipId: slip.id,
      customerId: slip.customerId ?? '',
      customerName: slip.customerName ?? '',
      customerPhone: customer?.phone ?? '',
      driverId: slip.driverId ?? '',
      driverName: slip.driverName ?? '',
      vehicleName: slip.vehicleName ?? '',
      vehicleNumber: slip.vehicleNumber ?? '',
      tripSource: slip.tripSource ?? '',
      tripDestination: slip.tripDestination ?? '',
      startDate: dateInput(slip.startDate),
      endDate: dateInput(slip.endDate),
      startKm: slip.openingKm ?? 0,
      endKm: slip.closingKm ?? 0,
      totalKm: slip.totalKm ?? 0,
      ratePerKm: slip.ratePerKm ?? 0,
      baseFare: roundMoney(Number(slip.totalKm ?? 0) * Number(slip.ratePerKm ?? 0)),
      tollParking: slip.tollParking ?? 0,
      driverAllowance: slip.driverAllowance ?? 0,
    }));
  };

  // Recalculate totals dynamically
  useEffect(() => {
    const base = Number(formData.baseFare) || 0;
    const allowance = Number(formData.driverAllowance) || 0;
    const toll = Number(formData.tollParking) || 0;
    const other = Number(formData.otherCharges) || 0;
    const subtotal = roundMoney(base + allowance + toll + other);

    const taxPercent = Number(formData.taxPercent) || 0;
    const taxAmount = roundMoney((subtotal * taxPercent) / 100);
    const discount = Number(formData.discount) || 0;
    const total = roundMoney(Math.max(0, subtotal + taxAmount - discount));

    const advance = Number(formData.advancePaid) || 0;
    const balance = roundMoney(Math.max(0, total - advance));

    const fuel = Number(formData.fuelExpense) || 0;
    const tollExp = Number(formData.tollExpense) || 0;
    const batta = Number(formData.driverBattaExpense) || 0;
    const otherExp = Number(formData.otherExpense) || 0;
    const totalExpense = roundMoney(fuel + tollExp + batta + otherExp);
    const netProfit = roundMoney(total - totalExpense);

    const paymentStatus = balance === 0 ? 'Paid' : advance > 0 ? 'Partial' : 'Pending';

    setFormData((prev) => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount: total,
      balanceDue: balance,
      totalExpense,
      netProfit,
      paymentStatus,
    }));
  }, [
    formData.baseFare,
    formData.driverAllowance,
    formData.tollParking,
    formData.otherCharges,
    formData.taxPercent,
    formData.discount,
    formData.advancePaid,
    formData.fuelExpense,
    formData.tollExpense,
    formData.driverBattaExpense,
    formData.otherExpense,
  ]);

  if (!isOpen) return null;

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setFormData((prev) => ({ ...prev, customerId: '', customerName: '', customerPhone: '' }));
      return;
    }
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        customerId: found.id,
        customerName: found.name,
        customerPhone: found.phone,
      }));
    }
  };

  const handleDriverChange = (e) => {
    const driverId = e.target.value;
    if (!driverId) {
      setFormData((prev) => ({
        ...prev,
        driverId: '',
        driverName: '',
        vehicleName: '',
        vehicleNumber: '',
      }));
      return;
    }
    const found = drivers.find((d) => String(d.id) === String(driverId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        driverId: found.id,
        driverName: found.name,
        vehicleName: found.vehicleAssigned || found.vehicle_assigned || 'Tour Vehicle',
        vehicleNumber: found.vehicleNumber || found.vehicle_number || '',
      }));
    }
  };

  const handleSlipChange = (e) => {
    const slipId = e.target.value;
    if (!slipId) {
      setFormData((prev) => ({
        ...prev,
        linkedSlipId: '',
        startKm: 0,
        endKm: 0,
        totalKm: 0,
        ratePerKm: 0,
      }));
      return;
    }
    const found = meterReadings.find((s) => String(s.id) === String(slipId));
    if (found) {
      applySlipData(found);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!formData.tripSource.trim() || !formData.tripDestination.trim()) {
      setError('Trip Pickup Source and Destination are required.');
      return;
    }

    if (!formData.startDate || !formData.endDate || formData.endDate < formData.startDate) {
      setError('Enter valid trip dates; the end cannot precede the start.');
      return;
    }
    if (Number(formData.advancePaid) > formData.totalAmount) {
      setError('Advance exceeds the invoice value.');
      return;
    }
    if (Number(formData.discount) > roundMoney(formData.subtotal + formData.taxAmount)) {
      setError('Discount exceeds the invoice value.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        ...formData,
        kmAmount: formData.baseFare, // Map baseFare for backward compatibility
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-md sm:rounded-md shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-navy-950 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>Generate Customer Bill / Tax Invoice</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Jagtap Travels • Billing & Trip Settlement
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Optional: Link from Recorded Meter Reading */}
          {meterReadings.length > 0 && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-950">
                    Link Recorded Meter Reading (Optional)
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Auto-fill vehicle, route, and charges from logged trip slip
                  </p>
                </div>
              </div>
              <ThemedSelect
                value={formData.linkedSlipId}
                onChange={handleSlipChange}
                containerClassName="w-full sm:w-64"
                className="w-full form-input"
                placeholder="-- No Linked Slip (Direct Billing) --"
              >
                <option value="">-- No Linked Slip (Direct Billing) --</option>
                {meterReadings
                  .filter((m) => m.status === 'Completed')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.slipNumber || m.slip_number} • {m.vehicleName} ({m.totalKm || 0} KM)
                    </option>
                  ))}
              </ThemedSelect>
            </div>
          )}

          {/* Section 1: Customer & Driver selection */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600" />
              <span>1. Customer & Driver Assignment</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Existing Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Existing Customer (Optional auto-fill)
                </label>
                <ThemedSelect
                  value={formData.customerId}
                  disabled={!!formData.linkedSlipId}
                  onChange={handleCustomerChange}
                  className="w-full form-input"
                  placeholder="-- Choose Customer or Enter Below --"
                >
                  <option value="">-- Choose Customer or Enter Below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              {/* Select Driver */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Fleet Driver
                </label>
                <ThemedSelect
                  value={formData.driverId}
                  disabled={!!formData.linkedSlipId}
                  onChange={handleDriverChange}
                  className="w-full form-input"
                  placeholder="-- Choose Driver --"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} • {d.vehicleAssigned || d.vehicle_assigned || 'Fleet'}
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              {/* Customer Name Manual */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.customerName}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98230 11223"
                  value={formData.customerPhone}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              {/* Vehicle Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Innova Crysta"
                  value={formData.vehicleName}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Registration Plate
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 QX 4589"
                  value={formData.vehicleNumber}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 uppercase focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="form-label">
              Invoice Issue Date
              <input
                className="form-input"
                type="date"
                required
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </label>
            <label className="form-label">
              Payment Due Date
              <input
                className="form-input font-bold text-navy-950"
                type="date"
                required
                value={formData.dueDate || formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </label>
          </div>
          {/* Section 2: Trip Route & Dates */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span>2. Route & Journey Dates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup / Starting Point <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Airport / City"
                  value={formData.tripSource}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, tripSource: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Point / Tour <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar - Panchgani Return"
                  value={formData.tripDestination}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, tripDestination: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Trip Fare & Charges (Clean, meter reading separated!) */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-slate-600" />
              <span>3. Trip Fare & Charges Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Base Fare / Package Rate (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 5000"
                  value={formData.baseFare}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Allowance (Batta / Night) (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.driverAllowance}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, driverAllowance: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Toll, State Tax & Parking (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.tollParking}
                  readOnly={!!formData.linkedSlipId}
                  onChange={(e) => setFormData({ ...formData, tollParking: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            {/* GST, Discount, and Advance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST Tax Rate (%)
                </label>
                <ThemedSelect
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
                  className="w-full form-input"
                >
                  <option value="0">0% (No Tax)</option>
                  <option value="5">5% (Tour Operator GST)</option>
                  <option value="12">12% (Standard GST)</option>
                  <option value="18">18% (Luxury / AC)</option>
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advance Paid by Customer (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.advancePaid}
                  onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <ThemedSelect
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="w-full form-input"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <ThemedSelect
                  value={formData.paymentStatus}
                  disabled
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full form-input"
                >
                  <option value="Paid">Paid in Full</option>
                  <option value="Partial">Partial Payment</option>
                  <option value="Pending">Payment Pending</option>
                </ThemedSelect>
              </div>
            </div>
          </div>

          {/* Section 3.5: Operational Expenses & Trip Net Profit */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-slate-600" />
                <span>Trip Operational Expenses & Net Profit</span>
              </h4>
              <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Est. Profit: {formatINR(formData.netProfit || 0)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">Fuel / Diesel (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.fuelExpense || ''}
                  onChange={(e) => setFormData({ ...formData, fuelExpense: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">Toll / Fastag (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.tollExpense || ''}
                  onChange={(e) => setFormData({ ...formData, tollExpense: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">Driver Batta (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.driverBattaExpense || ''}
                  onChange={(e) => setFormData({ ...formData, driverBattaExpense: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">Other Expense (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.otherExpense || ''}
                  onChange={(e) => setFormData({ ...formData, otherExpense: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
            <div className="flex justify-between text-2xs font-medium text-slate-500 pt-1">
              <span>Total Operating Cost: {formatINR(formData.totalExpense || 0)}</span>
              <span className="font-bold text-slate-700">Net Margin: {formData.totalAmount > 0 ? Math.round(((formData.netProfit || 0) / formData.totalAmount) * 100) : 0}%</span>
            </div>
          </div>

          {/* Section 4: Live Invoice Summary */}
          <div className="bg-navy-950 text-white p-4 rounded-md space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Trip Base Fare:</span>
              <span className="font-mono">{formatINR(formData.baseFare)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Driver Allowance + Toll & Parking:</span>
              <span className="font-mono">
                {formatINR(
                  (Number(formData.driverAllowance) || 0) + (Number(formData.tollParking) || 0),
                )}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST ({formData.taxPercent}%):</span>
              <span className="font-mono">{formatINR(formData.taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-navy-800 flex justify-between text-sm font-bold text-white">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-base text-blue-300">
                {formatINR(formData.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Advance Received:</span>
              <span className="font-mono text-emerald-400">
                (-) {formatINR(formData.advancePaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-navy-900">
              <span className="text-amber-400">Balance Due Payable:</span>
              <span className="font-mono text-amber-400">{formatINR(formData.balanceDue)}</span>
            </div>
            {formData.totalExpense > 0 && (
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-navy-900 text-emerald-400">
                <span>Net Estimated Trip Profit:</span>
                <span className="font-mono">{formatINR(formData.netProfit)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bill Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Package trip includes night driving charges."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-center"
            >
              <Receipt className="w-4 h-4 text-blue-300 shrink-0" />
              <span>{loading ? 'Creating Bill...' : 'Generate Customer Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
