import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function CTASection({
  title,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}) {
  return (
    <section className="px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-accent p-10 text-center text-white sm:p-16"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
        {description && (
          <p className="mx-auto mt-3 max-w-md text-brand-100">{description}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {primaryLabel && (
            <Link
              to={primaryTo}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-brand-700 shadow-lg transition hover:bg-brand-50"
            >
              {primaryLabel} <FiArrowRight className="h-5 w-5" />
            </Link>
          )}
          {secondaryLabel && (
            <Link
              to={secondaryTo}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </motion.div>
    </section>
  );
}
