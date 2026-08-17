import { FiMessageSquare } from 'react-icons/fi';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import RatingStars from '../ui/RatingStars';
import EmptyState from '../ui/EmptyState';
import { timeAgo, cx } from '../../utils/helpers';

const BREAKDOWN_KEYS = [
  { key: 'teaching', label: 'Teaching' },
  { key: 'communication', label: 'Communication' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'friendliness', label: 'Friendliness' },
];

export default function ReviewsSection({ reviews = [], stats = {}, ratingBreakdown = {} }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiMessageSquare className="text-brand-500" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Reviews
        </h2>
      </div>

      {/* Summary */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="font-display text-3xl font-extrabold text-slate-800 dark:text-white">
            {stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
          </div>
          <div>
            <RatingStars rating={stats.rating || 0} />
            <div className="text-xs text-slate-400 mt-0.5">
              {stats.reviewCount || reviews.length} reviews
            </div>
          </div>
        </div>

        {/* Breakdown */}
        {Object.keys(ratingBreakdown).length > 0 && (
          <div className="space-y-2">
            {BREAKDOWN_KEYS.map(({ key, label }) => {
              const val = ratingBreakdown[key] || 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent transition-all duration-700"
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-6 text-right">
                    {val.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <div key={review._id || i} className="glass rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar src={review.reviewerAvatar} name={review.reviewerName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                      {review.reviewerName || 'Anonymous'}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>
                  <RatingStars rating={review.rating} size="text-xs" />
                  {review.feedback && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {review.feedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="💬"
          title="No Reviews Yet"
          description="Complete sessions to receive reviews."
        />
      )}
    </Card>
  );
}
