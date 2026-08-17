import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiMessageSquare, FiUser, FiUsers, FiTrash2, FiCheck,
  FiClock, FiVideo, FiMapPin, FiArrowRight, FiBarChart2, FiRepeat,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Tag from '../components/ui/Tag';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import RatingStars from '../components/ui/RatingStars';
import { CardSkeleton } from '../components/ui/Skeleton';
import SessionForm from '../components/feature/SessionForm';
import { getRelationships, cancelMatch } from '../services/matches';
import { useDocumentTitle } from '../hooks';
import { formatDate, formatDateTime } from '../utils/helpers';

export default function Connections({ initialTab = 'mentors' }) {
  useDocumentTitle('My Connections');
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [mentors, setMentors] = useState([]);
  const [learners, setLearners] = useState([]);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulerFor, setSchedulerFor] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRelationships();
      setMentors(res.mentors || []);
      setLearners(res.learners || []);
      setPeers(res.peers || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = tab === 'mentor' ? learners : tab === 'peer' ? peers : mentors;
  const heading = tab === 'peer' ? 'Peer Connections' : tab === 'mentor' ? 'My Learners' : 'My Mentors';
  const sub = tab === 'peer'
    ? 'Mutual skill exchange partnerships.'
    : tab === 'mentor'
      ? 'Learners who accepted you as their mentor.'
      : 'Mentors who accepted your request.';

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setBusy(true);
    try {
      await cancelMatch(confirmCancel.id);
      toast.success('Connection ended');
      setConfirmCancel(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const typeTag = (type) => {
    if (type === 'peer') return <Tag tone="purple" icon={<FiRepeat className="h-2.5 w-2.5" />}>Peer</Tag>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sub}</p>
        </div>
        <Tabs
          tabs={[
            { value: 'learner', label: `My Mentors (${mentors.length})` },
            { value: 'mentor', label: `My Learners (${learners.length})` },
            { value: 'peer', label: `Peers (${peers.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={`No ${heading.toLowerCase()} yet`}
          description="Accept a connection request or discover students to get started."
          action={<Link to="/discover" className="btn-primary"><FiUsers className="h-4 w-4" /> Find connections</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((r) => {
            const stats = r.stats || {};
            const hasSessions = stats.completedSessions > 0;
            return (
              <Card key={r.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <Link to={`/profile/${r.otherUser?.id}`}>
                    <Avatar src={r.otherUser?.avatar} name={r.otherUser?.name} size="lg" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${r.otherUser?.id}`} className="flex items-center gap-2">
                      <h3 className="truncate font-display text-base font-bold hover:text-brand-600 dark:hover:text-brand-300">{r.otherUser?.name}</h3>
                      {typeTag(r.type)}
                    </Link>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {r.otherUser?.department}{r.otherUser?.department && ' · '}{r.otherUser?.college}
                    </div>
                    <div className="mt-1.5"><RatingStars rating={r.otherUser?.rating} size="text-xs" /></div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(r.skills || []).slice(0, 3).map((s) => <Tag key={s.skillId} tone="green" icon="📚">{s.name}</Tag>)}
                    </div>
                    {r.type === 'peer' && (r.skillAteaches || r.skillBteaches) && (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                        {r.skillAteaches && <span>You teach: <b className="text-emerald-600">{r.skillAteaches}</b></span>}
                        {r.skillBteaches && <span>· They teach: <b className="text-brand-600">{r.skillBteaches}</b></span>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Tag tone={r.type === 'peer' ? 'purple' : 'green'}>Active</Tag>
                    <span className="text-[10px] text-slate-400">{r.acceptedAt ? `since ${formatDate(r.acceptedAt)}` : ''}</span>
                  </div>
                </div>

                {/* Relationship stats */}
                {stats.completedSessions !== undefined && (
                  <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <FiBarChart2 className="h-3 w-3" />
                      {stats.completedSessions} session{stats.completedSessions !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <FiClock className="h-3 w-3" />
                      {stats.totalHours}h together
                    </span>
                    {stats.lastSessionAt && (
                      <span className="text-slate-400">
                        Last: {formatDate(stats.lastSessionAt)}
                      </span>
                    )}
                  </div>
                )}

                {/* Next session */}
                {stats.nextSession && (
                  <div className="flex items-center gap-3 rounded-xl border border-brand-200/60 bg-brand-500/5 p-3 dark:border-brand-500/20">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300">
                      <FiCalendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-brand-700 dark:text-brand-300">{stats.nextSession.topic}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(stats.nextSession.date)} · {stats.nextSession.startTime} · {stats.nextSession.duration}min
                      </div>
                    </div>
                    <Tag tone={stats.nextSession.meetingMode === 'online' ? 'brand' : 'amber'} icon={stats.nextSession.meetingMode === 'online' ? <FiVideo className="h-2.5 w-2.5" /> : <FiMapPin className="h-2.5 w-2.5" />}>
                      {stats.nextSession.meetingMode === 'online' ? 'Online' : 'Offline'}
                    </Tag>
                  </div>
                )}

                {/* Quick actions */}
                <div className="mt-auto flex flex-wrap gap-2">
                  {!stats.nextSession && (
                    <Button size="sm" className="flex-1" onClick={() => setSchedulerFor(r.otherUser)}>
                      <FiCalendar className="h-3.5 w-3.5" /> Schedule
                    </Button>
                  )}
                  {stats.nextSession && (
                    <Button size="sm" className="flex-1" onClick={() => navigate('/sessions')}>
                      <FiCalendar className="h-3.5 w-3.5" /> View sessions
                    </Button>
                  )}
                  <Link to={`/chat?user=${r.otherUser?.id}`} className="btn-secondary !px-3">
                    <FiMessageSquare className="h-3.5 w-3.5" />
                  </Link>
                  <Link to={`/profile/${r.otherUser?.id}`} className="btn-secondary !px-3">
                    <FiUser className="h-3.5 w-3.5" />
                  </Link>
                  <Button variant="danger" size="sm" className="!px-3" onClick={() => setConfirmCancel(r)} title="End connection">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SessionForm open={Boolean(schedulerFor)} onClose={() => setSchedulerFor(null)} otherUser={schedulerFor} onCreated={load} />

      {confirmCancel && (
        <Card className="!border-red-500/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h3 className="font-display font-bold">End connection with {confirmCancel.otherUser?.name}?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sessions and private chat with this user will be locked. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" loading={busy} onClick={handleCancel}><FiCheck className="h-3.5 w-3.5" /> End connection</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(null)}>Keep</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
