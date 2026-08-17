import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cx } from '../../utils/helpers';

function Tabs({ tabs, active, onChange, className }) {
  const tabRefs = useRef([]);

  const handleKeyDown = useCallback(
    (e, index) => {
      const tabCount = tabs.length;
      let nextIndex;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % tabCount;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + tabCount) % tabCount;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabCount - 1;
      } else {
        return;
      }
      const value = tabs[nextIndex].value ?? tabs[nextIndex];
      onChange(value);
      tabRefs.current[nextIndex]?.focus();
    },
    [tabs, onChange]
  );

  return (
    <div role="tablist" className={cx('flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800', className)}>
      {tabs.map((tab, index) => {
        const value = tab.value ?? tab;
        const label = tab.label ?? tab;
        const activeTab = active === value;
        return (
          <button
            key={value}
            ref={(el) => { tabRefs.current[index] = el; }}
            role="tab"
            aria-selected={activeTab}
            tabIndex={activeTab ? 0 : -1}
            onClick={() => onChange(value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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

export default React.memo(Tabs);
