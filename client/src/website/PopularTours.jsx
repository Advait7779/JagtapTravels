import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, ArrowRight } from '@phosphor-icons/react';

export default function PopularTours() {
  const tours = [
    {
      id: 'corporate-monthly',
      title: 'Company Tie-Ups & Monthly Cab Packages',
      category: 'Corporate & Monthly Fleet',
      duration: 'Monthly Contract',
      startingPrice: 35000,
      image: '/images/tours/corporate-monthly-car.jpg',
      badge: 'Corporate Fleet',
      highlight:
        'Dedicated monthly chauffeur-driven vehicles for IT companies, executive daily commutes & long-term rentals in Pune.',
      features: [
        'Dedicated monthly vehicle & verified commercial driver',
        'Tailored IT park staff commute (Hinjawadi, Magarpatta, Kharadi)',
        'Guaranteed immediate replacement vehicle on service days',
        'Transparent monthly billing with official GST tax invoice',
      ],
    },
    {
      id: 'mumbai-cab',
      title: 'Pune ➔ Mumbai Airport / City Cab',
      category: 'Airport Transfer',
      duration: 'One Way / Same Day',
      startingPrice: 2800,
      image: '/images/tours/mumbai-expressway.jpg',
      badge: 'Daily Express',
      highlight: 'Doorstep pickup from anywhere in Pune directly to Mumbai T1 / T2 Airport with zero delay.',
      features: [
        'Dedicated cab via expressway',
        '24/7 flight delay monitoring',
        'Innova Crysta, Ertiga or Sedan',
        'Zero midnight surcharge',
      ],
    },
    {
      id: 'mahabaleshwar',
      title: 'Mahabaleshwar & Panchgani Holiday',
      category: 'Hill Station Tour',
      duration: '3 Days / 2 Nights',
      startingPrice: 8500,
      image: '/images/tours/mahabaleshwar.jpg',
      badge: 'Family Favorite',
      highlight: 'Scenic Sahyadri mountain viewpoints, strawberry farms & historical Pratapgad Fort.',
      features: [
        'Arthur Seat, Kate Point & Venna Lake',
        'Mapro Garden strawberry village visit',
        'Historical Pratapgad Fort excursion',
        'Ghat-expert mountain chauffeur',
      ],
    },
    {
      id: 'ashtavinayak',
      title: 'Complete Ashtavinayak Darshan Circuit',
      category: 'Pilgrimage Circuit',
      duration: '2 Days / 1 Night',
      startingPrice: 9200,
      image: '/images/tours/ashtavinayak.jpg',
      badge: 'Devotional Tour',
      highlight: 'Complete darshan of all 8 holy swayambhu Ganesha temples across Maharashtra.',
      features: [
        'Morgaon, Theur, Siddhatek, Ranjangaon',
        'Ozar, Lenyadri, Mahad & Pali',
        'Senior-citizen friendly paced itinerary',
        'Chauffeur who knows temple aarti timings',
      ],
    },
    {
      id: 'shirdi',
      title: 'Shirdi, Shani Shingnapur & Trimbakeshwar',
      category: 'Temple Pilgrimage',
      duration: '2 Days / 1 Night',
      startingPrice: 8800,
      image: '/images/tours/shirdi-trimbakeshwar.jpg',
      badge: 'Spiritual Yatra',
      highlight: 'Holy Sai Baba Samadhi temple darshan, Trimbakeshwar Shiva Jyotirlinga & Shani temple.',
      features: [
        'VIP Darshan pass guidance at Shirdi',
        'Trimbakeshwar Jyotirlinga darshan',
        'Comfortable highway cruising in Innova Crysta',
        'Flexible halts for meals & relaxation',
      ],
    },
    {
      id: 'konkan',
      title: 'Konkan Beach Holiday (Alibaug / Dapoli)',
      category: 'Coastal Getaway',
      duration: '3 Days / 2 Nights',
      startingPrice: 9500,
      image: '/images/tours/konkan-beach.jpg',
      badge: 'Beach Special',
      highlight: 'Pristine beaches, Malvani seafood, water sports & coastal sea forts.',
      features: [
        'Nagaon & Kashid pristine beach stops',
        'Murud-Janjira sea fort excursion',
        'Water sports & sunset viewpoints',
        'Ample boot space for holiday luggage',
      ],
    },
  ];

  return (
    <section id="packages" className="py-16 sm:py-24 bg-white border-b border-slate-200 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto space-y-2.5 mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Popular Tour Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            Handcrafted holiday circuits with private AC cabs, verified chauffeurs, and doorstep pickup anywhere in Pune.
          </p>
        </motion.div>

        {/* Tour Cards Grid with Staggered Scroll Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {tours.map((tour, idx) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="bg-white rounded-md border border-slate-200/90 shadow-md shadow-slate-100 hover:shadow-xl hover:shadow-red-950/10 hover:border-amber-400 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Real Destination Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  <span className="absolute bottom-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded bg-slate-950/90 text-white flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                    <Clock size={15} weight="bold" className="text-amber-400" />
                    <span>{tour.duration}</span>
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-red-700 transition-colors tracking-tight">
                    {tour.title}
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {tour.highlight}
                  </p>

                  {/* Feature Checklist with Phosphor Check Icon */}
                  <div className="space-y-2 pt-3 text-xs text-slate-800 font-medium border-t border-slate-100">
                    {tour.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check size={15} weight="bold" className="shrink-0 mt-0.5 text-emerald-600" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer (Without Pricing) */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100">
                <a
                  href="#contact"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Book Tour</span>
                  <ArrowRight size={15} weight="bold" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
