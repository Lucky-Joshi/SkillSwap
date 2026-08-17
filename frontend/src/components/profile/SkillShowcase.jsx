import { FiPlus, FiCheckCircle, FiAward } from 'react-icons/fi';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { cx } from '../../utils/helpers';

function LevelBar({ level = 1 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cx(
            'h-1.5 w-4 rounded-full transition-colors',
            i <= level ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
          )}
        />
      ))}
    </div>
  );
}

function SkillChip({ skill, isMe, onEndorse, profileUserId }) {
  const canEndorse = !isMe && skill.user !== profileUserId;
  return (
    <div className="glass flex items-center gap-3 rounded-xl p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
            {skill.name || skill.skillName}
          </span>
          {skill.verified && (
            <FiCheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <LevelBar level={skill.level || 1} />
          {skill.endorsements > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <FiAward className="h-3 w-3" /> {skill.endorsements}
            </span>
          )}
        </div>
      </div>
      {canEndorse && onEndorse && (
        <button
          onClick={() => onEndorse(skill._id || skill.skillId, profileUserId)}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 whitespace-nowrap"
        >
          Endorse
        </button>
      )}
    </div>
  );
}

export default function SkillShowcase({ skills = [], isMe = false, onAddSkill, onEndorse, profileUserId }) {
  const teaching = skills.filter((s) => s.type === 'teaching' || s.canTeach);
  const learning = skills.filter((s) => s.type === 'learning' || s.isLearning);

  return (
    <Card>
      {/* Teaching */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-extrabold text-slate-800 dark:text-white">
            Skills I Can Teach
          </h3>
          {isMe && (
            <Button variant="ghost" size="sm" onClick={() => onAddSkill?.('teaching')}>
              <FiPlus /> Add
            </Button>
          )}
        </div>
        {teaching.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {teaching.map((s, i) => (
              <SkillChip key={s._id || s.skillId || i} skill={s} isMe={isMe} onEndorse={onEndorse} profileUserId={profileUserId} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            {isMe ? 'Add skills you can teach others.' : 'No teaching skills listed.'}
          </p>
        )}
      </div>

      {/* Learning */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-extrabold text-slate-800 dark:text-white">
            Skills I'm Learning
          </h3>
          {isMe && (
            <Button variant="ghost" size="sm" onClick={() => onAddSkill?.('learning')}>
              <FiPlus /> Add
            </Button>
          )}
        </div>
        {learning.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {learning.map((s, i) => (
              <SkillChip key={s._id || s.skillId || i} skill={s} isMe={isMe} onEndorse={onEndorse} profileUserId={profileUserId} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            {isMe ? 'Add skills you want to learn.' : 'No learning skills listed.'}
          </p>
        )}
      </div>
    </Card>
  );
}
