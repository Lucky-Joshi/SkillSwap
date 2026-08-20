import { useState } from 'react';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/routes';

const NAV_LINKS = [
  { to: ROUTES.FEATURES, label: 'Features' },
  { to: ROUTES.HOW_IT_WORKS, label: 'How It Works' },
  { to: ROUTES.AI, label: 'AI' },
  { to: ROUTES.ABOUT, label: 'About' },
  { to: ROUTES.FAQ, label: 'FAQ' },
  { to: ROUTES.CONTACT, label: 'Contact' },
];

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300'}`;

export default function PublicNavbar() {
  const { theme, toggle } = useTheme();
  const { token, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = user?.role === 'admin' ? '/admin' : ROUTES.DASHBOARD;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent text-lg font-black text-white shadow-glow">
            ⇄
          </div>
          <span className="font-display text-lg font-extrabold">
            Skill<span className="gradient-text">Swap</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          {token ? (
            <Link to={dashboardPath} className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="btn-ghost hidden sm:inline-flex">
                Log in
              </Link>
              <Link to={ROUTES.REGISTER} className="btn-primary">
                Get started
              </Link>
            </>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <FiMenu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-4 dark:bg-slate-900 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent text-lg font-black text-white shadow-glow">
                    ⇄
                  </div>
                  <span className="font-display text-lg font-extrabold">
                    Skill<span className="gradient-text">Swap</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600/15 to-brand-500/5 text-brand-700 dark:text-brand-300'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto space-y-3">
                {token ? (
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to={ROUTES.LOGIN}
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary w-full"
                    >
                      Log in
                    </Link>
                    <Link
                      to={ROUTES.REGISTER}
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
