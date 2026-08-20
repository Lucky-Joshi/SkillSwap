import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, FiX, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../utils/routes';

const MOBILE_NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/institutions', label: 'Institutions' },
  { to: '/admin/skills', label: 'Skills' },
  { to: '/admin/sessions', label: 'Sessions' },
  { to: '/admin/badges', label: 'Badges' },
  { to: '/admin/certificates', label: 'Certificates' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/ai', label: 'AI Monitor' },
  { to: '/admin/health', label: 'System Health' },
  { to: '/admin/analytics', label: 'Analytics' },
];

function Brand() {
  return (
    <NavLink to="/admin" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 text-lg font-black text-white shadow-lg">
        <FiShield className="h-5 w-5" />
      </div>
      <span className="font-display text-lg font-extrabold">
        Admin<span className="text-purple-600 dark:text-purple-400">Panel</span>
      </span>
    </NavLink>
  );
}

export default function AdminTopbar() {
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
              <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
                {MOBILE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600/15 to-purple-500/5 text-purple-700 dark:text-purple-300'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-white/10">
                <NavLink
                  to="/app/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Student View
                </NavLink>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
