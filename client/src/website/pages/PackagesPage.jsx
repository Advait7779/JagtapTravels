import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import {
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  WhatsappLogo,
} from '@phosphor-icons/react';

const PACKAGES_DATA = [
  {
    id: 'innova-crysta',
    title: 'Toyota Innova Crysta (6+1 Tourist)',
    category: 'suv',
    categories: ['all', 'suv', 'airport', 'pilgrimage'],
    duration: '6 + 1 Seater AC · MH 61E 7220',
    route: 'Pune ➔ Mumbai Airport (T1/T2) ➔ Shirdi ➔ Mahabaleshwar ➔ Goa',
    image: '/images/fleet/innova-crysta-6plus1.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.32.44 AM.jpeg',
    tag: 'Executive Choice',
    description:
      'Executive luxury MPV with reclining captain seats and dual AC cooling. Ideal for seamless Mumbai Airport transfers, corporate executive pickups, and family tours.',
    inclusions: [
      'Reclining captain bucket seats with personal armrests',
      'Dual chilled AC with rear passenger cooling vents',
      'Mobile fast charging points & whisper-quiet expressway ride',
      'Commercial tourist permit & verified highway chauffeur',
    ],
  },
  {
    id: 'traveller-20',
    title: 'Force Traveller 20 Seater AC Pushback',
    category: 'traveller',
    categories: ['all', 'traveller', 'pilgrimage'],
    duration: '20 Seater AC · MH 12 WX 7255',
    route: 'Pune ➔ Pandharpur ➔ Tuljapur ➔ Akkalkot ➔ Alibaug ➔ Mahabaleshwar',
    image: '/images/fleet/traveller-20-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM.jpeg',
    tag: 'Devotional & Group Touring',
    description:
      'Specially equipped high-roof tourist van for pilgrimage circuits, beach getaways, and school/family group outings with ample boot space.',
    inclusions: [
      'Individual pushback recliner seats with armrests',
      'Powerful roof-mounted AC with individual louvers',
      'USB fast charging sockets on every seat row & music audio',
      'High-roof easy walking aisle & dedicated rear luggage hold',
    ],
  },
  {
    id: 'traveller-26',
    title: 'Force Traveller 26 Seater AC Pushback',
    category: 'traveller',
    categories: ['all', 'traveller', 'outstation'],
    duration: '26 Seater AC · MH 12 TR 2261',
    route: 'Pune ➔ Konkan Coastal Circuit ➔ Goa ➔ Trimbakeshwar ➔ Lonavala',
    image: '/images/fleet/traveller-26-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.35 AM (1).jpeg',
    tag: 'Coastal & Ghat Special',
    description:
      'High-capacity 26-seater touring van with diamond-stitched pushback seats and twin AC units, engineered for Konkan beaches, ghats, and highway roadtrips.',
    inclusions: [
      'Premium diamond-stitched 26 pushback recliner seats',
      'High-capacity twin AC cooling units with ceiling ducting',
      'Panoramic large tour windows with full sun curtains',
      'Ghat & long-distance highway suspension with dual pilots',
    ],
  },
  {
    id: 'bus-32',
    title: 'Tata Ultra 32 Seater Pushback Tourist Bus',
    category: 'bus',
    categories: ['all', 'bus', 'corporate', 'pilgrimage'],
    duration: '32 Seater AC · MH 12 ZE 7220',
    route: 'Pune ➔ Bhimashankar ➔ Kolhapur Mahalaxmi ➔ Ellora ➔ Shirdi',
    image: '/images/fleet/bus-32-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM.jpeg',
    tag: 'Tata Ultra Luxury',
    description:
      'Mid-size luxury AC tourist coach featuring 2x2 pushback recliners, soft ambient LED ceiling lights, and massive underfloor baggage bays for group tours.',
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
    category: 'bus',
    categories: ['all', 'bus', 'outstation', 'pilgrimage'],
    duration: '45 Seater AC · MH 12 XN 7220',
    route: 'All 5 Maharashtra Jyotirlingas ➔ Tirupati ➔ Goa ➔ Hyderabad ➔ Indore',
    image: '/images/fleet/bus-45-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM.jpeg',
    tag: 'Air Suspension Flagship',
    description:
      'Pneumatic air-suspension flagship coach delivering an ultra-smooth, vibration-free highway ride on long-distance interstate and statewide pilgrimage yatras.',
    inclusions: [
      'Pneumatic air suspension for ultra-smooth bump-free travel',
      '45 premium reclining pushback seats with passenger seatbelts',
      'Cool & pleasant central dual AC climate system & surround audio',
      'Massive underfloor luggage bays & two certified highway captains',
    ],
  },
  {
    id: 'bus-46',
    title: '46 Seater AC Pushback Tourist Coach',
    category: 'bus',
    categories: ['all', 'bus', 'airport', 'corporate'],
    duration: '46 Seater AC · Yashraj Pink Coach',
    route: 'Pune ➔ Mumbai Airport International Terminals ➔ Expressway ➔ Goa',
    image: '/images/fleet/bus-46-seater.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.36 AM (1).jpeg',
    tag: 'Airport Charters & Events',
    description:
      'Grand luxury tourist coach equipped with full cabin AC, ergonomic pushback seats, and CCTV camera security, specialized for Mumbai Airport flight transfers and conferences.',
    inclusions: [
      'Full heavy-duty air conditioning throughout the cabin',
      'High-back ergonomic pushback luxury recliner seats',
      'CCTV camera surveillance for maximum passenger security',
      'Direct Chhatrapati Shivaji Maharaj Mumbai Airport charters',
    ],
  },
  {
    id: 'all-fleet',
    title: 'Complete Fleet Lineup (17 to 50 Seats)',
    category: 'corporate',
    categories: ['all', 'corporate', 'outstation'],
    duration: '17 to 50 Seater Range · All Models',
    route: 'Pan-Maharashtra ➔ Outstation Yatras ➔ Airport Transfers ➔ Corporate Shuttles',
    image: '/images/fleet/fleet-overview-all.jpeg',
    fallbackImage: '/WhatsApp Image 2026-10-17 at 10.28.37 AM (1).jpeg',
    tag: 'Custom Group Solutions',
    description:
      'Comprehensive owned fleet offering AC and Non-AC configurations for custom group sizes, destination wedding convoys, and corporate employee transportation contracts.',
    inclusions: [
      'Fleet options: Innova Crysta, 17, 21, 26, 32, 40, 45 & 50 Seaters',
      'Both AC and Non-AC options suited to your schedule and budget',
      '100% verified chauffeurs with 24/7 Pune & Hadapsar support',
      'Direct owner pricing with transparent rates & zero brokerage',
    ],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tour Packages' },
  { id: 'suv', label: 'Innova Crysta (6+1)' },
  { id: 'traveller', label: 'Force Travellers (20 & 26)' },
  { id: 'bus', label: 'Luxury Buses (32 to 50)' },
  { id: 'pilgrimage', label: 'Pilgrimage & Darshan' },
  { id: 'airport', label: 'Airport Transfers' },
];

export default function PackagesPage({ onNavigate, onBookPackage }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPackages =
    selectedCategory === 'all'
      ? PACKAGES_DATA
      : PACKAGES_DATA.filter(
          (p) => p.category === selectedCategory || (p.categories && p.categories.includes(selectedCategory))
        );

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Tour Packages Across Maharashtra"
        subtitle="Explore our verified luxury fleet and custom travel circuits. Transparent billing with doorstep pickup anywhere in Pune."
        breadcrumb="Tour Packages"
        badge="Direct Fleet Owner Pricing"
        onNavigateHome={() => onNavigate('home')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-red-800 text-white shadow-md shadow-red-900/20 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tour Cards Grid (Identical Card Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredPackages.map((tour, idx) => (
              <motion.div
                key={tour.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-200 transition-all flex flex-col group"
              >
                {/* Tour Image with Duration / Capacity Tag */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={tour.image}
                    onError={(e) => {
                      if (tour.fallbackImage && e.currentTarget.src !== tour.fallbackImage) {
                        e.currentTarget.src = tour.fallbackImage;
                      }
                    }}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                      <Clock size={14} weight="bold" />
                      <span>{tour.duration}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-sm">
                      {tour.title}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {tour.description}
                    </p>

                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-700 font-semibold">
                      <MapPin size={16} weight="fill" className="text-red-700 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{tour.route}</span>
                    </div>

                    {/* Key Inclusions Checklist */}
                    <div className="space-y-1.5 pt-1">
                      {tour.inclusions.slice(0, 4).map((inc, incIdx) => (
                        <div key={incIdx} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
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
                      className="w-full py-3 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <span>Book This Package</span>
                      <ArrowRight size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Custom Itinerary Planning Banner */}
        <div className="mt-16 p-8 rounded-md bg-navy-950 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-xl sm:text-2xl font-black text-white">
              Need a Custom Tour Route or Multi-City Itinerary?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Contact our 24/7 Pune booking desk at +91 90115 07220 or request a customized itinerary tailored to your group size and vehicle preference.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <span>Plan Custom Tour</span>
              <ArrowRight size={16} weight="bold" />
            </button>
            <a
              href="https://wa.me/919011507220?text=Hello%20Jagtap%20Travels,%20I%20want%20to%20plan%20a%20custom%20tour%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <WhatsappLogo size={16} weight="fill" />
              <span>WhatsApp Us</span>
            </a>
            <a
              href="tel:+919011507220"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-all cursor-pointer"
            >
              <Phone size={16} weight="bold" />
              <span>Call 24/7 Desk</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
