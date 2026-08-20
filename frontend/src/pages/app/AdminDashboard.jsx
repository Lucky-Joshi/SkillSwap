import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import { getAdminDashboard } from '../../services/admin';
import { formatDate } from '../../utils/helpers';

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getAdminDashboard();
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
    return <EmptyState icon="📊" title="No data" description="Could not load admin dashboard data." />;
  }

  const s = data.dashboard || data.stats || {};
  const topSkills = s.topSkills || data.topSkills || [];
  const recentUsers = s.recentUsers || data.recentUsers || [];

  const statCards = [
    { label: 'Total users', value: s.totalUsers ?? 0, accent: 'from-brand-500 to-indigo-600' },
    { label: 'Active (7d)', value: s.activeUsers ?? 0, accent: 'from-emerald-500 to-teal-600' },
    { label: 'Verified', value: s.verifiedUsers ?? 0, accent: 'from-purple-500 to-fuchsia-600' },
    { label: 'New this week', value: s.newThisWeek ?? 0, accent: 'from-sky-500 to-blue-600' },
    { label: 'New this month', value: s.newThisMonth ?? 0, accent: 'from-cyan-500 to-sky-600' },
    { label: 'Institutions', value: s.totalInstitutions ?? 0, accent: 'from-violet-500 to-purple-600' },
    { label: 'Connections', value: s.totalConnections ?? 0, accent: 'from-rose-500 to-pink-600' },
    { label: 'Active connections', value: s.activeConnections ?? 0, accent: 'from-pink-500 to-rose-600' },
    { label: 'Total sessions', value: s.totalSessions ?? 0, accent: 'from-amber-500 to-orange-600' },
    { label: 'Completed', value: s.completedSessions ?? 0, accent: 'from-emerald-500 to-green-600' },
    { label: 'Cancelled', value: s.cancelledSessions ?? 0, accent: 'from-red-500 to-rose-600' },
    { label: 'Sessions this week', value: s.sessionsThisWeek ?? 0, accent: 'from-yellow-500 to-amber-600' },
    { label: 'Sessions this month', value: s.sessionsThisMonth ?? 0, accent: 'from-orange-500 to-red-600' },
    { label: 'Total messages', value: s.totalMessages ?? 0, accent: 'from-teal-500 to-emerald-600' },
    { label: 'Total reviews', value: s.totalReviews ?? 0, accent: 'from-fuchsia-500 to-pink-600' },
    { label: 'Total skills', value: s.totalSkills ?? 0, accent: 'from-indigo-500 to-blue-600' },
    { label: 'Total badges', value: s.totalBadges ?? 0, accent: 'from-purple-500 to-violet-600' },
    { label: 'Badges issued', value: s.badgesIssued ?? 0, accent: 'from-violet-500 to-indigo-600' },
    { label: 'Total reports', value: s.totalReports ?? 0, accent: 'from-red-500 to-orange-600' },
    { label: 'Pending reports', value: s.pendingReports ?? 0, accent: 'from-amber-500 to-red-500' },
    { label: 'Avg trust score', value: s.averageTrustScore ?? 0, accent: 'from-brand-600 to-accent' },
  ];

  const roleColors = {
    admin: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    mentor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    learner: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    peer: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Platform-wide statistics and overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((c) => (
          <Card key={c.label} className="!p-4">
            <div className="font-display text-2xl font-extrabold">{c.value}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-400">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold">Top skills</h2>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-300">
                {topSkills.length}
              </span>
            </div>
            {topSkills.length > 0 ? (
              <div className="space-y-2">
                {topSkills.slice(0, 5).map((sk, i) => {
                  const maxCount = Math.max(...topSkills.map((x) => x.count || 0), 1);
                  const width = Math.max(10, ((sk.count || 0) / maxCount) * 100);
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
              <EmptyState icon="🏷️" title="No skills yet" description="Skills will appear here once created." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold">Recent users</h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Last {recentUsers.length}
              </span>
            </div>
            {recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((u) => (
                  <div key={u._id || u.id} className="rounded-xl border border-slate-200/60 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{u.name || '—'}</div>
                        <div className="truncate text-xs text-slate-400">{u.email || '—'}</div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleColors[u.role] || roleColors.peer}`}>
                        {u.role || 'user'}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {formatDate(u.createdAt || u.joinedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="👤" title="No users yet" description="Users will appear here as they sign up." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
