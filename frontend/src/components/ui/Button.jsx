import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  primary:
    'bg-bark-700 text-cream-light shadow-sm hover:bg-bark-900 focus-visible:ring-bark-700',
  secondary:
    'border border-bark-200 bg-paper text-bark-900 hover:bg-cream-light/70 focus-visible:ring-bark-500',
  outline:
    'border border-bark-300 bg-transparent text-bark-700 hover:bg-bark-50 focus-visible:ring-bark-500',
  ghost:
    'bg-transparent text-bark-500 hover:bg-cream/60 hover:text-bark-900 focus-visible:ring-bark-500',
  destructive:
    'bg-[#a8452f] text-cream-light shadow-sm hover:bg-[#8c3620] focus-visible:ring-[#a8452f]',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant] || variants.primary,
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}