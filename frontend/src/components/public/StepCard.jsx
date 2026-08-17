import { motion } from 'framer-motion';

export default function StepCard({ number, title, description, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="relative rounded-2xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur dark:border-white/10 dark:bg-slate-900/50"
    >
      <div className="gradient-text font-display text-4xl font-extrabold">{number}</div>
      {Icon && (
        <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </motion.div>
  );
}
