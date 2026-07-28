import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

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
  if (isSearch) {
    return (
      <div className={`search-container ${containerClassName}`}>
        <Search className="search-icon w-5 h-5" />
        <input
          ref={ref}
          type="search"
          className={`search-input ${className}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={`input-container ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={`input-field ${error ? 'error' : ''} ${className}`}
        required={required}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';
