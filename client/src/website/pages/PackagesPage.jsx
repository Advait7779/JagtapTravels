import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import {
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  WhatsappLogo,
  Eye,
  X,
} from '@phosphor-icons/react';

const PACKAGES_DATA = [
  {
    id: 'innova-crysta',
    title: 'Toyota Innova Crysta (6+1 Tourist)',
    capacityBadge: '6+1 Seater AC',
    plate: 'MH 61E 7220',
    tag: 'Executive Choice',
    route: 'Pune ➔ Mumbai Airport (T1/T2) ➔ Shirdi ➔ Mahabaleshwar ➔ Goa',
    image: '/images/fleet/innova-crysta-6plus1.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.32.44 AM.jpeg',
    description:
      'Executive luxury MPV with reclining captain seats and dual AC cooling. Ideal for Mumbai Airport transfers and outstation tours.',
    inclusions: [
      'Reclining captain bucket seats with personal armrests',
      'Dual chilled AC with rear passenger cooling vents',
      'Mobile fast charging ports & expressway suspension',
      'Verified highway chauffeur with 100% on-time record',
    ],
  },
  {
    id: 'traveller-20',
    title: 'Force Traveller 20 Seater AC Pushback',
    capacityBadge: '20 Seater AC',
    plate: 'MH 12 WX 7255',
    tag: 'Devotional & Tours',
    route: 'Pune ➔ Pandharpur ➔ Tuljapur ➔ Akkalkot ➔ Alibaug ➔ Mahabaleshwar',
    image: '/images/fleet/traveller-20-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM.jpeg',
    description:
      'High-roof tourist van for pilgrimage circuits, beach getaways, and group outings with generous luggage capacity.',
    inclusions: [
      'Individual pushback recliner seats with armrests',
      'Powerful roof-mounted AC with individual louvers',
      'USB fast charging sockets on every seat row & audio',
      'High-roof wide aisle & dedicated rear luggage hold',
    ],
  },
  {
    id: 'traveller-26',
    title: 'Force Traveller 26 Seater AC Pushback',
    capacityBadge: '26 Seater AC',
    plate: 'MH 12 TR 2261',
    tag: 'Coastal & Ghats',
    route: 'Pune ➔ Konkan Coastal Circuit ➔ Goa ➔ Trimbakeshwar ➔ Lonavala',
    image: '/images/fleet/traveller-26-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM (1).jpeg',
    description:
      'High-capacity touring van with diamond-stitched pushback seats and twin AC units, tuned for coastal roads and ghats.',
    inclusions: [
      'Premium diamond-stitched 26 pushback recliner seats',
      'High-capacity twin AC cooling units with ceiling ducting',
      'Panoramic large tour windows with full sun curtains',
      'Long-distance highway suspension with dual pilots',
    ],
  },
  {
    id: 'bus-32',
    title: 'Tata Ultra 32 Seater Pushback Tourist Bus',
    capacityBadge: '32 Seater AC',
    plate: 'MH 12 ZE 7220',
    tag: 'Tata Ultra Luxury',
    route: 'Pune ➔ Bhimashankar ➔ Kolhapur Mahalaxmi ➔ Ellora ➔ Shirdi',
    image: '/images/fleet/bus-32-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM.jpeg',
    description:
      'Mid-size luxury AC tourist coach featuring 2x2 pushback recliners, soft LED ceiling lighting, and large underfloor cargo holds.',
    inclusions: [
      '2x2 luxury pushback reclining seats with armrests',
      'Heavy-duty central air conditioning climate comfort',
      'Soft ambient LED overhead ceiling lighting & high headroom',
      'Massive underfloor cargo holds for group luggage & gear',
    ],
  },
  {
    id: 'bus-45',
    title: '45 Seater AC Pushback + Air Suspension Coach',
    capacityBadge: '45 Seater AC',
    plate: 'MH 12 XN 7220',
    tag: 'Air Suspension Flagship',
    route: 'All 5 Maharashtra Jyotirlingas ➔ Tirupati ➔ Goa ➔ Hyderabad ➔ Indore',
    image: '/images/fleet/bus-45-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM.jpeg',
    description:
      'Pneumatic air-suspension flagship coach delivering a bump-free ride on long-distance interstate and statewide pilgrimage circuits.',
    inclusions: [
      'Pneumatic air suspension for ultra-smooth travel',
      '45 premium reclining pushback seats with seatbelts',
      'Cool & pleasant central dual AC climate system',
      'Massive underfloor luggage bays & two highway captains',
    ],
  },
  {
    id: 'bus-46',
    title: '46 Seater AC Pushback Tourist Coach',
    capacityBadge: '46 Seater AC',
    plate: 'Yashraj Pink Coach',
    tag: 'Airport & Corporate',
    route: 'Pune ➔ Mumbai Airport International Terminals ➔ Expressway ➔ Goa',
    image: '/images/fleet/bus-46-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM (1).jpeg',
    description:
      'Grand luxury tourist coach with full cabin AC, pushback seats, and CCTV surveillance, specialized for Mumbai Airport charters.',
    inclusions: [
      'Full heavy-duty air conditioning throughout the coach',
      'High-back ergonomic pushback luxury recliner seats',
      'CCTV camera surveillance for maximum passenger security',
      'Direct Chhatrapati Shivaji Maharaj Mumbai Airport charters',
    ],
  },
  {
    id: 'bus-50',
    title: '50 Seater 3x2 School & Group Tourist Coach',
    capacityBadge: '50 Seater (3x2)',
    plate: 'MH 12 VW 7221',
    tag: 'School & Group Special',
    route: 'Pune ➔ Mahabaleshwar ➔ Imagica ➔ Shirdi ➔ Konkan & Statewide Group Tours',
    image: '/images/fleet/bus-50-seater.jpeg',
    fallbackImage: '/bus-50-seater.jpeg',
    description:
      'High-capacity 50-seater coach with comfortable 3x2 pushback seating arrangement. Tuned for school picnics, college industrial visits, devotional yatras, and large group outings.',
    inclusions: [
      'High-capacity 3x2 cushioned seats with headrest covers',
      'Specially verified chauffeurs for student and family safety',
      'PA & surround audio system for school/college tour entertainment',
      'Massive underfloor luggage bays & overhead parcel racks',
    ],
  },
  {
    id: 'all-fleet',
    title: 'Complete Fleet Lineup (17 to 50 Seats)',
    capacityBadge: '17 to 50 Seater Range',
    plate: 'All Fleet Models',
    tag: 'Custom Group Fleet',
    route: 'Pan-Maharashtra ➔ Outstation Yatras ➔ Airport Transfers ➔ Corporate Shuttles',
    image: '/images/fleet/fleet-overview-all.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM (1).jpeg',
    description:
      'Full owned fleet offering AC and Non-AC configurations for custom group sizes, destination wedding convoys, and corporate tie-ups.',
    inclusions: [
      'Fleet options: Innova Crysta, 17, 21, 26, 32, 40, 45 & 50 Seaters',
      'Both AC and Non-AC options suited to your schedule and budget',
      '100% verified chauffeurs with 24/7 Pune & Hadapsar support',
      'Direct owner pricing with transparent rates & zero brokerage',
    ],
  },
];

