import React, { useState, useEffect } from 'react';
import { ArrowUp, PhoneCall } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Real WhatsApp Official Brand Logo SVG
 * Matches the official WhatsApp emblem with green gradient, white outline/tail, and handset.
 */
function RealWhatsAppIcon({ className = 'w-full h-full' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175.216 175.552" className={className}>
      <defs>
        <linearGradient id="wa-grad-btn" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#57d163" />
          <stop offset="1" stopColor="#23b33a" />
        </linearGradient>
        <filter id="wa-shadow-btn" width="1.115" height="1.114" x="-.057" y="-.057" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="3.531" />
        </filter>
      </defs>
      <path
        fill="#b3b3b3"
        d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0"
        filter="url(#wa-shadow-btn)"
      />
      <path
        fill="#fff"
        d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
      />
      <path
        fill="url(#wa-grad-btn)"
        d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
      />
    </svg>
  );
}

const CALL_NUMBERS = ['818087220', '8888094770', '9011507220'];
const WHATSAPP_NUMBER = '9011507220';

export default function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCall = (e) => {
    e.preventDefault();
    const picked = CALL_NUMBERS[Math.floor(Math.random() * CALL_NUMBERS.length)];
    window.location.href = `tel:+91${picked}`;
  };

  return (
    <>
      {/* Fixed Left Bottom: Direct Call Button with Dynamic Number Rotation */}
      <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50">
        <a
          href="tel:+919011507220"
          onClick={handleCall}
          aria-label="Call Jagtap Travels (24/7 Helpline)"
          title="Call Jagtap Travels (24/7 Helpline)"
          className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-700 hover:bg-red-800 text-white shadow-xl shadow-red-900/30 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/80 cursor-pointer"
        >
          <PhoneCall size={24} weight="fill" className="transition-transform group-hover:rotate-12" />
        </a>
      </div>

      {/* Fixed Right Bottom: Real WhatsApp & Scroll To Top (No blinking effect) */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-center gap-3">
        {/* Scroll To Top Button (Appears above WhatsApp when scrolled down) */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-300 hover:border-red-600 hover:text-red-700 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-90"
            >
              <ArrowUp size={18} weight="bold" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Real WhatsApp Floating Action Button */}
        <a
          href={`https://wa.me/91${WHATSAPP_NUMBER}?text=Hi%20Jagtap%20Travels,%20I%20have%20an%20inquiry%20regarding%20cab%20and%20bus%20booking`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Chat on WhatsApp (+91 ${WHATSAPP_NUMBER})`}
          title="Chat on WhatsApp"
          className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 transition-all duration-300 hover:scale-110 active:scale-95 drop-shadow-xl"
        >
          <RealWhatsAppIcon className="w-full h-full transition-transform group-hover:scale-105" />
        </a>
      </div>
    </>
  );
}
