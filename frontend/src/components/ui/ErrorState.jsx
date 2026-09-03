import React from 'react';
import { motion } from 'framer-motion';
import { TriangleAlert, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this right now. Please try again in a moment.",
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-bark-100 bg-paper px-6 py-16 text-center shadow-card',
        className,
      )}
      role="alert"
      {...props}
    >
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#a8452f]/25 bg-[#a8452f]/10 text-[#8c3620]"
      >
        <TriangleAlert className="h-8 w-8" />
      </motion.span>
      <h3 className="mt-5 text-base font-bold text-bark-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-bark-500">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-6">
          <RotateCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </motion.div>
  );
}