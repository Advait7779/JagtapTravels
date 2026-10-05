import React from 'react';
import {
  Gear,
  SquaresFour,
  Users,
  IdentificationBadge,
  Gauge,
  Receipt,
  FileText,
  Wrench,
  Globe,
  SignOut,
  X,
  CalendarCheck,
  ChatCircleDots,
  Buildings,
  GasPump,
  CircleNotch,
  Coins,
  Scroll,
} from '@phosphor-icons/react';
import { canAccessTab } from '../utils/access';

export default function Sidebar({
  activeTab,
  setActiveTab,
  counts = {},
  pgStatus,
  user,
  mobileOpen,
  storage,
  onLogout,
  onCloseMobile,
  onOpenWebsite,
}) {
  const navSections = [
    {
      title: 'Daily Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
        { id: 'bookings', label: 'Bookings & Trips', icon: CalendarCheck },
        { id: 'corporateContracts', label: 'Corporate Contracts', icon: Buildings },
        { id: 'corporateInvoices', label: 'Corporate Invoices', icon: Scroll },
        { id: 'inquiries', label: 'Website Inquiries', icon: ChatCircleDots },
        { id: 'meterReadings', label: 'Duty Slips', icon: Gauge },
        { id: 'quotations', label: 'Quotations', icon: FileText },
      ],
    },
    {
      title: 'Finance & Expenses',
      items: [
        { id: 'bills', label: 'Customer Invoices', icon: Receipt },
        { id: 'payroll', label: 'Driver Salary & Advance', icon: Coins },
        { id: 'fuel', label: 'Fuel Expenses', icon: GasPump },
        { id: 'tyres', label: 'Tyre Management', icon: CircleNotch },
      ],
    },
    {
      title: 'Fleet & Administration',
      items: [
        { id: 'vehicles', label: 'Vehicles & Service', icon: Wrench },
        { id: 'drivers', label: 'Drivers', icon: IdentificationBadge },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'settings', label: 'Business Settings', icon: Gear },
      ],
    },
  ];

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-50 w-64 sm:w-72 md:w-64 bg-navy-950 text-slate-300 flex flex-col shrink-0 border-r border-navy-850 select-none transition-transform duration-200 ease-in-out md:translate-x-0 font-['Plus_Jakarta_Sans',sans-serif] ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-3.5 sm:px-4 flex items-center justify-between border-b border-navy-850 bg-navy-950 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-12 rounded-md bg-white p-0.5 flex items-center justify-center shadow-md shrink-0 overflow-hidden border border-amber-400/50">
            <img
              src="/jagtap-brand-logo.png"
              alt="Jagtap Travels"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight truncate">
              JAGTAP TRAVELS
            </h1>
            <p className="text-[11px] text-amber-400 font-bold tracking-wide truncate">
              Travel CRM
            </p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {navSections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter((item) => canAccessTab(user, item.id));
          if (!visibleItems.length) return null;
          return <div key={secIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {sec.title}
            </div>

            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = counts?.[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-white text-navy-950 shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-900/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 transition-transform group-hover:scale-110">
                      <Icon size={17} weight={isActive ? 'bold' : 'regular'} />
                    </div>
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        item.id === 'inquiries'
                          ? 'bg-blue-600 text-white animate-pulse'
                          : isActive
                          ? 'bg-navy-900 text-white'
                          : 'bg-navy-850 text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>;
        })}
      </div>

      {/* Website & Logout Buttons */}
      <div className="p-3.5 border-t border-navy-850 space-y-2 shrink-0">
        {onOpenWebsite && (
          <button
            onClick={onOpenWebsite}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 transition-all border border-amber-500/30 shadow-xs"
            title="Return to public website"
          >
            <Globe size={16} />
            <span>Visit Public Website</span>
          </button>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 transition-all border border-rose-500/20 hover:border-transparent shadow-xs"
          title="Sign out of CRM"
        >
          <SignOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
