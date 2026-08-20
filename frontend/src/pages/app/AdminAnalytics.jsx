import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import { getAdminAnalytics } from '../../services/admin';

export default function AdminAnalytics() {
  useDocumentTitle('Admin · Analytics');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getAdminAnalytics();
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  if (!data) {
    return <EmptyState icon="📈" title="No data" description="Could not load analytics data." />;
  }

  const userGrowth = data.userGrowth || [];
  const maxGrowthCount = Math.max(...userGrowth.map((w) => w.count || 0), 1);

  const sessions = data.sessionsByStatus || {};
  const sessionCards = [
    { label: 'Completed', value: sessions.completed ?? 0, color: 'from-emerald-500 to-green-600' },
    { label: 'Pending', value: sessions.pending ?? 0, color: 'from-amber-500 to-orange-600' },
    { label: 'Confirmed', value: sessions.confirmed ?? 0, color: 'from-sky-500 to-blue-600' },
    { label: 'Cancelled', value: sessions.cancelled ?? 0, color: 'from-red-500 to-rose-600' },
  ];

  const topSkills = data.topSkills || [];
  const maxSkillCount = Math.max(...topSkills.map((s) => s.count || 0), 1);

  const connectionTypes = data.connectionTypes || {};
  const mentorship = connectionTypes.mentorship ?? 0;
  const peer = connectionTypes.peer ?? 0;
  const totalConnections = mentorship + peer || 1;

  const reviewTrends = data.reviewTrends || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Platform usage trends and key performance indicators.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 font-display font-bold">User Growth</h2>
        {userGrowth.length > 0 ? (
          <div className="space-y-2">
            {userGrowth.map((w, i) => {
              const width = Math.max(8, ((w.count || 0) / maxGrowthCount) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium text-slate-400">{w.label || w.week || `Week ${i + 1}`}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div
                        className="flex h-full items-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-2"
                        style={{ width: `${width}%` }}
                      >
                        {w.count > 0 && (
                          <span className="text-[10px] font-bold text-white">{w.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">{w.count ?? 0}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No growth data available.</p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sessionCards.map((c) => (
          <Card key={c.label} className="!p-4">
            <div className={`font-display text-2xl font-extrabold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
              {c.value}
            </div>
            <div className="mt-0.5 text-xs font-medium text-slate-400">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display font-bold">Top Skills</h2>
          {topSkills.length > 0 ? (
            <div className="space-y-2">
              {topSkills.slice(0, 8).map((sk, i) => {
                const width = Math.max(8, ((sk.count || 0) / maxSkillCount) * 100);
                return (
                  <div key={sk._id || sk.name || i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-[10px] font-bold text-brand-600 dark:text-brand-300">
                      {i + 1}
                    </span>
                    <span className="w-32 truncate text-sm font-medium text-slate-600 dark:text-slate-300">
                      {sk.name || sk.skill || '—'}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {sk.count ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No skill data available.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-display font-bold">Connection Types</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Mentorship</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{mentorship}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                    style={{ width: `${(mentorship / totalConnections) * 100}%` }}
                  />
                </div>
                <div className="mt-0.5 text-right text-[10px] text-slate-400">
                  {((mentorship / totalConnections) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Peer</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{peer}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                    style={{ width: `${(peer / totalConnections) * 100}%` }}
                  />
                </div>
                <div className="mt-0.5 text-right text-[10px] text-slate-400">
                  {((peer / totalConnections) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-display font-bold">Review Trends</h2>
            {reviewTrends.length > 0 ? (
              <div className="space-y-2">
                {reviewTrends.map((r, i) => {
                  const pct = ((r.averageRating || 0) / 5) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs font-medium text-slate-400">{r.month || r.label}</span>
                      <div className="flex-1">
                        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {typeof r.averageRating === 'number' ? r.averageRating.toFixed(1) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No review data available.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
