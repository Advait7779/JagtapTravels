import React from 'react';
import { List, CalendarBlank } from '@phosphor-icons/react';

export default function Navbar({
  user,
  onLogout,
  onOpenAddCustomer,
  onOpenAddDriver,
  onOpenAddMeterReading,
  onOpenAddBill,
  onOpenAddQuotation,
  onToggleMenu,
  activeTab,
}) {
  const displayName = 'Admin';
  const initial = 'A';

  const getTabTitle = () => {
    switch (activeTab) {
      case 'settings':
        return 'Business Settings';
      case 'dashboard':
        return 'Dashboard Overview';
      case 'bookings':
        return 'Bookings & Trip Dispatch';
      case 'inquiries':
        return 'Leads & Web Enquiries';
      case 'customers':
        return 'Customer Directory';
      case 'drivers':
        return 'Driver Fleet Management';
      case 'meterReadings':
        return 'Meter Readings & Duty Slips';
      case 'bills':
        return 'Billing & Invoices';
      case 'quotations':
        return 'Quotations & Estimates';
      case 'vehicles':
        return 'Vehicle Service & Maintenance';
      default:
        return 'CRM Console';
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-10 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Active Section Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          className="md:hidden p-1.5 -ml-1 text-slate-700 hover:text-navy-950 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          onClick={onToggleMenu}
          aria-label="Open navigation"
        >
          <List size={20} weight="bold" />
        </button>
        <h2 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">
          {getTabTitle()}
        </h2>
        <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 shrink-0 shadow-2xs">
          <CalendarBlank size={16} weight="bold" />
          <span>{today}</span>
        </span>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900 leading-none">{displayName}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-black text-xs flex items-center justify-center border border-blue-500/30 shadow-sm shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
}
