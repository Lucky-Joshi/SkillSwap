import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiMoon, FiSun } from 'react-icons/fi';

export default function AuthLayout({ title, subtitle, children }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-brand-50/40 to-accent/20 p-4 dark:from-slate-950 dark:via-brand-950/40 dark:to-slate-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <button
        onClick={toggle}
        className="absolute right-5 top-5 rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-500 backdrop-blur transition hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300"
      >
        {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent text-xl font-black text-white shadow-glow">
            ⇄
          </div>
          <span className="font-display text-2xl font-extrabold">
            Skill<span className="gradient-text">Swap</span>
          </span>
        </Link>

        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
