import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

export interface SnackbarProps {
  open: boolean;
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  open,
  message,
  icon = 'error',
  actionLabel = '关闭',
  onAction,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  const snackbarContent = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1000] flex justify-center pointer-events-none"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
        >
          <motion.div
            role="status"
            aria-live="polite"
            data-testid="snackbar"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1.0] }}
            className="pointer-events-auto w-full max-w-sm bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] rounded-xl shadow-lg px-4 py-3 flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {icon && (
                <md-icon className="text-lg text-[var(--md-sys-color-inverse-primary)] shrink-0">
                  {icon}
                </md-icon>
              )}
              <span className="leading-snug text-xs sm:text-sm font-normal truncate">
                {message}
              </span>
            </div>
            {actionLabel && (
              <button
                type="button"
                onClick={onAction || onClose}
                className="text-xs font-semibold text-[var(--md-sys-color-inverse-primary)] hover:opacity-80 transition cursor-pointer shrink-0 uppercase tracking-wider px-1 py-0.5"
              >
                {actionLabel}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(snackbarContent, document.body);
};
