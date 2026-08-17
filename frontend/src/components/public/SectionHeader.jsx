import { motion } from 'framer-motion';

export default function SectionHeader({ badge, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12 text-center"
    >
      {badge && (
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
          {badge}
        </div>
      )}
      <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {description && (
        <p className="mx-auto mt-3 max-w-lg text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </motion.div>
  );
}
