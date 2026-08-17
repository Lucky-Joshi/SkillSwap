import { FiEdit2, FiBook } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/helpers';

export default function EducationTimeline({ educationHistory = [], user = {}, isMe = false }) {
  const entries = educationHistory.length > 0
    ? educationHistory
    : user.institution
      ? [{
          school: user.institution,
          degree: user.qualification,
          field: user.department,
          startYear: user.year ? `Year ${user.year}` : undefined,
        }]
      : [];

  if (entries.length === 0) {
    return isMe ? (
      <Card>
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white mb-2">
          Education
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Add your education history.
        </p>
      </Card>
    ) : null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Education
        </h2>
        {isMe && (
          <Button variant="ghost" size="sm"><FiEdit2 /> Edit</Button>
        )}
      </div>

      <div className="relative space-y-4">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

        {entries.map((entry, i) => (
          <div key={i} className="relative flex items-start gap-3 pl-9">
            <div className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-500">
              <FiBook className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {entry.degree || entry.school}
              </div>
              {entry.field && (
                <div className="text-xs text-slate-500 dark:text-slate-400">{entry.field}</div>
              )}
              {entry.school && entry.degree && (
                <div className="text-xs text-slate-400 dark:text-slate-500">{entry.school}</div>
              )}
              {(entry.startYear || entry.endYear || entry.years) && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {entry.years || `${entry.startYear} – ${entry.endYear || 'Present'}`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
