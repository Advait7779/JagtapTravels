import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 1,
      image: '/banner-slide-1.jpg',
      title: 'Explore Maharashtra With Supreme Comfort',
      highlight: 'Luxury Tour Buses & Cabs',
      description:
        'Experience the scenic Sahyadri ghats, Konkan beaches, and sacred temples in pristine air-conditioned tour buses and private outstation cabs with verified chauffeurs.',
      primaryBtnText: 'Explore Tour Packages',
      primaryBtnHref: '#packages',
      secondaryBtnText: 'Book Now',
      secondaryBtnHref: '#contact',
    },
    {
      id: 2,
      image: '/banner-slide-2.jpg',
      title: 'Punctual Pune ➔ Mumbai Airport Transfers',
      highlight: 'Innova Crysta & Sedans',
      description:
        'Smooth expressway travel with guaranteed on-time doorstep pickup. No surge pricing, no cancellation worries, and ample boot space for family luggage.',
      primaryBtnText: 'Book Airport Cab',
      primaryBtnHref: '#contact',
      secondaryBtnText: 'Book Now',
      secondaryBtnHref: '#contact',
    },
    {
      id: 3,
      image: '/banner-slide-3.jpg',
      title: 'Corporate Fleet & Company Tie-Up Services',
      highlight: 'Dedicated Chauffeurs & Monthly Rentals',
      description:
        'Reliable employee commute solutions, executive daily transfers, and dedicated long-term fleet contracts for Pune IT parks and corporate headquarters. Guaranteed backup vehicles, verified drivers, and transparent monthly GST billing.',
      primaryBtnText: 'Explore Corporate Fleet',
      primaryBtnHref: '#packages',
      secondaryBtnText: 'Book Corporate Cab',
      secondaryBtnHref: '#contact',
    },
  ];

  // Auto-advance slides every 5.5 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <section
      id="home"
      className="relative pt-20 sm:pt-24 md:pt-28 min-h-[520px] xs:min-h-[560px] sm:min-h-[640px] md:min-h-[700px] lg:min-h-[780px] xl:min-h-[840px] max-h-[1050px] flex items-center overflow-hidden select-none bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Ken Burns subtle scale and smooth crossfade */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        >
          {/* Subtle slow zoom when active */}
          <div
            className={`w-full h-full transition-transform duration-[7000ms] ease-out ${
              index === currentSlide ? 'scale-105' : 'scale-100'
            }`}
          />
          {/* Layered cinematic gradients for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/25 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />
        </div>
      ))}

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-3xl space-y-4 sm:space-y-5 text-white"
          >
            {/* Heading */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] sm:leading-[1.16] text-hero-title-shadow">
              {slide.title}{' '}
              <span className="text-amber-300 block sm:inline mt-1 sm:mt-0 font-extrabold">
                — {slide.highlight}
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-base lg:text-lg text-white/95 leading-relaxed max-w-2xl font-medium text-hero-shadow">
              {slide.description}
            </p>

            {/* Action CTAs with Phosphor Icons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              <a
                href={slide.primaryBtnHref}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold text-white bg-red-700 hover:bg-red-800 shadow-md shadow-red-950/40 border border-red-500/50 transition-all hover:scale-105 active:scale-95"
              >
                <span>{slide.primaryBtnText}</span>
                <ArrowRight size={15} weight="bold" />
              </a>

              <a
                href={slide.secondaryBtnHref}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold text-white bg-slate-900/90 hover:bg-slate-900 border border-white/25 shadow-md shadow-slate-950/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
              >
                <span>{slide.secondaryBtnText}</span>
                <ArrowRight size={14} weight="bold" />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows with Phosphor Icons */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-red-700 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-xl"
      >
        <CaretLeft size={20} weight="bold" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-red-700 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-xl"
      >
        <CaretRight size={20} weight="bold" />
      </button>

      {/* Dot Pagination Bar */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-slate-950/70 backdrop-blur-md px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/15 shadow-xl">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full h-2 sm:h-2.5 ${
              idx === currentSlide
                ? 'w-7 sm:w-9 bg-amber-400 shadow-sm shadow-amber-400/60'
                : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
