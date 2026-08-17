import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import { cx } from '../../utils/helpers';
import { updateProfile } from '../../services/users';
import {
  QUALIFICATION_OPTIONS,
  DEPARTMENT_OPTIONS,
  YEAR_OPTIONS,
  AVAILABILITY_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  LANGUAGE_OPTIONS,
  INTEREST_OPTIONS,
} from '../../utils/constants';

const EDIT_TABS = [
  { value: 'basic', label: 'Basic' },
  { value: 'about', label: 'About' },
  { value: 'skills', label: 'Skills' },
  { value: 'projects', label: 'Projects' },
  { value: 'education', label: 'Education' },
  { value: 'social', label: 'Social' },
  { value: 'interests', label: 'Interests' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyProject = () => ({ title: '', description: '', link: '', image: '', skills: [] });
const emptyEducation = () => ({ school: '', university: '', degree: '', field: '', startYear: '', endYear: '', isCurrent: false });

export default function ProfileEditForm({ open, onClose, user, onSaved }) {
  const [tab, setTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [langInput, setLangInput] = useState('');
  const [projectSkillInput, setProjectSkillInput] = useState('');

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name || '',
        introduction: user.introduction || '',
        bio: user.bio || '',
        college: user.college || '',
        qualification: user.qualification || '',
        department: user.department || '',
        year: user.year || '',
        graduationYear: user.graduationYear || '',
        location: user.location || '',
        timezone: user.timezone || '',
        teachingPhilosophy: user.teachingPhilosophy || '',
        learningGoals: user.learningGoals || '',
        preferredLearningStyle: user.preferredLearningStyle || '',
        languages: user.languages || [],
        availability: user.availability || '',
        availabilitySchedule: user.availabilitySchedule || {
          monday: false, tuesday: false, wednesday: false,
          thursday: false, friday: false, saturday: false, sunday: false,
        },
        morning: user.availabilitySchedule?.morning ?? false,
        afternoon: user.availabilitySchedule?.afternoon ?? false,
        evening: user.availabilitySchedule?.evening ?? false,
        projects: (user.projects || []).map((p) => ({ ...p })),
        educationHistory: (user.educationHistory || []).map((e) => ({ ...e })),
        github: user.github || '',
        linkedin: user.linkedin || '',
        portfolio: user.portfolio || '',
        socialLinks: { ...(user.socialLinks || {}) },
        interests: user.interests || [],
      });
      setTab('basic');
      setLangInput('');
      setProjectSkillInput('');
    }
  }, [open, user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setNested = (parent, key) => (e) =>
    setForm((f) => ({ ...f, [parent]: { ...f[parent], [key]: e.target.value } }));

  const toggleDay = (day) =>
    setForm((f) => ({
      ...f,
      availabilitySchedule: { ...f.availabilitySchedule, [day]: !f.availabilitySchedule[day] },
    }));

  const toggleTimeSlot = (slot) =>
    setForm((f) => ({ ...f, [slot]: !f[slot] }));

  const addLanguage = () => {
    const val = langInput.trim();
    if (val && !form.languages.includes(val)) {
      setForm((f) => ({ ...f, languages: [...f.languages, val] }));
      setLangInput('');
    }
  };

  const removeLanguage = (lang) =>
    setForm((f) => ({ ...f, languages: f.languages.filter((l) => l !== lang) }));

  const toggleInterest = (interest) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));

  const addProject = () =>
    setForm((f) => ({ ...f, projects: [...f.projects, emptyProject()] }));

  const updateProject = (idx, key, val) =>
    setForm((f) => {
      const next = [...f.projects];
      next[idx] = { ...next[idx], [key]: val };
      return { ...f, projects: next };
    });

  const removeProject = (idx) =>
    setForm((f) => ({ ...f, projects: f.projects.filter((_, i) => i !== idx) }));

  const addProjectSkill = (idx) => {
    const val = projectSkillInput.trim();
    if (!val) return;
    setForm((f) => {
      const next = [...f.projects];
      const skills = [...(next[idx].skills || []), val];
      next[idx] = { ...next[idx], skills };
      return { ...f, projects: next };
    });
    setProjectSkillInput('');
  };

  const removeProjectSkill = (idx, skillIdx) =>
    setForm((f) => {
      const next = [...f.projects];
      next[idx] = {
        ...next[idx],
        skills: next[idx].skills.filter((_, i) => i !== skillIdx),
      };
      return { ...f, projects: next };
    });

  const addEducation = () =>
    setForm((f) => ({ ...f, educationHistory: [...f.educationHistory, emptyEducation()] }));

  const updateEducation = (idx, key, val) =>
    setForm((f) => {
      const next = [...f.educationHistory];
      next[idx] = { ...next[idx], [key]: val };
      return { ...f, educationHistory: next };
    });

  const removeEducation = (idx) =>
    setForm((f) => ({ ...f, educationHistory: f.educationHistory.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        introduction: form.introduction,
        bio: form.bio,
        college: form.college,
        qualification: form.qualification,
        department: form.department,
        year: form.year,
        graduationYear: form.graduationYear,
        location: form.location,
        timezone: form.timezone,
        teachingPhilosophy: form.teachingPhilosophy,
        learningGoals: form.learningGoals,
        preferredLearningStyle: form.preferredLearningStyle,
        languages: form.languages,
        availability: form.availability,
        availabilitySchedule: {
          ...form.availabilitySchedule,
          morning: form.morning,
          afternoon: form.afternoon,
          evening: form.evening,
        },
        projects: form.projects,
        educationHistory: form.educationHistory,
        github: form.github,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
        socialLinks: form.socialLinks,
        interests: form.interests,
      };
      const res = await updateProfile(payload);
      toast.success('Profile updated');
      onSaved?.(res.user);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderBasic = () => (
    <div className="space-y-4">
      <Input label="Full Name" value={form.name || ''} onChange={set('name')} />
      <Input label="Introduction" value={form.introduction || ''} onChange={set('introduction')} placeholder="A short tagline about yourself" />
      <TextArea label="Bio" value={form.bio || ''} onChange={set('bio')} />
      <Input label="College / University" value={form.college || ''} onChange={set('college')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Qualification" value={form.qualification || ''} onChange={set('qualification')}>
          <option value="">Select...</option>
          {QUALIFICATION_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
        </Select>
        <Select label="Department" value={form.department || ''} onChange={set('department')}>
          <option value="">Select...</option>
          {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Year" value={form.year || ''} onChange={set('year')}>
          <option value="">Select...</option>
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y === 'Graduate' ? y : `Year ${y}`}</option>)}
        </Select>
        <Input label="Graduation Year" value={form.graduationYear || ''} onChange={set('graduationYear')} placeholder="e.g. 2026" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Location" value={form.location || ''} onChange={set('location')} placeholder="City, Country" />
        <Input label="Timezone" value={form.timezone || ''} onChange={set('timezone')} placeholder="e.g. UTC+5:30" />
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-4">
      <TextArea label="Teaching Philosophy" value={form.teachingPhilosophy || ''} onChange={set('teachingPhilosophy')} placeholder="How do you approach teaching?" />
      <TextArea label="Learning Goals" value={form.learningGoals || ''} onChange={set('learningGoals')} placeholder="What do you want to achieve?" />
      <Select label="Preferred Learning Style" value={form.preferredLearningStyle || ''} onChange={set('preferredLearningStyle')}>
        <option value="">Select...</option>
        {LEARNING_STYLE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
      </Select>

      <div>
        <label className="label">Languages</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.languages?.map((lang) => (
            <Tag key={lang} tone="purple">
              {lang}
              <button onClick={() => removeLanguage(lang)} className="ml-1 hover:text-red-400"><FiX className="inline h-3 w-3" /></button>
            </Tag>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            className="input flex-1"
          >
            <option value="">Add a language...</option>
            {LANGUAGE_OPTIONS.filter((l) => !form.languages.includes(l)).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={addLanguage} disabled={!langInput}>Add</Button>
        </div>
      </div>

      <Select label="Availability" value={form.availability || ''} onChange={set('availability')}>
        <option value="">Select...</option>
        {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </Select>

      <div>
        <label className="label">Weekly Schedule</label>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cx(
                'rounded-lg px-2 py-2 text-xs font-medium text-center transition border',
                form.availabilitySchedule?.[day]
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              )}
            >
              {DAY_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Time Preference</label>
        <div className="flex gap-2">
          {[
            { key: 'morning', label: 'Morning' },
            { key: 'afternoon', label: 'Afternoon' },
            { key: 'evening', label: 'Evening' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleTimeSlot(key)}
              className={cx(
                'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition border',
                form[key]
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Manage your teaching and learning skills from the Skills tab on your profile page. Use the skill picker to add or remove skills.
      </p>
      <div className="glass rounded-xl p-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Teaching Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {user.skills?.filter((s) => s.type === 'teaching' || s.canTeach).map((s) => (
            <Tag key={s._id || s.skillId} tone="green">{s.icon} {s.name}</Tag>
          ))}
          {(!user.skills || user.skills.filter((s) => s.type === 'teaching' || s.canTeach).length === 0) && (
            <span className="text-xs text-slate-400">No teaching skills yet.</span>
          )}
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Learning Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {user.skills?.filter((s) => s.type === 'learning' || s.isLearning).map((s) => (
            <Tag key={s._id || s.skillId} tone="amber">{s.icon} {s.name}</Tag>
          ))}
          {(!user.skills || user.skills.filter((s) => s.type === 'learning' || s.isLearning).length === 0) && (
            <span className="text-xs text-slate-400">No learning skills yet.</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-4">
      {form.projects?.map((project, idx) => (
        <div key={idx} className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Project {idx + 1}
            </span>
            <button onClick={() => removeProject(idx)} className="text-slate-400 hover:text-red-500 transition">
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
          <Input label="Title" value={project.title || ''} onChange={(e) => updateProject(idx, 'title', e.target.value)} />
          <TextArea label="Description" value={project.description || ''} onChange={(e) => updateProject(idx, 'description', e.target.value)} />
          <Input label="Link" value={project.link || ''} onChange={(e) => updateProject(idx, 'link', e.target.value)} placeholder="https://..." />
          <div>
            <label className="label">Skills</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {project.skills?.map((skill, si) => (
                <Tag key={si} tone="brand">
                  {skill}
                  <button onClick={() => removeProjectSkill(idx, si)} className="ml-1 hover:text-red-400"><FiX className="inline h-3 w-3" /></button>
                </Tag>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={projectSkillInput}
                onChange={(e) => setProjectSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProjectSkill(idx); } }}
                placeholder="Add skill..."
                className="input flex-1"
              />
              <Button variant="secondary" size="sm" onClick={() => addProjectSkill(idx)}>Add</Button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={addProject}><FiPlus className="h-4 w-4" /> Add Project</Button>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-4">
      {form.educationHistory?.map((entry, idx) => (
        <div key={idx} className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Education {idx + 1}
            </span>
            <button onClick={() => removeEducation(idx)} className="text-slate-400 hover:text-red-500 transition">
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
          <Input label="School" value={entry.school || ''} onChange={(e) => updateEducation(idx, 'school', e.target.value)} />
          <Input label="University" value={entry.university || ''} onChange={(e) => updateEducation(idx, 'university', e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Degree" value={entry.degree || ''} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} />
            <Input label="Field of Study" value={entry.field || ''} onChange={(e) => updateEducation(idx, 'field', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start Year" value={entry.startYear || ''} onChange={(e) => updateEducation(idx, 'startYear', e.target.value)} placeholder="e.g. 2022" />
            <Input
              label="End Year"
              value={entry.endYear || ''}
              onChange={(e) => updateEducation(idx, 'endYear', e.target.value)}
              placeholder="e.g. 2026"
              disabled={entry.isCurrent}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={entry.isCurrent || false}
              onChange={(e) => {
                updateEducation(idx, 'isCurrent', e.target.checked);
                if (e.target.checked) updateEducation(idx, 'endYear', '');
              }}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">Currently studying here</span>
          </label>
        </div>
      ))}
      <Button variant="ghost" onClick={addEducation}><FiPlus className="h-4 w-4" /> Add Education</Button>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Links</div>
      <Input label="GitHub" value={form.github || ''} onChange={set('github')} placeholder="https://github.com/..." />
      <Input label="LinkedIn" value={form.linkedin || ''} onChange={set('linkedin')} placeholder="https://linkedin.com/in/..." />
      <Input label="Portfolio" value={form.portfolio || ''} onChange={set('portfolio')} placeholder="https://..." />

      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">Competitive Programming & Other</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="LeetCode" value={form.socialLinks?.leetcode || ''} onChange={setNested('socialLinks', 'leetcode')} placeholder="https://leetcode.com/..." />
        <Input label="Codeforces" value={form.socialLinks?.codeforces || ''} onChange={setNested('socialLinks', 'codeforces')} placeholder="https://codeforces.com/..." />
        <Input label="HackerRank" value={form.socialLinks?.hackerrank || ''} onChange={setNested('socialLinks', 'hackerrank')} placeholder="https://hackerrank.com/..." />
        <Input label="Kaggle" value={form.socialLinks?.kaggle || ''} onChange={setNested('socialLinks', 'kaggle')} placeholder="https://kaggle.com/..." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Behance" value={form.socialLinks?.behance || ''} onChange={setNested('socialLinks', 'behance')} placeholder="https://behance.net/..." />
        <Input label="Dribbble" value={form.socialLinks?.dribbble || ''} onChange={setNested('socialLinks', 'dribbble')} placeholder="https://dribbble.com/..." />
        <Input label="YouTube" value={form.socialLinks?.youtube || ''} onChange={setNested('socialLinks', 'youtube')} placeholder="https://youtube.com/..." />
        <Input label="Website" value={form.socialLinks?.website || ''} onChange={setNested('socialLinks', 'website')} placeholder="https://..." />
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Select your areas of interest to help us match you with like-minded peers.
      </p>
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => {
          const selected = form.interests?.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={cx(
                'chip border transition-all',
                selected
                  ? 'border-brand-500 bg-brand-500/15 text-brand-700 dark:text-brand-300'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              {interest}
              {selected && <span className="text-brand-500 ml-1">&#10003;</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const tabContent = {
    basic: renderBasic,
    about: renderAbout,
    skills: renderSkills,
    projects: renderProjects,
    education: renderEducation,
    social: renderSocial,
    interests: renderInterests,
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="lg">
      <Tabs tabs={EDIT_TABS} active={tab} onChange={setTab} className="mb-6" />
      <div className="max-h-[55vh] overflow-y-auto pr-1">
        {tabContent[tab]?.()}
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200/60 pt-4 dark:border-white/10">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
    </Modal>
  );
}
