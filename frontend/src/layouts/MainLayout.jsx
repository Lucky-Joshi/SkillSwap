import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  FiGrid, FiSearch, FiZap, FiMessageSquare, FiCalendar, FiClock, FiUsers,
  FiAward, FiFileText, FiBell, FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiMoon, FiSun, FiShield,
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_MAIN = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/discover', label: 'Discover', icon: FiSearch },
  { to: '/recommendations', label: 'Recommendations', icon: FiZap },
  { to: '/chat', label: 'Chat', icon: FiMessageSquare },
  { to: '/sessions', label: 'Sessions', icon: FiClock },
  { to: '/calendar', label: 'Calendar', icon: FiCalendar },
  { to: '/connections', label: 'Connections', icon: FiUsers },
  { to: '/roadmap', label: 'AI Roadmap', icon: FiFileText },
  { to: '/leaderboard', label: 'Leaderboard', icon: FiAward },
];

const NAV_BOTTOM = [
  { to: '/dashboard', label: 'Home', icon: FiGrid },
  { to: '/discover', label: 'Discover', icon: FiSearch },
  { to: '/recommendations', label: 'Matches', icon: FiZap },
  { to: '/chat', label: 'Chat', icon: FiMessageSquare },
  { to: '/profile', label: 'Me', icon: FiUser },
];

function Brand({ compact }) {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent text-lg font-black text-white shadow-glow">
        ⇄
      </div>
      {!compact && (
        <span className="font-display text-lg font-extrabold">
          Skill<span className="gradient-text">Swap</span>
        </span>
      )}
    </NavLink>
  );
}

function SideNav() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavItem = ({ to, label, icon: Icon, onClick }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-gradient-to-r from-brand-600/15 to-brand-500/5 text-brand-700 dark:text-brand-300'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/60 bg-white/80 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_MAIN.map((item) => <NavItem key={item.to} {...item} />)}
          <div className="my-3 border-t border-slate-200/60 dark:border-white/10" />
          <NavItem to="/notifications" label="Notifications" icon={FiBell} />
          <NavItem to="/certificates" label="Certificates" icon={FiFileText} />
          <NavItem to="/profile" label="Profile" icon={FiUser} />
          <NavItem to="/settings" label="Settings" icon={FiSettings} />
          {user?.role === 'admin' && <NavItem to="/admin" label="Admin tools" icon={FiShield} />}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70"
          >
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="glass flex items-center gap-3 rounded-2xl p-3">
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-slate-400">{user?.department || user?.college || 'Student'}</div>
            </div>
            <button onClick={handleLogout} title="Log out" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500">
              <FiLogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <FiMenu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile drawer */}
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
                {[...NAV_MAIN, { to: '/notifications', label: 'Notifications', icon: FiBell }]
                  .map((item) => <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />)}
              </nav>
              <div className="mt-6 border-t border-slate-200/60 pt-4 dark:border-white/10">
                <NavItem to="/profile" label="Profile" icon={FiUser} onClick={() => setOpen(false)} />
                <NavItem to="/settings" label="Settings" icon={FiSettings} onClick={() => setOpen(false)} />
                {user?.role === 'admin' && <NavItem to="/admin" label="Admin tools" icon={FiShield} onClick={() => setOpen(false)} />}
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500/10"
                >
                  <FiLogOut className="h-5 w-5" /> Log out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-slate-200/60 bg-white/90 px-2 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 lg:hidden">
        {NAV_BOTTOM.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition ${
                isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-brand-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/30">
      <SideNav />
      <main className="px-4 pb-24 pt-4 sm:px-6 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-6xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
