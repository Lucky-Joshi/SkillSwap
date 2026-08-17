import { FiMap } from 'react-icons/fi';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function RoadmapProgress({ user = {} }) {
  const skills = user.learnedSkills || user.skills || [];

  const progressSkills = skills
    .filter((s) => s.progress !== undefined || s.level)
    .map((s) => ({
      name: s.name || s.skillName,
      progress: s.progress ?? Math.min(100, ((s.level || 1) / 5) * 100),
    }));

  if (progressSkills.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="🗺️"
          title="No Roadmap Yet"
          description="Start learning skills to track your progress."
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiMap className="text-brand-500" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Learning Roadmap
        </h2>
      </div>

      <div className="space-y-3">
        {progressSkills.map((skill, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {skill.name}
              </span>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {Math.round(skill.progress)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent transition-all duration-700"
                style={{ width: `${Math.min(100, skill.progress)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
