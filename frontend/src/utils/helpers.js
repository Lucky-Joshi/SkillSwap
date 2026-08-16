export const cx = (...classes) => classes.filter(Boolean).join(' ');

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const avatarUrl = (avatar, name) =>
  avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials(name))}&background=6366f1&color=fff&bold=true`;

export const levelLabel = (level = 1) =>
  ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][level] || 'Intermediate';

export const paginationWindow = (current, total) => {
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
};
