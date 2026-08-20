import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import { listAdminSessions, getAdminSessionStats } from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 20;

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  confirmed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export default function AdminSessions() {
  useDocumentTitle('Admin · Sessions');

  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const buildParams = useCallback(() => {
    const params = { page, limit: PAGE_SIZE };
    if (status !== 'all') params.status = status;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    return params;
  }, [page, status, dateFrom, dateTo]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminSessions(buildParams());
      setSessions(res.sessions || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadStats = useCallback(async () => {
    try {
      const res = await getAdminSessionStats();
      setStats(res);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statCards = stats
    ? [
        { label: 'Total', value: stats.total ?? 0, accent: 'from-brand-500 to-indigo-600' },
        { label: 'Pending', value: stats.pending ?? 0, accent: 'from-amber-500 to-orange-600' },
        { label: 'Confirmed', value: stats.confirmed ?? 0, accent: 'from-blue-500 to-cyan-600' },
        { label: 'Completed', value: stats.completed ?? 0, accent: 'from-emerald-500 to-green-600' },
        { label: 'Cancelled', value: stats.cancelled ?? 0, accent: 'from-red-500 to-rose-600' },
        { label: 'Avg Duration', value: stats.averageDuration ? `${Math.round(stats.averageDuration)}m` : '0m', accent: 'from-violet-500 to-purple-600' },
      ]
    : [];

  const sessionsByDay = stats?.sessionsByDay || [];
  const maxDayCount = Math.max(...sessionsByDay.map((d) => d.count || 0), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Session Management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and manage all learning sessions across the platform.
        </p>
      </div>

      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((c) => (
            <Card key={c.label} className="!p-4">
              <div className="font-display text-2xl font-extrabold">{c.value}</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">{c.label}</div>
            </Card>
          ))}
        </div>
      )}

      {sessionsByDay.length > 0 && (
        <Card>
          <h2 className="mb-4 font-display font-bold">Sessions by Day</h2>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {sessionsByDay.map((d) => {
              const height = Math.max(4, ((d.count || 0) / maxDayCount) * 100);
              return (
                <div key={d.date || d._id} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-brand-500 to-brand-400 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="mt-1 hidden w-full truncate text-center text-[10px] text-slate-400 group-hover:block">
                    {d.date || d._id}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={handleFilterChange(setStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
            placeholder="From"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
            placeholder="To"
          />
        </div>

        {loading ? (
          <Spinner />
        ) : sessions.length === 0 ? (
          <EmptyState icon="📅" title="No sessions found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    <th className="py-2 pr-4">Mentor</th>
                    <th className="py-2 pr-4">Learner</th>
                    <th className="py-2 pr-4">Topic</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id || s._id} className="border-b border-slate-100 dark:border-white/5">
                      <td className="py-2.5 pr-4">
                        <div className="font-semibold">{s.mentor?.name || s.mentorName || '—'}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="font-semibold">{s.learner?.name || s.learnerName || '—'}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{s.topic || s.skill?.name || '—'}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(s.scheduledAt || s.date || s.createdAt)}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{s.duration ? `${s.duration}m` : '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s.status] || ''}`}>
                          {s.status || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {s.rating ? (
                          <span className="text-amber-500">{'★'.repeat(Math.round(s.rating))}{'☆'.repeat(5 - Math.round(s.rating))}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Page {page} of {totalPages} ({total} sessions)</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
