import { FiCheckCircle, FiAward, FiPlusCircle } from 'react-icons/fi';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { timeAgo, cx } from '../../utils/helpers';

const ACTIVITY_ICONS = {
  session: <FiCheckCircle className="h-4 w-4" />,
  badge: <FiAward className="h-4 w-4" />,
  skill: <FiPlusCircle className="h-4 w-4" />,
};

const ACTIVITY_COLORS = {
  session: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  badge: 'bg-accent/15 text-amber-600 dark:text-amber-400',
  skill: 'bg-brand-500/15 text-brand-600 dark:text-brand-400',
};

export default function ActivityTimeline({ activities = [] }) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="📋"
          title="No Recent Activity"
          description="Activity from sessions and achievements will appear here."
        />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white mb-4">
        Recent Activity
      </h2>

      <div className="relative space-y-4">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

        {sorted.map((activity, i) => {
          const type = activity.type || 'session';
          return (
            <div key={activity._id || i} className="relative flex items-start gap-3 pl-9">
              <div
                className={cx(
                  'absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                  ACTIVITY_COLORS[type] || ACTIVITY_COLORS.session
                )}
              >
                {ACTIVITY_ICONS[type] || ACTIVITY_ICONS.session}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {activity.title || activity.description}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {timeAgo(activity.createdAt || activity.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
