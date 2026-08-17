import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen, FiTarget, FiUsers, FiCalendar, FiBell, FiMessageSquare,
  FiAward, FiZap, FiStar, FiChevronRight, FiClock, FiBarChart2,
  FiActivity, FiUserCheck, FiTrendingUp,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import Tag from '../components/ui/Tag';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { getDashboard } from '../services/ai';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks';
import { formatDateTime, timeAgo } from '../utils/helpers';
import { scoreLabel } from '../utils/constants';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getDashboard();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <div className="mb-6"><div className="skeleton h-8 w-64" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const s = data?.stats || {};
  const firstName = (user?.name || 'there').split(' ')[0];

  const stats = [
    { icon: <FiBookOpen />, label: 'Teaching skills', value: s.teachCount, accent: 'from-emerald-500 to-teal-600' },
    { icon: <FiTarget />, label: 'Learning goals', value: s.learnCount, accent: 'from-accent to-orange-500' },
    { icon: <FiUsers />, label: 'Connections', value: s.activeConnections || s.matchCount, accent: 'from-brand-500 to-indigo-600' },
    { icon: <FiAward />, label: 'Badges', value: s.badgeCount, accent: 'from-purple-500 to-fuchsia-600' },
  ];

  const skillHours = data?.skillHours || [];
  const connectionsSummary = data?.connectionsSummary || [];
  const activityFeed = data?.activityFeed || [];
  const recentReviews = data?.recentReviews || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
            Welcome back, {firstName} <span className="inline-block animate-float">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here's your learning pulse today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/discover" className="btn-secondary"><FiZap className="h-4 w-4" /> Find peers</Link>
          <Link to="/recommendations" className="btn-primary">AI matches <FiChevronRight className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((st) => <StatCard key={st.label} {...st} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile completion */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display font-bold">Profile completion</h2>
              <span className="font-display text-xl font-extrabold text-brand-600 dark:text-brand-300">{s.profileCompletion}%</span>
            </div>
            <ProgressBar value={s.profileCompletion} />
            <div className="mt-3 flex flex-wrap gap-2">
              {!user?.bio && <Tag tone="red">Add a bio</Tag>}
              {!user?.avatar && <Tag tone="red">Add an avatar</Tag>}
              {s.teachCount === 0 && <Tag tone="amber">Add teaching skills</Tag>}
              {s.learnCount === 0 && <Tag tone="amber">Add learning goals</Tag>}
              {s.profileCompletion === 100 && <Tag tone="green">✓ Complete profile</Tag>}
            </div>
          </Card>

          {/* Mentoring progress */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold">Mentoring progress</h2>
              <Link to="/sessions" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">View sessions</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-brand-500/10 p-3 text-center">
                <div className="font-display text-xl font-extrabold text-brand-600 dark:text-brand-300">{s.sessionsCompleted || 0}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Sessions done</div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                <div className="font-display text-xl font-extrabold text-emerald-600">{s.hoursLearned || 0}h</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Learning</div>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3 text-center">
                <div className="font-display text-xl font-extrabold text-purple-600">{s.hoursTaught || 0}h</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Teaching</div>
              </div>
              <div className="rounded-xl bg-accent/10 p-3 text-center">
                <div className="font-display text-xl font-extrabold text-amber-600">{(s.learningStreak || 0) + (s.teachingStreak || 0)}🔥</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Day streak</div>
              </div>
            </div>
            {s.learnedSkills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.learnedSkills.slice(0, 6).map((sk) => <Tag key={sk._id || sk.name} tone="green" icon="✓">{sk.name || sk}</Tag>)}
              </div>
            )}
          </Card>

          {/* Skill hours breakdown */}
          {skillHours.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display font-bold">Skill hours breakdown</h2>
                <Tag tone="brand" icon={<FiBarChart2 className="h-2.5 w-2.5" />}>By topic</Tag>
              </div>
              <div className="space-y-2">
                {skillHours.map((sh) => {
                  const maxHours = Math.max(...skillHours.map((x) => x.total), 1);
                  const width = Math.max(10, (sh.total / maxHours) * 100);
                  return (
                    <div key={sh.skill} className="flex items-center gap-3">
                      <span className="w-28 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{sh.skill}</span>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                      <span className="w-16 text-right text-xs text-slate-400">
                        {sh.taught > 0 && <span className="text-emerald-500">{sh.taught}t</span>}
                        {sh.taught > 0 && sh.learned > 0 && ' / '}
                        {sh.learned > 0 && <span className="text-purple-500">{sh.learned}l</span>}
                        {!sh.taught && !sh.learned && `${sh.total}h`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Active connections */}
          {connectionsSummary.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display font-bold">Active connections</h2>
                <Link to="/connections" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">View all</Link>
              </div>
              <div className="space-y-3">
                {connectionsSummary.slice(0, 4).map((c) => (
                  <Link key={c.id} to={`/profile/${c.userId}`} className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 transition hover:border-brand-300 dark:border-white/10">
                    <Avatar src={c.avatar} name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.role === 'peer' ? 'Peer' : c.role === 'mentor' ? 'Your mentor' : 'Your learner'}</div>
                    </div>
                    <FiChevronRight className="text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Upcoming sessions */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold">Upcoming sessions</h2>
              <Link to="/sessions" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">View all</Link>
            </div>
            {data?.upcomingSessions?.length ? (
              <div className="space-y-3">
                {data.upcomingSessions.map((sess) => (
                  <div key={sess._id} className="flex items-center gap-4 rounded-xl border border-slate-200/60 p-3 dark:border-white/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300"><FiCalendar /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{sess.topic}</div>
                      <div className="text-xs text-slate-400">{formatDateTime(sess.date)} · {sess.duration} min</div>
                    </div>
                    <Tag tone="green">{sess.status}</Tag>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="📅" title="No upcoming sessions" description="Schedule one from a chat or match."
                action={<Link to="/discover" className="btn-secondary">Find a peer</Link>} />
            )}
          </Card>

          {/* Recent activity feed */}
          {activityFeed.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display font-bold">Recent activity</h2>
                <Tag tone="slate" icon={<FiActivity className="h-2.5 w-2.5" />}>Feed</Tag>
              </div>
              <div className="space-y-3">
                {activityFeed.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-3 dark:border-white/10">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <FiCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.text}</div>
                      <div className="text-[10px] text-slate-400">{a.hours && `${a.hours}h · `}{timeAgo(a.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI suggestions */}
          <Card className="bg-gradient-to-br from-brand-600 to-indigo-700 !text-white">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-100">
              <FiZap className="h-4 w-4" /> AI suggestion
            </div>
            <p className="text-sm leading-relaxed text-white/90">
              {s.learnCount
                ? `You want to learn ${s.learnCount} skill${s.learnCount > 1 ? 's' : ''}. ${s.teachCount ? `You're already teaching ${s.teachCount}.` : 'Start teaching one to unlock mutual matches.'}`
                : 'Add learning goals to unlock personalized mentor recommendations.'}
            </p>
            <Link to="/recommendations" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
              See my matches <FiChevronRight />
            </Link>
          </Card>

          {/* Quick actions */}
          <Card>
            <h2 className="mb-3 font-display font-bold">Quick actions</h2>
            <div className="space-y-2">
              <Link to="/calendar" className="btn-secondary w-full">🗓️ Session calendar</Link>
              <Link to="/mentors" className="btn-secondary w-full">🤝 My mentors</Link>
              <Link to="/learners" className="btn-secondary w-full">🧑‍🏫 My learners</Link>
              <Link to="/roadmap" className="btn-secondary w-full">🗺️ Generate a roadmap</Link>
              <Link to="/leaderboard" className="btn-secondary w-full">🏆 View leaderboard</Link>
              <Link to="/certificates" className="btn-secondary w-full">📜 My certificates</Link>
            </div>
          </Card>

          {/* Rating / points */}
          <Card>
            <h2 className="mb-3 font-display font-bold">Your standing</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><FiStar className="text-accent" /> Rating</span>
                <span className="font-semibold">{s.rating ? Number(s.rating).toFixed(1) : '—'} / 5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><FiAward className="text-brand-500" /> Points</span>
                <span className="font-semibold">{s.points || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><FiUsers className="text-purple-500" /> Reviews</span>
                <span className="font-semibold">{s.reviewCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><FiMessageSquare className="text-emerald-500" /> Pending requests</span>
                <span className="font-semibold">{s.pendingRequests || 0}</span>
              </div>
            </div>
          </Card>

          {/* Recent reviews */}
          {recentReviews.length > 0 && (
            <Card>
              <h2 className="mb-3 font-display font-bold">Recent reviews</h2>
              <div className="space-y-3">
                {recentReviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200/60 p-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Avatar src={r.from?.avatar} name={r.from?.name} size="xs" />
                      <span className="text-xs font-semibold">{r.from?.name}</span>
                      <span className="ml-auto text-xs text-amber-500">{'★'.repeat(r.rating)}</span>
                    </div>
                    {r.feedback && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.feedback}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
