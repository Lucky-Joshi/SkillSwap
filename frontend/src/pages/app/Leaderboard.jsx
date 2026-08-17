import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAward, FiStar } from 'react-icons/fi';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getLeaderboard } from '../../services/leaderboard';
import { useDocumentTitle } from '../../hooks';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  useDocumentTitle('Leaderboard');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getLeaderboard({ page: p, limit: 12 });
      setRows(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Top contributors earn points by teaching, learning and completing sessions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon="🏆" title="No rankings yet" description="Be the first to earn points!" />
      ) : (
        <Card className="!p-2">
          <div className="divide-y divide-slate-200/60 dark:divide-white/5">
            {rows.map((row, i) => {
              const isTop3 = i < 3;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <div className={`w-10 text-center font-display text-xl font-extrabold ${isTop3 ? 'text-2xl' : 'text-slate-400'}`}>
                    {isTop3 ? MEDALS[row.rank - 1] : row.rank}
                  </div>
                  <Avatar src={row.avatar} name={row.name} size="sm" />
                  <Link to={`/app/profile/${row.id}`} className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold hover:text-brand-600 dark:hover:text-brand-300">{row.name}</div>
                    <div className="text-xs text-slate-400">{row.department || row.college || 'Student'}</div>
                  </Link>
                  <div className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
                    <FiStar className="text-accent" /> {Number(row.rating || 0).toFixed(1)}
                  </div>
                  <div className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
                    <FiAward className="text-purple-500" /> {row.badgeCount || 0}
                  </div>
                  <div className="w-20 text-right">
                    <div className="font-display text-lg font-extrabold text-brand-600 dark:text-brand-300">{row.points}</div>
                    <div className="text-[10px] text-slate-400">points</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}
