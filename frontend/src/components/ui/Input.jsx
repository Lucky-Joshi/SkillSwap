import { forwardRef } from 'react';
import { cx } from '../../utils/helpers';

const Input = forwardRef(function Input({ label, error, className, id, ...props }, ref) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={cx('input', error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
});

export default Input;
