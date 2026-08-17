import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import RatingStars from '../ui/RatingStars';
import ScoreRing from '../ui/ScoreRing';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export default function MatchCard({ person, mode = 'mentors', onRequest, requesting }) {
  const { user } = useAuth();
  const isMe = user?.id === person.id;
  const teach = person.canTeach || [];
  const learn = person.wantToLearn || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass flex flex-col gap-4 rounded-2xl p-6 card-hover"
    >
      <div className="flex items-start gap-4">
        <Avatar src={person.avatar} name={person.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-bold">{person.name}</h3>
            {person.department && <Tag tone="purple" className="hidden sm:inline-flex">{person.department}</Tag>}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{person.college}</span>
            {person.year && <span>· Year {person.year}</span>}
          </div>
          <div className="mt-2">
            <RatingStars rating={person.rating} count={person.reviewCount} size="text-xs" />
          </div>
        </div>
        <ScoreRing score={person.score} size={84} />
      </div>

      {person.bio && <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{person.bio}</p>}

      {teach.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {teach.slice(0, 4).map((s) => (
            <Tag key={s} tone="green" icon="📚">{s}</Tag>
          ))}
        </div>
      )}
      {learn.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {learn.slice(0, 4).map((s) => (
            <Tag key={s} tone="amber" icon="🎯">{s}</Tag>
          ))}
        </div>
      )}

      {person.mutualSkills?.length > 0 && (
        <div className="rounded-xl bg-brand-500/10 px-3 py-2 text-xs text-brand-700 dark:text-brand-300">
          🤝 Mutual: {person.mutualSkills.join(', ')}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        {isMe ? (
          <Tag tone="slate">You</Tag>
        ) : (
          <>
            <Button className="flex-1" loading={requesting} onClick={() => onRequest(person)}>
              <FiMail className="h-4 w-4" />
              {mode === 'mentors' ? 'Request Mentorship' : 'Offer to Mentor'}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
