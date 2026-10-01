import React from 'react';
import PageHeader from '../components/PageHeader';
import WhyChooseUs from '../WhyChooseUs';
import {
  ShieldCheck,
  Certificate,
  Gauge,
  UserCheck,
  MapTrifold,
  Clock,
  CheckCircle,
  ArrowRight,
} from '@phosphor-icons/react';

export default function WhyUsPage({ onNavigate }) {
  const safetyStandards = [
    {
      icon: UserCheck,
      title: 'Verified Commercial Chauffeurs',
      desc: 'All drivers hold commercial passenger badges, undergo strict background checks, and possess 10+ years of highway driving experience.',
    },
    {
      icon: Gauge,
      title: 'GPS Tracking & Speed Governance',
      desc: 'Every vehicle is fitted with certified speed governors and GPS telemetry for passenger peace of mind during late night or ghat journeys.',
    },
    {
      icon: ShieldCheck,
      title: 'Daily Pre-Trip Sanitization & Check',
      desc: 'Tire pressures, braking fluid, chilled air conditioning filters, and emergency first-aid kits are inspected before every single departure.',
    },
    {
      icon: MapTrifold,
      title: 'Sahyadri Ghat Mastery',
      desc: 'Our pilots specialize in challenging mountain passes including Pasarni (Mahabaleshwar), Khandala, Tamhini, Malshej, and Amboli.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Why Choose Jagtap Travels"
        subtitle="15+ Years of trusted hospitality, verified chauffeurs, and a spotless commercial fleet serving families, pilgrims, and corporates in Pune."
        breadcrumb="Why Us"
        badge="15+ Years Travel Excellence"
        onNavigateHome={() => onNavigate('home')}
      />

      {/* 1. Core Pillars of Service */}
      <WhyChooseUs />

      {/* 3. Safety & Maintenance Standards */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Safety Protocols Every Kilometer of Your Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              We never compromise on safety. Here is how we safeguard families, corporate executives, and senior citizens on every tour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {safetyStandards.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-md bg-slate-50 border border-slate-200/80 hover:border-red-300 transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-md bg-white border border-slate-200 text-red-800 flex items-center justify-center shadow-sm">
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Ready to Plan CTA */}
      <section className="py-16 bg-red-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Experience the Jagtap Travels Hospitality Difference
          </h3>
          <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto font-medium">
            Contact our Pune office (Bhekrai Nagar) today for instant vehicle booking, customized itinerary planning, or transparent tariff consultations.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="px-6 py-3.5 rounded-md bg-white text-red-900 text-xs sm:text-sm font-bold shadow-md hover:bg-amber-50 transition-all hover:scale-105"
            >
              Book Your Journey
            </button>
            <a
              href="tel:+919011507220"
              className="px-6 py-3.5 rounded-md bg-red-900/60 border border-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-900 transition-all"
            >
              Call 24/7 Helpline: +91 90115 07220
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
