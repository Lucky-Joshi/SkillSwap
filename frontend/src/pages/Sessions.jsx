import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCalendar, FiCheckCircle, FiClock, FiVideo, FiXCircle } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Tag from '../components/ui/Tag';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { getSessions, updateSession } from '../services/sessions';
import { createReview } from '../services/reviews';
import { useDocumentTitle } from '../hooks';
import { formatDateTime } from '../utils/helpers';

function SessionCard({ session, onComplete, onCancel, onReview, reviewing }) {
  const { user } = useAuth();
  const other = session.role === 'mentor' ? session.learner : session.mentor;
  const isMentor = session.role === 'mentor';
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const STATUS_TONE = {
    scheduled: 'brand',
    completed: 'green',
    cancelled: 'red',
  };

  const submitReview = async () => {
    if (!rating) {
      toast.error('Pick a rating first');
      return;
    }
    try {
      await createReview({
        mentor: session.mentor.id,
        rating,
        feedback,
        sessionId: session._id,
      });
      toast.success('Review submitted — thank you!');
      onReview?.(session._id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <FiCalendar className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display font-bold">{session.topic}</h3>
          <Tag tone={STATUS_TONE[session.status]}>{session.status}</Tag>
          {session.role === 'mentor' && <Tag tone="purple">You mentor</Tag>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {formatDateTime(session.date)} · {session.duration} min</span>
          {session.link && (
            <a href={session.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-300">
              <FiVideo className="h-3 w-3" /> Join link
            </a>
          )}
        </div>
        {session.notes && <div className="mt-1 text-xs text-slate-400">📝 {session.notes}</div>}
      </div>

      {session.status === 'scheduled' && (
        <div className="flex shrink-0 gap-2">
          <Link to={`/profile/${other.id}`} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-300">
            <Avatar src={other?.avatar} name={other?.name} size="xs" /> {other?.name}
          </Link>
          <Button variant="secondary" size="sm" onClick={() => onCancel(session._id)}><FiXCircle className="h-3.5 w-3.5" /> Cancel</Button>
          <Button size="sm" onClick={() => onComplete(session._id)}><FiCheckCircle className="h-3.5 w-3.5" /> Complete</Button>
        </div>
      )}

      {session.status === 'completed' && !reviewing && (
        <Button variant="secondary" size="sm" onClick={() => onReview(session)}>⭐ Leave review</Button>
      )}

      {reviewing && (
        <div className="w-full shrink-0 space-y-2 sm:w-64">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRating(i)} className={`text-2xl transition ${i <= rating ? 'text-accent' : 'text-slate-300 dark:text-slate-600'}`}>★</button>
            ))}
          </div>
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback…" className="input !py-2 text-xs" />
          <div className="flex gap-2">
            <Button size="sm" onClick={submitReview}>Submit</Button>
            <Button variant="ghost" size="sm" onClick={() => onReview(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Sessions() {
  useDocumentTitle('Sessions');
  const [tab, setTab] = useState('scheduled');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await getSessions({ status, limit: 50 });
      setSessions(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const handleComplete = async (id) => {
    try {
      await updateSession(id, { status: 'completed' });
      toast.success('Session completed! 🎉');
      load(tab);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (id) => {
    try {
      await updateSession(id, { status: 'cancelled' });
      toast.success('Session cancelled');
      load(tab);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReview = (session) => {
    setReviewing(reviewing?._id === session._id ? null : session);
  };

  const counts = {
    scheduled: sessions.filter((s) => s.status === 'scheduled').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Sessions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {counts.scheduled > 0 ? `You have ${counts.scheduled} upcoming session${counts.scheduled > 1 ? 's' : ''}.` : 'Plan and track your mentoring sessions.'}
          </p>
        </div>
        <Tabs
          tabs={[{ value: 'scheduled', label: 'Upcoming' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {loading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="📅"
          title={`No ${tab} sessions`}
          description="Schedule a session from a match or a chat conversation."
          action={<Link to="/discover" className="btn-primary">Find a peer</Link>}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <SessionCard
              key={s._id}
              session={s}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onReview={handleReview}
              reviewing={reviewing?._id === s._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
