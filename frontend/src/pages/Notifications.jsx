import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiCheckCircle, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Tag from '../components/ui/Tag';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import { getNotifications, markRead, markAllRead } from '../services/notifications';
import { getPendingRequests } from '../services/matches';
import { acceptMatch, rejectMatch } from '../services/matches';
import { useDocumentTitle } from '../hooks';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const ICONS = {
  match: '🤝',
  message: '💬',
  session: '📅',
  review: '⭐',
  badge: '🏅',
  system: '🔔',
};

export default function Notifications() {
  useDocumentTitle('Notifications');
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [res, reqRes] = await Promise.all([
        getNotifications({ page: p, limit: 15 }),
        getPendingRequests(),
      ]);
      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setRequests(reqRes.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const handleRead = async (id) => {
    await markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  const handleReadAll = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRespond = async (matchId, action) => {
    try {
      if (action === 'accept') {
        await acceptMatch(matchId);
        toast.success('Request accepted! Start chatting 🎉');
      } else {
        await rejectMatch(matchId);
        toast('Request declined');
      }
      setRequests((prev) => prev.filter((r) => r.id !== matchId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Requests, messages and achievements.</p>
        </div>
        <Button variant="secondary" onClick={handleReadAll}><FiCheck className="h-4 w-4" /> Mark all read</Button>
      </div>

      {/* Pending match requests */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-bold">Learning requests</h2>
          {requests.map((r) => (
            <Card key={r.id} className="flex flex-col gap-4 sm:flex-row sm:items-center !p-4">
              <Link to={`/profile/${r.otherUser.id}`} className="flex min-w-0 items-center gap-3">
                <Avatar src={r.otherUser?.avatar} name={r.otherUser?.name} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.otherUser?.name}</div>
                  <div className="text-xs text-slate-400">{r.otherUser?.department} {r.otherUser?.year && `· Year ${r.otherUser.year}`}</div>
                </div>
              </Link>
              {r.compatibilityScore > 0 && <Tag tone="green">AI {r.compatibilityScore}%</Tag>}
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleRespond(r.id, 'reject')}>Decline</Button>
                <Button size="sm" onClick={() => handleRespond(r.id, 'accept')}><FiCheck className="h-4 w-4" /> Accept</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="🔕" title="All caught up" description="New notifications will appear here in real time." />
      ) : (
        <div className="space-y-2">
          {items.map((n, idx) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => handleRead(n._id)}
              className={`glass flex w-full cursor-pointer items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-white/90 dark:hover:bg-slate-900/60 ${!n.read ? 'ring-1 ring-brand-500/30' : ''}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                {ICONS[n.type] || '🔔'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm font-semibold ${n.read ? '' : 'text-brand-700 dark:text-brand-300'}`}>{n.title}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                </div>
                {n.message && <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{n.message}</div>}
              </div>
              {n.type === 'message' && (
                <Link
                  to={`/chat?user=${n.data?.senderId}`}
                  className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300 sm:flex"
                >
                  <FiMessageSquare /> Open chat
                </Link>
              )}
              {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}
            </motion.div>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
