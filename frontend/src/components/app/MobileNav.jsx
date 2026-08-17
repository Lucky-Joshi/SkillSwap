import { NavLink } from 'react-router-dom';
import { FiGrid, FiSearch, FiZap, FiMessageSquare, FiUser } from 'react-icons/fi';
import { ROUTES } from '../../utils/routes';

const NAV_BOTTOM = [
  { to: ROUTES.DASHBOARD, label: 'Home', icon: FiGrid },
  { to: ROUTES.DISCOVER, label: 'Discover', icon: FiSearch },
  { to: ROUTES.RECOMMENDATIONS, label: 'Matches', icon: FiZap },
  { to: ROUTES.CHAT, label: 'Chat', icon: FiMessageSquare },
  { to: ROUTES.PROFILE, label: 'Me', icon: FiUser },
];

export default function MobileNav() {
  return (
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
  );
}
