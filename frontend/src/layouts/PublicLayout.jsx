import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/public/PublicNavbar';
import PublicFooter from '../components/public/PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-50/50 text-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/40 dark:text-slate-100">
      <PublicNavbar />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
