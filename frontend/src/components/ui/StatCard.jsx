import { motion } from 'framer-motion';

export default function StatCard({ icon, label, value, sub, accent = 'from-brand-500 to-brand-600' }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass flex items-center gap-4 rounded-2xl p-5"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xl text-white shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-display text-2xl font-extrabold leading-none">{value}</div>
        <div className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</div>}
      </div>
    </motion.div>
  );
}
