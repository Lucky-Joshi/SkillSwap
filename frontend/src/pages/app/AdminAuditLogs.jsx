import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiShield, FiCheck, FiClock, FiTrash2, FiSlash, FiRotateCcw, FiAlertTriangle, FiEdit } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { useDocumentTitle } from '../../hooks';
import { listAdminAuditLogs } from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 30;

const ACTION_LABELS = {
  verify_user: { label: 'Verified', icon: FiCheck, color: 'text-blue-500' },
  unverify_user: { label: 'Unverified', icon: FiAlertTriangle, color: 'text-slate-500' },
  suspend_user: { label: 'Suspended', icon: FiClock, color: 'text-amber-500' },
  unsuspend_user: { label: 'Unsuspended', icon: FiRotateCcw, color: 'text-emerald-500' },
  soft_delete_user: { label: 'Soft Deleted', icon: FiTrash2, color: 'text-red-500' },
  permanent_delete_user: { label: 'Permanently Deleted', icon: FiTrash2, color: 'text-red-700' },
  reactivate_user: { label: 'Reactivated', icon: FiRotateCcw, color: 'text-emerald-500' },
  ban_user: { label: 'Banned', icon: FiSlash, color: 'text-red-600' },
  update_user_role: { label: 'Role Updated', icon: FiEdit, color: 'text-purple-500' },
  resolve_report: { label: 'Report Resolved', icon: FiCheck, color: 'text-blue-500' },
  dismiss_report: { label: 'Report Dismissed', icon: FiAlertTriangle, color: 'text-slate-500' },
  create_badge: { label: 'Badge Created', icon: FiShield, color: 'text-emerald-500' },
  update_badge: { label: 'Badge Updated', icon: FiEdit, color: 'text-blue-500' },
  delete_badge: { label: 'Badge Deleted', icon: FiTrash2, color: 'text-red-500' },
  create_institution: { label: 'Institution Created', icon: FiShield, color: 'text-emerald-500' },
  update_institution: { label: 'Institution Updated', icon: FiEdit, color: 'text-blue-500' },
  delete_institution: { label: 'Institution Deleted', icon: FiTrash2, color: 'text-red-500' },
  merge_institutions: { label: 'Institutions Merged', icon: FiShield, color: 'text-purple-500' },
  create_skill: { label: 'Skill Created', icon: FiShield, color: 'text-emerald-500' },
  update_skill: { label: 'Skill Updated', icon: FiEdit, color: 'text-blue-500' },
  delete_skill: { label: 'Skill Deleted', icon: FiTrash2, color: 'text-red-500' },
  merge_skills: { label: 'Skills Merged', icon: FiShield, color: 'text-purple-500' },
};

const ACTION_FILTERS = [
  'all', 'verify_user', 'suspend_user', 'soft_delete_user', 'permanent_delete_user',
  'reactivate_user', 'ban_user', 'update_user_role',
];

export default function AdminAuditLogs() {
  useDocumentTitle('Admin · Audit Logs');

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (actionFilter !== 'all') params.action = actionFilter;
      const res = await listAdminAuditLogs(params);
      setLogs(res.logs || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete record of all admin actions. Every moderation action is logged with admin, timestamp, reason, and IP.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {ACTION_FILTERS.map((a) => (
              <option key={a} value={a}>{a === 'all' ? 'All actions' : ACTION_LABELS[a]?.label || a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState icon="📋" title="No audit logs found" description="Actions will appear here as admins moderate the platform." />
        ) : (
          <>
            <div className="space-y-2">
              {logs.map((log) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action.replace(/_/g, ' '), icon: FiShield, color: 'text-slate-500' };
                const Icon = meta.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-white/5">
                    <div className={`mt-0.5 ${meta.color}`}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 text-sm">
                        <span className="font-semibold">{log.admin?.name || 'Admin'}</span>
                        <span className={meta.color}>{meta.label.toLowerCase()}</span>
                        {log.targetName && <span className="font-medium">{log.targetName}</span>}
                      </div>
                      {log.reason && <p className="mt-0.5 text-xs text-slate-500">{log.reason}</p>}
                      {log.notes && <p className="mt-0.5 text-xs text-slate-400 italic">{log.notes}</p>}
                      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ip && <span>IP: {log.ip}</span>}
                        {log.previousStatus && log.newStatus && <span>{log.previousStatus} → {log.newStatus}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Page {page} of {totalPages} ({total} logs)</span>
              <div className="flex gap-2">
                <Button variant="secondary" className="!px-3 !py-1 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" className="!px-3 !py-1 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