export default function PackagesPage({ onNavigate, onBookPackage }) {
  const [selectedPoster, setSelectedPoster] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPoster(null);
    };
    if (selectedPoster) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPoster]);

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Tour Packages Across Maharashtra"
        subtitle="Explore our verified luxury fleet and custom travel circuits. Transparent billing with doorstep pickup anywhere in Pune."
        breadcrumb="Tour Packages"
        badge="Direct Fleet Owner Pricing"
        onNavigateHome={() => onNavigate('home')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Tour Cards Grid: All Packages Shown at Once with Expanded, Uncropped Flyer Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PACKAGES_DATA.map((tour, idx) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-200 transition-all flex flex-col group"
            >
              {/* Bigger Image Area: Generous Aspect Ratio with object-contain so Flyers are NOT Cropped */}
              <div
                className="relative aspect-[3/4] sm:aspect-[4/5] max-h-[460px] w-full bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setSelectedPoster(tour)}
                title="Click to view full flyer"
              >
                <img
                  src={tour.image}
                  onError={(e) => {
                    if (tour.fallbackImage && e.currentTarget.src !== tour.fallbackImage) {
                      e.currentTarget.src = tour.fallbackImage;
                    }
                  }}
                  alt={tour.title}
                  className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                />

                {/* Floating Capacity Badge */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black/80 text-white backdrop-blur-xs border border-white/20 shadow">
                    {tour.capacityBadge}
                  </span>
                </div>

                {/* Hover Preview Icon */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                  <span className="p-2 bg-red-800/90 rounded-full shadow text-white">
                    <Eye size={18} weight="bold" />
                  </span>
                </div>
              </div>

              {/* Compact, Streamlined Info Section Below Image */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-100/70 px-2 py-0.5 rounded">
                      {tour.plate}
                    </span>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                      {tour.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-red-800 transition-colors">
                    {tour.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {tour.description}
                  </p>

                  {/* Route */}
                  <div className="p-2 rounded bg-slate-50 border border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-700 font-semibold">
                    <MapPin size={14} weight="fill" className="text-red-700 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{tour.route}</span>
                  </div>

                  {/* Key Inclusions (Compact, 3 bullets) */}
                  <div className="space-y-1 pt-1">
                    {tour.inclusions.slice(0, 3).map((inc, incIdx) => (
                      <div key={incIdx} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                        <CheckCircle size={13} weight="fill" className="text-emerald-600 shrink-0" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking CTA */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (onBookPackage) onBookPackage(tour);
                      onNavigate('contact');
                    }}
                    className="w-full py-2.5 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>Book This Package</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Itinerary Planning Banner */}
        <div className="mt-14 p-5 sm:p-7 rounded-xl bg-navy-950 text-white border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 text-center lg:text-left flex-1 min-w-0">
            <h4 className="text-xl sm:text-2xl font-black text-white">
              Need a Custom Tour Route or Multi-City Itinerary?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Contact our 24/7 Pune booking desk at +91 90115 07220 or request a customized itinerary tailored to your group size and vehicle preference.
            </p>
          </div>
          <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Plan Custom Tour</span>
              <ArrowRight size={14} weight="bold" />
            </button>
            <a
              href="https://wa.me/919011507220?text=Hello%20Jagtap%20Travels,%20I%20want%20to%20plan%20a%20custom%20tour%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 cursor-pointer whitespace-nowrap shrink-0"
            >
              <WhatsappLogo size={15} weight="fill" />
              <span>WhatsApp Us</span>
            </a>
            <a
              href="tel:+919011507220"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Phone size={14} weight="bold" />
              <span>Call 24/7 Desk</span>
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox Modal (Clean View, Zero Obstructive Bottom Options) */}
      <AnimatePresence>
        {selectedPoster && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs"
            onClick={() => setSelectedPoster(null)}
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
                    {selectedPoster.capacityBadge}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black truncate">{selectedPoster.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoster(null)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-2 sm:p-3 flex items-center justify-center bg-black/50">
                <img
                  src={selectedPoster.image}
                  onError={(e) => {
                    if (selectedPoster.fallbackImage && e.currentTarget.src !== selectedPoster.fallbackImage) {
                      e.currentTarget.src = selectedPoster.fallbackImage;
                    }
                  }}
                  alt={selectedPoster.title}
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
