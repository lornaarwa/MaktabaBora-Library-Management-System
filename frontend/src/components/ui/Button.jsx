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
      case 'secondary': return 'button-secondary';
      case 'ghost': return 'button-ghost';
      case 'primary':
      default: return 'button-primary';
    }
  };

  return (
    <button
      type={type}
      className={`${getVariantClass()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
