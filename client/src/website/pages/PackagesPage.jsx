import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import {
  MapPin,
  Clock,
  Car,
  CheckCircle,
  ArrowRight,
  Sparkle,
  CalendarCheck,
  ShieldCheck,
} from '@phosphor-icons/react';

const PACKAGES_DATA = [
  {
    id: 'corporate-monthly',
    title: 'Company Tie-Ups & Monthly Cab Packages',
    category: 'corporate',
    categoryLabel: 'Corporate & Monthly Fleet',
    duration: 'Monthly Contract',
    route: 'Pune (Hinjawadi, Magarpatta, Kharadi) ➔ Executive Commute & Plant Visits',
    image: '/images/tours/corporate-monthly-car.jpg',
    tag: 'Monthly Contract',
    description:
      'Dedicated monthly chauffeur-driven vehicles for IT companies, executive daily commutes & long-term rentals in Pune with guaranteed backup vehicles.',
    pricing: [
      { vehicle: 'Sedan (Dzire / Etios)', seats: '4 Seats', price: '₹35,000 / Mo' },
      { vehicle: 'Ertiga (7 Seater)', seats: '6 Seats', price: '₹42,000 / Mo' },
      { vehicle: 'Innova Crysta', seats: '7 Seats', price: '₹55,000 / Mo' },
      { vehicle: 'Force Urbania', seats: '13-17 Seats', price: '₹75,000 / Mo' },
    ],
    inclusions: [
      'Dedicated monthly vehicle & verified commercial driver',
      'Tailored IT park staff commute (Hinjawadi, Magarpatta, Kharadi)',
      'Guaranteed immediate replacement vehicle on service days',
      'Transparent monthly billing with official GST tax invoice',
    ],
  },
  {
    id: 'ashtavinayak',
    title: 'Complete 8 Ashtavinayak Yatra',
    category: 'pilgrimage',
    categoryLabel: 'Pilgrimage & Darshan',
    duration: '3 Days / 2 Nights',
    route: 'Pune ➔ Theur ➔ Siddhatek ➔ Morgaon ➔ Pali ➔ Mahad ➔ Lenyadri ➔ Ozar ➔ Ranjangaon',
    image: '/images/tours/ashtavinayak.jpg',
    tag: 'Sacred Circuit',
    description:
      'Complete, hassle-free darshan of all 8 Swayambhu Ganpati temples across Maharashtra in religious sequential order with elderly-friendly drivers.',
    pricing: [
      { vehicle: 'Sedan (Dzire / Etios)', seats: '4 Seats', price: '₹9,500' },
      { vehicle: 'Ertiga (7 Seater)', seats: '6 Seats', price: '₹12,500' },
      { vehicle: 'Innova Crysta', seats: '7 Seats', price: '₹16,500' },
      { vehicle: 'Force Urbania / Tempo', seats: '13-17 Seats', price: '₹22,000' },
    ],
    inclusions: [
      'Fuel & Driver Allowance (Day & Night)',
      'Toll Tax & Parking Charges',
      'Doorstep Pickup & Drop in Pune/PCMC',
      'Customized Aarti & Darshan Timing Breaks',
    ],
  },
  {
    id: 'shirdi-trimbak',
    title: 'Shirdi Sai Baba & Trimbakeshwar Jyotirlinga',
    category: 'pilgrimage',
    categoryLabel: 'Pilgrimage & Darshan',
    duration: '2 Days / 1 Night',
    route: 'Pune ➔ Shirdi ➔ Shani Shingnapur ➔ Nashik ➔ Trimbakeshwar ➔ Pune',
    image: '/images/tours/shirdi-trimbakeshwar.jpg',
    tag: 'Jyotirlinga & Sai',
    description:
      'Sacred darshan at Shirdi Sai Sansthan, holy dip and darshan at Trimbakeshwar Jyotirlinga, Panchavati Ram Mandir, and Shani Shingnapur.',
    pricing: [
      { vehicle: 'Sedan (Dzire / Etios)', seats: '4 Seats', price: '₹8,200' },
      { vehicle: 'Ertiga (7 Seater)', seats: '6 Seats', price: '₹10,500' },
      { vehicle: 'Innova Crysta', seats: '7 Seats', price: '₹13,800' },
      { vehicle: 'Force Urbania', seats: '13-17 Seats', price: '₹19,500' },
    ],
    inclusions: [
      'AC Cab with fuel & toll taxes',
      'Driver night charges included',
      'Doorstep pickup from anywhere in Pune',
      'Sightseeing halts for local snacks & prasad',
    ],
  },
  {
    id: 'mahabaleshwar',
    title: 'Mahabaleshwar & Panchgani Queen of Hills',
    category: 'nature',
    categoryLabel: 'Hill Stations & Nature',
    duration: '2 Days / 1 Night',
    route: 'Pune ➔ Shirwal ➔ Wai ➔ Panchgani ➔ Mahabaleshwar ➔ Tapola ➔ Pune',
    image: '/images/tours/mahabaleshwar.jpg',
    tag: 'Monsoon & Winter Favorite',
    description:
      'Scenic Pasarni Ghat drive to Venna Lake, Mapro Garden strawberry fields, Arthur’s Seat, Kate’s Point, Elephant’s Head, and Table Land.',
    pricing: [
      { vehicle: 'Sedan (Dzire / Etios)', seats: '4 Seats', price: '₹6,200' },
      { vehicle: 'Ertiga (7 Seater)', seats: '6 Seats', price: '₹7,800' },
      { vehicle: 'Innova Crysta', seats: '7 Seats', price: '₹10,200' },
      { vehicle: 'Force Urbania', seats: '13-17 Seats', price: '₹14,500' },
    ],
    inclusions: [
      'Experienced mountain & ghat chauffeur',
      'Toll & parking charges',
      'Flexible viewpoints stopovers',
      'Sanitized AC vehicle with fresh aroma',
    ],
  },
  {
    id: 'konkan-beach',
    title: 'Alibaug, Nagaon Beach & Murud Janjira',
    category: 'coastal',
    categoryLabel: 'Coastal Konkan',
    duration: '2 Days / 1 Night',
    route: 'Pune ➔ Khopoli ➔ Pen ➔ Alibaug ➔ Nagaon Beach ➔ Murud Janjira Fort',
    image: '/images/tours/konkan-beach.jpg',
    tag: 'Beach & Watersports',
    description:
      'Golden sand beaches, banana boat rides, authentic Konkani seafood feasts, and boat exploration of the historic Murud Janjira sea fortress.',
    pricing: [
      { vehicle: 'Sedan (Dzire / Etios)', seats: '4 Seats', price: '₹7,500' },
      { vehicle: 'Ertiga (7 Seater)', seats: '6 Seats', price: '₹9,500' },
      { vehicle: 'Innova Crysta', seats: '7 Seats', price: '₹12,800' },
      { vehicle: 'Force Urbania', seats: '13-17 Seats', price: '₹18,000' },
    ],
    inclusions: [
      'Entire fuel, toll & state taxes',
      'Driver night stay charges',
      'Beachside drop & pickup',
      'Boot space for weekend luggage',
    ],
  },
  {
    id: 'mumbai-airport',
    title: 'Pune ➔ Mumbai T1 / T2 Airport Transfer',
    category: 'airport',
    categoryLabel: 'Airport & Outstation',
    duration: 'One-Way / Round Trip',
    route: 'Pune (Any Address) ➔ Mumbai-Pune Expressway ➔ CSMI Airport Terminal 1 & 2',
    image: '/images/tours/mumbai-expressway.jpg',
    tag: '24/7 Guaranteed Punctual',
    description:
      'Stress-free, dependable airport transit with 15-minute advance arrival at your gate, polite chauffeur, flight tracking, and zero surge pricing.',
    pricing: [
      { vehicle: 'Sedan (Dzire / Etios)', seats: '4 Seats', price: '₹2,600' },
      { vehicle: 'Ertiga (7 Seater)', seats: '6 Seats', price: '₹3,400' },
      { vehicle: 'Innova Crysta', seats: '7 Seats', price: '₹4,800' },
      { vehicle: 'Force Urbania', seats: '13-17 Seats', price: '₹7,200' },
    ],
    inclusions: [
      'Expressway Toll fee included',
      'Airport entry & parking buffer',
      'Flight delay tracking',
      'Luggage assistance by chauffeur',
    ],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tour Packages' },
  { id: 'corporate', label: 'Company Tie-Ups & Monthly' },
  { id: 'pilgrimage', label: 'Pilgrimage & Darshan' },
  { id: 'nature', label: 'Hill Stations & Nature' },
  { id: 'coastal', label: 'Coastal Konkan' },
  { id: 'airport', label: 'Airport Transfers' },
];

export default function PackagesPage({ onNavigate, onBookPackage }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPackages =
    selectedCategory === 'all'
      ? PACKAGES_DATA
      : PACKAGES_DATA.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Tour Packages Across Maharashtra"
        subtitle="Customized family yatras, hill station getaways, beach holidays, and airport transfers with guaranteed clean cars and patient chauffeurs."
        breadcrumb="Tour Packages"
        badge="Curated Maharashtra Circuits"
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
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-red-800 text-white shadow-md shadow-red-900/20 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tour Cards Grid */}
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
                {/* Tour Image with Duration Tag */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

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
                      {tour.inclusions.slice(0, 3).map((inc, incIdx) => (
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
                      className="w-full py-3 rounded-md bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
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
              We customize multi-day pilgrim circuits, family vacations, and corporate transport tailored to your exact departure time, preferred car, and budget.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="px-6 py-3.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow-md shrink-0 transition-transform hover:scale-105"
          >
            Request Custom Quotation
          </button>
        </div>
      </div>
    </div>
  );
}
