import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import {
  listAdminUsers,
  updateAdminUser,
  suspendAdminUser,
  deleteAdminUser,
} from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 20;

const ROLES = ['all', 'student', 'faculty', 'alumni', 'admin'];
const VERIFIED_OPTIONS = ['all', 'true', 'false'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: 'points', label: 'Points' },
  { value: 'trust', label: 'Trust' },
];

export default function AdminUsers() {
  useDocumentTitle('Admin · Users');

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [verified, setVerified] = useState('all');
  const [sort, setSort] = useState('newest');

  const buildParams = useCallback(() => {
    const params = { page, limit: PAGE_SIZE, sort };
    if (search.trim()) params.q = search.trim();
    if (role !== 'all') params.role = role;
    if (verified !== 'all') params.verified = verified;
    return params;
  }, [page, search, role, verified, sort]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminUsers(buildParams());
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const run = async (key, fn, successMsg) => {
    setBusy(key);
    try {
      await fn();
      toast.success(successMsg);
      await loadUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleEditRole = (u, newRole) => {
    run(`role-${u.id}`, () => updateAdminUser(u.id, { role: newRole }), `${u.name} role updated to ${newRole}.`);
  };

  const handleToggleVerify = (u) => {
    run(`verify-${u.id}`, () => updateAdminUser(u.id, { isVerified: !u.isVerified }), `${u.name} ${u.isVerified ? 'unverified' : 'verified'}.`);
  };

  const handleToggleSuspend = (u) => {
    run(`suspend-${u.id}`, () => suspendAdminUser(u.id), `${u.name} ${u.isSuspended ? 'unsuspended' : 'suspended'}.`);
  };

  const handleDelete = (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) return;
    run(`del-${u.id}`, () => deleteAdminUser(u.id), `${u.name} deleted.`);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, search, and manage all registered users.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="mb-4">
          <Input
            placeholder="Search by name, email, or college…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={role}
            onChange={handleFilterChange(setRole)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r === 'all' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>

          <select
            value={verified}
            onChange={handleFilterChange(setVerified)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {VERIFIED_OPTIONS.map((v) => (
              <option key={v} value={v}>{v === 'all' ? 'All verified' : v === 'true' ? 'Verified' : 'Unverified'}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Institution</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Trust</th>
                    <th className="py-2 pr-4">Points</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Joined</th>
                    <th className="py-2 text-right">Actions</th>
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
                      <td className="py-2.5 pr-4">
                        <select
                          value={u.role}
                          disabled={busy === `role-${u.id}`}
                          onChange={(e) => handleEditRole(u, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-white/10"
                        >
                          {['student', 'faculty', 'alumni', 'admin'].map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pr-4 font-mono">{u.trustScore ?? 0}</td>
                      <td className="py-2.5 pr-4 font-mono">{u.points ?? 0}</td>
                      <td className="py-2.5 pr-4">
                        <span className="flex flex-wrap gap-1">
                          {u.role === 'admin' && (
                            <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">admin</span>
                          )}
                          {u.isVerified && (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">verified</span>
                          )}
                          {u.isSuspended && (
                            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">suspended</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs"
                            loading={busy === `verify-${u.id}`}
                            onClick={() => handleToggleVerify(u)}
                          >
                            {u.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs"
                            loading={busy === `suspend-${u.id}`}
                            onClick={() => handleToggleSuspend(u)}
                          >
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs text-red-500"
                            loading={busy === `del-${u.id}`}
                            onClick={() => handleDelete(u)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Page {page} of {totalPages} ({total} users)</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="!px-3 !py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
