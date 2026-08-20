import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { useDocumentTitle } from '../../hooks';
import { listAdminReports, resolveAdminReport } from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ['all', 'pending', 'reviewed', 'resolved', 'dismissed'];
const TARGET_OPTIONS = ['all', 'user', 'message', 'session', 'skill'];

const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  reviewed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  resolved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  dismissed: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
};

export default function AdminReports() {
  useDocumentTitle('Admin · Reports');

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [status, setStatus] = useState('all');
  const [targetType, setTargetType] = useState('all');

  const [resolveModal, setResolveModal] = useState(null);
  const [resolution, setResolution] = useState('');

  const buildParams = useCallback(() => {
    const params = { page, limit: PAGE_SIZE };
    if (status !== 'all') params.status = status;
    if (targetType !== 'all') params.targetType = targetType;
    return params;
  }, [page, status, targetType]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminReports(buildParams());
      setReports(res.reports || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleStatusChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const runAction = async (key, fn, msg) => {
    setBusy(key);
    try {
      await fn();
      toast.success(msg);
      await loadReports();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleReview = (r) => {
    runAction(`review-${r.id}`, () => resolveAdminReport(r.id, { status: 'reviewed' }), 'Report marked as reviewed.');
  };

  const handleDismiss = (r) => {
    if (!window.confirm('Dismiss this report?')) return;
    runAction(`dismiss-${r.id}`, () => resolveAdminReport(r.id, { status: 'dismissed' }), 'Report dismissed.');
  };

  const openResolve = (r) => {
    setResolveModal(r);
    setResolution('');
  };

  const submitResolve = () => {
    if (!resolution.trim()) return toast.error('Resolution text is required');
    runAction(`resolve-${resolveModal.id}`, () => resolveAdminReport(resolveModal.id, { status: 'resolved', resolution: resolution.trim() }), 'Report resolved.');
    setResolveModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review and resolve user reports.</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={handleStatusChange(setStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={targetType}
            onChange={handleStatusChange(setTargetType)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {TARGET_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : reports.length === 0 ? (
          <EmptyState icon="🚩" title="No reports found" description="No reports match the selected filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    <th className="py-2 pr-4">Reporter</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Target ID</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 dark:border-white/5">
                      <td className="py-2.5 pr-4 font-semibold">{r.reporter?.name || r.reporterName || '—'}</td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{r.targetType || '—'}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{r.targetId || '—'}</td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{r.reason || '—'}</td>
                      <td className="py-2.5 pr-4 max-w-xs truncate text-slate-500 dark:text-slate-400">{r.description || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[r.status] || STATUS_STYLES.dismissed}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                      <td className="py-2.5 text-right">
                        {r.status === 'pending' && (
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <Button variant="ghost" className="!px-2 !py-1 text-xs" loading={busy === `review-${r.id}`} onClick={() => handleReview(r)}>
                              Mark Reviewed
                            </Button>
                            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openResolve(r)}>
                              Resolve
                            </Button>
                            <Button variant="ghost" className="!px-2 !py-1 text-xs text-red-500" loading={busy === `dismiss-${r.id}`} onClick={() => handleDismiss(r)}>
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            <div className="text-center text-xs text-slate-400">{total} reports total</div>
          </>
        )}
      </Card>

      <Modal open={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Report" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Provide a resolution note for report from <strong>{resolveModal?.reporter?.name || resolveModal?.reporterName || '—'}</strong>.
          </p>
          <Input
            label="Resolution"
            placeholder="Describe the resolution…"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <div className="flex gap-2">
            <Button loading={busy === `resolve-${resolveModal?.id}`} onClick={submitResolve}>Resolve</Button>
            <Button variant="ghost" onClick={() => setResolveModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
