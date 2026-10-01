import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Quotes,
  CheckCircle,
  MapPin,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';

export default function CustomerReviews() {
  const scrollRef = useRef(null);

  const reviews = [
    {
      id: 1,
      name: 'Rajesh & Meena Sharma',
      initials: 'RS',
      avatarColor: 'from-amber-500 to-orange-600',
      location: 'Hadapsar, Pune',
      tour: 'Mahabaleshwar & Panchgani',
      rating: 5,
      comment:
        'Booked for our 3-day family trip with elderly parents and kids. The cab was spotless and driver Ramesh drove with great care through the Pasarni ghat. Highly recommended!',
    },
    {
      id: 2,
      name: 'Dr. Amit Deshmukh',
      initials: 'AD',
      avatarColor: 'from-blue-600 to-indigo-700',
      location: 'Kothrud, Pune',
      tour: 'Ashtavinayak Circuit (8 Temples)',
      rating: 5,
      comment:
        'The best experience we have had for Ashtavinayak darshan. Our chauffeur knew temple morning aarti timings and smoothest bypass routes. Completed all 8 Ganpatis comfortably with zero fatigue. 10/10 service!',
    },
    {
      id: 3,
      name: 'Sunil Kulkarni',
      initials: 'SK',
      avatarColor: 'from-emerald-600 to-teal-700',
      location: 'Hinjewadi Phase 1',
      tour: 'Pune ➔ Mumbai Airport T2',
      rating: 5,
      comment:
        'I travel to Mumbai Airport frequently for overseas business trips. Jagtap Travels has never been late once in 2 years. Even for 3:30 AM pickups, the cab is at my apartment gate 10 minutes prior.',
    },
    {
      id: 4,
      name: 'Pooja Patil & Friends',
      initials: 'PP',
      avatarColor: 'from-rose-500 to-red-600',
      location: 'Baner, Pune',
      tour: 'Goa Coastal Roadtrip',
      rating: 5,
      comment:
        'We booked a vehicle for a reunion roadtrip to South Goa. Superb pushback luxury seats, powerful AC, and ample luggage space. Driver was very polite and helpful throughout the 4 days journey.',
    },
    {
      id: 5,
      name: 'Vikram & Snehal Joshi',
      initials: 'VJ',
      avatarColor: 'from-purple-600 to-violet-700',
      location: 'Aundh, Pune',
      tour: 'Shirdi & Shani Shingnapur',
      rating: 5,
      comment:
        'Extremely comfortable pilgrimage journey. Driver arranged VIP darshan queue advice and great vegetarian highway restaurant stops. Smooth ride throughout for our senior parents.',
    },
    {
      id: 6,
      name: 'Anand R. Verma',
      initials: 'AV',
      avatarColor: 'from-cyan-600 to-blue-700',
      location: 'Viman Nagar, Pune',
      tour: 'Lonavala & Khandala Ghats',
      rating: 5,
      comment:
        'Prompt booking on short notice on Sunday morning. Transparent fixed billing with no hidden toll charges or driver allowance surprises. Truly honest, polite, and professional service.',
    },
    {
      id: 7,
      name: 'Cognizant Team Pune',
      initials: 'CT',
      avatarColor: 'from-amber-600 to-yellow-600',
      location: 'Magarpatta City',
      tour: 'Alibaug Beach Corporate Offsite',
      rating: 5,
      comment:
        'Organized our 30-member team outing to Alibaug. Pristine bus condition, chilled air conditioning, super smooth highway ride, and punctual coordination from the Jagtap Travels team.',
    },
    {
      id: 8,
      name: 'Sanjay Thorat & Family',
      initials: 'ST',
      avatarColor: 'from-teal-600 to-emerald-700',
      location: 'Pimpri-Chinchwad (PCMC)',
      tour: 'Konkan Tarkarli & Malvan Tour',
      rating: 5,
      comment:
        '5-day holiday tour to coastal Konkan. The vehicle was clean and smelled fresh each morning. Chauffeur had deep local knowledge of beaches and scenic coastal viewpoints.',
    },
  ];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200 text-slate-800 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-2"
        >
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            What Our Valued Travelers Say
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            Genuine experiences from families, corporate teams, and pilgrims traveling across Maharashtra with Jagtap Travels.
          </p>
        </motion.div>
      </div>

      {/* Reviews Carousel with Generous Spacing Between Arrows & Cards */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center gap-2 sm:gap-6">
        {/* Left Side Navigation Arrow */}
        <button
          onClick={() => scroll('left')}
          aria-label="Previous reviews"
          className="shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white text-red-700 hover:text-red-800 border border-slate-300 hover:border-red-600 shadow-md hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        {/* 8-Card Horizontally Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth py-4 no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="w-[270px] xs:w-[310px] sm:w-[370px] shrink-0 snap-start bg-white rounded-md border border-slate-200/90 p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-amber-400/80 transition-all duration-300 flex flex-col justify-between group relative"
            >
              {/* Top Badge Row */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-bold text-red-700 bg-red-50 border border-red-100 max-w-[150px] xs:max-w-[190px] sm:max-w-[240px] truncate shadow-2xs">
                    <MapPin size={12} weight="bold" className="shrink-0" />
                    <span className="truncate">{rev.tour}</span>
                  </span>

                  {/* 5 Stars Rating */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={14} weight="fill" className="text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="relative mb-4 sm:mb-5">
                  <Quotes
                    size={24}
                    weight="fill"
                    className="absolute -top-1.5 -left-1 text-slate-200 group-hover:text-red-200 transition-colors"
                  />
                  <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium relative z-10 pt-1">
                    "{rev.comment}"
                  </p>
                </div>
              </div>

              {/* Bottom Author Card */}
              <div className="pt-3.5 sm:pt-4 border-t border-slate-100 flex items-center gap-2.5 sm:gap-3 mt-auto">
                {/* Vibrant Initial Avatar */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${rev.avatarColor} text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0`}
                >
                  {rev.initials}
                </div>

                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                    <span>{rev.name}</span>
                    <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                  </h4>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    {rev.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side Navigation Arrow */}
        <button
          onClick={() => scroll('right')}
          aria-label="Next reviews"
          className="shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white text-red-700 hover:text-red-800 border border-slate-300 hover:border-red-600 shadow-md hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
        >
          <CaretRight size={20} weight="bold" />
        </button>
      </div>
    </section>
  );
}
