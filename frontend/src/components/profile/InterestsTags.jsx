import { FiEdit2 } from 'react-icons/fi';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import Button from '../ui/Button';

export default function InterestsTags({ interests = [], isMe = false, onEdit }) {
  if (interests.length === 0 && !isMe) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Interests
        </h2>
        {isMe && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <FiEdit2 /> Edit
          </Button>
        )}
      </div>

      {interests.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, i) => (
            <Tag key={i} tone="brand">{interest}</Tag>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          {isMe ? 'Add your interests to find like-minded learners.' : 'No interests listed.'}
        </p>
      )}
    </Card>
  );
}
