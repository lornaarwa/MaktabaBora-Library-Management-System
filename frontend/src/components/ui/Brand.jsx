import React from 'react';
import { cn } from '../../lib/utils';

export const MAKTABABORA_LOGO = '/brand/maktababora-logo.jpeg';

/**
 * Official MaktabaBora brand logo. Always use this component (or the asset
 * path above) instead of hand-drawn or generated logo substitutes.
 *
 * Variants:
 *  - 'full' : logo emblem + wordmark lockup (sidebar, footer, auth pages)
 *  - 'mark' : rounded square emblem only (mobile header, compact spots)
 *  - 'icon' : the raw logo image at a given size (hero sections)
 */
export function Brand({ variant = 'full', className = '', imgClassName = '', ...props }) {
  if (variant === 'mark') {
    return (
      <span
        className={cn(
          'inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-bark-100 bg-paper shadow-card',
          className,
        )}
        {...props}
      >
        <img
          src={MAKTABABORA_LOGO}
          alt="MaktabaBora logo"
          className={cn('h-full w-full object-cover', imgClassName)}
          draggable="false"
        />
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <img
        src={MAKTABABORA_LOGO}
        alt="MaktabaBora logo"
        className={cn('shrink-0 object-contain', className)}
        draggable="false"
        {...props}
      />
    );
  }

  // 'full' lockup: emblem + wordmark
  return (
    <span className={cn('inline-flex items-center gap-3', className)} {...props}>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-bark-100 bg-paper shadow-card">
        <img
          src={MAKTABABORA_LOGO}
          alt="MaktabaBora logo"
          className="h-full w-full object-cover"
          draggable="false"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-bark-900">
          Maktaba<span className="text-tan-dark">Bora</span>
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bark-500">
          Library Management System
        </span>
      </span>
    </span>
  );
}