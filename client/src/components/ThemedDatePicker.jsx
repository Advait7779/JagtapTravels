import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Format 'YYYY-MM-DD' into readable string e.g. '18 Sep, 2026'
 */
function formatDateLabel(val) {
  if (!val || typeof val !== 'string') return '';
  const parts = val.split('-');
  if (parts.length < 3) return val;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
    const monthShort = MONTH_NAMES[monthIdx].substring(0, 3);
    return `${day} ${monthShort}, ${year}`;
  }
  return val;
}

/**
 * ThemedDatePicker - Custom CRM-themed single date picker
 * Replaces native browser/OS <input type="date"> with a sleek Jagtap Travels themed UI.
 * Uses a floating React Portal with viewport collision detection.
 */
export default function ThemedDatePicker({
  value,
  onChange,
  placeholder = 'Select Date',
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
  const currentMonthIdx = now.getMonth();
  const currentDay = now.getDate();

  // Parse currently selected date
  let selYear = currentYear;
  let selMonthIdx = currentMonthIdx;
  let selDay = currentDay;
  if (value && typeof value === 'string' && value.includes('-')) {
    const p = value.split('-');
    if (p.length >= 3) {
      selYear = parseInt(p[0], 10) || currentYear;
      selMonthIdx = (parseInt(p[1], 10) || (currentMonthIdx + 1)) - 1;
      selDay = parseInt(p[2], 10) || currentDay;
    }
  }

  // Active view in calendar
  const [viewYear, setViewYear] = useState(selYear);
  const [viewMonthIdx, setViewMonthIdx] = useState(selMonthIdx);

  useEffect(() => {
    if (value && typeof value === 'string' && value.includes('-')) {
      const p = value.split('-');
      if (p.length >= 3) {
        const y = parseInt(p[0], 10);
        const m = parseInt(p[1], 10) - 1;
        if (y) setViewYear(y);
        if (m >= 0 && m < 12) setViewMonthIdx(m);
      }
    }
  }, [value]);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 300 && spaceAbove > spaceBelow;

    const menuWidth = 260;
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

  const handlePrevMonth = () => {
    if (viewMonthIdx === 0) {
      setViewMonthIdx(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonthIdx === 11) {
      setViewMonthIdx(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonthIdx((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    const mm = String(viewMonthIdx + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const newVal = `${viewYear}-${mm}-${dd}`;
    emitChange(newVal);
  };

  const handleToday = () => {
    const mm = String(currentMonthIdx + 1).padStart(2, '0');
    const dd = String(currentDay).padStart(2, '0');
    setViewYear(currentYear);
    setViewMonthIdx(currentMonthIdx);
    emitChange(`${currentYear}-${mm}-${dd}`);
  };

  const handleClear = () => {
    emitChange('');
  };

  // Calendar days calculation
  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonthIdx, 1).getDay(); // 0 = Sun, 1 = Mon...

  const dayCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells.push(d);
  }

  const displayText = value ? formatDateLabel(value) : placeholder;

  return (
    <div className={`relative inline-block text-left ${containerClassName}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={toggleOpen}
        disabled={disabled}
        className={`bg-white px-3 py-2 rounded-md font-semibold text-slate-800 border border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-navy-900/20 flex items-center justify-between gap-2 text-xs transition-colors shadow-2xs ${
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
            className="bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* Header: Month & Year navigation */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Previous Month"
              >
                <CaretLeft size={16} weight="bold" />
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-navy-950 tracking-tight">
                  {MONTH_NAMES[viewMonthIdx]} {viewYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Next Month"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 px-2 pt-2 text-center text-[10px] font-bold text-slate-400 uppercase">
              {WEEKDAY_NAMES.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 p-2 bg-white">
              {dayCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-7 w-7" />;
                }

                const mm = String(viewMonthIdx + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const dateStr = `${viewYear}-${mm}-${dd}`;
                const isSelected = value === dateStr;
                const isToday =
                  currentYear === viewYear &&
                  currentMonthIdx === viewMonthIdx &&
                  currentDay === day;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 text-xs rounded-md font-bold flex items-center justify-center transition-all mx-auto ${
                      isSelected
                        ? 'bg-navy-900 text-amber-400 shadow-sm'
                        : isToday
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100 text-2xs">
              <button
                type="button"
                onClick={handleToday}
                className="font-bold text-navy-900 hover:text-amber-800 transition-colors"
              >
                Today
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
