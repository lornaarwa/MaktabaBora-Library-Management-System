import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon, XIcon } from 'lucide-react';

const icons = {
  success: CheckCircle2Icon,
  error: TriangleAlertIcon,
  info: InfoIcon,
};

export function ToastStack({ toasts = [], dismissToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-5 sm:translate-x-0"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.tone] || icons.info;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-bark-100 dark:border-stone-700 bg-paper dark:bg-stone-900 px-4 py-3 shadow-lift dark:shadow-2xl"
              role="status"
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  toast.tone === 'error'
                    ? 'text-[#8c3620] dark:text-rose-400'
                    : toast.tone === 'success'
                    ? 'text-olive-dark dark:text-emerald-400'
                    : 'text-bark-500 dark:text-sky-400'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-bark-900 dark:text-stone-100">{toast.title}</p>
                {toast.detail && (
                  <p className="mt-0.5 text-xs leading-relaxed text-bark-500 dark:text-stone-400">{toast.detail}</p>
                )}
              </div>
              {dismissToast && (
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-bark-300 dark:text-stone-500 transition hover:text-bark-700 dark:hover:text-stone-300"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
