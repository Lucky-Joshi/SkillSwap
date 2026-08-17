import { FiUsers } from 'react-icons/fi';
import Card from '../ui/Card';
import { cx } from '../../utils/helpers';

export default function ConnectionStats({ connections = {} }) {
  const mentors = connections.mentors || 0;
  const learners = connections.learners || 0;
  const peers = connections.peers || 0;
  const total = mentors + learners + peers;

  if (total === 0) return null;

  const segments = [
    { label: 'Mentors', value: mentors, color: 'bg-brand-500' },
    { label: 'Learners', value: learners, color: 'bg-emerald-500' },
    { label: 'Peers', value: peers, color: 'bg-accent' },
  ];

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiUsers className="text-brand-500" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Connections
        </h2>
        <span className="ml-auto text-sm font-semibold text-slate-500 dark:text-slate-400">
          {total}
        </span>
      </div>

      {/* Stat bar */}
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 mb-3">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className={cx('h-full transition-all duration-700', seg.color)}
              style={{ width: `${(seg.value / total) * 100}%` }}
            />
          ) : null
        )}
      </div>

      <div className="flex items-center gap-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={cx('h-2.5 w-2.5 rounded-full', seg.color)} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {seg.label}{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{seg.value}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
