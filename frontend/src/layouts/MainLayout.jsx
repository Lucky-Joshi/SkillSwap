import { motion } from 'framer-motion';
import Sidebar from '../components/app/Sidebar';
import TopNavbar from '../components/app/TopNavbar';
import MobileNav from '../components/app/MobileNav';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-brand-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950/30">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <TopNavbar />
      <main id="main-content" role="main" className="px-4 pb-24 pt-4 sm:px-6 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-6xl"
        >
          {children}
        </motion.div>
      </main>
      <MobileNav />
    </div>
  );
}
