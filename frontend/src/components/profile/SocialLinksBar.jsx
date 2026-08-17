import {
  FiGithub, FiLinkedin, FiGlobe, FiCodepen, FiYoutube,
} from 'react-icons/fi';
import { SiLeetcode, SiCodeforces, SiHackerrank, SiKaggle } from 'react-icons/si';
import Card from '../ui/Card';

const LINKS = [
  { key: 'github', icon: <FiGithub />, label: 'GitHub' },
  { key: 'linkedin', icon: <FiLinkedin />, label: 'LinkedIn' },
  { key: 'portfolioUrl', icon: <FiGlobe />, label: 'Portfolio' },
  { key: 'leetcode', icon: <SiLeetcode />, label: 'LeetCode' },
  { key: 'codeforces', icon: <SiCodeforces />, label: 'Codeforces' },
  { key: 'hackerrank', icon: <SiHackerrank />, label: 'HackerRank' },
  { key: 'kaggle', icon: <SiKaggle />, label: 'Kaggle' },
  { key: 'youtube', icon: <FiYoutube />, label: 'YouTube' },
  { key: 'website', icon: <FiGlobe />, label: 'Website' },
];

export default function SocialLinksBar({ user = {} }) {
  const links = LINKS.filter((l) => user[l.key]);

  if (links.length === 0) return null;

  return (
    <Card className="!p-4">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <a
            key={link.key}
            href={user[link.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-500 hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-brand-500"
          >
            {link.icon}
            <span className="hidden sm:inline">{link.label}</span>
          </a>
        ))}
      </div>
    </Card>
  );
}
