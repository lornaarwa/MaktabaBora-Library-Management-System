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
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-5 sm:translate-x-0">
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
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-bark-100 bg-paper px-4 py-3 shadow-lift"
              role="status"
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  toast.tone === 'error' ? 'text-[#8c3620]' : toast.tone === 'success' ? 'text-olive-dark' : 'text-bark-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-bark-900">{toast.title}</p>
                {toast.detail && <p className="mt-0.5 text-xs leading-relaxed text-bark-500">{toast.detail}</p>}
              </div>
              {dismissToast && (
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-bark-300 transition hover:text-bark-700"
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
