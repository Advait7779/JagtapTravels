import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../HeroSection';
import PopularTours from '../PopularTours';
import WhyChooseUs from '../WhyChooseUs';
import CustomerReviews from '../CustomerReviews';
import CtaSection from '../CtaSection';
import VehicleCollagePattern from '../components/VehicleCollagePattern';
import { ArrowRight } from '@phosphor-icons/react';

export default function HomePage({ onNavigate }) {
  return (
    <div className="space-y-0">
      {/* 1. Hero Section with Carousel & Quick Booking */}
      <HeroSection />

      {/* 2. Unique Vehicle Showcase Section (Matching Reference Image Pattern) */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Our Travel Fleet in Maharashtra
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Choose from company tie-up Maruti Ertiga MPVs, executive Toyota Innova Crysta SUVs, economical Sedans, and spacious luxury tourist buses with expert chauffeurs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('why-us')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-800 hover:text-red-900 group shrink-0"
            >
              <span>Why Choose Jagtap Travels</span>
              <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Unique Overlapping Vehicle Collage Component */}
          <VehicleCollagePattern
            onBookClick={() => onNavigate('contact')}
          />
        </div>
      </section>

      {/* 3. Popular Maharashtra Tour Packages Preview */}
      <PopularTours />

      {/* View All Packages Quick Bar */}
      <div className="bg-slate-50 py-6 border-b border-slate-200 text-center">
        <button
          type="button"
          onClick={() => onNavigate('packages')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-navy-900 hover:bg-navy-950 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
        >
          <span>View All Tour Packages & Custom Itineraries</span>
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

      {/* 4. Why Choose Us (Trust Pillars) */}
      <WhyChooseUs />

      {/* 5. Verified Customer Reviews */}
      <CustomerReviews />


      {/* 6. Call To Action (CTA) Section */}
      <CtaSection onNavigate={onNavigate} />
    </div>
  );
}
