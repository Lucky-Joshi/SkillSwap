import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiClock, FiAlertTriangle, FiShield, FiXCircle, FiRotateCcw, FiTrash2, FiSlash, FiEye } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useDocumentTitle } from '../../hooks';
import {
  listAdminUsers,
  getAdminUser,
  updateAdminUser,
  verifyAdminUser,
  suspendAdminUser,
  softDeleteAdminUser,
  permanentDeleteAdminUser,
  reactivateAdminUser,
  banAdminUser,
} from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 20;

const ROLES = ['all', 'student', 'faculty', 'alumni', 'admin'];
const STATUSES = ['all', 'active', 'verified', 'suspended', 'deleted', 'banned'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: '-points', label: 'Points' },
  { value: '-trustScore', label: 'Trust' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  verified: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  suspended: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  deleted: 'bg-red-500/15 text-red-600 dark:text-red-400',
  banned: 'bg-red-600/15 text-red-700 dark:text-red-400',
  pending: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
};

export default function AdminUsers() {
  useDocumentTitle('Admin · Users');

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('-createdAt');

  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('');
  const [suspendUnit, setSuspendUnit] = useState('days');
  const [suspendNotes, setSuspendNotes] = useState('');

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteType, setDeleteType] = useState('soft');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState('');

  const buildParams = useCallback(() => {
    const params = { page, limit: PAGE_SIZE, sort };
    if (search.trim()) params.q = search.trim();
    if (role !== 'all') params.role = role;
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [page, search, role, statusFilter, sort]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminUsers(buildParams());
      setUsers(res.users || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

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

  const handleViewDetails = async (u) => {
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const res = await getAdminUser(u.id);
      setDetailUser(res.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditRole = (u, newRole) => {
    run(`role-${u.id}`, () => updateAdminUser(u.id, { role: newRole }), `${u.name} role updated to ${newRole}.`);
  };

  const handleVerify = (u) => {
    run(`verify-${u.id}`, () => verifyAdminUser(u.id), u.isVerified ? `${u.name} unverified.` : `${u.name} verified.`);
  };

  const handleSuspend = () => {
    if (!suspendReason.trim()) return toast.error('Reason is required.');
    const key = suspendModal.id;
    const data = { reason: suspendReason, notes: suspendNotes };
    if (suspendDuration) { data.duration = suspendDuration; data.durationUnit = suspendUnit; }
    run(`suspend-${key}`, () => suspendAdminUser(key, data), 'User suspended.');
    setSuspendModal(null); setSuspendReason(''); setSuspendDuration(''); setSuspendNotes('');
  };

  const handleSoftDelete = () => {
    if (!deleteReason.trim()) return toast.error('Reason is required.');
    if (deleteConfirm !== 'DELETE') return toast.error('Type DELETE to confirm.');
    const key = deleteModal.id;
    run(`del-${key}`, () => softDeleteAdminUser(key, { reason: deleteReason }), 'User soft-deleted.');
    setDeleteModal(null); setDeleteReason(''); setDeleteConfirm('');
  };

  const handlePermanentDelete = () => {
    if (!deleteReason.trim()) return toast.error('Reason is required.');
    if (deleteConfirm !== 'DELETE') return toast.error('Type DELETE to confirm.');
    const key = deleteModal.id;
    run(`pdel-${key}`, () => permanentDeleteAdminUser(key, { confirmation: 'DELETE', reason: deleteReason }), 'User permanently deleted.');
    setDeleteModal(null); setDeleteReason(''); setDeleteConfirm('');
  };

  const handleReactivate = (u) => {
    run(`react-${u.id}`, () => reactivateAdminUser(u.id), `${u.name} reactivated.`);
  };

  const handleBan = () => {
    if (!banReason.trim()) return toast.error('Reason is required.');
    const key = banModal.id;
    run(`ban-${key}`, () => banAdminUser(key, { reason: banReason }), 'User banned.');
    setBanModal(null); setBanReason('');
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Moderate users with full audit trail. Every action is logged and users are notified.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="mb-4">
          <Input placeholder="Search by name, email, or college…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5">
            {ROLES.map((r) => <option key={r} value={r}>{r === 'all' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Institution</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Trust</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Joined</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-white/5">
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{u.college || '—'}</td>
                      <td className="py-2.5 pr-3">
                        <select value={u.role} disabled={busy === `role-${u.id}`} onChange={(e) => handleEditRole(u, e.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-white/10">
                          {['student', 'faculty', 'alumni', 'admin'].map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{u.trustScore ?? 0}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[u.status] || STATUS_STYLES.active}`}>
                          {u.status || 'active'}
                        </span>
                        {u.role === 'admin' && (
                          <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            <FiShield className="h-2.5 w-2.5" /> admin
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button variant="ghost" className="!px-1.5 !py-1 text-xs" onClick={() => handleViewDetails(u)} title="View details">
                            <FiEye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" className="!px-1.5 !py-1 text-xs" loading={busy === `verify-${u.id}`} onClick={() => handleVerify(u)} title={u.isVerified ? 'Unverify' : 'Verify'}>
                            {u.isVerified ? <FiXCircle className="h-3.5 w-3.5" /> : <FiCheck className="h-3.5 w-3.5" />}
                          </Button>
                          {u.status === 'suspended' || u.status === 'deleted' || u.status === 'banned' ? (
                            <Button variant="ghost" className="!px-1.5 !py-1 text-xs text-emerald-500" loading={busy === `react-${u.id}`} onClick={() => handleReactivate(u)} title="Reactivate">
                              <FiRotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" className="!px-1.5 !py-1 text-xs text-amber-500" onClick={() => { setSuspendModal(u); setSuspendReason(''); setSuspendDuration(''); setSuspendNotes(''); }} title="Suspend" disabled={u.role === 'admin'}>
                                <FiClock className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" className="!px-1.5 !py-1 text-xs text-red-500" onClick={() => { setDeleteModal(u); setDeleteType('soft'); setDeleteReason(''); setDeleteConfirm(''); }} title="Delete" disabled={u.role === 'admin'}>
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" className="!px-1.5 !py-1 text-xs text-red-700" onClick={() => { setBanModal(u); setBanReason(''); }} title="Ban" disabled={u.role === 'admin'}>
                                <FiSlash className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
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
                <Button variant="secondary" className="!px-3 !py-1 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" className="!px-3 !py-1 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailUser || detailLoading} onClose={() => { setDetailUser(null); }} title="User Details" size="lg">
        {detailLoading ? <Spinner /> : detailUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {detailUser.avatar && <img src={detailUser.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />}
              <div>
                <h3 className="text-lg font-bold">{detailUser.name}</h3>
                <p className="text-sm text-slate-500">{detailUser.email}</p>
                <div className="mt-1 flex gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[detailUser.status] || ''}`}>{detailUser.status}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{detailUser.role}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>College: <span className="font-medium">{detailUser.college || '—'}</span></div>
              <div>Trust Score: <span className="font-mono">{detailUser.trustScore}</span></div>
              <div>Points: <span className="font-mono">{detailUser.points}</span></div>
              <div>Sessions: <span className="font-mono">{detailUser.sessionsCompleted}</span></div>
              <div>Connections: <span className="font-mono">{detailUser.activeConnections}</span></div>
              <div>Profile Views: <span className="font-mono">{detailUser.profileViews}</span></div>
            </div>
            {detailUser.suspensionReason && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                <p className="font-semibold text-amber-700 dark:text-amber-400">Suspension Reason</p>
                <p>{detailUser.suspensionReason}</p>
                {detailUser.suspendedUntil && <p className="text-xs text-amber-600">Until: {formatDate(detailUser.suspendedUntil)}</p>}
              </div>
            )}
            {detailUser.banReason && (
              <div className="rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                <p className="font-semibold text-red-700 dark:text-red-400">Ban Reason</p>
                <p>{detailUser.banReason}</p>
              </div>
            )}
            {detailUser.auditHistory?.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Recent Admin Actions</h4>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {detailUser.auditHistory.map((log) => (
                    <div key={log._id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-800">
                      <span><span className="font-medium">{log.admin?.name || 'Admin'}</span> {log.action.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Suspend Modal */}
      <Modal open={!!suspendModal} onClose={() => setSuspendModal(null)} title="Suspend User">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Suspend <strong>{suspendModal?.name}</strong>? They will be unable to log in or use any features.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason *</label>
            <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" rows={3} placeholder="Why is this user being suspended?" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Duration</label>
              <input type="number" value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" placeholder="Leave empty for indefinite" min="1" />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-sm font-medium">Unit</label>
              <select value={suspendUnit} onChange={(e) => setSuspendUnit(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Internal Notes</label>
            <input value={suspendNotes} onChange={(e) => setSuspendNotes(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" placeholder="Optional internal notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSuspendModal(null)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSuspend} loading={busy === `suspend-${suspendModal?.id}`}>Suspend User</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete User">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Delete <strong>{deleteModal?.name}</strong>? This action requires confirmation.
          </p>
          <div className="flex gap-3">
            <Button variant={deleteType === 'soft' ? 'primary' : 'secondary'} className={deleteType === 'soft' ? 'bg-red-500 hover:bg-red-600 text-white' : ''} onClick={() => setDeleteType('soft')}>Soft Delete (Recommended)</Button>
            <Button variant={deleteType === 'permanent' ? 'primary' : 'secondary'} className={deleteType === 'permanent' ? 'bg-red-700 hover:bg-red-800 text-white' : ''} onClick={() => setDeleteType('permanent')}>Permanent Delete</Button>
          </div>
          {deleteType === 'permanent' && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <FiAlertTriangle className="mr-1 inline h-4 w-4" />
              Permanent deletion removes all user data. Messages are anonymized. This cannot be undone.
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Reason *</label>
            <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" rows={2} placeholder="Why is this user being deleted?" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type DELETE to confirm *</label>
            <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-800 dark:bg-white/5" placeholder="DELETE" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            {deleteType === 'permanent' ? (
              <Button className="bg-red-700 hover:bg-red-800 text-white" onClick={handlePermanentDelete} loading={busy === `pdel-${deleteModal?.id}`}>Permanently Delete</Button>
            ) : (
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleSoftDelete} loading={busy === `del-${deleteModal?.id}`}>Soft Delete</Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal open={!!banModal} onClose={() => setBanModal(null)} title="Ban User">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Permanently ban <strong>{banModal?.name}</strong>? They will not be able to log in or register again.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason *</label>
            <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" rows={3} placeholder="Why is this user being banned?" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBanModal(null)}>Cancel</Button>
            <Button className="bg-red-700 hover:bg-red-800 text-white" onClick={handleBan} loading={busy === `ban-${banModal?.id}`}>Ban User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
