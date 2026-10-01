import React from 'react';

export default function CtaSection({ onNavigate }) {
  return (
    <section className="py-14 sm:py-16 bg-slate-900 border-t border-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ready to Book Your Journey?
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Reliable outstation cabs, airport transfers, and corporate fleet services across Maharashtra.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('contact')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-red-800 hover:bg-red-900 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
          >
            Book Now
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('packages')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
          >
            View Tour Packages
          </button>
        </div>

        <div className="pt-2 text-xs text-slate-400">
          <span>24/7 Reservation Desk: </span>
          <a
            href="tel:+919011507220"
            className="text-slate-300 hover:text-white font-semibold underline underline-offset-2"
          >
            +91 90115 07220
          </a>
          <span className="mx-1.5">•</span>
          <a
            href="tel:+918888094770"
            className="text-slate-300 hover:text-white font-semibold underline underline-offset-2"
          >
            +91 88880 94770
          </a>
        </div>
      </div>
    </section>
  );
}
