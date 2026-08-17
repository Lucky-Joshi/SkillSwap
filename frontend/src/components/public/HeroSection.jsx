import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function HeroSection({
  badge,
  badgeIcon: BadgeIcon,
  title,
  titleHighlight,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  children,
}) {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-24 text-center sm:px-6">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl"
      >
        {badge && (
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
            {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
            {badge}
          </div>
        )}

        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-6xl">
          {title}{' '}
          {titleHighlight && <span className="gradient-text">{titleHighlight}</span>}
        </h1>

        {description && (
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            {description}
          </p>
        )}

        {(primaryLabel || secondaryLabel) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primaryLabel && (
              <Link to={primaryTo} className="btn-primary px-8 py-3.5 text-base">
                {primaryLabel} <FiArrowRight className="h-5 w-5" />
              </Link>
            )}
            {secondaryLabel && (
              <Link to={secondaryTo} className="btn-secondary px-8 py-3.5 text-base">
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}

        {children}
      </motion.div>
    </section>
  );
}
