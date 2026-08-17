import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { ROUTES } from '../../utils/routes';

function Brand() {
  return (
    <NavLink to={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent text-lg font-black text-white shadow-glow">
        ⇄
      </div>
      <span className="font-display text-lg font-extrabold">
        Skill<span className="gradient-text">Swap</span>
      </span>
    </NavLink>
  );
}

export default function TopNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <FiMenu className="h-6 w-6" />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-4 dark:bg-slate-900 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-6 flex flex-col gap-1">
                {[
                  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
                  { to: ROUTES.DISCOVER, label: 'Discover' },
                  { to: ROUTES.RECOMMENDATIONS, label: 'Recommendations' },
                  { to: ROUTES.CHAT, label: 'Chat' },
                  { to: ROUTES.SESSIONS, label: 'Sessions' },
                  { to: ROUTES.CALENDAR, label: 'Calendar' },
                  { to: ROUTES.CONNECTIONS, label: 'Connections' },
                  { to: ROUTES.ROADMAP, label: 'AI Roadmap' },
                  { to: ROUTES.LEADERBOARD, label: 'Leaderboard' },
                  { to: ROUTES.NOTIFICATIONS, label: 'Notifications' },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600/15 to-brand-500/5 text-brand-700 dark:text-brand-300'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-6 border-t border-slate-200/60 pt-4 dark:border-white/10">
                <NavLink to={ROUTES.PROFILE} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gradient-to-r from-brand-600/15 to-brand-500/5 text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70'}`}>
                  Profile
                </NavLink>
                <NavLink to={ROUTES.SETTINGS} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gradient-to-r from-brand-600/15 to-brand-500/5 text-brand-700 dark:text-brand-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70'}`}>
                  Settings
                </NavLink>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
