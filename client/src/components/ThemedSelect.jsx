import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ThemedSelect - Theme UI Dropdown Component
 * Replaces native browser/OS <select> menus with customized CRM-themed UI dropdowns.
 * Uses a floating React Portal to guarantee that dropdown menus NEVER get clipped
 * by parent table scrollbars (overflow-x-auto, overflow-hidden) or modal boundaries.
 * Includes collision detection to automatically flip upwards if near screen bottom.
 */
export default function ThemedSelect({
  value,
  onChange,
  options = [],
  children,
  placeholder = 'Select...',
  className = '',
  containerClassName = '',
  menuClassName = '',
  name,
  id,
  required = false,
  disabled = false,
  align = 'left', // 'left' | 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Extract option list either from options array or from children <option> elements
  const parsedOptions = [];
  if (options && options.length > 0) {
    options.forEach((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        parsedOptions.push({
          value: opt.value !== undefined ? String(opt.value) : '',
          label: opt.label !== undefined ? opt.label : String(opt.value),
          badge: opt.badge,
          disabled: !!opt.disabled,
        });
      } else {
        parsedOptions.push({
          value: String(opt),
          label: String(opt),
          disabled: false,
        });
      }
    });
  } else if (children) {
    React.Children.forEach(children, (child) => {
      if (!child) return;
      if (child.type === 'option') {
        parsedOptions.push({
          value:
            child.props.value !== undefined
              ? String(child.props.value)
              : String(child.props.children || ''),
          label: child.props.children,
          badge: child.props['data-badge'],
          disabled: !!child.props.disabled,
        });
      } else if (child.props && child.props.children) {
        React.Children.forEach(child.props.children, (sub) => {
          if (sub && sub.type === 'option') {
            parsedOptions.push({
              value:
                sub.props.value !== undefined
                  ? String(sub.props.value)
                  : String(sub.props.children || ''),
              label: sub.props.children,
              badge: sub.props['data-badge'],
              disabled: !!sub.props.disabled,
            });
          }
        });
      }
    });
  }

  // Find currently selected option
  const selectedOption = parsedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || (parsedOptions[0]?.label ?? '');

  const isTableBadge =
    className.includes('text-[11px]') ||
    className.includes('text-2xs') ||
    (className.includes('rounded') && !className.includes('form-input'));
  const isFormInput = className.includes('form-input');

  // Compute smart viewport positioning for portal menu
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine whether to open upward or downward
    // If space below is less than 220px and above has more space, open upward
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    const minW = isTableBadge ? 140 : Math.max(rect.width, 140);
    const menuWidth = Math.max(rect.width, minW);

    let left = rect.left;
    if (align === 'right' || left + menuWidth > viewportWidth - 12) {
      left = Math.max(12, rect.right - menuWidth);
    }
    left = Math.max(12, Math.min(left, viewportWidth - menuWidth - 12));

    const maxH = openUp
      ? Math.min(260, Math.max(80, spaceAbove - 16))
      : Math.min(260, Math.max(80, spaceBelow - 16));

    setCoords({
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? viewportHeight - rect.top + 6 : undefined,
      left,
      width: menuWidth,
      maxHeight: maxH,
      openUp,
    });
  }, [align, isTableBadge]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click, Escape key, or window scroll/resize
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

    const handleResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (optVal) => {
    if (disabled) return;
    if (onChange) {
      // Pass synthetic event matching standard HTML select onChange shape
      const syntheticEvent = {
        target: { value: optVal, name, id },
        currentTarget: { value: optVal, name, id },
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Base styling for trigger button depending on context
  const triggerClasses = isTableBadge
    ? `inline-flex items-center justify-between gap-1.5 cursor-pointer transition-all ${className}`
    : isFormInput
    ? `flex items-center justify-between gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-medium text-slate-900 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900/20 transition-all ${className}`
    : `inline-flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 hover:border-slate-400 rounded-md text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-navy-900/20 transition-all ${className}`;

  return (
    <div
      ref={containerRef}
      className={`relative ${isFormInput ? 'w-full block' : 'inline-block'} ${containerClassName}`}
    >
      {/* Hidden native select for accessibility, automated tests, and HTML form serialization */}
      <select
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {parsedOptions.map((opt, i) => (
          <option key={`${opt.value}-${i}`} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Themed Custom Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleOpen}
        className={`${triggerClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-navy-950' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Themed Custom Dropdown Popup Menu rendered via Portal into document.body */}
      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className={`fixed z-[99999] bg-white rounded-md border border-slate-200/90 shadow-2xl py-1 overflow-y-auto ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
            style={{
              top: coords.top !== undefined ? `${coords.top}px` : 'auto',
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
          >
            {parsedOptions.length === 0 ? (
              <div className="px-3.5 py-2 text-xs text-slate-400 text-center italic">
                No options available
              </div>
            ) : (
              parsedOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-amber-500/10 text-amber-950 font-bold border-l-3 border-amber-500'
                        : 'text-slate-700 hover:bg-amber-50/70 hover:text-navy-950'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-amber-600 shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
