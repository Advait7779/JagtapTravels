import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  User,
  MapPin,
  Car,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatINR, localDate, roundMoney } from '../../utils/formatters';
import ThemedSelect from '../ThemedSelect';

export default function QuotationModal({
  isOpen,
  onClose,
  onSave,
  customers = [],
  preselectedCustomer = null,
}) {
  const newForm = () => ({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tourTitle: '',
    pickupLocation: 'Pune',
    dropLocation: '',
    vehicleType: 'Toyota Innova Crysta',
    durationDays: 3,
    travelDate: localDate(7),
    estimatedKm: 600,
    itinerary: '',
    inclusions: 'AC Vehicle, Fuel, Experienced Driver, Driver Night Allowance',
    exclusions: 'Toll & State Permits, Parking charges, Hotel stay, Meals',
    baseAmount: 15000,
    taxAmount: 750,
    totalAmount: 15750,
    validityDate: localDate(7),
    status: 'Sent',
    notes: '',
  });
  const [formData, setFormData] = useState(newForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle pre-selected customer or lead prefill
  useEffect(() => {
    if (!isOpen) return;
    setFormData(newForm());
    setError('');
    if (preselectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customerId: preselectedCustomer.id || '',
        customerName: preselectedCustomer.name || preselectedCustomer.customerName || '',
        customerPhone: preselectedCustomer.phone || preselectedCustomer.customerPhone || '',
        customerEmail: preselectedCustomer.email || preselectedCustomer.customerEmail || '',
        tourTitle: preselectedCustomer.tourTitle || preselectedCustomer.tripType || prev.tourTitle,
        vehicleType: preselectedCustomer.vehicleType || preselectedCustomer.vehicle || prev.vehicleType,
        pickupLocation: preselectedCustomer.pickupLocation || prev.pickupLocation,
        dropLocation: preselectedCustomer.dropLocation || prev.dropLocation,
        notes: preselectedCustomer.notes || preselectedCustomer.message || prev.notes,
      }));
    }
  }, [preselectedCustomer, isOpen]);

  // Recalculate tax and total
  useEffect(() => {
    const base = Number(formData.baseAmount) || 0;
    const tax = roundMoney((base * 5) / 100); // 5% GST
    setFormData((prev) => ({
      ...prev,
      taxAmount: tax,
      totalAmount: roundMoney(base + tax),
    }));
  }, [formData.baseAmount]);

  if (!isOpen) return null;

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
      }));
      return;
    }
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        customerId: found.id,
        customerName: found.name,
        customerPhone: found.phone,
        customerEmail: found.email || '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.tourTitle.trim()) {
      setError('Customer name and Tour Package Title are required.');
      return;
    }
    if (!formData.pickupLocation.trim() || !formData.dropLocation.trim()) {
      setError('Pickup and Drop locations are required.');
      return;
    }

    if (formData.travelDate && formData.validityDate > formData.travelDate) {
      setError('Validity cannot be later than the travel date.');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create quotation.');
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
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>Create Customer Quotation / Estimate</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Jagtap Travels • Pricing & Itinerary
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

          {/* Section 1: Customer Details */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600" />
              <span>1. Customer Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Existing Customer (Optional)
                </label>
                <ThemedSelect
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  className="w-full form-input"
                >
                  <option value="">-- Choose Customer or Fill Details --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98230 11223"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tour & Vehicle Details */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-slate-600" />
              <span>2. Tour Package & Vehicle Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tour Package / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar Weekend Tour (3 Days) or Ashtavinayak Darshan"
                  value={formData.tourTitle}
                  onChange={(e) => setFormData({ ...formData, tourTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune City / Airport"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drop / Destination Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar - Panchgani & Return"
                  value={formData.dropLocation}
                  onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Type Offered
                </label>
                <ThemedSelect
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full form-input"
                >
                  <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios - 4 Seater)</option>
                  <option value="Maruti Ertiga (7 Seater)">Maruti Ertiga (7 Seater)</option>
                  <option value="Toyota Innova Crysta">Toyota Innova Crysta (7 Seater)</option>
                  <option value="Tempo Traveller (17 Seater)">Tempo Traveller (17 Seater)</option>
                  <option value="Tempo Traveller (26 Seater)">Tempo Traveller (26 Seater)</option>
                  <option value="Luxury Coach Bus (32/45 Seater)">
                    Luxury Coach Bus (32/45 Seater)
                  </option>
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tour Duration (Days)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  max="60"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Travel Date
                </label>
                <input
                  type="date"
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Validity Date
                </label>
                <input
                  type="date"
                  value={formData.validityDate}
                  onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Itinerary & Inclusions */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>3. Itinerary, Inclusions & Exclusions</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Day-wise Itinerary Outline
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Day 1: Departure from Pune, hotel check-in. Day 2: Sightseeing points. Day 3: Return to Pune."
                value={formData.itinerary}
                onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inclusions (What's included in price)
                </label>
                <textarea
                  rows={2}
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exclusions (Customer to pay directly)
                </label>
                <textarea
                  rows={2}
                  value={formData.exclusions}
                  onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Pricing & Status */}
          <div className="bg-navy-950 text-white p-4 rounded-md space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Estimated Base Package Cost (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.baseAmount}
                  onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-white font-mono focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <span className="block text-slate-400 font-medium mb-1">GST Tax (5%):</span>
                <p className="text-sm font-mono text-slate-200 py-2">
                  {formatINR(formData.taxAmount)}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="block text-slate-400 font-medium mb-1">
                  Total Quotation Value:
                </span>
                <p className="text-lg font-mono font-bold text-blue-300">
                  {formatINR(formData.totalAmount)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-navy-850 flex items-center justify-between">
              <label className="text-slate-300 font-medium">Initial Quotation Status:</label>
              <ThemedSelect
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-2.5 py-1 rounded bg-navy-900 border border-navy-700 text-xs font-semibold text-slate-200"
              >
                <option value="Sent">Sent (Ready to dispatch)</option>
                <option value="Draft">Draft (Internal review)</option>
                <option value="Accepted">Accepted (Customer confirmed)</option>
                <option value="Rejected">Rejected</option>
              </ThemedSelect>
            </div>
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
              <Send className="w-4 h-4 text-blue-300 shrink-0" />
              <span>{loading ? 'Creating Quote...' : 'Save & Prepare Quotation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
