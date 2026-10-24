import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  WhatsappLogo,
  Phone,
  MagnifyingGlassPlus,
  X,
  Wind,
  Eye,
} from '@phosphor-icons/react';

export const FLEET_VEHICLES = [
  {
    id: 'innova-crysta',
    name: 'Toyota Innova Crysta',
    shortName: 'Innova Crysta',
    pillLabel: 'Innova Crysta',
    capacityBadge: '6+1 Seater',
    plate: 'MH 61E 7220',
    category: 'Executive Luxury Tourist SUV',
    capacity: '6 + 1 Seater',
    acType: 'Dual Chilled AC',
    luggage: '4 - 5 Large Bags',
    image: '/images/fleet/innova-crysta-6plus1.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.32.44 AM.jpeg',
    serviceType: 'Airport & Outstation',
    description: 'Premium executive MPV for airport transfers, corporate delegates, and family tours across Maharashtra.',
    features: [
      'Reclining captain bucket seats with armrests',
      'Dual chilled AC with rear passenger cooling vents',
      'Mobile charging ports & smooth highway suspension',
      'Commercial tourist permit & verified highway chauffeur',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the Toyota Innova Crysta (6+1 Seater).',
  },
  {
    id: 'traveller-20',
    name: 'Force Traveller 20 Seater',
    shortName: '20 Seater Traveller',
    pillLabel: 'Traveller 20',
    capacityBadge: '20 Seater',
    plate: 'MH 12 WX 7255',
    category: 'AC Pushback Tourist Van',
    capacity: '20 Seater',
    acType: 'Roof-Mounted AC',
    luggage: 'Dedicated Rear Hold',
    image: '/images/fleet/traveller-20-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM.jpeg',
    serviceType: 'Pilgrimage & Group Tours',
    description: 'Equipped for pilgrimage circuits (Pandharpur, Tuljapur, Akkalkot), beach holidays, and group travel.',
    features: [
      'Individual pushback recliner seats with armrests',
      'Powerful roof AC with individual passenger vents',
      'USB charging points on every row & music system',
      'Spacious luggage space & high-roof wide aisle',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the Force Traveller 20 Seater.',
  },
  {
    id: 'traveller-26',
    name: 'Force Traveller 26 Seater',
    shortName: '26 Seater Traveller',
    pillLabel: 'Traveller 26',
    capacityBadge: '26 Seater',
    plate: 'MH 12 TR 2261',
    category: 'Spacious Group Touring Van',
    capacity: '26 Seater',
    acType: 'Twin AC Units',
    luggage: '25+ Bags Hold',
    image: '/images/fleet/traveller-26-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM (1).jpeg',
    serviceType: 'Large Groups & Offsites',
    description: 'High-capacity touring van for Konkan & Goa beach roadtrips, corporate offsites, and wedding parties.',
    features: [
      'Diamond-stitched pushback recliner seats',
      'High-capacity twin air conditioning system',
      'Panoramic large tour windows with sun curtains',
      'Experienced dual highway pilots for long hauls',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the Force Traveller 26 Seater.',
  },
  {
    id: 'bus-32',
    name: 'Tata Ultra 32 Seater Bus',
    shortName: '32 Seater Luxury Bus',
    pillLabel: 'Tata Ultra 32',
    capacityBadge: '32 Seater',
    plate: 'MH 12 ZE 7220',
    category: 'Executive Mid-Size AC Coach',
    capacity: '32 Seater',
    acType: 'Central Climate AC',
    luggage: 'Underfloor Bays',
    image: '/images/fleet/bus-32-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM.jpeg',
    serviceType: 'Corporate & School Outings',
    description: 'Mid-size AC coach designed for corporate team outings, school picnics, and statewide pilgrimage yatras.',
    features: [
      '2x2 luxury pushback reclining seats with armrests',
      'Heavy-duty central AC & soft ambient ceiling lights',
      'Full privacy window curtains for all passenger rows',
      'Massive underfloor cargo storage for bags & gear',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the Tata Ultra 32 Seater Bus.',
  },
  {
    id: 'bus-45',
    name: '45 Seater Air Suspension Coach',
    shortName: '45 Seater Coach',
    pillLabel: 'Coach 45',
    capacityBadge: '45 Seater',
    plate: 'MH 12 XN 7220',
    category: 'Flagship Air Suspension Coach',
    capacity: '45 Seater',
    acType: 'Dual Climate AC',
    luggage: '50+ Bags Cargo',
    image: '/images/fleet/bus-45-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM.jpeg',
    serviceType: 'Inter-State & Long Distance',
    description: 'Flagship coach with pneumatic air suspension for smooth, vibration-free travel on long-distance routes.',
    features: [
      'Pneumatic air suspension for ultra-smooth highway ride',
      '45 premium reclining pushback seats with seatbelts',
      'Central dual AC climate system & surround sound',
      'Two certified professional highway captains',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 45 Seater Air Suspension Coach.',
  },
  {
    id: 'bus-46',
    name: '46 Seater AC Tourist Coach',
    shortName: '46 Seater Coach',
    pillLabel: 'Coach 46',
    capacityBadge: '46 Seater',
    plate: 'Yashraj Pink Coach',
    category: 'Grand Luxury Tourist Coach',
    capacity: '46 Seater',
    acType: 'Full Climate AC',
    luggage: 'Large Boot + Racks',
    image: '/images/fleet/bus-46-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM (1).jpeg',
    serviceType: 'Airport Charters & Events',
    description: 'Spacious tourist coach suited for Mumbai Airport flight transfers, conferences, and wedding logistics.',
    features: [
      'High-back ergonomic pushback luxury recliner seats',
      'Full heavy-duty air conditioning throughout the cabin',
      'CCTV camera surveillance for passenger safety',
      'Direct Chhatrapati Shivaji Maharaj Mumbai Airport charters',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 46 Seater AC Tourist Coach.',
  },
  {
    id: 'bus-50',
    name: '50 Seater 3x2 Luxury Tourist Coach',
    shortName: '50 Seater 3x2 Coach',
    pillLabel: 'Coach 50',
    capacityBadge: '50 Seater',
    plate: 'MH 12 VW 7221',
    category: 'High Capacity School & Group Coach',
    capacity: '50 Seater (3x2)',
    acType: 'Full Climate AC / Air Vents',
    luggage: 'Underfloor Bays & Parcel Racks',
    image: '/images/fleet/bus-50-seater.jpeg',
    fallbackImage: '/bus-50-seater.jpeg',
    serviceType: 'School Trips & Group Charters',
    description: 'High-capacity 50-seater coach with comfortable 3x2 pushback seating. Specially designed for school picnics, college industrial visits, devotional yatras, and large group outings.',
    features: [
      'Comfortable 3x2 cushioned seating with wide headrests',
      'Specialized for school picnics, college tours & group travel',
      'Verified highway captains with verified safety record',
      'Spacious luggage bays & interior parcel racks with audio/mic system',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 50 Seater 3x2 Coach (MH 12 VW 7221).',
  },
  {
    id: 'all-fleet',
    name: 'Complete Fleet Lineup (17-50 Seats)',
    shortName: 'Complete Fleet',
    pillLabel: 'All Fleet',
    capacityBadge: '17-50',
    plate: 'All Vehicle Models',
    category: 'Full Maharashtra Fleet Range',
    capacity: '6 to 50 Seater',
    acType: 'AC & Non-AC Available',
    luggage: 'All Cargo Sizes',
    image: '/images/fleet/fleet-overview-all.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM (1).jpeg',
    serviceType: 'Tailored Fleet Solutions',
    description: 'Comprehensive owned fleet offering AC and Non-AC configurations for custom group sizes and wedding convoys.',
    features: [
      'Fleet options: Innova Crysta, 17, 21, 26, 32, 40, 45 & 50 Seaters',
      'AC and Non-AC options suited to your schedule and budget',
      '100% verified chauffeurs with 24/7 Pune & Hadapsar support',
      'Direct owner pricing with transparent rates & zero brokerage',
    ],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about custom fleet booking for our group.',
  },
];

export default function VehicleCollagePattern({ onSelectVehicle, onBookClick }) {
  const [activeVehicleId, setActiveVehicleId] = useState('innova-crysta');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeVehicle = FLEET_VEHICLES.find((v) => v.id === activeVehicleId) || FLEET_VEHICLES[0];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    if (lightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  const whatsappUrl = `https://wa.me/${activeVehicle.whatsappNumber}?text=${encodeURIComponent(
    activeVehicle.whatsappMessage
  )}`;

  return (
    <div className="w-full font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Vehicle Category Selector Pills (Small, No Scrollbar, Fits in 1 Screen) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-5">
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
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-red-800 text-white shadow-xs ring-1 ring-red-700'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-navy-950 border border-slate-200'
              }`}
            >
              <span>{vehicle.pillLabel || vehicle.shortName}</span>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                  isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {vehicle.capacityBadge || vehicle.capacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Main Featured Vehicle Showcase Grid (Balanced, Compact, Professional) */}
      <div className="bg-slate-50/70 p-4 sm:p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Smaller, Elegantly Sized Vehicle Poster */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[260px] sm:max-w-[280px] rounded-lg overflow-hidden shadow-md border-2 border-white bg-slate-950 group">
              {/* Floating Capacity & Registration Badges */}
              <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs">
                  {activeVehicle.capacity}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/75 backdrop-blur-xs text-white border border-white/20">
                  {activeVehicle.plate}
                </span>
              </div>

              {/* Compact Poster View */}
              <div
                className="relative aspect-[9/13.5] max-h-[390px] sm:max-h-[410px] w-full bg-slate-900 cursor-pointer overflow-hidden"
                onClick={() => setLightboxOpen(true)}
                title="Click to view full vehicle poster"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeVehicle.id}
                    src={activeVehicle.image}
                    onError={(e) => {
                      if (activeVehicle.fallbackImage && e.currentTarget.src !== activeVehicle.fallbackImage) {
                        e.currentTarget.src = activeVehicle.fallbackImage;
                      }
                    }}
                    alt={activeVehicle.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                  />
                </AnimatePresence>

                {/* Subtle Hover Zoom Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                  <span className="p-2 bg-red-800/90 rounded-full shadow text-white">
                    <MagnifyingGlassPlus size={20} weight="bold" />
                  </span>
                </div>
              </div>

              {/* Footer Preview Bar */}
              <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between gap-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider truncate">
                  {activeVehicle.shortName}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={12} weight="bold" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Minimal, Professional Specs & Information */}
          <div className="lg:col-span-7 space-y-4">
            {/* Title & Classification */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-100/70 px-2 py-0.5 rounded">
                  {activeVehicle.category}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {activeVehicle.plate}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeVehicle.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pt-0.5">
                {activeVehicle.description}
              </p>
            </div>

            {/* 3 Core Metric Pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium mb-0.5">
                  <Users size={14} weight="bold" className="text-red-700 shrink-0" />
                  <span>Seating</span>
                </div>
                <p className="text-xs font-black text-slate-900 truncate">{activeVehicle.capacity}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium mb-0.5">
                  <Wind size={14} weight="bold" className="text-sky-600 shrink-0" />
                  <span>Climate</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{activeVehicle.acType}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium mb-0.5">
                  <Briefcase size={14} weight="bold" className="text-amber-600 shrink-0" />
                  <span>Luggage</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{activeVehicle.luggage}</p>
              </div>
            </div>

            {/* Key Features (Clean, Professional, Strictly 4 items) */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Key Fleet Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                {activeVehicle.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 font-medium">
                    <ShieldCheck size={14} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons (Compact & Focused) */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <a
                href="#contact"
                onClick={(e) => {
                  if (onBookClick) {
                    e.preventDefault();
                    onBookClick(activeVehicle);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Book Vehicle</span>
                <ArrowRight size={14} weight="bold" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <WhatsappLogo size={16} weight="fill" />
                <span>WhatsApp Inquiry</span>
              </a>

              <a
                href="tel:+919011507220"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-md bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Phone size={14} weight="bold" className="text-red-700" />
                <span>Call: 90115 07220</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Full-Screen Lightbox Modal for Hi-Res Poster Preview */}
      <AnimatePresence>
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="relative max-w-xl max-h-[92vh] w-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-400 text-slate-950">
                    {activeVehicle.capacity}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black truncate">{activeVehicle.name}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-2 sm:p-3 flex items-center justify-center bg-black/50">
                <img
                  src={activeVehicle.image}
                  onError={(e) => {
                    if (activeVehicle.fallbackImage && e.currentTarget.src !== activeVehicle.fallbackImage) {
                      e.currentTarget.src = activeVehicle.fallbackImage;
                    }
                  }}
                  alt={activeVehicle.name}
                  className="max-h-[82vh] w-auto object-contain rounded shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
