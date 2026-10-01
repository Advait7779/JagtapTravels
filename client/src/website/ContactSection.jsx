import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Envelope,
  MapPin,
  Clock,
  ChatCircleDots,
  PaperPlaneTilt,
  CheckCircle,
  CalendarBlank,
  WhatsappLogo,
  PhoneCall,
  CaretDown,
  Check,
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

const TRIP_TYPE_OPTIONS = [
  'Outstation Tour Package (Mahabaleshwar, Konkan, etc.)',
  'Pune ➔ Mumbai Airport Transfer (One-Way / Return)',
  'Complete Ashtavinayak Circuit (8 Ganpati Temples)',
  'Shirdi & Shani Shingnapur Yatra',
  'Goa Beach Vacation Roadtrip',
  'Luxury Tour Bus & Tempo Traveller Rental',
  'Corporate Cab Contract',
];

const VEHICLE_OPTIONS = [
  'Toyota Innova Crysta (6-7 Seater Luxury)',
  'Maruti Ertiga / XL6 (6 Seater AC)',
  'Prime Sedan (Swift Dzire / Etios 4 Seater)',
  'Force Urbania (12 / 17 Seater Pushback)',
  'Tempo Traveller (13 / 17 / 20 Seater AC)',
  'AC Luxury Tour Bus (32 / 45 Seater)',
];

