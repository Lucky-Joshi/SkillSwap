import { FiAward } from 'react-icons/fi';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { formatDate, cx } from '../../utils/helpers';

export default function AchievementShowcase({ badges = [], totalPoints = 0 }) {
  const earned = badges.filter((b) => b.earned || b.earnedAt);
  const unearned = badges.filter((b) => !b.earned && !b.earnedAt);

  if (badges.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="🏆"
          title="No Badges Yet"
          description="Complete sessions and reach milestones to earn badges."
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Achievements
        </h2>
        <span className="text-sm font-semibold text-accent">{totalPoints} pts</span>
      </div>

      {earned.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Earned
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {earned.map((badge, i) => (
              <div
                key={badge._id || i}
                className="glass rounded-xl p-4 text-center transition hover:scale-[1.02]"
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/10 text-2xl">
                  {badge.icon || '🏅'}
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {badge.name}
                </div>
                <div className="text-xs text-accent font-semibold mt-0.5">{badge.points} pts</div>
                {badge.earnedAt && (
                  <div className="text-[10px] text-slate-400 mt-1">{formatDate(badge.earnedAt)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {unearned.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Locked
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {unearned.map((badge, i) => (
              <div
                key={badge._id || i}
                className="glass rounded-xl p-4 text-center opacity-50 grayscale"
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-2xl">
                  {badge.icon || '🔒'}
                </div>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">
                  {badge.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{badge.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
