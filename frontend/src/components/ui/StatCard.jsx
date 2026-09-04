import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading = false,
  delay = 0,
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={cn(
        'group rounded-xl border border-bark-100 bg-paper p-5 shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-bark-500">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider">{label}</span>
        {Icon && (
          <span className="rounded-lg border border-bark-100 bg-cream-light/60 p-2 text-bark-700 transition-colors group-hover:bg-olive/30 group-hover:text-bark-800">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-bark-100/80" aria-hidden="true" />
      ) : (
        <span className="mt-2 block text-2xl font-extrabold text-bark-900">{value}</span>
      )}
      {hint && <span className="mt-1 block text-[10px] text-bark-500">{hint}</span>}
    </motion.div>
  );
}