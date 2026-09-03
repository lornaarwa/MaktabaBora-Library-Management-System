import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-bark-100/80',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/** A ready-made skeleton block shaped like a book card. */
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-bark-100 bg-paper p-4 shadow-card">
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

/** A ready-made skeleton for dashboard stat cards. */
export function StatCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-bark-100 bg-paper p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}