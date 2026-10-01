import React from 'react';
import { Envelope, MapPin } from '@phosphor-icons/react';

export default function WebsiteFooter({ onOpenAdmin, onNavigate }) {
  const year = new Date().getFullYear();

  const handleNav = (e, pageId) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(pageId);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-md shadow-md border border-slate-700">
                <img
                  src="/jagtap-logo.png"
                  alt="Jagtap Travels"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-wide block leading-tight">
                  JAGTAP <span className="text-amber-400">TRAVELS</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest">
                  Travel • Explore • Experience
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Trusted tour operator and car rental service based in Pune, Maharashtra. Offering
              reliable, sanitized, and chauffeur-driven AC cabs for outstation holidays, airport
              drops, and spiritual yatras.
            </p>

            <div className="pt-2 text-xs space-y-2 text-slate-200">
              <p className="flex items-center gap-2">
                <Envelope size={16} weight="bold" className="text-amber-400" />
                <span>bookings@jagtaptravels.com</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={16} weight="bold" className="shrink-0 mt-0.5 text-amber-400" />
                <span>Siddhi Niwas, Purandhar Colony, Bhekrai Nagar, Pune - 412308</span>
              </p>
            </div>
          </div>

          {/* Quick Nav (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleNav(e, 'home')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#packages"
                  onClick={(e) => handleNav(e, 'packages')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Tour Packages
                </a>
              </li>
              <li>
                <a
                  href="#why-us"
                  onClick={(e) => handleNav(e, 'why-us')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Why Choose Us
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleNav(e, 'contact')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Popular Routes (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Popular Routes
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>• Pune to Mumbai Airport (T1/T2)</li>
              <li>• Pune to Mahabaleshwar & Panchgani</li>
              <li>• Complete Ashtavinayak Circuit (8 Temples)</li>
              <li>• Pune to Shirdi & Shani Shingnapur</li>
              <li>• Pune to Goa (North / South Beaches)</li>
              <li>• Pune to Alibaug & Nagaon Beach</li>
              <li>• Pune to Lonavala & Khandala Ghats</li>
            </ul>
          </div>

          {/* Services & Staff Portal (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Our Services</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>• Outstation Round-Trip Tours</li>
              <li>• Pune ➔ Mumbai Airport Transfers</li>
              <li>• Ashtavinayak & Shirdi Pilgrimages</li>
              <li>• Family Vacations & Group Travel</li>
            </ul>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-4"
            >
              Staff CRM Login
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <p>© {year} Jagtap Travels. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <a
              href="#privacy"
              onClick={(e) => handleNav(e, 'privacy')}
              className="hover:text-amber-400 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="#terms"
              onClick={(e) => handleNav(e, 'terms')}
              className="hover:text-amber-400 transition-colors"
            >
              Terms &amp; Conditions
            </a>
          </div>
          <p>Operated with pride from Bhekrai Nagar, Pune, Maharashtra</p>
        </div>
      </div>
    </footer>
  );
}
