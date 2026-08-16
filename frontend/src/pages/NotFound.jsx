import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useDocumentTitle } from '../hooks';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <AuthLayout title="404" subtitle="This page took a skill gap analysis and found nothing.">
      <div className="space-y-4 text-center">
        <div className="text-6xl">🕳️</div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or was moved.
        </p>
        <div className="flex gap-3">
          <Link to="/" className="btn-secondary flex-1">Home</Link>
          <Link to="/dashboard" className="btn-primary flex-1">Dashboard</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
