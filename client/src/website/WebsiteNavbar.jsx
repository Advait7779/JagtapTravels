import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ArrowRight, List, X } from '@phosphor-icons/react';

export default function WebsiteNavbar({ onOpenAdmin, currentPage = 'home', onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', name: 'Home', href: '#home' },
    { id: 'packages', name: 'Tour Packages', href: '#packages' },
    { id: 'why-us', name: 'Why Us', href: '#why-us' },
    { id: 'contact', name: 'Contact', href: '#contact' },
  ];

  const handleLinkClick = (e, id) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Notification Bar */}
      <div className="bg-red-800 text-white text-[11px] font-semibold py-1.5 px-4 sm:px-6 hidden sm:block border-b border-red-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Address */}
          <div className="flex items-center gap-2 text-white font-medium">
            <MapPin size={15} weight="bold" className="shrink-0 text-amber-300" />
            <span>Siddhi Niwas, Purandhar Colony, Bhekrai Nagar, Pune - 412308</span>
          </div>

          {/* Right: 24/7 Service */}
          <div className="flex items-center gap-2 text-amber-200 font-bold tracking-wide">
            <Clock size={15} weight="bold" className="shrink-0 text-amber-300" />
            <span>24/7 Service Available</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={`border-b transition-all duration-300 ${
          scrolled
            ? 'border-slate-200/90 shadow-md py-2.5 bg-white/95 backdrop-blur-md'
            : 'border-slate-100 py-3.5 bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <img
              src="/jagtap-logo.png"
              alt="Jagtap Travels"
              className="h-10 sm:h-13 w-auto object-contain"
            />
          </a>

          {/* Desktop Navigation Links (Strictly the 5 items only) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-800">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className={`py-1 relative group tracking-tight transition-colors ${
                    isActive ? 'text-red-800 font-bold' : 'text-slate-700 hover:text-red-700'
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-red-700 transition-all duration-200 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </a>
              );
            })}
          </div>

          {/* Action CTA: Book Now Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, 'contact')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-md shadow-red-950/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>Book Now</span>
              <ArrowRight size={15} weight="bold" />
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2 shadow-xl overflow-hidden"
            >
              {navLinks.map((link) => {
                const isActive = currentPage === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-50 text-red-800 font-bold border-l-4 border-red-700'
                        : 'text-slate-800 hover:bg-amber-50 hover:text-red-700'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <a
                  href="#contact"
                  onClick={(e) => handleLinkClick(e, 'contact')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 shadow-sm"
                >
                  <span>Book Now</span>
                  <ArrowRight size={14} weight="bold" />
                </a>
                <div className="pt-2 text-center text-[11px] text-slate-500 flex flex-col items-center gap-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Clock size={14} weight="bold" className="text-red-700" /> 24/7 Service Available
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Siddhi Niwas, Purandhar Colony, Bhekrai Nagar, Pune - 412308
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
