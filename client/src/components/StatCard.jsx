import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600 shadow-blue-500/5',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-500/5',
    amber: 'bg-amber-50 border-amber-200 text-amber-600 shadow-amber-500/5',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-indigo-500/5',
    navy: 'bg-slate-100 border-slate-200 text-slate-700 shadow-slate-500/5',
    rose: 'bg-rose-50 border-rose-200 text-rose-600 shadow-rose-500/5',
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200/90 shadow-sm hover:shadow-md transition-all font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</span>
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center border shrink-0 shadow-xs ${
            colorMap[color] || colorMap.blue
          }`}
        >
          <Icon size={22} weight="bold" />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">{value}</div>
      {subtext && <p className="text-[11px] sm:text-xs text-slate-600 mt-1 font-medium line-clamp-1">{subtext}</p>}
    </div>
  );
}