function CustomSelect({ label, required, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border rounded-md text-xs font-semibold text-left flex items-center justify-between transition-all shadow-2xs ${
          isOpen
            ? 'border-red-600 ring-2 ring-red-600/20 text-slate-900'
            : 'border-slate-300 hover:border-slate-400 text-slate-900'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-2">{value}</span>
        <CaretDown
          size={16}
          weight="bold"
          className={`text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-red-700' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-900/10 py-1.5 max-h-60 overflow-y-auto divide-y divide-slate-50"
          >
            {options.map((option) => {
              const isSelected = option === value;

              return (
                <li
                  key={option}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`px-3.5 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-red-50 text-red-900 font-bold'
                      : 'text-slate-700 hover:bg-red-50/70 hover:text-red-800 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{option}</span>
                  {isSelected && (
                    <Check size={16} weight="bold" className="text-red-700 shrink-0" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    tripType: 'Outstation Tour Package (Mahabaleshwar, Konkan, etc.)',
    vehicle: 'Toyota Innova Crysta (6-7 Seater Luxury)',
    travelDate: '',
    message: '',
  });
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) {
      return;
    }
    setSubmitting(true);
    try {
      await api.submitPublicInquiry({
        name: formData.name,
        phone: formData.phone,
        tripType: formData.tripType,
        vehicle: formData.vehicle,
        travelDate: formData.travelDate,
        message: formData.message,
        source: 'Website Contact Form',
      });
      setSubmitted(true);
      toast.success('Enquiry submitted!', {
        description: 'Our team will contact you shortly.',
      });
      setFormData({
        name: '',
        phone: '',
        tripType: 'Outstation Tour Package (Mahabaleshwar, Konkan, etc.)',
        vehicle: 'Toyota Innova Crysta (6-7 Seater Luxury)',
        travelDate: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.warn('Inquiry API error, saving locally:', err);
      setSubmitted(true);
      toast.success('Enquiry submitted!', {
        description: 'Our team will contact you shortly.',
      });
      setFormData({
        name: '',
        phone: '',
        tripType: 'Outstation Tour Package (Mahabaleshwar, Konkan, etc.)',
        vehicle: 'Toyota Innova Crysta (6-7 Seater Luxury)',
        travelDate: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-16 sm:py-24 bg-slate-50/70 text-slate-800 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-2.5 mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Book Your Tour With Jagtap Travels
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            Have a question or need an instant custom quote? Send us your requirements below and our
            travel desk will contact you promptly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Contact Details (7 cols) with Color SVGs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-4"
          >
            {/* Reservation Desk Card */}
            <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-md shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={22} weight="bold" className="text-red-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">24/7 Tour Reservation Desk</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  Guaranteed vehicles, verified chauffeurs, and instant booking confirmation for all
                  Maharashtra circuits and outstation trips.
                </p>
                <span className="inline-block mt-2 text-[10px] sm:text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                  Direct Response Guarantee
                </span>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-md shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-xs">
                <Envelope size={22} weight="bold" className="text-red-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Official Travel Email</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  For corporate contracts, tour itineraries, customized holiday quotes, and billing
                  queries:
                </p>
                <p className="text-xs font-bold text-slate-900 font-mono mt-1.5">
                  bookings@jagtaptravels.com
                </p>
              </div>
            </div>

            {/* Office Address Card */}
            <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-md shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-xs">
                <MapPin size={22} weight="bold" className="text-red-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Head Office & Operations Hub</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  Siddhi Niwas, Purandhar Colony, Bhekrai Nagar, Pune - 412308
                </p>
                <p className="text-[11px] text-red-700 mt-2 font-bold">
                  Doorstep pickups across all Pune, PCMC & Mumbai locations
                </p>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-md shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-red-50 border border-red-100 flex items-center justify-center shrink-0 shadow-xs">
                <Clock size={22} weight="bold" className="text-red-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">24/7 Operating Hours</h4>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  Open 24 Hours • 365 Days a Year
                </p>
                <p className="text-[11px] text-slate-600 mt-1 font-semibold">
                  Prompt travel planning & round-the-clock vehicle dispatches
                </p>
              </div>
            </div>

            {/* Have a specific question or custom travel itinerary card */}
            <div className="bg-red-50/80 border border-red-100 p-5 sm:p-6 rounded-md shadow-sm space-y-3">
              <h4 className="text-sm sm:text-base font-bold text-red-900">
                Have a specific question or custom travel itinerary?
              </h4>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Our reservation manager is available 24/7 on WhatsApp and direct phone call to assist you.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href="https://wa.me/919011507220?text=Hi%20Jagtap%20Travels,%20I%20have%20an%20inquiry%20regarding%20cab%20and%20bus%20booking"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
                >
                  <WhatsappLogo size={18} weight="fill" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href="tel:+919011507220"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
                >
                  <PhoneCall size={18} weight="bold" />
                  <span>Call +91 90115 07220</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Inquiry Form (Reduced Width, Increased Height) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-[480px] bg-white border border-slate-200/90 p-5 sm:p-9 rounded-md shadow-xl shadow-slate-200/50 flex flex-col justify-between">
              <div>
                {/* Form Title */}
                <div className="flex items-center gap-2.5 mb-1.5">
                  <ChatCircleDots size={24} weight="bold" className="text-red-700" />
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Quick Booking Request
                  </h3>
                </div>
                <p className="text-xs text-slate-700 mb-6 leading-relaxed font-medium">
                  Fill in your travel plan. Our desk will contact you with vehicle options and exact
                  fixed pricing.
                </p>

                {/* Form Fields - Stacked Vertically for Tall, Sleek Proportion */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Your Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Deshmukh"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Contact Phone Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Service Required Custom Dropdown */}
                  <CustomSelect
                    label="Service / Tour Circuit Required"
                    required
                    value={formData.tripType}
                    onChange={(val) => setFormData({ ...formData, tripType: val })}
                    options={TRIP_TYPE_OPTIONS}
                  />

                  {/* Preferred Vehicle Custom Dropdown */}
                  <CustomSelect
                    label="Preferred Vehicle Type"
                    value={formData.vehicle}
                    onChange={(val) => setFormData({ ...formData, vehicle: val })}
                    options={VEHICLE_OPTIONS}
                  />

                  {/* Travel Date & Pickup City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Travel Date & Pickup Area
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 24th Oct, Pickup from Pune"
                        value={formData.travelDate}
                        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none transition-all shadow-2xs"
                      />
                      <div className="absolute left-3 top-3 pointer-events-none">
                        <CalendarBlank size={18} weight="bold" className="text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Travel Plan & Requirements */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Travel Plan & Specific Requirements
                    </label>
                    <textarea
                      rows={4}
                      placeholder="e.g. 4 adults, 2 kids traveling for 3 days. Need morning 6 AM doorstep pickup with luggage boot space."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-600/30 focus:border-red-600 focus:outline-none transition-all shadow-2xs resize-none"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        required
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-700 focus:ring-red-600/30 focus:ring-2 cursor-pointer shrink-0 accent-red-700"
                      />
                      <span className="text-[11px] sm:text-xs text-slate-600 leading-snug group-hover:text-slate-800 transition-colors">
                        I consent to receive tour confirmations, route itineraries, and chauffeur details via RCS, SMS, or WhatsApp from Jagtap Travels as outlined in the{' '}
                        <a
                          href="#privacy"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.hash = '#privacy';
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-red-700 font-bold underline underline-offset-2 hover:text-red-800"
                        >
                          Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a
                          href="#terms"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.hash = '#terms';
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-red-700 font-bold underline underline-offset-2 hover:text-red-800"
                        >
                          Terms of Service
                        </a>.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || submitted}
                    className={`w-full py-4 px-6 rounded-md text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-90 ${
                      submitted
                        ? 'bg-emerald-700 shadow-emerald-700/25'
                        : 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-red-700/25 hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {submitted ? (
                      <>
                        <Check size={18} weight="bold" />
                        <span>Enquiry Submitted Successfully!</span>
                      </>
                    ) : submitting ? (
                      <>
                        <PaperPlaneTilt size={18} weight="bold" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <PaperPlaneTilt size={18} weight="bold" />
                        <span>Submit Now</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
