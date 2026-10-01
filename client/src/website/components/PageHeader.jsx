import React from 'react';
import { CaretRight, House } from '@phosphor-icons/react';

export default function PageHeader({ title, subtitle, breadcrumb, badge, onNavigateHome }) {
  return (
    <div className="relative pt-32 pb-14 sm:pt-36 sm:pb-16 bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 text-white overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] border-b border-slate-800">
      {/* Subtle Glow & Ambient Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center sm:text-left">
        {/* Breadcrumb */}
        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 font-medium mb-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <House size={14} weight="bold" />
            <span>Home</span>
          </button>
          <CaretRight size={12} weight="bold" className="text-slate-500" />
          <span className="text-amber-400 font-bold">{breadcrumb || title}</span>
        </div>

        {/* Badge */}
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/60 border border-red-700/50 text-amber-300 text-xs font-bold mb-3">
            <span>{badge}</span>
          </div>
        )}

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-normal max-w-3xl mt-2.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
