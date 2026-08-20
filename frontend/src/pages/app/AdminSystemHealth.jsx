import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import { getAdminSystemHealth } from '../../services/admin';

function StatusDot({ ok }) {
  return (
    <span
      className={`h-3 w-3 shrink-0 rounded-full ${ok ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
    />
  );
}

function formatMemory(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminSystemHealth() {
  useDocumentTitle('Admin · System Health');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getAdminSystemHealth();
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <Spinner />;

  if (!data) {
    return <EmptyState icon="🏥" title="No data" description="Could not load system health data." />;
  }

  const h = data.health || {};
  const components = [
    {
      name: 'Database',
      ok: h.db?.status === 'connected',
      details: [
        { label: 'Status', value: h.db?.status ?? 'unknown' },
        { label: 'Host', value: h.db?.host ?? '—' },
      ],
    },
    {
      name: 'API',
      ok: h.api?.status === 'operational' || h.api?.status === 'ok' || h.api?.status === 'healthy',
      details: [{ label: 'Status', value: h.api?.status ?? 'unknown' }],
    },
    {
      name: 'Socket.IO',
      ok: h.socket?.status === 'operational' || h.socket?.status === 'ok' || h.socket?.status === 'healthy',
      details: [{ label: 'Status', value: h.socket?.status ?? 'unknown' }],
    },
    {
      name: 'AI Service',
      ok: h.ai?.status === 'online' || h.ai?.status === 'ok',
      details: [
        { label: 'Status', value: h.ai?.status ?? 'unknown' },
        { label: 'Uptime', value: h.ai?.uptime_seconds ?? h.ai?.uptime ?? '—' },
      ],
    },
  ];

  const allHealthy = components.every((c) => c.ok);
  const server = h.server || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">System Health</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Live health status of all platform components.
        </p>
      </div>

      <Card className={`!p-4 ${allHealthy ? 'border border-emerald-500/30' : 'border border-red-500/30'}`}>
        <div className="flex items-center gap-3">
          <StatusDot ok={allHealthy} />
          <span className={`text-sm font-semibold ${allHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {allHealthy ? 'All Systems Operational' : 'Issues Detected'}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {components.map((comp) => (
          <Card key={comp.name}>
            <div className="mb-3 flex items-center gap-3">
              <StatusDot ok={comp.ok} />
              <span className="font-display font-bold">{comp.name}</span>
            </div>
            <div className="space-y-2">
              {comp.details.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{d.label}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 font-display font-bold">Server Info</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-slate-400">Node.js Version</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
              {server.nodeVersion ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Uptime</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
              {formatUptime(server.uptime)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Memory Usage</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
              {formatMemory(server.memory?.rss)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
