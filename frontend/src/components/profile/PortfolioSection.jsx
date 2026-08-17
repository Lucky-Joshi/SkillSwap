import { FiExternalLink, FiPlus, FiImage } from 'react-icons/fi';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

export default function PortfolioSection({ projects = [], isMe = false }) {
  if (projects.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
            Portfolio
          </h2>
          {isMe && <Button variant="ghost" size="sm"><FiPlus /> Add Project</Button>}
        </div>
        <EmptyState
          icon="📁"
          title="No Projects Yet"
          description={isMe ? 'Showcase your work by adding projects.' : 'No projects to display.'}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Portfolio
        </h2>
        {isMe && <Button variant="ghost" size="sm"><FiPlus /> Add Project</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project, i) => (
          <div
            key={project._id || i}
            className="glass rounded-xl overflow-hidden transition hover:shadow-md"
          >
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-brand-500/10 to-accent/10">
                <FiImage className="h-8 w-8 text-brand-300 dark:text-brand-600" />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {project.title}
                </h3>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-brand-500 transition"
                  >
                    <FiExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {project.description && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {project.description}
                </p>
              )}
              {project.skills?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {project.skills.map((skill, j) => (
                    <Tag key={j} tone="brand">{skill}</Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
