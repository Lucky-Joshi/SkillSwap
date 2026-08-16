import { motion } from 'framer-motion';
import { FiCheck, FiClock, FiCalendar, FiBookOpen } from 'react-icons/fi';

export default function RoadmapView({ roadmap, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!roadmap?.steps?.length) {
    return <p className="py-8 text-center text-sm text-slate-400">Enter a goal above to generate a learning roadmap.</p>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Roadmap</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">for "{roadmap.goal}"</p>
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <span className="chip border border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300">
            <FiClock className="mr-1" /> {roadmap.totalEstimatedHours ?? roadmap.total_estimated_hours ?? '—'} hrs
          </span>
          {roadmap.estimatedWeeks && (
            <span className="chip border border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300">
              <FiCalendar className="mr-1" /> ~{roadmap.estimatedWeeks} weeks
            </span>
          )}
        </div>
      </div>

      <ol className="relative space-y-4 pl-1">
        {roadmap.steps.map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="relative flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-sm font-bold text-white shadow-md">
                {i + 1}
              </div>
              {i < roadmap.steps.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-brand-400/50 to-transparent" />}
            </div>
            <div className="glass mb-1 flex-1 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                </div>
                {step.skills?.length > 0 && (
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {step.skills.map((s) => (
                      <span key={s} className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <FiCheck className="mr-0.5" />{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" /> {step.weeks || '—'} weeks</span>
                <span className="flex items-center gap-1"><FiClock className="h-3 w-3" /> {step.hours || '—'} hrs</span>
                <span className="flex items-center gap-1"><FiBookOpen className="h-3 w-3" /> {step.skills?.length || 0} skills</span>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
