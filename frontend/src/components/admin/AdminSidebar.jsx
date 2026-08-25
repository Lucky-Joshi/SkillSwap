import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiMapPin, FiLayers, FiClock, FiAward, FiFileText,
  FiAlertTriangle, FiActivity, FiHeart, FiBarChart2, FiSettings, FiLogOut,
  FiMoon, FiSun, FiShield, FiList,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROUTES } from '../../utils/routes';
import Avatar from '../ui/Avatar';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/institutions', label: 'Institutions', icon: FiMapPin },
  { to: '/admin/skills', label: 'Skills', icon: FiLayers },
  { to: '/admin/sessions', label: 'Sessions', icon: FiClock },
  { to: '/admin/badges', label: 'Badges', icon: FiAward },
  { to: '/admin/certificates', label: 'Certificates', icon: FiFileText },
  { to: '/admin/reports', label: 'Reports', icon: FiAlertTriangle },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FiList },
  { to: '/admin/ai', label: 'AI Monitor', icon: FiActivity },
  { to: '/admin/health', label: 'System Health', icon: FiHeart },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
];

function Brand() {
  return (
    <NavLink to="/admin" className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 text-lg font-black text-white shadow-lg">
        <FiShield className="h-5 w-5" />
      </div>
      <span className="font-display text-lg font-extrabold">
        Admin<span className="text-purple-600 dark:text-purple-400">Panel</span>
      </span>
    </NavLink>
  );
}

function NavItem({ to, label, icon: Icon, onClick, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-gradient-to-r from-purple-600/15 to-purple-500/5 text-purple-700 dark:text-purple-300'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function AdminSidebar() {
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
      <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <div className="my-3 border-t border-slate-200/60 dark:border-white/10" />
        <NavItem to="/app/dashboard" label="Student View" icon={FiGrid} />
        <NavItem to="/admin/settings" label="Settings" icon={FiSettings} />
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
            <div className="truncate text-xs text-purple-500 dark:text-purple-400">Administrator</div>
          </div>
          <button onClick={handleLogout} title="Log out" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500">
            <FiLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
