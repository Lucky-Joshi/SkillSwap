import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';
import { ROUTES } from '../../utils/routes';

const PRODUCT = [
  { to: ROUTES.FEATURES, label: 'Features' },
  { to: ROUTES.AI, label: 'AI Technology' },
  { to: ROUTES.HOW_IT_WORKS, label: 'How It Works' },
  { to: ROUTES.FAQ, label: 'FAQ' },
];

const COMMUNITY = [
  { to: ROUTES.ABOUT, label: 'About Us' },
  { to: ROUTES.CONTACT, label: 'Contact' },
  { to: '#', label: 'GitHub' },
];

const LEGAL = [
  { to: '#', label: 'Privacy Policy' },
  { to: '#', label: 'Terms of Service' },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 dark:border-white/10 dark:bg-slate-950/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent text-lg font-black text-white shadow-glow">
                ⇄
              </div>
              <span className="font-display text-lg font-extrabold">
                Skill<span className="gradient-text">Swap</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              AI-powered peer learning platform for college students. Learn from your
              peers, teach what you know.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:text-brand-600 dark:border-white/10 dark:hover:text-brand-300">
                <FiGithub className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:text-brand-600 dark:border-white/10 dark:hover:text-brand-300">
                <FiTwitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:text-brand-600 dark:border-white/10 dark:hover:text-brand-300">
                <FiLinkedin className="h-5 w-5" />
              </a>
              <a href="mailto:hello@skillswap.dev" className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:text-brand-600 dark:border-white/10 dark:hover:text-brand-300">
                <FiMail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Product</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Community</h3>
            <ul className="mt-4 space-y-3">
              {COMMUNITY.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Legal</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/60 pt-8 dark:border-white/10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
            </p>
            <p className="text-xs text-slate-400">
              AI-Powered Peer Learning Platform
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
