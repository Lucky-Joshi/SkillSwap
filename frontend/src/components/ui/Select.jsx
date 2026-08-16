import { forwardRef } from 'react';
import { cx } from '../../utils/helpers';

const Select = forwardRef(function Select({ label, error, className, children, ...props }, ref) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={cx('input', error && 'border-red-500')} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
