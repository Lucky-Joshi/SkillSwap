import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  FiGrid, FiSearch, FiZap, FiMessageSquare, FiCalendar, FiClock, FiUsers,
  FiAward, FiFileText, FiBell, FiUser, FiSettings, FiLogOut, FiMoon, FiSun, FiShield,
} from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROUTES } from '../../utils/routes';

const NAV_MAIN = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: FiGrid },
  { to: ROUTES.DISCOVER, label: 'Discover', icon: FiSearch },
  { to: ROUTES.RECOMMENDATIONS, label: 'Recommendations', icon: FiZap },
  { to: ROUTES.CHAT, label: 'Chat', icon: FiMessageSquare },
  { to: ROUTES.SESSIONS, label: 'Sessions', icon: FiClock },
  { to: ROUTES.CALENDAR, label: 'Calendar', icon: FiCalendar },
  { to: ROUTES.CONNECTIONS, label: 'Connections', icon: FiUsers },
  { to: ROUTES.ROADMAP, label: 'AI Roadmap', icon: FiFileText },
  { to: ROUTES.LEADERBOARD, label: 'Leaderboard', icon: FiAward },
];

function Brand({ compact }) {
  return (
    <NavLink to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 px-2">
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

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
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
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/60 bg-white/80 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:flex">
      <Brand />
      <nav className="mt-8 flex flex-col gap-1">
        {NAV_MAIN.map((item) => <NavItem key={item.to} {...item} />)}
        <div className="my-3 border-t border-slate-200/60 dark:border-white/10" />
        <NavItem to={ROUTES.NOTIFICATIONS} label="Notifications" icon={FiBell} />
        <NavItem to={ROUTES.CERTIFICATES} label="Certificates" icon={FiFileText} />
        <NavItem to={ROUTES.PROFILE} label="Profile" icon={FiUser} />
        <NavItem to={ROUTES.SETTINGS} label="Settings" icon={FiSettings} />
        {user?.role === 'admin' && <NavItem to={ROUTES.ADMIN} label="Admin tools" icon={FiShield} />}
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
  );
}
