import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react';

const MONTH_NAMES = [
  { full: 'January', short: 'Jan', num: '01' },
  { full: 'February', short: 'Feb', num: '02' },
  { full: 'March', short: 'Mar', num: '03' },
  { full: 'April', short: 'Apr', num: '04' },
  { full: 'May', short: 'May', num: '05' },
  { full: 'June', short: 'Jun', num: '06' },
  { full: 'July', short: 'Jul', num: '07' },
  { full: 'August', short: 'Aug', num: '08' },
  { full: 'September', short: 'Sep', num: '09' },
  { full: 'October', short: 'Oct', num: '10' },
  { full: 'November', short: 'Nov', num: '11' },
  { full: 'December', short: 'Dec', num: '12' },
];

/**
 * Format 'YYYY-MM' into readable string e.g. 'September, 2026'
 */
function formatMonthLabel(val) {
  if (!val || typeof val !== 'string') return '';
  const parts = val.split('-');
  if (parts.length < 2) return val;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES[monthIdx].full}, ${year}`;
  }
  return val;
}

/**
 * ThemedMonthPicker - Custom CRM-themed month selection dropdown
 * Replaces native browser/OS <input type="month"> with a sleek Jagtap Travels themed UI.
 * Uses a floating React Portal with viewport collision detection.
 */
export default function ThemedMonthPicker({
  value,
  onChange,
  placeholder = 'Select Month',
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  name,
  id,
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');

  // Parse currently selected year and month
  let selectedYear = currentYear;
  let selectedMonthNum = currentMonthNum;
  if (value && typeof value === 'string' && value.includes('-')) {
    const parts = value.split('-');
    selectedYear = parseInt(parts[0], 10) || currentYear;
    selectedMonthNum = parts[1] || currentMonthNum;
  }

  // Active view year in the picker
  const [viewYear, setViewYear] = useState(selectedYear);

  // Sync view year if value changes externally
  useEffect(() => {
    if (value && typeof value === 'string' && value.includes('-')) {
      const y = parseInt(value.split('-')[0], 10);
      if (y) setViewYear(y);
    }
  }, [value]);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Calculate coordinates for portal positioning
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;

    const menuWidth = 240;
    let left = rect.left;
    if (align === 'right' || left + menuWidth > viewportWidth - 12) {
      left = Math.max(12, rect.right - menuWidth);
    }
    left = Math.max(12, Math.min(left, viewportWidth - menuWidth - 12));

    setCoords({
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? viewportHeight - rect.top + 6 : undefined,
      left,
      width: menuWidth,
      openUp,
    });
  }, [align]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click, Escape key, or scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScroll = () => {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        if (r.bottom < -20 || r.top > window.innerHeight + 20) {
          setIsOpen(false);
          return;
        }
      }
      updatePosition();
    };

    const handleResize = () => updatePosition();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  const emitChange = (newVal) => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: newVal, name },
        currentTarget: { value: newVal, name },
        value: newVal,
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  const handleSelectMonth = (monthNum) => {
    const newVal = `${viewYear}-${monthNum}`;
    emitChange(newVal);
  };

  const handleThisMonth = () => {
    setViewYear(currentYear);
    const newVal = `${currentYear}-${currentMonthNum}`;
    emitChange(newVal);
  };

  const handleClear = () => {
    emitChange('');
  };

  const displayText = value ? formatMonthLabel(value) : placeholder;

  return (
    <div className={`relative inline-block text-left ${containerClassName}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={toggleOpen}
        disabled={disabled}
        className={`bg-white px-2.5 py-1.5 rounded-md font-bold text-slate-800 border border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-navy-900/20 flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayText}</span>
        <CalendarBlank size={15} weight="bold" className="text-slate-500 shrink-0" />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : 'auto',
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Header: Year navigation */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Previous Year"
              >
                <CaretLeft size={16} weight="bold" />
              </button>

              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-navy-950 tracking-tight">{viewYear}</span>
              </div>

              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Next Year"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-1.5 p-2 bg-white">
              {MONTH_NAMES.map((m) => {
                const isSelected =
                  value && selectedYear === viewYear && selectedMonthNum === m.num;
                const isThisMonth =
                  currentYear === viewYear && currentMonthNum === m.num;

                return (
                  <button
                    key={m.num}
                    type="button"
                    title={m.full}
                    onClick={() => handleSelectMonth(m.num)}
                    className={`py-2 px-1 text-xs rounded-md font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-navy-900 text-amber-400 shadow-sm'
                        : isThisMonth
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    {m.short}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100 text-2xs">
              <button
                type="button"
                onClick={handleThisMonth}
                className="font-bold text-navy-900 hover:text-amber-800 transition-colors"
              >
                This month
              </button>
              {!required && value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
