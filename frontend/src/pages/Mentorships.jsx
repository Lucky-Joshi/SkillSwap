import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiMessageSquare, FiUser, FiUsers, FiTrash2, FiCheck,
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
import { formatDate } from '../utils/helpers';

export default function Mentorships({ initialRole = 'learner' }) {
  useDocumentTitle('My Mentors');
  const [role, setRole] = useState(initialRole);
  const [mentors, setMentors] = useState([]);
  const [learners, setLearners] = useState([]);
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
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = role === 'mentor' ? learners : mentors;
  const heading = role === 'mentor' ? 'My Learners' : 'My Mentors';
  const sub = role === 'mentor'
    ? 'Learners who accepted you as their mentor.'
    : 'Mentors who accepted your request.';

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setBusy(true);
    try {
      await cancelMatch(confirmCancel.id);
      toast.success('Mentorship ended');
      setConfirmCancel(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
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
          ]}
          active={role}
          onChange={setRole}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={`No ${heading.toLowerCase()} yet`}
          description="Accept a mentorship request or find mentors to get started."
          action={<Link to="/recommendations" className="btn-primary"><FiUsers className="h-4 w-4" /> Find matches</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id} className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <Link to={`/profile/${r.otherUser?.id}`}>
                  <Avatar src={r.otherUser?.avatar} name={r.otherUser?.name} size="lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${r.otherUser?.id}`} className="flex items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold hover:text-brand-600 dark:hover:text-brand-300">{r.otherUser?.name}</h3>
                  </Link>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {r.otherUser?.department}{r.otherUser?.department && ' · '}{r.otherUser?.college}
                  </div>
                  <div className="mt-1.5"><RatingStars rating={r.otherUser?.rating} size="text-xs" /></div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(r.skills || []).slice(0, 3).map((s) => <Tag key={s.skillId} tone="green" icon="📚">{s.name}</Tag>)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Tag tone="green">Active</Tag>
                  <span className="text-[10px] text-slate-400">{r.acceptedAt ? `since ${formatDate(r.acceptedAt)}` : ''}</span>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <Button size="sm" className="flex-1" onClick={() => setSchedulerFor(r.otherUser)}>
                  <FiCalendar className="h-3.5 w-3.5" /> Schedule
                </Button>
                <Link to={`/chat?user=${r.otherUser?.id}`} className="btn-secondary !px-3">
                  <FiMessageSquare className="h-3.5 w-3.5" />
                </Link>
                <Link to={`/profile/${r.otherUser?.id}`} className="btn-secondary !px-3">
                  <FiUser className="h-3.5 w-3.5" />
                </Link>
                <Button variant="danger" size="sm" className="!px-3" onClick={() => setConfirmCancel(r)} title="End mentorship">
                  <FiTrash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SessionForm open={Boolean(schedulerFor)} onClose={() => setSchedulerFor(null)} otherUser={schedulerFor} onCreated={load} />

      {confirmCancel && (
        <Card className="!border-red-500/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h3 className="font-display font-bold">End mentorship with {confirmCancel.otherUser?.name}?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sessions and private chat with this user will be locked. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" loading={busy} onClick={handleCancel}><FiCheck className="h-3.5 w-3.5" /> End mentorship</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(null)}>Keep</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
