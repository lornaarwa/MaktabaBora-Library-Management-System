import React from 'react';

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  disabled = false, 
  className = '', 
  ...props 
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary': 
        return 'rounded-lg border border-bark-100 bg-paper px-4 py-2 text-sm font-semibold text-bark-900 transition hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed';
      case 'ghost': 
        return 'rounded-lg px-3 py-1.5 text-xs font-semibold text-bark-500 transition hover:bg-cream/60 hover:text-bark-900 disabled:opacity-40 disabled:cursor-not-allowed';
      case 'primary':
      default: 
        return 'rounded-lg bg-bark-700 px-4 py-2 text-sm font-bold text-cream-light transition hover:bg-bark-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm';
    }
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 ${getVariantClass()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
