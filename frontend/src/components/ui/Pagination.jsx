import { paginationWindow, cx } from '../../utils/helpers';

export default function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;
  const pages = paginationWindow(page, totalPages);
  return (
    <div className={cx('flex items-center justify-center gap-1.5 py-6', className)}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
      >
        ←
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cx(
            'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition',
            p === page
              ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}
