import { cx } from '../../utils/helpers';

export default function ProgressBar({ value = 0, className, barClassName }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700', className)}>
      <div
        className={cx('h-full rounded-full bg-gradient-to-r from-brand-500 to-accent transition-all duration-700', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
