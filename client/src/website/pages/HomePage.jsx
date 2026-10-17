import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../HeroSection';
import WhyChooseUs from '../WhyChooseUs';
import CustomerReviews from '../CustomerReviews';
import CtaSection from '../CtaSection';
import VehicleCollagePattern from '../components/VehicleCollagePattern';
import FleetGallerySection from '../components/FleetGallerySection';
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
                Choose from our premium owned fleet: executive Toyota Innova Crysta (6+1), luxury Force Travellers (20 & 26 Seater AC Pushback), and executive AC coaches (32, 45 & 46 Seater with Air Suspension) with expert highway chauffeurs.
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

      {/* 3. Complete Owned Fleet Inventory & Flyer Showcase */}
      <FleetGallerySection onBookClick={() => onNavigate('contact')} />

      {/* 5. Why Choose Us (Trust Pillars) */}
      <WhyChooseUs />

      {/* 5. Verified Customer Reviews */}
      <CustomerReviews />


      {/* 6. Call To Action (CTA) Section */}
      <CtaSection onNavigate={onNavigate} />
    </div>
  );
}
