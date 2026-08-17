import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks';
import {
  getAdminStats,
  listAdminUsers,
  deleteTestUsers,
  deleteUser,
  resetDemoAccount,
  purgeData,
} from '../../services/admin';
import { formatDate } from '../../utils/helpers';

export default function Admin() {
  useDocumentTitle('Admin');
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await getAdminStats();
      setStats(res.stats);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const loadUsers = useCallback(async (q = '') => {
    try {
      const res = await listAdminUsers(q ? { q } : {});
      setUsers(res.users || []);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    Promise.all([loadStats(), loadUsers()]).finally(() => setLoading(false));
  }, [user?.role, loadStats, loadUsers]);

  const run = async (key, fn, successMsg) => {
    setBusy(key);
    try {
      await fn();
      toast.success(successMsg);
      await Promise.all([loadStats(), loadUsers()]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const handlePurge = async () => {
    if (!confirmPurge) {
      setConfirmPurge(true);
      setTimeout(() => setConfirmPurge(false), 5000);
      toast('Click again to confirm. This cannot be undone.');
      return;
    }
    setConfirmPurge(false);
    await run('purge', purgeData, 'All user data purged. Core data and admin account kept.');
  };

  if (loading) return <Spinner />;

  if (user?.role !== 'admin') {
    return <EmptyState icon="🔒" title="Admin only" description="You do not have access to the admin tools." />;
  }

  const statCards = stats
    ? [
        { label: 'Total users', value: stats.totalUsers },
        { label: 'Verified', value: stats.verifiedUsers },
        { label: 'Test accounts', value: stats.testUsers },
        { label: 'Demo accounts', value: stats.demoUsers },
        { label: 'Avg trust', value: stats.averageTrustScore },
        { label: 'Matches', value: stats.totalMatches },
        { label: 'Sessions', value: stats.totalSessions },
        { label: 'Messages', value: stats.totalMessages },
        { label: 'Reviews', value: stats.totalReviews },
        { label: 'Skills', value: stats.totalSkills },
        { label: 'Badges', value: stats.totalBadges },
        { label: 'Institutions', value: stats.totalInstitutions },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Admin tools</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Clean up fake or test data without touching real accounts.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((c) => (
            <Card key={c.label} className="!p-4">
              <div className="font-display text-2xl font-extrabold">{c.value}</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">{c.label}</div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h2 className="mb-3 font-display font-bold">Cleanup tools</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="danger"
            loading={busy === 'test'}
            onClick={() => run('test', deleteTestUsers, 'All temporary test accounts deleted.')}
          >
            Delete all test accounts{stats?.testUsers ? ` (${stats.testUsers})` : ''}
          </Button>
          <Button
            variant="secondary"
            loading={busy === 'demo'}
            onClick={() => run('demo', resetDemoAccount, 'Demo account reset to a clean state.')}
          >
            Reset demo account
          </Button>
          <Button
            variant="danger"
            loading={busy === 'purge'}
            onClick={handlePurge}
          >
            {confirmPurge ? 'Click again to confirm' : 'Purge all user data'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          CLI alternatives: <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">node scripts/seed.js --cleanup-test</code> ·{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">--demo-reset</code> ·{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">--core</code>
        </p>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-bold">Users</h2>
          <form
            className="w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              loadUsers(query);
            }}
          >
            <Input placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </form>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-slate-400">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Institution</th>
                  <th className="py-2 pr-4">Trust</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2.5 pr-4">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{u.college || '—'}</td>
                    <td className="py-2.5 pr-4 font-mono">{u.trustScore ?? 0}</td>
                    <td className="py-2.5 pr-4">
                      <span className="flex flex-wrap gap-1">
                        {u.isTest && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">test</span>}
                        {u.isDemo && <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">demo</span>}
                        {u.role === 'admin' && <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">admin</span>}
                        {u.isVerified && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">verified</span>}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="py-2.5 text-right">
                      {!u.isDemo && u.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs text-red-500"
                          loading={busy === `del-${u.id}`}
                          onClick={() => run(`del-${u.id}`, () => deleteUser(u.id), `Deleted ${u.name}.`)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
