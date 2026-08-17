import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import {
  FiCalendar, FiCheckCircle, FiClock, FiVideo, FiMapPin, FiXCircle,
  FiPlus, FiArrowRight, FiZap, FiEye,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Tag from '../components/ui/Tag';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';
import SessionForm from '../components/feature/SessionForm';
import {
  getSessionDashboard, confirmSession, cancelSession, completeSession,
} from '../services/sessions';
import { getRelationships } from '../services/matches';
import { getNextSteps } from '../services/ai';
import { useDocumentTitle } from '../hooks';
import { formatDateTime, timeAgo } from '../utils/helpers';

const STATUS_TONE = {
  pending: 'amber',
  confirmed: 'brand',
  upcoming: 'brand',
  in_progress: 'green',
  completed: 'green',
  cancelled: 'red',
};

const STATUS_LABEL = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  upcoming: 'Upcoming',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const meetingInfo = (s) => {
  if (s.meetingMode === 'offline') {
    const label = {
      campus: 'Campus', classroom: 'Classroom', library: 'Library', lab: 'Lab', custom: 'Custom location',
    }[s.locationType] || 'Offline';
    return { icon: FiMapPin, text: s.location ? `${label} · ${s.location}` : label, link: null };
  }
  const label = {
    googleMeet: 'Google Meet', zoom: 'Zoom', teams: 'Microsoft Teams', custom: 'Meeting link',
  }[s.meetingType] || 'Online';
  const url = s.meetingLink || s.link;
  return { icon: FiVideo, text: label, link: url || null };
};

function SessionDetail({ session }) {
  const meet = meetingInfo(session);
  const other = session.role === 'mentor' ? session.learner : session.mentor;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar src={other?.avatar} name={other?.name} size="sm" />
        <div>
          <div className="text-sm font-semibold">{other?.name}</div>
          <div className="text-xs text-slate-400">{session.role === 'mentor' ? 'Your learner' : 'Your mentor'}</div>
        </div>
        <Tag tone={STATUS_TONE[session.status]} className="ml-auto">{STATUS_LABEL[session.status] || session.status}</Tag>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400"><FiCalendar /> Date</div>
          <div className="mt-1 font-semibold">{formatDateTime(session.date)}</div>
        </div>
        <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400"><FiClock /> Duration</div>
          <div className="mt-1 font-semibold">{session.startTime} · {session.duration} min</div>
        </div>
      </div>
      {session.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{session.description}</p>
      )}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/60 p-3 dark:border-white/10">
        <span className="flex items-center gap-2 text-sm font-medium">
          <meet.icon className="h-4 w-4 text-brand-500" /> {meet.text}
        </span>
        {meet.link && (
          <a href={meet.link} target="_blank" rel="noreferrer" className="btn-secondary !px-3 !py-1.5 text-xs">Join</a>
        )}
      </div>
      {session.feedback && (
        <div className="rounded-xl bg-amber-500/10 p-3 text-sm">
          <span className="font-semibold">Feedback: </span>{session.feedback}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Created {timeAgo(session.createdAt)}</span>
        {session.completedAt && <span>Completed {timeAgo(session.completedAt)}</span>}
      </div>
    </div>
  );
}

function CompleteModal({ session, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [recommend, setRecommend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextSteps, setNextSteps] = useState([]);
  const [progress, setProgress] = useState(null);

  const submit = async () => {
    if (!rating) {
      toast.error('Pick a rating first');
      return;
    }
    setSubmitting(true);
    try {
      const res = await completeSession(session._id, { rating, feedback, recommendAnother: recommend });
      toast.success('Session completed! 🎉');
      setNextSteps(res.nextSteps || []);
      setProgress(res.progress || null);
      onDone?.(res.session);
      if (res.progress) toast(`Progress updated: ${res.progress.hoursLearned || 0}h learned`, { icon: '📈' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (nextSteps.length > 0) {
    return (
      <Modal open onClose={onClose} title="Session complete 🎉" size="sm">
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-5 !text-white">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-100"><FiZap /> AI suggests your next topics</div>
            <div className="mt-3 space-y-2">
              {nextSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">{i + 1}</span>
                  {step}
                  {i < nextSteps.length - 1 && <FiArrowRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </div>
              ))}
            </div>
          </div>

          {progress && (
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your progress</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <div className="text-lg font-extrabold text-emerald-600">{progress.hoursLearned || 0}h</div>
                  <div className="text-[10px] text-slate-500">Hours learned</div>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <div className="text-lg font-extrabold text-purple-600">{progress.hoursTaught || 0}h</div>
                  <div className="text-[10px] text-slate-500">Hours taught</div>
                </div>
              </div>
              {progress.learningStreak > 0 && (
                <div className="mt-2 text-center text-sm text-slate-500">
                  🔥 {progress.learningStreak} day learning streak
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={onClose}>Done</Button>
            <Link to="/roadmap" className="btn-secondary flex-1 justify-center">View roadmap</Link>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`Complete "${session.topic}"`} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Rate this session with {session.role === 'mentor' ? 'your learner' : 'your mentor'}.</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} onClick={() => setRating(i)} className={`text-3xl transition ${i <= rating ? 'text-accent' : 'text-slate-300 dark:text-slate-600'}`}>★</button>
          ))}
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Write feedback…"
          className="input min-h-[90px]"
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} className="h-4 w-4 rounded" />
          Recommend another session
        </label>
        <div className="flex gap-2">
          <Button className="flex-1" loading={submitting} onClick={submit}><FiCheckCircle className="h-4 w-4" /> Complete</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Sessions() {
  useDocumentTitle('Sessions');
  const [tab, setTab] = useState('upcoming');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState([]);
  const [schedulerFor, setSchedulerFor] = useState(null);
  const [schedulePick, setSchedulePick] = useState(false);
  const [details, setDetails] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, rel] = await Promise.all([getSessionDashboard(), getRelationships()]);
      setData(dash.dashboard);
      setRelationships([...(rel.mentors || []), ...(rel.learners || [])]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openScheduler = () => {
    if (relationships.length === 1) setSchedulerFor(relationships[0].otherUser);
    else if (relationships.length > 1) setSchedulePick(true);
    else toast('You need an accepted mentorship to schedule a session.', { icon: '🤝' });
  };

  const action = async (fn, id, message) => {
    setBusyId(id);
    try {
      await fn(id);
      toast.success(message);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = (session) => {
    setDetails(null);
    setCompleting(session);
  };

  const dashboard = data || {};
  const listMap = {
    upcoming: dashboard.upcoming || [],
    pending: dashboard.pending || [],
    in_progress: dashboard.inProgress || [],
    completed: dashboard.completed || [],
    cancelled: dashboard.cancelled || [],
    history: dashboard.history || [],
  };
  const sessions = listMap[tab] || [];
  const next = dashboard.nextMeeting;

  const tabs = [
    { value: 'upcoming', label: `Upcoming (${(dashboard.upcoming || []).length})` },
    { value: 'pending', label: `Pending (${(dashboard.pending || []).length})` },
    { value: 'in_progress', label: `In progress (${(dashboard.inProgress || []).length})` },
    { value: 'completed', label: `Completed (${(dashboard.completed || []).length})` },
    { value: 'cancelled', label: `Cancelled (${(dashboard.cancelled || []).length})` },
    { value: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Sessions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Schedule, confirm and complete mentoring sessions with your accepted connections.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/calendar" className="btn-secondary"><FiCalendar className="h-4 w-4" /> Calendar</Link>
          <Button onClick={openScheduler}><FiPlus className="h-4 w-4" /> Schedule Session</Button>
        </div>
      </div>

      {/* Next meeting */}
      {next && (
        <Card className="bg-gradient-to-br from-brand-600 to-indigo-700 !text-white">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15"><FiCalendar className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-100">Next meeting</div>
              <div className="truncate font-display text-lg font-bold">{next.topic}</div>
              <div className="text-sm text-white/80">{formatDateTime(next.date)} · {next.startTime} · {next.duration} min</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20" onClick={() => setDetails(next)}>
                <FiEye className="h-4 w-4" /> View
              </Button>
              <Button className="!bg-white !text-brand-700" onClick={() => handleComplete(next)}>
                <FiCheckCircle className="h-4 w-4" /> Complete
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="w-full sm:w-auto" />

      {loading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="📅"
          title={`No ${tab} sessions`}
          description="Once a mentorship is accepted you can schedule your first session."
          action={<Button onClick={openScheduler}><FiPlus className="h-4 w-4" /> Schedule a session</Button>}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const other = s.role === 'mentor' ? s.learner : s.mentor;
            const meet = meetingInfo(s);
            const editable = s.storedStatus === 'pending' || s.storedStatus === 'confirmed';
            return (
              <Card key={s._id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <FiCalendar className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold">{s.topic}</h3>
                    <Tag tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status] || s.status}</Tag>
                    {s.role === 'mentor' && <Tag tone="purple">You mentor</Tag>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {formatDateTime(s.date)} · {s.startTime} · {s.duration} min</span>
                    <span className="flex items-center gap-1"><meet.icon className="h-3 w-3" /> {meet.text}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Avatar src={other?.avatar} name={other?.name} size="xs" />
                    <Link to={`/profile/${other?.id}`} className="font-semibold hover:text-brand-600 dark:hover:text-brand-300">{other?.name}</Link>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setDetails(s)}><FiEye className="h-3.5 w-3.5" /> View</Button>
                  {s.storedStatus === 'pending' && (
                    <Button size="sm" loading={busyId === s._id} onClick={() => action(confirmSession, s._id, 'Session confirmed ✅')}><FiCheckCircle className="h-3.5 w-3.5" /> Confirm</Button>
                  )}
                  {editable && (
                    <Button variant="secondary" size="sm" loading={busyId === s._id} onClick={() => action(cancelSession, s._id, 'Session cancelled')}><FiXCircle className="h-3.5 w-3.5" /> Cancel</Button>
                  )}
                  {s.storedStatus === 'confirmed' && (
                    <Button size="sm" loading={busyId === s._id} onClick={() => handleComplete(s)}><FiCheckCircle className="h-3.5 w-3.5" /> Complete</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pick a connection to schedule with */}
      <Modal open={schedulePick} onClose={() => setSchedulePick(false)} title="Schedule with…">
        <div className="space-y-2">
          {relationships.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSchedulePick(false); setSchedulerFor(r.otherUser); }}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 p-3 text-left transition hover:border-brand-300 dark:border-white/10"
            >
              <Avatar src={r.otherUser?.avatar} name={r.otherUser?.name} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold">{r.otherUser?.name}</div>
                <div className="text-xs text-slate-400">{r.role === 'mentor' ? 'Your learner' : 'Your mentor'}</div>
              </div>
              <FiArrowRight className="ml-auto text-slate-400" />
            </button>
          ))}
        </div>
      </Modal>

      <SessionForm open={Boolean(schedulerFor)} onClose={() => setSchedulerFor(null)} otherUser={schedulerFor} onCreated={load} />

      <AnimatePresence>
        {details && (
          <Modal open onClose={() => setDetails(null)} title={details.topic}>
            <SessionDetail session={details} />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {details.storedStatus === 'pending' && (
                <Button size="sm" onClick={() => action(confirmSession, details._id, 'Session confirmed ✅')}><FiCheckCircle className="h-3.5 w-3.5" /> Confirm</Button>
              )}
              {details.storedStatus === 'confirmed' && (
                <Button size="sm" onClick={() => handleComplete(details)}><FiCheckCircle className="h-3.5 w-3.5" /> Mark complete</Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDetails(null)}>Close</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {completing && (
        <CompleteModal session={completing} onClose={() => setCompleting(null)} onDone={() => load()} />
      )}
    </div>
  );
}
