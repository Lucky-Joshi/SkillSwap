import { FiEdit2, FiBookOpen, FiTarget, FiMapPin, FiGlobe, FiClock } from 'react-icons/fi';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { LEARNING_STYLE_OPTIONS } from '../../utils/constants';

export default function AboutSection({ user = {}, isMe = false, onEdit }) {
  if (!user?._id) return null;

  const learningStyle = LEARNING_STYLE_OPTIONS.find((s) => s.value === user.preferredLearningStyle);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">About</h2>
        {isMe && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <FiEdit2 /> Edit
          </Button>
        )}
      </div>

      {user.bio ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-line">
          {user.bio}
        </p>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic mb-4">
          {isMe ? 'Add a bio to tell others about yourself.' : 'No bio yet.'}
        </p>
      )}

      {user.teachingPhilosophy && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            <FiBookOpen /> Teaching Philosophy
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {user.teachingPhilosophy}
          </p>
        </div>
      )}

      {user.learningGoals && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            <FiTarget /> Learning Goals
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {user.learningGoals}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {learningStyle && (
          <Tag tone="brand" icon={<span>{learningStyle.icon}</span>}>
            {learningStyle.label} Learner
          </Tag>
        )}
        {user.timezone && (
          <Tag tone="slate" icon={<FiClock />}>{user.timezone}</Tag>
        )}
        {user.location && (
          <Tag tone="slate" icon={<FiMapPin />}>{user.location}</Tag>
        )}
      </div>

      {user.languages?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Languages
          </div>
          <div className="flex flex-wrap gap-1.5">
            {user.languages.map((lang) => (
              <Tag key={lang} tone="purple" icon={<FiGlobe />}>{lang}</Tag>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
