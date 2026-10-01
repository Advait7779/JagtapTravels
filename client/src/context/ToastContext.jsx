import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Trash,
  WarningCircle,
  Warning,
  Info,
  X,
} from '@phosphor-icons/react';

// Global listener for imperative toast calls outside of React component trees
let globalToastEmitter = null;

export const toast = {
  success: (message, options = {}) =>
    globalToastEmitter?.({ type: 'success', message, ...options }),
  error: (message, options = {}) =>
    globalToastEmitter?.({ type: 'error', message, ...options }),
  delete: (message, options = {}) =>
    globalToastEmitter?.({ type: 'delete', message, ...options }),
  info: (message, options = {}) =>
    globalToastEmitter?.({ type: 'info', message, ...options }),
  warning: (message, options = {}) =>
    globalToastEmitter?.({ type: 'warning', message, ...options }),
  dismiss: (id) => globalToastEmitter?.({ action: 'dismiss', id }),
};

const ToastContext = createContext(toast);

export function useToast() {
  return useContext(ToastContext);
}

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    progressBg: 'bg-emerald-500',
  },
  delete: {
    icon: Trash,
    badgeBg: 'bg-rose-500/20',
    badgeBorder: 'border-rose-500/40',
    badgeText: 'text-rose-400',
    accentBorder: 'border-rose-500/30',
    progressBg: 'bg-rose-500',
  },
  error: {
    icon: WarningCircle,
    badgeBg: 'bg-rose-600/25',
    badgeBorder: 'border-rose-500/50',
    badgeText: 'text-rose-300',
    accentBorder: 'border-rose-500/40',
    progressBg: 'bg-rose-500',
  },
  warning: {
    icon: Warning,
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-400',
    accentBorder: 'border-amber-500/30',
    progressBg: 'bg-amber-500',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-500/40',
    badgeText: 'text-blue-400',
    accentBorder: 'border-blue-500/30',
    progressBg: 'bg-blue-500',
  },
};

function ToastItem({ toast: item, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
  const Icon = config.icon;
  const duration = item.duration || 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden bg-navy-950/95 backdrop-blur-md text-white border ${config.accentBorder} shadow-xl shadow-black/40 rounded-md px-3 py-1.5 sm:px-3.5 sm:py-2 min-w-[200px] max-w-[90vw] sm:max-w-sm w-auto flex items-center gap-2.5 select-none font-['Plus_Jakarta_Sans',sans-serif]`}
    >
      {/* Icon Badge */}
      <div
        className={`w-5.5 h-5.5 rounded ${config.badgeBg} border ${config.badgeBorder} ${config.badgeText} flex items-center justify-center shrink-0 shadow-xs`}
      >
        <Icon size={13} weight="bold" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pr-0.5">
        <p className="text-xs font-bold text-white tracking-tight leading-tight">
          {item.message}
        </p>
        {item.description && (
          <p className="text-[11px] text-slate-300 font-normal mt-0.5 leading-tight truncate max-w-[240px] sm:max-w-[280px]">
            {item.description}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="p-0.5 -mr-0.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <X size={12} weight="bold" />
      </button>

      {/* Progress Drain Bar */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-[2px] ${config.progressBg} opacity-80`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration: duration / 1000,
          ease: 'linear',
        }}
        style={{
          transformOrigin: 'left',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', message, description, duration = 4000 }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newToast = { id, type, message, description, duration };

      setToasts((prev) => {
        // Keep at most 4 toasts visible at a time to prevent screen clutter
        const next = [newToast, ...prev];
        return next.slice(0, 4);
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast],
  );

  // Bind global imperative helper
  globalToastEmitter = useCallback(
    (payload) => {
      if (payload.action === 'dismiss') {
        removeToast(payload.id);
      } else {
        return addToast(payload);
      }
    },
    [addToast, removeToast],
  );

  const contextValue = {
    success: (msg, opts) => addToast({ type: 'success', message: msg, ...opts }),
    error: (msg, opts) => addToast({ type: 'error', message: msg, ...opts }),
    delete: (msg, opts) => addToast({ type: 'delete', message: msg, ...opts }),
    info: (msg, opts) => addToast({ type: 'info', message: msg, ...opts }),
    warning: (msg, opts) => addToast({ type: 'warning', message: msg, ...opts }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Top Center Floating Toast Portal */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none flex flex-col items-center gap-2 max-w-[92vw] w-fit px-2"
        aria-live="polite"
        role="region"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
