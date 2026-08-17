import { useState } from 'react';
import { FiThumbsUp } from 'react-icons/fi';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { cx } from '../../utils/helpers';

export default function EndorsementSection({ endorsements = [], isMe = false, onEndorse, profileUserId }) {
  const [toggled, setToggled] = useState({});

  const sorted = [...endorsements].sort((a, b) => (b.count || 0) - (a.count || 0));

  const handleEndorse = (skillId) => {
    setToggled((prev) => ({ ...prev, [skillId]: !prev[skillId] }));
    onEndorse?.(skillId, profileUserId);
  };

  if (sorted.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="👍"
          title="No Endorsements Yet"
          description="Endorse skills to recognize peers' abilities."
        />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white mb-4">
        Skill Endorsements
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {sorted.map((end, i) => {
          const isEndorsed = toggled[end.skillId || end._id] || end.isEndorsedByMe;
          return (
            <div
              key={end.skillId || end._id || i}
              className="glass flex items-center justify-between rounded-xl p-3"
            >
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {end.skillName || end.name}
                </div>
                <div className="text-xs text-slate-400">
                  {end.count || 0} endorsement{(end.count || 0) !== 1 ? 's' : ''}
                </div>
              </div>
              {!isMe && onEndorse && (
                <button
                  onClick={() => handleEndorse(end.skillId || end._id)}
                  className={cx(
                    'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                    isEndorsed
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-700 dark:text-slate-400'
                  )}
                >
                  <FiThumbsUp />
                  {isEndorsed ? 'Endorsed' : 'Endorse'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
