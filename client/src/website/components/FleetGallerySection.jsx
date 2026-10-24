import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WhatsappLogo,
  Phone,
  Eye,
  X,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import { FLEET_VEHICLES } from './VehicleCollagePattern';

export default function FleetGallerySection({ onBookClick }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedVehicle(null);
    };
    if (selectedVehicle) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVehicle]);

  return (
    <section className="py-14 sm:py-18 bg-slate-50 border-b border-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 bg-red-100/70 px-2.5 py-1 rounded">
              Verified Fleet Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Browse All Vehicles in Our Owned Fleet
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Explore our complete vehicle range across Maharashtra. Every vehicle is maintained, sanitized, and operated by professional highway chauffeurs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:+919011507220"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-navy-950 bg-white px-3.5 py-2 rounded-md border border-slate-200 shadow-2xs"
            >
              <Phone size={14} weight="bold" className="text-red-700" />
              <span>Direct Desk: 90115 07220</span>
            </a>
          </div>
        </div>

        {/* 8-Card Fleet Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {FLEET_VEHICLES.map((vehicle) => {
            const whatsappUrl = `https://wa.me/${vehicle.whatsappNumber}?text=${encodeURIComponent(
              vehicle.whatsappMessage
            )}`;

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Poster Thumbnail */}
                <div
                  className="relative aspect-[9/13] w-full bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedVehicle(vehicle)}
                  title="Click to view full flyer"
                >
                  <img
                    src={vehicle.image}
                    onError={(e) => {
                      if (vehicle.fallbackImage && e.currentTarget.src !== vehicle.fallbackImage) {
                        e.currentTarget.src = vehicle.fallbackImage;
                      }
                    }}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/80 text-white backdrop-blur-xs">
                      {vehicle.capacityBadge || vehicle.capacity}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="p-1.5 bg-red-800/90 rounded-full shadow text-white">
                      <Eye size={16} weight="bold" />
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 truncate" title={vehicle.name}>
                      {vehicle.shortName}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">
                      {vehicle.category.split('&')[0]}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer text-center"
                    >
                      Flyer
                    </button>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
                      title="Inquire on WhatsApp"
                    >
                      <WhatsappLogo size={14} weight="fill" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedVehicle && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs"
            onClick={() => setSelectedVehicle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="relative max-w-xl max-h-[92vh] w-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-400 text-slate-950">
                    {selectedVehicle.capacity}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black truncate">{selectedVehicle.name}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-2 sm:p-3 flex items-center justify-center bg-black/50">
                <img
                  src={selectedVehicle.image}
                  onError={(e) => {
                    if (selectedVehicle.fallbackImage && e.currentTarget.src !== selectedVehicle.fallbackImage) {
                      e.currentTarget.src = selectedVehicle.fallbackImage;
                    }
                  }}
                  alt={selectedVehicle.name}
                  className="max-h-[82vh] w-auto object-contain rounded shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
