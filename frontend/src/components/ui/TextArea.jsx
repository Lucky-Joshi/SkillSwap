import { forwardRef } from 'react';
import { cx } from '../../utils/helpers';

const TextArea = forwardRef(function TextArea({ label, error, className, ...props }, ref) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={cx('input resize-none', error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30')}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default TextArea;
