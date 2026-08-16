import { motion } from 'framer-motion';
import { cx } from '../../utils/helpers';

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cx('flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800', className)}>
      {tabs.map((tab) => {
        const value = tab.value ?? tab;
        const label = tab.label ?? tab;
        const activeTab = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cx(
              'relative flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition',
              activeTab ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {activeTab && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-700"
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
