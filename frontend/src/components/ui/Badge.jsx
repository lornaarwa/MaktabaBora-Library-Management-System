import React from 'react';

export function Badge({ 
  children, 
  variant = 'neutral', 
  className = '', 
  ...props 
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'badge-primary';
      case 'success': return 'badge-success';
      case 'warning': return 'badge-warning';
      case 'error': return 'badge-error';
      case 'info': return 'badge-info';
      case 'neutral':
      default: return 'badge-neutral';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`} {...props}>
      {children}
    </span>
  );
}
