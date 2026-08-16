import { FiStar } from 'react-icons/fi';
import { cx } from '../../utils/helpers';

export default function RatingStars({ rating = 0, count, size = 'text-sm' }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <FiStar
            key={i}
            className={cx(size, i <= rounded ? 'fill-accent text-accent' : 'text-slate-300 dark:text-slate-600')}
          />
        ))}
      </div>
      {rating > 0 && (
        <span className={cx(size, 'font-semibold text-slate-700 dark:text-slate-300')}>
          {Number(rating).toFixed(1)}
          {count !== undefined && <span className="font-normal text-slate-400"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
