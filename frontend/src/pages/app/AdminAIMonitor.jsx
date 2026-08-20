import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import { getAdminAIMonitor } from '../../services/admin';

export default function AdminAIMonitor() {
  useDocumentTitle('Admin · AI Monitor');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getAdminAIMonitor();
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <Spinner />;

  if (!data) {
    return <EmptyState icon="🤖" title="No data" description="Could not load AI monitor data." />;
  }

  const online = data.aiStatus === 'online';

  const infoCards = [
    { label: 'Uptime (s)', value: data.uptime ?? '—' },
    { label: 'Graph Nodes', value: data.graphNodes ?? 0 },
    { label: 'Graph Edges', value: data.graphEdges ?? 0 },
    { label: 'Version', value: data.version ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">AI Monitor</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Real-time status of the AI service and knowledge graph.
        </p>
      </div>

      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
          />
          <span className="font-display font-bold">AI Service Status</span>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${online ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {infoCards.map((c) => (
          <Card key={c.label} className="!p-4">
            <div className="font-display text-2xl font-extrabold">{c.value}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-400">{c.label}</div>
          </Card>
        ))}
      </div>

      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Connection: <span className="font-semibold">{online ? 'connected' : 'disconnected'}</span>
          </span>
        </div>
      </Card>
    </div>
  );
}
