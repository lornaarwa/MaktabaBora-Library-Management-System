import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({
  label,
  hint,
  error,
  required,
  id,
  className = '',
  containerClassName = '',
  type = 'text',
  isSearch = false,
  ...props
}, ref) => {
  const baseInput = cn(
    'w-full rounded-xl border bg-cream-light/30 px-3.5 py-2.5 text-sm text-bark-900 placeholder:text-bark-300',
    'focus:outline-none focus:ring-2 focus:ring-tan-dark/60 focus:border-bark-400',
    error ? 'border-[#a8452f]/50' : 'border-bark-100',
    className,
  );

  if (isSearch) {
    return (
      <div className={cn('relative', containerClassName)}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bark-400" />
        <input
          ref={ref}
          type="search"
          aria-label={label || 'Search'}
          className={cn(baseInput, 'pl-10', error && 'border-[#a8452f]/50')}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-bark-700">
          {label} {required && <span className="text-tan-dark">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={baseInput}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-[#8c3620]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-bark-500">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';