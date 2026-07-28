import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Modal({ isOpen, open, onClose, title, subtitle, children, size = 'md', footer, className = '' }) {
  const isOpenState = open !== undefined ? open : isOpen;

  useEffect(() => {
    if (!isOpenState) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpenState, onClose]);

  return (
    <AnimatePresence>
      {isOpenState && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-bark-900/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative z-10 flex max-h-[92vh] w-full ${sizes[size]} flex-col overflow-hidden rounded-t-2xl border border-bark-100 bg-paper shadow-lift sm:rounded-2xl ${className}`}
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-bark-100 bg-cream-light/60 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold leading-tight text-bark-900">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-bark-500">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg border border-bark-100 bg-paper p-1.5 text-bark-700 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-bark-700"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </header>
            <div className="mb-scroll flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <footer className="border-t border-bark-100 bg-cream-light/50 px-5 py-4">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
