import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CaretDown, CaretUp, CaretLeft, CaretRight } from '@phosphor-icons/react';

/**
 * Custom hook to handle pagination state and slicing
 */
export function usePagination({ items = [], initialPageSize = 10 }) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // If current page is beyond total pages (e.g. after search/filtering), clamp it
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    setPage: setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems,
  };
}

/**
 * Top-Right "SHOW: 10 rows" Dropdown Selector
 * Matches exact UI style from user mockup with orange/amber active styling and floating menu.
 */
export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  options = [5, 10, 15, 20],
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-flex items-center gap-2 ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 select-none">
        SHOW:
      </span>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2.5 px-3 py-1.5 bg-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
            : 'border-amber-500/80 hover:border-amber-600 text-slate-800 hover:bg-slate-50/80'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{pageSize} rows</span>
        {isOpen ? (
          <CaretUp size={13} weight="bold" className="text-slate-600" />
        ) : (
          <CaretDown size={13} weight="bold" className="text-slate-600" />
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((opt) => {
            const isSelected = opt === pageSize;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onPageSizeChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'text-amber-600 bg-amber-50/60 font-black'
                    : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-950'
                }`}
              >
                <span>{opt} rows</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Bottom Pagination Navigation Footer
 * Left: "Showing X to Y of Z records"
 * Right: Previous Arrow [<], Page Pills [1, 2, 3...], Next Arrow [>]
 */
export function TablePaginationFooter({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  label = 'records',
  className = '',
}) {
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* Left info count */}
      <div className="font-medium text-slate-600 text-center sm:text-left">
        Showing{' '}
        <span className="font-bold text-slate-900">
          {startIndex}–{endIndex}
        </span>{' '}
        of <span className="font-bold text-slate-900">{totalItems}</span> {label}
      </div>

      {/* Right navigation controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous page arrow */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          title="Previous page"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        {/* Page pills */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400 font-bold select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page arrow */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          title="Next page"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export default {
  usePagination,
  PageSizeSelector,
  TablePaginationFooter,
};
