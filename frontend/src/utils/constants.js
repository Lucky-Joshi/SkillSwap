export const API_BASE = import.meta.env.VITE_API_URL || '';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const SKILL_CATEGORIES = [
  { value: 'programming', label: 'Programming' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'ai-ml', label: 'AI / ML' },
  { value: 'cloud-devops', label: 'Cloud & DevOps' },
  { value: 'design', label: 'Design' },
  { value: 'soft-skills', label: 'Soft Skills' },
  { value: 'languages', label: 'Languages' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

export const YEAR_OPTIONS = ['1', '2', '3', '4', '5', 'Graduate'];

export const QUALIFICATION_OPTIONS = [
  '10th Grade', '12th Grade', 'Diploma', 'B.Tech', 'B.E', 'B.Sc', 'BCA', 'MCA',
  'M.Tech', 'M.Sc', 'BBA', 'MBA', 'BA', 'MA', 'Ph.D', 'Other',
];

export const DEPARTMENT_OPTIONS = [
  'Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical',
  'Civil', 'Chemical', 'Aerospace', 'Biotechnology', 'Data Science', 'AI & ML', 'Mathematics',
  'Physics', 'Chemistry', 'Design', 'Business', 'Management', 'Commerce', 'Economics',
  'Law', 'Humanities', 'Communications', 'Psychology', 'Other',
];

export const TRUST_BREAKDOWN = [
  { label: 'Verified email', points: 30 },
  { label: 'Complete academic details', points: 10 },
  { label: 'Bio', points: 10 },
  { label: 'Avatar', points: 5 },
  { label: 'Linked profiles', points: 5 },
  { label: 'Skills (3 pts each, max 15)', points: 15 },
  { label: 'Received a review', points: 10 },
  { label: 'Completed a session', points: 10 },
  { label: 'Accepted match', points: 5 },
  { label: 'Earned a badge', points: 5 },
];

export const trustLabel = (score) => {
  if (score >= 80) return { label: 'Highly trusted', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 50) return { label: 'Trusted', color: 'text-brand-600 dark:text-brand-400' };
  if (score >= 25) return { label: 'Getting started', color: 'text-accent' };
  return { label: 'New profile', color: 'text-slate-500 dark:text-slate-400' };
};

export const AVAILABILITY_OPTIONS = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'mornings', label: 'Mornings' },
];

export const SCORE_LABELS = [
  { min: 85, label: 'Excellent Match', color: 'text-emerald-600 dark:text-emerald-400' },
  { min: 70, label: 'Strong Match', color: 'text-brand-600 dark:text-brand-400' },
  { min: 50, label: 'Good Match', color: 'text-accent' },
  { min: 0, label: 'Fair Match', color: 'text-slate-500 dark:text-slate-400' },
];

export const scoreLabel = (score) =>
  SCORE_LABELS.find((s) => score >= s.min)?.label || 'Fair Match';

export const SCORE_COLORS = ['#f87171', '#fbbf24', '#34d399', '#818cf8', '#a78bfa'];
