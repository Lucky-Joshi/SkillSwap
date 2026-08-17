import { motion } from 'framer-motion';

export default function FeatureCard({ icon: Icon, title, description, badge, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay }}
      className="glass card-hover rounded-2xl p-6"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-xl text-white shadow-lg">
        <Icon />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {badge && (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
          {badge}
        </span>
      )}
    </motion.div>
  );
}
