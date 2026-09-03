import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names with Tailwind-aware conflict resolution.
 * Use everywhere conditional Tailwind classes are composed.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}