import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import Card from '../ui/Card';
import ScoreRing from '../ui/ScoreRing';
import Button from '../ui/Button';
import { cx } from '../../utils/helpers';

function getMissingFields(user = {}) {
  const fields = [];
  if (!user.bio) fields.push({ label: 'Bio', key: 'bio' });
  if (!user.avatar) fields.push({ label: 'Profile Photo', key: 'avatar' });
  if (!user.institution) fields.push({ label: 'Institution', key: 'institution' });
  if (!user.department) fields.push({ label: 'Department', key: 'department' });
  if (!user.qualification) fields.push({ label: 'Qualification', key: 'qualification' });
  if (!user.github && !user.linkedin && !user.portfolioUrl) fields.push({ label: 'Social Links', key: 'links' });
  if (!user.availability) fields.push({ label: 'Availability', key: 'availability' });
  if (!user.interests?.length) fields.push({ label: 'Interests', key: 'interests' });
  if (!user.languages?.length) fields.push({ label: 'Languages', key: 'languages' });
  if (!user.teachingPhilosophy) fields.push({ label: 'Teaching Philosophy', key: 'philosophy' });
  if (!user.learningGoals) fields.push({ label: 'Learning Goals', key: 'goals' });
  if (!user.portfolioUrl && !user.projects?.length) fields.push({ label: 'Portfolio', key: 'portfolio' });
  return fields;
}

function getCompletionScore(user = {}) {
  const total = 12;
  let filled = 0;
  if (user.bio) filled++;
  if (user.avatar) filled++;
  if (user.institution) filled++;
  if (user.department) filled++;
  if (user.qualification) filled++;
  if (user.github || user.linkedin || user.portfolioUrl) filled++;
  if (user.availability) filled++;
  if (user.interests?.length) filled++;
  if (user.languages?.length) filled++;
  if (user.teachingPhilosophy) filled++;
  if (user.learningGoals) filled++;
  if (user.portfolioUrl || user.projects?.length) filled++;
  return Math.round((filled / total) * 100);
}

export default function ProfileCompletion({ user = {} }) {
  const completion = getCompletionScore(user);
  const missing = getMissingFields(user);

  if (completion >= 100) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiAlertCircle className="text-accent" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Complete Your Profile
        </h2>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <ScoreRing score={completion} size={80} />
        <div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {missing.length} field{missing.length !== 1 ? 's' : ''} remaining
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Complete your profile to build trust.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {missing.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
          >
            <span className="text-sm text-slate-600 dark:text-slate-300">{field.label}</span>
            <Button variant="ghost" size="sm">
              <FiCheck className="h-3 w-3" /> Complete
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
