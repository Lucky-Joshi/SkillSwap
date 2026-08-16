import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FiEdit3, FiSave, FiGithub, FiLinkedin, FiGlobe, FiMail, FiMessageSquare,
  FiCalendar, FiUpload, FiAward, FiBookOpen, FiTarget, FiCheckCircle, FiX, FiTrash2,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Select from '../components/ui/Select';
import RatingStars from '../components/ui/RatingStars';
import Tag from '../components/ui/Tag';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import SkillPicker from '../components/feature/SkillPicker';
import SessionForm from '../components/feature/SessionForm';
import { getUser, updateProfile, uploadAvatar, uploadResume, addSkill, removeUserSkill } from '../services/users';
import { getSkills } from '../services/skills';
import { getUserReviews } from '../services/reviews';
import { getAllBadges } from '../services/badges';
import { requestMatch } from '../services/matches';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks';
import { formatDate, timeAgo, levelLabel } from '../utils/helpers';
import { AVAILABILITY_OPTIONS, YEAR_OPTIONS, QUALIFICATION_OPTIONS, DEPARTMENT_OPTIONS, TRUST_BREAKDOWN, trustLabel } from '../utils/constants';

export default function Profile() {
  useDocumentTitle('Profile');
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({});
  const [allSkills, setAllSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [badges, setBadges] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState('teach');
  const [sessionOpen, setSessionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const resumeRef = useRef(null);

  const isMe = !id || String(profile?.id || profile?._id) === String(me?.id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = id || me.id;
      const [userRes, reviewsRes, badgesRes] = await Promise.all([
        getUser(userId),
        getUserReviews(userId, { limit: 6 }),
        getAllBadges(),
      ]);
      setProfile(userRes.user);
      setForm(userRes.user);
      setReviews(reviewsRes.data || []);
      setBadges(badgesRes.badges || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, me.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getSkills({ limit: 100 }).then((res) => setAllSkills(res.data || [])).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({
        name: form.name,
        bio: form.bio,
        college: form.college,
        qualification: form.qualification,
        department: form.department,
        year: form.year,
        availability: form.availability,
        github: form.github,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
      });
      setProfile(res.user);
      setForm(res.user);
      if (isMe) updateUser(res.user);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      setProfile(res.user);
      setForm(res.user);
      if (isMe) updateUser(res.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadResume(file);
      toast.success(`Resume parsed! ${res.added.length ? `Added ${res.added.length} skills.` : 'No new skills found.'}`);
      const userRes = await getUser(me.id);
      setProfile(userRes.user);
      setForm(userRes.user);
      updateUser(userRes.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openPicker = (type) => {
    setPickerType(type);
    setPickerOpen(true);
  };

  const handleAddSkills = async (ids) => {
    setSaving(true);
    try {
      for (const skillId of ids) {
        await addSkill({ skillId, canTeach: pickerType === 'teach', wantToLearn: pickerType !== 'teach', level: 3 });
      }
      toast.success('Skills added');
      setPickerOpen(false);
      const userRes = await getUser(me.id);
      setProfile(userRes.user);
      setForm(userRes.user);
      updateUser(userRes.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillEntry) => {
    try {
      await removeUserSkill(skillEntry.id || skillEntry._id);
      toast.success(`Removed ${skillEntry.name}`);
      const userRes = await getUser(me.id);
      setProfile(userRes.user);
      setForm(userRes.user);
      updateUser(userRes.user);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRequest = async () => {
    try {
      await requestMatch({ userId: profile.id, mode: 'mentors', compatibilityScore: 0 });
      toast.success('Request sent!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Spinner />;
  if (!profile) return <EmptyState icon="👤" title="User not found" />;

  const teach = profile.skills?.filter((s) => s.canTeach) || [];
  const learn = profile.skills?.filter((s) => s.wantToLearn) || [];
  const earnedBadges = badges.filter((b) => b.earned);

  const p = profile;
  const profileId = p.id || p._id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-brand-600 via-brand-500 to-accent" />
        <div className="relative mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
          <button onClick={() => isMe && fileRef.current?.click()} className="group relative" title={isMe ? 'Change avatar' : ''}>
            <Avatar src={p.avatar} name={p.name} size="xl" className="ring-4 ring-white dark:ring-slate-900" />
            {isMe && (
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                <FiEdit3 className="h-4 w-4" />
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{p.name}</h1>
              {p.isVerified && <Tag tone="green" icon="✓">Verified</Tag>}
              {p.role && p.role !== 'student' && <Tag tone="purple">{p.role}</Tag>}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {p.qualification && <span className="font-medium text-slate-600 dark:text-slate-300">{p.qualification}</span>}
              {p.qualification && ' · '}
              {p.department}{p.department && ' · '}{p.year && `Year ${p.year}`} · {p.college}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <RatingStars rating={p.rating} count={p.reviewCount} />
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
                <FiAward /> {p.points || 0} pts
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold" title="Profile trust score">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: `conic-gradient(#34d399 ${(p.trustScore || 0) * 3.6}deg, rgba(148,163,184,0.25) 0deg)` }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-900">{p.trustScore || 0}</span>
                </span>
                <span className={trustLabel(p.trustScore || 0).color}>{trustLabel(p.trustScore || 0).label}</span>
              </span>
              {p.isTest && <Tag tone="amber">Test account</Tag>}
              {p.availability && <Tag tone="slate">🕒 {p.availability}</Tag>}
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {isMe ? (
              editing ? (
                <>
                  <Button onClick={handleSave} loading={saving}><FiSave className="h-4 w-4" /> Save</Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setEditing(true)}><FiEdit3 className="h-4 w-4" /> Edit profile</Button>
              )
            ) : (
              <>
                <Button onClick={handleRequest}><FiMail className="h-4 w-4" /> Request</Button>
                <Button variant="secondary" onClick={() => navigate(`/chat?user=${profileId}`)}><FiMessageSquare className="h-4 w-4" /> Message</Button>
                <Button variant="secondary" onClick={() => setSessionOpen(true)}><FiCalendar className="h-4 w-4" /> Schedule</Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
          {p.bio && <p className="w-full text-slate-600 dark:text-slate-300">{p.bio}</p>}
          {p.github && <a href={p.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-600"><FiGithub /> GitHub</a>}
          {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-600"><FiLinkedin /> LinkedIn</a>}
          {p.portfolio && <a href={p.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-600"><FiGlobe /> Portfolio</a>}
          <span className="flex items-center gap-1.5">Joined {formatDate(p.createdAt)}</span>
        </div>
      </Card>

      {isMe && editing && (
        <Card>
          <h2 className="mb-4 font-display text-lg font-bold">Edit information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name || ''} onChange={set('name')} />
            <Input label="College / University" value={form.college || ''} onChange={set('college')} />
            <Select label="Qualification" value={form.qualification || ''} onChange={set('qualification')}>
              <option value="">Select…</option>
              {QUALIFICATION_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
            </Select>
            <Select label="Department / Stream" value={form.department || ''} onChange={set('department')}>
              <option value="">Select…</option>
              {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select label="Year" value={form.year || ''} onChange={set('year')}>
              <option value="">Select…</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y === 'Graduate' ? y : `Year ${y}`}</option>)}
            </Select>
            <Select label="Availability" value={form.availability || ''} onChange={set('availability')}>
              <option value="">Select…</option>
              {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </Select>
            <Input label="GitHub" value={form.github || ''} onChange={set('github')} placeholder="https://github.com/…" />
            <Input label="LinkedIn" value={form.linkedin || ''} onChange={set('linkedin')} placeholder="https://linkedin.com/in/…" />
            <Input label="Portfolio" value={form.portfolio || ''} onChange={set('portfolio')} placeholder="https://…" />
            <TextArea label="Bio" value={form.bio || ''} onChange={set('bio')} className="sm:col-span-2" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => resumeRef.current?.click()} loading={uploading}>
              <FiUpload className="h-4 w-4" /> Upload resume & extract skills
            </Button>
            <input ref={resumeRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={handleResume} />
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'overview', label: `Overview` },
          { value: 'skills', label: `Skills (${p.skills?.length || 0})` },
          { value: 'badges', label: `Badges (${earnedBadges.length})` },
          { value: 'reviews', label: `Reviews (${p.reviewCount || reviews.length})` },
        ]}
        active={tab}
        onChange={setTab}
        className="w-full sm:w-auto"
      />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 font-display font-bold"><FiBookOpen className="text-emerald-500" /> Can teach</h2>            <div className="flex flex-wrap gap-2">
              {teach.map((s) => (
                <span key={s.id || s._id} className="group inline-flex items-center gap-1.5 chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {s.icon} {s.name}
                  {s.level && <span className="text-[10px] opacity-70">· {levelLabel(s.level)}</span>}
                  {isMe && (
                    <button onClick={() => handleRemoveSkill(s)} className="opacity-0 transition group-hover:opacity-100 hover:text-red-500"><FiX /></button>
                  )}
                </span>
              ))}
              {teach.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
            </div>
            {isMe && <Button variant="ghost" className="mt-3" onClick={() => openPicker('teach')}>+ Add teaching skills</Button>}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-display font-bold"><FiTarget className="text-accent" /> Want to learn</h2>
            <div className="flex flex-wrap gap-2">
              {learn.map((s) => (
                <span key={s.id || s._id} className="group inline-flex items-center gap-1.5 chip border border-accent/40 bg-accent/10 text-amber-700 dark:text-amber-300">
                  {s.icon} {s.name}
                  {isMe && (
                    <button onClick={() => handleRemoveSkill(s)} className="opacity-0 transition group-hover:opacity-100 hover:text-red-500"><FiX /></button>
                  )}
                </span>
              ))}
              {learn.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
            </div>
            {isMe && <Button variant="ghost" className="mt-3" onClick={() => openPicker('learn')}>+ Add learning goals</Button>}
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display font-bold"><span title="Profile trust score">🛡️</span> Profile trust</h2>
            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
                style={{ background: `conic-gradient(#34d399 ${(p.trustScore || 0) * 3.6}deg, rgba(148,163,184,0.25) 0deg)` }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900">{p.trustScore || 0}</span>
              </span>
              <div className="text-sm">
                <div className={`font-semibold ${trustLabel(p.trustScore || 0).color}`}>{trustLabel(p.trustScore || 0).label}</div>
                <p className="mt-0.5 text-xs text-slate-400">Complete your profile and stay active to raise it.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              {TRUST_BREAKDOWN.map((row) => (
                <li key={row.label} className="flex items-center justify-between">
                  <span>{row.label}</span>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">+{row.points}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-3 font-display font-bold">Projects</h2>
            {p.projects?.length ? (
              <div className="space-y-2">
                {p.projects.map((pr) => (
                  <div key={pr._id} className="rounded-lg border border-slate-200/60 p-3 dark:border-white/10">
                    <div className="text-sm font-semibold">{pr.title}</div>
                    {pr.description && <div className="text-xs text-slate-400">{pr.description}</div>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No projects listed.</p>}
          </Card>

          <Card>
            <h2 className="mb-3 font-display font-bold">Achievements</h2>
            {p.achievements?.length ? (
              <ul className="space-y-1.5 text-sm">
                {p.achievements.map((a, i) => <li key={i} className="flex items-start gap-2"><FiCheckCircle className="mt-0.5 text-emerald-500" /> {a}</li>)}
              </ul>
            ) : <p className="text-sm text-slate-400">No achievements yet.</p>}
          </Card>
        </div>
      )}

      {tab === 'skills' && (
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">All skills</h2>
            {isMe && <Button variant="secondary" onClick={() => openPicker('teach')}><FiEdit3 className="h-4 w-4" /> Manage skills</Button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.skills?.map((s) => (
              <div key={s.id || s._id} className="flex items-center justify-between rounded-xl border border-slate-200/60 p-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-slate-400">{levelLabel(s.level)}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {s.canTeach && <Tag tone="green">Teach</Tag>}
                  {s.wantToLearn && <Tag tone="amber">Learn</Tag>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => (
            <motion.div
              key={b.id}
              whileHover={{ y: -4 }}
              className={`glass rounded-2xl p-5 text-center ${b.earned ? '' : 'opacity-40 grayscale'}`}
            >
              <div className="text-4xl">{b.icon}</div>
              <div className="mt-2 font-semibold">{b.name}</div>
              <div className="mt-0.5 text-xs text-slate-400">{b.points} pts</div>
              {b.earned && <Tag tone="green" className="mt-2">✓ Earned</Tag>}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <EmptyState icon="⭐" title="No reviews yet" description="Reviews appear after mentoring sessions." />
          ) : (
            reviews.map((r) => (
              <Card key={r._id} className="!p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.learner?.avatar} name={r.learner?.name} size="sm" />
                  <div>
                    <div className="text-sm font-semibold">{r.learner?.name}</div>
                    <div className="text-xs text-slate-400">{timeAgo(r.createdAt)}</div>
                  </div>
                  <div className="ml-auto"><RatingStars rating={r.rating} /></div>
                </div>
                {r.feedback && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{r.feedback}</p>}
              </Card>
            ))
          )}
        </div>
      )}

      <SessionForm open={sessionOpen} onClose={() => setSessionOpen(false)} otherUser={p} />

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={`Add ${pickerType === 'teach' ? 'teaching' : 'learning'} skills`}>
        <SkillPicker
          skills={allSkills}
          selected={[]}
          onChange={(ids) => {
            if (ids.length) handleAddSkills(ids);
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPickerOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}
