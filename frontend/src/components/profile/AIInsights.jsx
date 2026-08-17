import { FiZap, FiBookOpen, FiTarget, FiStar } from 'react-icons/fi';
import Card from '../ui/Card';
import ScoreRing from '../ui/ScoreRing';

function computeTeachingScore(stats = {}) {
  const sessions = (stats.sessionsAsMentor || 0);
  const rating = (stats.rating || 0);
  if (sessions === 0) return 0;
  return Math.min(100, Math.round((sessions * 10) + (rating * 12)));
}

function computeLearningSpeed(stats = {}) {
  const streak = stats.learningStreak || 0;
  const hours = stats.hoursLearned || 0;
  if (hours === 0) return 0;
  return Math.min(100, Math.round((streak * 5) + (hours * 2)));
}

export default function AIInsights({ user = {}, stats = {} }) {
  const completion = Math.round(
    ((user.bio ? 10 : 0) +
      (user.avatar ? 5 : 0) +
      (user.skills?.length > 0 ? 20 : 0) +
      (user.institution ? 10 : 0) +
      (user.department ? 10 : 0) +
      (user.github || user.linkedin ? 10 : 0) +
      (user.availability ? 5 : 0) +
      (user.interests?.length > 0 ? 10 : 0) +
      (user.languages?.length > 0 ? 5 : 0) +
      (user.portfolioUrl ? 5 : 0) +
      (user.teachingPhilosophy ? 5 : 0) +
      (user.learningGoals ? 5 : 0)) / 100 * 100
  );

  const teachingScore = computeTeachingScore(stats);
  const learningSpeed = computeLearningSpeed(stats);
  const bestSubject = user.skills?.find((s) => s.type === 'teaching' || s.canTeach)?.name || '—';
  const nextSkill = user.skills?.find((s) => s.type === 'learning' || s.isLearning)?.name || '—';

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiZap className="text-accent" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          AI Insights
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <ScoreRing score={completion} size={80} />
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Profile Complete
          </div>
        </div>

        <div className="space-y-3">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <FiStar className="h-3 w-3" /> Teaching Score
            </div>
            <div className="font-display text-xl font-extrabold text-slate-700 dark:text-white">
              {teachingScore}
            </div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <FiZap className="h-3 w-3" /> Learning Speed
            </div>
            <div className="font-display text-xl font-extrabold text-slate-700 dark:text-white">
              {learningSpeed}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <FiBookOpen className="h-3 w-3" /> Best Subject
          </div>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{bestSubject}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <FiTarget className="h-3 w-3" /> Suggested Next
          </div>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{nextSkill}</div>
        </div>
      </div>
    </Card>
  );
}
