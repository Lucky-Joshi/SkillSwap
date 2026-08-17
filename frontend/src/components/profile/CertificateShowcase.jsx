import { FiAward, FiClock, FiUser } from 'react-icons/fi';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { formatDate } from '../../utils/helpers';

export default function CertificateShowcase({ certificates = [] }) {
  if (certificates.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="📜"
          title="No Certificates Yet"
          description="Complete learning sessions to earn certificates."
        />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white mb-4">
        Certificates
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {certificates.map((cert, i) => (
          <div
            key={cert._id || i}
            className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition hover:shadow-md"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-500 to-accent" />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <FiAward className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {cert.topic || cert.sessionTopic}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <FiUser className="h-3 w-3" />
                    {cert.role === 'mentor' ? 'Mentor' : 'Learner'}
                  </span>
                  {cert.hours > 0 && (
                    <span className="flex items-center gap-1">
                      <FiClock className="h-3 w-3" />
                      {cert.hours}h
                    </span>
                  )}
                </div>
                {cert.completedAt && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatDate(cert.completedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
