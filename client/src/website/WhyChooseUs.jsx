import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkle,
  Certificate,
  Receipt,
  Clock,
  Heart,
  Compass,
  ArrowRight,
} from '@phosphor-icons/react';

export default function WhyChooseUs() {
  const pillars = [
    {
      icon: Sparkle,
      title: 'Spotless & Sanitized Cabs',
      description:
        'Every vehicle is thoroughly washed, vacuumed, and sanitized before your trip. Enjoy dust-free interiors, fresh aroma, and chilled air conditioning.',
    },
    {
      icon: Certificate,
      title: 'Expert Mountain & Ghat Drivers',
      description:
        'Chauffeurs with 10+ years experience navigating Sahyadri ghats (Pasarni, Khandala, Tamhini, Amboli). Safe, steady, and disciplined highway driving.',
    },
    {
      icon: Receipt,
      title: '100% Transparent Fixed Rates',
      description:
        'No hidden surcharges or surprise billing at destination. Clear per-KM tariffs, driver allowance, and GST invoice options provided upfront.',
    },
    {
      icon: Clock,
      title: '24/7 Punctual Doorstep Pickup',
      description:
        'Early morning 3:30 AM airport run or late night city pickup — our cab arrives at your gate 10 minutes prior to scheduled departure.',
    },
    {
      icon: Heart,
      title: 'Family & Senior Citizen Friendly',
      description:
        'We understand family travel. Chauffeurs happily accommodate tea/meal breaks, photography stops, and assist with heavy luggage.',
    },
    {
      icon: Compass,
      title: 'Customized Tour Plans',
      description:
        'Not bound to rigid timetables. Explore scenic spots at your leisure, add temple darshan stops, or alter your return schedule smoothly.',
    },
  ];

  return (
    <section id="why-us" className="py-16 sm:py-24 bg-slate-50/70 text-slate-800 relative overflow-hidden border-b border-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-2.5 mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Families & Corporates Trust Us
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            Over a decade of dedicated travel service across Maharashtra with verified drivers, clean cars, and dependable hospitality.
          </p>
        </motion.div>

        {/* Pillars Grid with Staggered Animations & Color SVGs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white border border-slate-200/90 hover:border-red-300 rounded-md p-6 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-md bg-red-50 border border-red-100 text-red-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-700 group-hover:text-white group-hover:shadow-md transition-all">
                  <Icon size={28} weight="bold" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-red-700 transition-colors tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-700 mt-2.5 leading-relaxed font-medium">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-md bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white shadow-2xl shadow-red-950/20 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left border border-red-600/40"
        >
          <div className="space-y-1">
            <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Planning a Weekend Getaway or Family Pilgrimage?
            </h4>
            <p className="text-xs sm:text-sm text-white/95 font-medium">
              Send your travel inquiry to our senior reservation desk in Bhekrai Nagar, Pune for prompt vehicle and itinerary confirmation.
            </p>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-white text-red-800 hover:bg-amber-50 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <span>Book Your Tour Now</span>
              <ArrowRight size={16} weight="bold" />
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
