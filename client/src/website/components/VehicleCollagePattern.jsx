import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Buildings,
  ShieldCheck,
  ArrowRight,
  WhatsappLogo,
  Phone,
  MagnifyingGlassPlus,
  X,
  MapPin,
  Wind,
  Armchair,
  Eye,
} from '@phosphor-icons/react';

export const FLEET_VEHICLES = [
  {
    id: 'innova-crysta',
    name: 'Toyota Innova Crysta (6+1 Tourist)',
    shortName: 'Innova Crysta',
    pillLabel: 'Innova Crysta',
    capacity: '6 + 1 Seater',
    plate: 'MH 61E 7220',
    category: 'Executive Luxury Tourist SUV',
    acType: 'Dual Chilled Front & Rear AC',
    luggage: '4 - 5 Large Bags',
    tag: 'Executive & Family',
    image: '/images/fleet/innova-crysta-6plus1.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.32.44 AM.jpeg',
    serviceType: 'Airport Transfers, Pilgrimage & Outstation Tours',
    tagline: 'Travel in Comfort with Us',
    features: [
      '6+1 seating with luxury reclining captain bucket seats',
      'Dual chilled AC with rear passenger cooling vents',
      'Plush dual-tone leather interior & executive legroom',
      'Expressway tested for utmost passenger safety & reliability',
      'Mobile fast charging ports & whisper-quiet expressway ride',
    ],
    idealFor: 'Mumbai airport transfers, pilgrimage tours (Shirdi, Ashtavinayak), corporate delegates, and luxury family holidays to Mahabaleshwar & Goa.',
    routes: ['Mumbai Airport', 'Shirdi', 'Mahabaleshwar', 'Ashtavinayak', 'Konkan & Goa'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the Toyota Innova Crysta (6+1 Tourist) for our upcoming trip.',
  },
  {
    id: 'traveller-20',
    name: 'Force Traveller 20 Seater AC Pushback',
    shortName: '20 Seater Traveller',
    pillLabel: '20 Seater Traveller',
    capacity: '20 Seater',
    plate: 'MH 12 WX 7255',
    category: 'Luxury Tourist Van / Mini Coach',
    acType: 'Roof-Mounted High-Power AC',
    luggage: 'Dedicated Rear Luggage Bay & Overhead Racks',
    tag: 'Group Touring Choice',
    image: '/images/fleet/traveller-20-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM.jpeg',
    serviceType: 'Pilgrimage, Corporate & School Tours',
    tagline: 'Safe Journey, Happy Memories',
    features: [
      'Powerful air conditioning with individual overhead louvers',
      'Plush individual pushback recliner seats with armrests',
      'USB fast charging sockets on every seat row',
      'Music system & PA audio microphone for group entertainment',
      'Spacious luggage space & high-roof wide walking aisle',
      'CSM Mumbai Airport pickup & Maharashtra outstation ready',
    ],
    idealFor: 'Pilgrimage yatras (Pandharpur, Tuljapur, Akkalkot), beach holidays to Alibaug & Dapoli, hill stations, school picnics, and corporate group outings.',
    routes: ['Pandharpur', 'Tuljapur', 'Akkalkot', 'Mumbai Airport', 'Alibaug', 'Matheran'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 20 Seater Force Traveller (AC Pushback) for our group travel.',
  },
  {
    id: 'traveller-26',
    name: 'Force Traveller 26 Seater AC Pushback',
    shortName: '26 Seater Traveller',
    pillLabel: '26 Seater Traveller',
    capacity: '26 Seater',
    plate: 'MH 12 TR 2261',
    category: 'Spacious Group Touring Van',
    acType: 'High-Capacity Twin AC Units',
    luggage: '25+ Bags in Dedicated Luggage Hold',
    tag: 'Bookings Open',
    image: '/images/fleet/traveller-26-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM (1).jpeg',
    serviceType: 'Large Groups, Weddings & Corporate Offsites',
    tagline: 'Booking Open · Premium Beach, Ghat & Highway Travel',
    features: [
      'Premium diamond-stitched 26 pushback recliner seats',
      'High-capacity twin AC cooling units with ceiling ducting',
      'Panoramic large tour windows with full sun curtains',
      'Wide center walking aisle & generous leg clearance',
      'Beach, ghat & long-distance highway tuned suspension',
      'Experienced dual highway pilots for extended journeys',
    ],
    idealFor: 'Medium-to-large group vacations, Konkan & Goa beach roadtrips, company offsites, destination weddings, and all-Maharashtra temple yatras.',
    routes: ['Konkan Coastal Tour', 'Goa Beach Circuit', 'Trimbakeshwar', 'Lonavala', 'Mahabaleshwar'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 26 Seater Force Traveller (AC Pushback) for our group trip.',
  },
  {
    id: 'bus-32',
    name: 'Tata Ultra 32 Seater Pushback Tourist Bus',
    shortName: '32 Seater Luxury Bus',
    pillLabel: '32 Seater Bus',
    capacity: '32 Seater',
    plate: 'MH 12 ZE 7220 · Yashraj',
    category: 'Executive Mid-Size AC Tourist Coach',
    acType: 'Heavy-Duty Central Climate AC',
    luggage: 'Massive Underfloor Cargo Luggage Bays',
    tag: 'Tata Ultra Luxury',
    image: '/images/fleet/bus-32-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM.jpeg',
    serviceType: 'Corporate Outings, School & Pilgrimage',
    tagline: 'Comfortable Journey, Happier Destinations',
    features: [
      'Comfortable 2x2 luxury pushback reclining seats with armrests',
      'Central heavy-duty air conditioning climate comfort',
      'Soft ambient LED overhead ceiling lighting & high headroom',
      'Full privacy window curtains for all passenger rows',
      'Tata Ultra modern commercial chassis for a smooth highway glide',
      'Extra-large underfloor cargo holds for bags & gear',
    ],
    idealFor: 'Pilgrimage yatras, corporate team outings, wedding guest transportation, school & college picnics, and large group holiday tours across Maharashtra.',
    routes: ['Bhimashankar', 'Kolhapur Mahalaxmi', 'Ellora / Aurangabad', 'Panchgani', 'Shirdi'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 32 Seater Tata Ultra Tourist Bus for our group trip.',
  },
  {
    id: 'bus-45',
    name: '45 Seater AC Pushback + Air Suspension Coach',
    shortName: '45 Seater Air Suspension Bus',
    pillLabel: '45 Seater Bus',
    capacity: '45 Seater',
    plate: 'MH 12 XN 7220 · Yashraj',
    category: 'Flagship Air Suspension Tourist Coach',
    acType: 'Cool & Pleasant Dual Climate AC',
    luggage: 'Giant Underfloor Luggage Bays (50+ Bags)',
    tag: 'Air Suspension Flagship',
    image: '/images/fleet/bus-45-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM.jpeg',
    serviceType: 'State & Inter-State Charters & Pilgrimages',
    tagline: 'प्रत्येक प्रवास... आपला विश्वास... Comfort Beyond Distance',
    features: [
      'Pneumatic air suspension for ultra-smooth bump-free travel',
      '45 premium reclining pushback seats with passenger safety belts',
      'Cool & pleasant central dual AC climate system',
      'Neon ambient ceiling lighting & hi-fi surround sound system',
      'Massive side-loading underfloor luggage compartments',
      'Two government-certified professional highway captains',
    ],
    idealFor: 'State-wide Maharashtra & Inter-State group tours, long distance pilgrimage (Tirupati, Jyotirlinga, Konkan), corporate annual meets, and grand wedding baraat transfers.',
    routes: ['Maharashtra 5 Jyotirlinga', 'Tirupati Circuit', 'Goa', 'Hyderabad', 'Indore'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 45 Seater AC Pushback + Air Suspension Coach for our group travel.',
  },
  {
    id: 'bus-46',
    name: '46 Seater AC Pushback Tourist Coach',
    shortName: '46 Seater AC Coach',
    pillLabel: '46 Seater Bus',
    capacity: '46 Seater',
    plate: 'Yashraj Pink Coach · Bookings Open',
    category: 'Grand Luxury Tourist Coach',
    acType: 'Full Heavy-Duty Climate AC',
    luggage: 'Extra-Large Boot + Overhead Parcel Racks',
    tag: 'Airport & Corporate Charters',
    image: '/images/fleet/bus-46-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM (1).jpeg',
    serviceType: 'Mumbai Airport Transfers & Corporate Events',
    tagline: 'Bookings Open · Mumbai Airport & Outstation Ready',
    features: [
      'Full heavy-duty air conditioning throughout the cabin',
      'High-back ergonomic pushback luxury recliner seats',
      'CCTV camera surveillance for maximum passenger security',
      'Full music entertainment system & PA announcement mic',
      'High-ceiling spacious walking gangway & large scenic windows',
      'Direct Chhatrapati Shivaji Maharaj Mumbai Airport transfers',
    ],
    idealFor: 'Mumbai Airport flight charters, multi-day company conferences, wedding guest logistics, and large group holiday excursions.',
    routes: ['Mumbai Airport Terminals', 'Pune-Mumbai Expressway', 'Mahabaleshwar', 'Alibaug', 'Goa'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about booking the 46 Seater AC Pushback Tourist Coach for our trip.',
  },
  {
    id: 'all-fleet',
    name: 'Jagtap Travels Complete Fleet Lineup',
    shortName: 'All Fleet Overview',
    pillLabel: 'All Fleet Overview',
    capacity: '6 to 50 Seater Fleet',
    plate: '17 to 50 Seater Range',
    category: 'Complete Maharashtra Fleet Lineup',
    acType: 'AC & Non-AC Available',
    luggage: 'All Luggage Capacities',
    tag: 'All Vehicles Available',
    image: '/images/fleet/fleet-overview-all.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM (1).jpeg',
    serviceType: 'Custom Fleet Solutions for Any Group Size',
    tagline: 'Your Journey... Our Responsibility...',
    features: [
      'Full fleet lineup: Innova Crysta (6+1), 17, 21, 26, 32, 40, 45 & 50 Seater',
      'Both AC and Non-AC options available for every travel budget',
      'Safe & comfortable journeys across Maharashtra & Pan-India',
      'Dedicated corporate transport, pilgrimage yatras & weddings',
      '100% verified, polite chauffeurs with 24/7 Pune & Hadapsar support',
    ],
    idealFor: 'Custom group sizes, multi-vehicle wedding convoys, company employee transport contracts, and tailored outstation itineraries.',
    routes: ['Pan-Maharashtra', 'Outstation Yatras', 'Airport Transfers', 'Corporate Routes'],
    phone: '+91 90115 07220',
    whatsappNumber: '919011507220',
    whatsappMessage: 'Hello Jagtap Travels, I want to inquire about custom vehicle booking from your fleet.',
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
      {/* 1. Vehicle Category Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none mb-6 sm:mb-8">
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
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 shadow-xs cursor-pointer ${
                isActive
                  ? 'bg-red-800 text-white shadow-md shadow-red-900/25 scale-[1.02] ring-2 ring-red-700/50'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-navy-950 border border-slate-200'
              }`}
            >
              <span>{vehicle.pillLabel || vehicle.shortName}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {vehicle.capacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Main Featured Vehicle Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-slate-50/70 p-4 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Left Column: Authentic Vehicle Flyer / Poster Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[390px] mx-auto rounded-xl overflow-hidden shadow-xl border-4 border-white bg-slate-950 group">
            {/* Poster Header Badges */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black bg-amber-400 text-slate-950 shadow-md">
                {activeVehicle.capacity}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
                {activeVehicle.plate}
              </span>
            </div>

            {/* Poster Image with AnimatePresence */}
            <div
              className="relative aspect-[9/13.5] w-full bg-slate-900 cursor-pointer overflow-hidden"
              onClick={() => setLightboxOpen(true)}
              title="Click to zoom / view full poster"
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
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-contain sm:object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </AnimatePresence>

              {/* Hover Dark Overlay with Zoom Prompt */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                <span className="p-3 bg-red-800/90 rounded-full shadow-lg text-white">
                  <MagnifyingGlassPlus size={24} weight="bold" />
                </span>
                <span className="text-xs font-bold tracking-wide bg-black/60 px-3 py-1 rounded-full border border-white/20">
                  Click to View Full Poster
                </span>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-2 border-t border-slate-800">
              <div className="truncate">
                <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Official Jagtap Fleet</p>
                <p className="text-xs font-black truncate">{activeVehicle.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="shrink-0 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} weight="bold" />
                <span>Zoom</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2 text-center">
            Click image above to preview the complete high-resolution vehicle poster
          </p>
        </div>

        {/* Right Column: Vehicle Details, Specs, Amenities & Direct Booking CTAs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header & Category */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-red-800 bg-red-100/80 px-2.5 py-1 rounded-md">
                {activeVehicle.category}
              </span>
              <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-md">
                {activeVehicle.tag}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeVehicle.name}
            </h3>
            <p className="text-xs sm:text-sm text-red-900/90 font-bold italic">
              "{activeVehicle.tagline}"
            </p>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pt-1">
              {activeVehicle.idealFor}
            </p>
          </div>

          {/* 4-Column Quick Specification Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                <Users size={16} weight="bold" className="text-red-700 shrink-0" />
                <span>Seating</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-900">{activeVehicle.capacity}</p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                <Wind size={16} weight="bold" className="text-sky-600 shrink-0" />
                <span>Climate</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug truncate" title={activeVehicle.acType}>
                {activeVehicle.acType}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                <Briefcase size={16} weight="bold" className="text-amber-600 shrink-0" />
                <span>Luggage</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug truncate" title={activeVehicle.luggage}>
                {activeVehicle.luggage}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                <Buildings size={16} weight="bold" className="text-emerald-600 shrink-0" />
                <span>Service Type</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug truncate" title={activeVehicle.serviceType}>
                {activeVehicle.serviceType}
              </p>
            </div>
          </div>

          {/* Vehicle Comfort & Safety Highlights (Extracted directly from the poster) */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Armchair size={16} weight="bold" className="text-red-700" />
              <span>Vehicle Comfort & Safety Highlights</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {activeVehicle.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                  <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Maharashtra Routes / Circuits */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={14} weight="bold" className="text-red-700" />
              <span>Top Destinations & Tour Circuits:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeVehicle.routes.map((route, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs"
                >
                  {route}
                </span>
              ))}
            </div>
          </div>

          {/* Fast Booking CTA Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="#contact"
              onClick={(e) => {
                if (onBookClick) {
                  e.preventDefault();
                  onBookClick(activeVehicle);
                }
              }}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Book {activeVehicle.shortName} Now</span>
              <ArrowRight size={16} weight="bold" />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <WhatsappLogo size={18} weight="fill" />
              <span>WhatsApp Inquiry</span>
            </a>

            <a
              href="tel:+919011507220"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Phone size={16} weight="bold" className="text-red-700" />
              <span>Call: 90115 07220</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Visual Fleet Lineup Thumbnail Strip (Browse All Vehicles at a Glance) */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Browse All Vehicles in Our Owned Fleet</h4>
            <p className="text-xs text-slate-500">Click any vehicle card to view full specifications & booking options</p>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold text-slate-500">
            {FLEET_VEHICLES.length} Vehicles Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {FLEET_VEHICLES.map((vehicle) => {
            const isCurrent = vehicle.id === activeVehicleId;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  setActiveVehicleId(vehicle.id);
                  if (onSelectVehicle) onSelectVehicle(vehicle);
                }}
                className={`group text-left p-2 rounded-xl transition-all border cursor-pointer ${
                  isCurrent
                    ? 'bg-red-50/80 border-red-700 ring-2 ring-red-700 shadow-md scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="aspect-[9/13] w-full rounded-lg overflow-hidden bg-slate-900 mb-2 relative">
                  <img
                    src={vehicle.image}
                    onError={(e) => {
                      if (vehicle.fallbackImage && e.currentTarget.src !== vehicle.fallbackImage) {
                        e.currentTarget.src = vehicle.fallbackImage;
                      }
                    }}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-black/80 text-white">
                    {vehicle.capacity}
                  </span>
                </div>
                <p className="text-[11px] font-black text-slate-900 line-clamp-1 group-hover:text-red-800">
                  {vehicle.shortName}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold truncate">
                  {vehicle.category.split('&')[0]}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Full-Screen Lightbox Modal for Hi-Res Poster Preview */}
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
              transition={{ duration: 0.2 }}
              className="relative max-w-2xl max-h-[92vh] w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header Bar */}
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                    {activeVehicle.capacity}
                  </span>
                  <h4 className="text-sm font-black truncate">{activeVehicle.name}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close poster preview"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              {/* Lightbox Poster Image */}
              <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black/50">
                <img
                  src={activeVehicle.image}
                  onError={(e) => {
                    if (activeVehicle.fallbackImage && e.currentTarget.src !== activeVehicle.fallbackImage) {
                      e.currentTarget.src = activeVehicle.fallbackImage;
                    }
                  }}
                  alt={activeVehicle.name}
                  className="max-h-[75vh] w-auto object-contain rounded-md shadow-2xl"
                />
              </div>

              {/* Lightbox Action Footer */}
              <div className="p-3 bg-slate-900 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <p className="text-xs text-slate-300 font-medium">
                  Direct Booking Desk: <strong className="text-amber-400">+91 90115 07220</strong>
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                  >
                    <WhatsappLogo size={16} weight="fill" />
                    <span>Inquire on WhatsApp</span>
                  </a>
                  <a
                    href="tel:+919011507220"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition-all"
                  >
                    <Phone size={15} weight="bold" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
