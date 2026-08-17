import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiChevronRight, FiClock, FiVideo, FiMapPin, FiCalendar } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getSessionCalendar } from '../../services/sessions';
import { useDocumentTitle } from '../../hooks';
import { cx } from '../../utils/helpers';

const STATUS_TONE = {
  pending: 'amber',
  upcoming: 'brand',
  in_progress: 'green',
  confirmed: 'brand',
  completed: 'green',
  cancelled: 'red',
};

export default function Calendar() {
  useDocumentTitle('Calendar');
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const monthParam = useMemo(
    () => `${view.year}-${String(view.month + 1).padStart(2, '0')}`,
    [view.year, view.month]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSessionCalendar({ month: monthParam });
      const map = {};
      (res.events || []).forEach((e) => { map[e.date] = e.sessions; });
      setEvents(map);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [monthParam]);

  useEffect(() => { load(); }, [load]);

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shift = (delta) => {
    setView((v) => {
      const m = v.month + delta;
      if (m < 0) return { year: v.year - 1, month: 11 };
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: m };
    });
  };

  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const todayMeetings = Object.values(events).flat().filter((s) => {
    const d = new Date(s.date).toISOString().slice(0, 10);
    return d === todayKey;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your mentoring timeline — click any session for details.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => shift(-1)}><FiChevronLeft /></Button>
          <span className="min-w-[130px] text-center text-sm font-bold">{monthName}</span>
          <Button variant="secondary" size="sm" onClick={() => shift(1)}><FiChevronRight /></Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Month grid */}
          <Card className="lg:col-span-2">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={`empty-${i}`} />;
                const key = `${monthParam}-${String(d).padStart(2, '0')}`;
                const daySessions = events[key] || [];
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    onClick={() => daySessions.length && setSelected(daySessions[0])}
                    className={cx(
                      'flex min-h-[64px] flex-col gap-1 rounded-xl border p-1.5 text-left transition sm:min-h-[84px]',
                      isToday
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-slate-200/60 hover:border-brand-300 dark:border-white/10',
                      daySessions.length ? 'cursor-pointer' : 'cursor-default'
                    )}
                  >
                    <span className={cx('text-xs font-bold', isToday ? 'text-brand-600 dark:text-brand-300' : '')}>{d}</span>
                    <div className="space-y-1">
                      {daySessions.slice(0, 2).map((s) => (
                        <div
                          key={s._id}
                          className={cx(
                            'flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px]',
                            s.status === 'cancelled' ? 'bg-red-500/10 text-red-500 line-through'
                              : s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600'
                                : s.status === 'in_progress' ? 'bg-accent/20 text-accent'
                                  : 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                          )}
                        >
                          <FiClock className="shrink-0" /> {s.startTime}
                          <span className="truncate">{s.topic}</span>
                        </div>
                      ))}
                      {daySessions.length > 2 && <div className="px-1.5 text-[9px] text-slate-400">+{daySessions.length - 2} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Today's meetings */}
          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-display font-bold"><FiCalendar className="text-brand-500" /> Today</h2>
              {todayMeetings.length === 0 ? (
                <EmptyState icon="🌤️" title="Nothing today" description="Enjoy the day off, or schedule a session." />
              ) : (
                <div className="space-y-2">
                  {todayMeetings.map((s) => (
                    <button key={s._id} onClick={() => setSelected(s)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 p-3 text-left transition hover:border-brand-300 dark:border-white/10">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{s.topic}</div>
                        <div className="text-xs text-slate-400">{s.startTime} · {s.duration} min</div>
                      </div>
                      <Tag tone={STATUS_TONE[s.status]}>{s.status}</Tag>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 font-display font-bold">Quick links</h2>
              <div className="space-y-2">
                <Link to="/app/sessions" className="btn-secondary w-full">📅 Session dashboard</Link>
                <Link to="/app/chat" className="btn-secondary w-full">💬 Open chat</Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Session detail modal */}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.topic}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={(selected.role === 'mentor' ? selected.learner : selected.mentor)?.avatar}
                name={(selected.role === 'mentor' ? selected.learner : selected.mentor)?.name} size="sm" />
              <div>
                <div className="text-sm font-semibold">{(selected.role === 'mentor' ? selected.learner : selected.mentor)?.name}</div>
                <div className="text-xs text-slate-400">{selected.role === 'mentor' ? 'Your learner' : 'Your mentor'}</div>
              </div>
              <Tag tone={STATUS_TONE[selected.status]} className="ml-auto">{selected.status}</Tag>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400">When</div>
                <div className="mt-1 font-semibold">{new Date(selected.date).toLocaleDateString()} · {selected.startTime}</div>
              </div>
              <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400">Duration</div>
                <div className="mt-1 font-semibold">{selected.duration} minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 p-3 text-sm dark:border-white/10">
              {selected.meetingMode === 'offline' ? <FiMapPin className="text-brand-500" /> : <FiVideo className="text-brand-500" />}
              <span className="font-medium">{selected.meetingMode === 'offline' ? (selected.location || 'Offline') : (selected.meetingLink || 'Online')}</span>
            </div>
            {selected.description && <p className="text-sm text-slate-500 dark:text-slate-400">{selected.description}</p>}
            <div className="flex justify-end">
              <Link to="/app/sessions" className="btn-secondary">Open session dashboard</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
