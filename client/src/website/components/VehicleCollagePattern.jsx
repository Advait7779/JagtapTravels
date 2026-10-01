import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Buildings,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react';

export const FLEET_VEHICLES = [
  {
    id: 'ertiga',
    name: 'Maruti Suzuki Ertiga',
    pillLabel: 'Maruti Ertiga',
    category: 'Corporate Tie-Up & 6-7 Seater MPV',
    capacity: '6 - 7 Seater',
    luggage: '4 - 5 Bags',
    tag: 'Company Tie-Up Fleet',
    image: '/images/fleet/ertiga-white.jpg',
    serviceType: 'Corporate Tie-Ups & Outstation',
    features: [
      'Dedicated company tie-up contracts & monthly packages',
      'Employee daily commute & IT park executive pickup',
      'Dual air conditioning with rear cooling vents',
      'Comfortable reclining 7-seater flexible setup',
      'Verified polite chauffeurs & 100% on-time guarantee',
    ],
    idealFor: 'Company tie-ups, IT corporate employee transfers, executive pickups, monthly packages, and family outstation tours across Maharashtra.',
  },
  {
    id: 'innova',
    name: 'Toyota Innova Crysta',
    pillLabel: 'Innova Crysta',
    category: 'Premium Executive & Outstation SUV',
    capacity: '6 - 7 Seater',
    luggage: '5 Large Bags',
    tag: 'Most Popular',
    image: '/images/fleet/innova-crysta.jpg',
    serviceType: 'Executive & VIP Travel',
    features: [
      'Chilled dual air conditioning with rear controls',
      'Captain pushback plush bucket seats',
      'Whisper-quiet expressway ride & smooth suspension',
      'Mobile charging points & spacious boot space',
      'Clean sanitized white executive cab guarantee',
    ],
    idealFor: 'Executive corporate airport transfers, VIP business delegates, and luxury family tours to Mahabaleshwar, Lonavala & Shirdi.',
  },
  {
    id: 'sedan',
    name: 'Maruti Suzuki Dzire',
    pillLabel: 'Dzire Sedan',
    category: 'Corporate & Outstation Sedan',
    capacity: '4 Seater',
    luggage: '3 Bags',
    tag: 'Best Value',
    image: '/images/fleet/sedan-dzire.jpg',
    serviceType: 'Corporate & Outstation',
    features: [
      'Powerful air conditioning & climate control',
      'Smooth suspension & spacious boot for luggage',
      'High fuel efficiency & dependable comfort',
      'Punctual doorstep pickup & drop guarantee',
      'Polite, verified highway & city chauffeur',
    ],
    idealFor: 'Corporate client transfers, solo business travelers, Pune-Mumbai expressway trips, and budget outstation tours.',
  },
  {
    id: 'bus',
    name: 'Luxury AC Tour Bus',
    pillLabel: 'Luxury Coach',
    category: 'Tourist Coach & Corporate Shuttle',
    capacity: '32 - 45 Seater',
    luggage: '40+ Bags in Cargo',
    tag: 'Large Groups & Offsites',
    image: '/images/fleet/luxury-bus.jpg',
    serviceType: 'Corporate Events & Group Tours',
    features: [
      'Pushback luxury recliner seats with ample legroom',
      'Center aisle with high headroom & air suspension',
      'Hi-Fi stereo sound system & PA microphone',
      'Under-floor massive luggage cargo bays',
      'Two verified professional highway pilots',
    ],
    idealFor: 'Corporate team offsites, company annual events, school excursions, destination weddings, and pilgrimage yatras.',
  },
];

export default function VehicleCollagePattern({ onSelectVehicle, onBookClick }) {
  const [activeVehicleId, setActiveVehicleId] = useState('ertiga');
  const activeVehicle = FLEET_VEHICLES.find((v) => v.id === activeVehicleId) || FLEET_VEHICLES[0];

  return (
    <div className="w-full font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Vehicle Category Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none mb-8">
        {FLEET_VEHICLES.map((vehicle) => {
          const isActive = vehicle.id === activeVehicleId;
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => {
                setActiveVehicleId(vehicle.id);
                if (onSelectVehicle) onSelectVehicle(vehicle);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 shadow-sm ${
                isActive
                  ? 'bg-red-800 text-white shadow-md shadow-red-900/20 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{vehicle.pillLabel || vehicle.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {vehicle.capacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid: Left Collage Pattern, Right Specs & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Side: Overlapping Image Collage Pattern matching reference */}
        <div className="lg:col-span-6 relative flex justify-center py-4 sm:py-6">
          {/* Background Decorative Dot Grid Matrix */}
          <div className="absolute -top-4 -left-4 sm:left-2 w-28 h-32 opacity-40 pointer-events-none z-0">
            <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <pattern id="dot-grid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#0f172a" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#dot-grid)" />
            </svg>
          </div>

          {/* Background Geometric Accent (Warm Orange Corner Triangle from Reference) */}
          <div className="absolute -bottom-3 -left-2 sm:left-0 w-36 h-36 bg-amber-500 rounded-md -rotate-12 -z-10 opacity-90 shadow-lg shadow-amber-500/20" />

          {/* Main Hero Vehicle Image Container */}
          <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-md overflow-hidden shadow-2xl border-4 border-white bg-slate-900 z-10">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeVehicle.id}
                src={activeVehicle.image}
                alt={activeVehicle.name}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35 }}
                className="w-full h-full object-cover object-center"
              />
            </AnimatePresence>

            {/* Subtle Gradient Shade at bottom for vehicle tag */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />


            {/* Vehicle Name Banner at bottom of image */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 text-white">
              <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                {activeVehicle.category}
              </p>
              <h4 className="text-base sm:text-lg lg:text-xl font-black text-white drop-shadow-md">
                {activeVehicle.name}
              </h4>
            </div>
          </div>

          {/* Secondary Overlapping Expressway Aerial Image (Top Right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute -top-3 -right-2 sm:-right-4 w-32 sm:w-40 aspect-square rounded-md overflow-hidden border-4 border-white shadow-2xl z-20 bg-slate-100 hidden xs:block"
          >
            <img
              src="/images/fleet/expressway-aerial.jpg"
              alt="Expressway connectivity"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-white tracking-wide drop-shadow">
              Expressway Routes
            </span>
          </motion.div>


        </div>

        {/* Right Side: Vehicle Details, Features & Fast Booking */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeVehicle.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {activeVehicle.idealFor}
            </p>
          </div>

          {/* Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Users size={16} weight="bold" className="text-red-700" />
                <span>Seating</span>
              </div>
              <p className="text-sm font-black text-slate-900">{activeVehicle.capacity}</p>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Briefcase size={16} weight="bold" className="text-red-700" />
                <span>Luggage</span>
              </div>
              <p className="text-sm font-black text-slate-900">{activeVehicle.luggage}</p>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Buildings size={16} weight="bold" className="text-red-700" />
                <span>Service Type</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 leading-snug">{activeVehicle.serviceType}</p>
            </div>
          </div>

          {/* Key Amenities Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Vehicle Comfort & Safety Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeVehicle.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="#contact"
              onClick={(e) => {
                if (onBookClick) {
                  e.preventDefault();
                  onBookClick(activeVehicle);
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>Book {activeVehicle.name.split(' ')[0]} Now</span>
              <ArrowRight size={16} weight="bold" />
            </a>

            <a
              href="tel:+919011507220"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-md bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <span>Call: +91 90115 07220</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
