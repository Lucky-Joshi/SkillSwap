import { FiClock, FiSunrise, FiSun, FiMoon } from 'react-icons/fi';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import { cx } from '../../utils/helpers';
import { AVAILABILITY_OPTIONS } from '../../utils/constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_ICONS = {
  mornings: <FiSunrise className="h-3.5 w-3.5" />,
  morningsAfternoons: <FiSun className="h-3.5 w-3.5" />,
  afternoons: <FiSun className="h-3.5 w-3.5" />,
  evenings: <FiMoon className="h-3.5 w-3.5" />,
};

export default function AvailabilitySection({ user = {} }) {
  const schedule = user.weeklySchedule || {};
  const timePref = user.timePreference || '';
  const label = user.availability || '';

  const hasSchedule = DAYS.some((d) => schedule[d]?.length > 0);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="text-brand-500" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Availability
        </h2>
      </div>

      {label && (
        <Tag tone="green" className="mb-3">
          {AVAILABILITY_OPTIONS.find((o) => o.value === label)?.label || label}
        </Tag>
      )}

      {hasSchedule && (
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {DAYS.map((day) => {
            const slots = schedule[day] || [];
            const isActive = slots.length > 0;
            return (
              <div key={day} className="text-center">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {day}
                </div>
                <div
                  className={cx(
                    'h-8 rounded-lg text-xs flex items-center justify-center font-medium',
                    isActive
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                      : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600'
                  )}
                >
                  {isActive ? slots.length : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {timePref && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          {TIME_ICONS[timePref] || <FiClock className="h-3.5 w-3.5" />}
          <span className="capitalize">{timePref.replace(/([A-Z])/g, ' $1').trim()}</span>
        </div>
      )}

      {!label && !hasSchedule && !timePref && (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          No availability set.
        </p>
      )}
    </Card>
  );
}
