import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  User,
  Phone,
  MapPin,
  Car,
  Clock,
  CurrencyInr,
  Users,
  AirplaneTakeoff,
  Note,
  CheckCircle,
} from '@phosphor-icons/react';
import ThemedSelect from '../ThemedSelect';

export default function BookingModal({
  isOpen,
  onClose,
  onSave,
  bookingToEdit,
  initialData,
  customers = [],
  drivers = [],
  vehicles = [],
  settings = {},
}) {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupLocation: 'Pune',
    dropLocation: '',
    pickupAddress: '',
    pickupTime: '06:00 AM',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    vehicleType: 'Innova Crysta',
    vehicleId: '',
    vehicleName: '',
    vehicleNumber: '',
    driverId: '',
    driverName: '',
    passengerCount: 4,
    flightTrainNumber: '',
    estimatedAmount: 0,
    advanceAmount: 0,
    status: 'Confirmed',
    notes: '',
    saveToCustomers: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingToEdit) {
      setFormData({
        customerId: bookingToEdit.customerId || '',
        customerName: bookingToEdit.customerName || '',
        customerPhone: bookingToEdit.customerPhone || '',
        customerEmail: bookingToEdit.customerEmail || '',
        pickupLocation: bookingToEdit.pickupLocation || '',
        dropLocation: bookingToEdit.dropLocation || '',
        pickupAddress: bookingToEdit.pickupAddress || '',
        pickupTime: bookingToEdit.pickupTime || '06:00 AM',
        startDate: bookingToEdit.startDate || new Date().toISOString().slice(0, 10),
        endDate: bookingToEdit.endDate || bookingToEdit.startDate || new Date().toISOString().slice(0, 10),
        vehicleType: bookingToEdit.vehicleType || 'Innova Crysta',
        vehicleId: bookingToEdit.vehicleId || '',
        vehicleName: bookingToEdit.vehicleName || '',
        vehicleNumber: bookingToEdit.vehicleNumber || '',
        driverId: bookingToEdit.driverId || '',
        driverName: bookingToEdit.driverName || '',
        passengerCount: bookingToEdit.passengerCount || 4,
        flightTrainNumber: bookingToEdit.flightTrainNumber || '',
        estimatedAmount: bookingToEdit.estimatedAmount || 0,
        advanceAmount: bookingToEdit.advanceAmount || 0,
        status: bookingToEdit.status || 'Confirmed',
        notes: bookingToEdit.notes || '',
      });
    } else if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        startDate: initialData.startDate || initialData.travelDate || prev.startDate,
        endDate: initialData.endDate || initialData.travelDate || prev.endDate,
        customerName: initialData.customerName || initialData.name || '',
        customerPhone: initialData.customerPhone || initialData.phone || '',
        customerEmail: initialData.customerEmail || initialData.email || '',
        dropLocation: initialData.dropLocation || initialData.destination || initialData.tripType || '',
        vehicleType: initialData.vehicleType || initialData.vehicle || prev.vehicleType,
        estimatedAmount: initialData.totalAmount || initialData.baseAmount || 0,
      }));
    } else {
      setFormData({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        pickupLocation: 'Pune',
        dropLocation: '',
        pickupAddress: '',
        pickupTime: '06:00 AM',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        vehicleType: 'Innova Crysta',
        vehicleId: '',
        vehicleName: '',
        vehicleNumber: '',
        driverId: '',
        driverName: '',
        passengerCount: 4,
        flightTrainNumber: '',
        estimatedAmount: 0,
        advanceAmount: 0,
        status: 'Confirmed',
        notes: '',
      });
    }
    setError('');
  }, [bookingToEdit, initialData, isOpen]);

  if (!isOpen) return null;

  // Handle selecting an existing customer from dropdown
  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setFormData((prev) => ({ ...prev, customerId: '' }));
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
        pickupAddress: found.address || prev.pickupAddress,
      }));
    }
  };

  // Handle selecting a vehicle from fleet
  const handleSelectVehicle = (e) => {
    const vId = e.target.value;
    if (!vId) {
      setFormData((prev) => ({ ...prev, vehicleId: '', vehicleName: '', vehicleNumber: '' }));
      return;
    }
    const found = vehicles.find((v) => String(v.id) === String(vId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicleId: found.id,
        vehicleName: found.name,
        vehicleNumber: found.vehicleNumber,
        driverId: found.driverId || prev.driverId,
        driverName: found.driverName || prev.driverName,
      }));
    }
  };

  // Handle selecting a driver
  const handleSelectDriver = (e) => {
    const dId = e.target.value;
    if (!dId) {
      setFormData((prev) => ({ ...prev, driverId: '', driverName: '' }));
      return;
    }
    const found = drivers.find((d) => String(d.id) === String(dId));
    if (found) {
      setFormData((prev) => ({
        ...prev,
        driverId: found.id,
        driverName: found.name,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }
    if (!formData.pickupLocation.trim() || !formData.dropLocation.trim()) {
      setError('Pickup and destination locations are required.');
      return;
    }
    if (!formData.startDate) {
      setError('Start date is required.');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, bookingToEdit?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative bg-white rounded-md shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-900 text-amber-400 rounded-md">
              <CalendarCheck size={22} weight="bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {bookingToEdit ? 'Edit Trip Booking' : 'New Trip Booking & Dispatch'}
              </h2>
              <p className="text-xs text-slate-500">
                Record advance booking, assign chauffeur and fleet vehicle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-md">
              {error}
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <User size={15} weight="bold" className="text-navy-900" />
                1. Customer Information
              </h3>
              {customers.length > 0 && (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Quick select:</span>
                  <ThemedSelect
                    value={formData.customerId || ''}
                    onChange={handleSelectCustomer}
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </ThemedSelect>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Patil"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9822012345"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            {!formData.customerId && (
              <label className="flex items-center gap-2 pt-0.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.saveToCustomers !== false}
                  onChange={(e) => setFormData({ ...formData, saveToCustomers: e.target.checked })}
                  className="w-4 h-4 rounded text-navy-900 focus:ring-navy-900 border-slate-300"
                />
                <span className="text-[11px] font-semibold text-slate-600">
                  Save this customer into Customer Directory for future bookings
                </span>
              </label>
            )}
          </div>

          {/* Section 2: Trip & Route Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <MapPin size={15} weight="bold" className="text-navy-900" />
              2. Trip Route & Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup City / Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune / Airport"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar / Mumbai"
                  value={formData.dropLocation}
                  onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Travel Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                      endDate: e.target.value > formData.endDate ? e.target.value : formData.endDate,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Time</label>
                <input
                  type="text"
                  placeholder="e.g. 06:30 AM"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exact Pickup Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siddhi Niwas, Purandhar Colony, Bhekrai Nagar, Pune"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Vehicle & Chauffeur Assignment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <Car size={15} weight="bold" className="text-navy-900" />
              3. Vehicle & Chauffeur Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Category</label>
                <ThemedSelect
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full form-input"
                >
                  <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios 4+1)</option>
                  <option value="Maruti Ertiga (6+1)">Maruti Ertiga (6+1)</option>
                  <option value="Innova Crysta (6-7+1)">Innova Crysta (6-7+1)</option>
                  <option value="Tempo Traveller 17 Seater">Tempo Traveller 17 Seater</option>
                  <option value="Luxury Bus 32/45 Seater">Luxury Bus 32/45 Seater</option>
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Fleet Vehicle
                </label>
                <ThemedSelect
                  value={formData.vehicleId || ''}
                  onChange={handleSelectVehicle}
                  className="w-full form-input"
                >
                  <option value="">-- Assign Later / Unassigned --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.vehicleNumber}) {v.docStatus === 'Expired' ? '⚠️ Docs Expired' : ''}
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Chauffeur / Driver
                </label>
                <ThemedSelect
                  value={formData.driverId || ''}
                  onChange={handleSelectDriver}
                  className="w-full form-input"
                >
                  <option value="">-- Assign Later / Unassigned --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status}) {d.licenseStatus === 'Expired' ? '⚠️ Lic Expired' : ''}
                    </option>
                  ))}
                </ThemedSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passengers Count</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passengerCount}
                  onChange={(e) => setFormData({ ...formData, passengerCount: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Flight / Train # (Airport/Station Pickup)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6E 543 / Pune Duronto"
                  value={formData.flightTrainNumber}
                  onChange={(e) => setFormData({ ...formData, flightTrainNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Commercials & Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <CurrencyInr size={15} weight="bold" className="text-navy-900" />
              4. Commercials & Booking Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimated Total Fare (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 8500"
                  value={formData.estimatedAmount}
                  onChange={(e) => setFormData({ ...formData, estimatedAmount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Advance Paid by Client (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 2000"
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData({ ...formData, advanceAmount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Booking Status</label>
                <ThemedSelect
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full form-input font-bold"
                >
                  <option value="Confirmed">✅ Confirmed</option>
                  <option value="Dispatched">🚗 Dispatched (On Trip)</option>
                  <option value="Completed">🎉 Completed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </ThemedSelect>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Special Instructions / Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Client requested AC on at pickup, luggage carrier needed, clean white covers."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-md transition-all shadow-sm active:scale-[0.99] flex items-center gap-2"
            >
              <CheckCircle size={16} weight="bold" />
              {loading ? 'Saving...' : bookingToEdit ? 'Update Booking' : 'Confirm & Save Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
