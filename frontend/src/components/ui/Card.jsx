import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-bark-100 bg-paper shadow-card',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('border-b border-bark-100 px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={cn('text-base font-bold text-bark-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardSubtitle({ children, className = '', ...props }) {
  return (
    <p className={cn('mt-0.5 text-xs text-bark-500', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('border-t border-bark-100 px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}