import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';
import Spinner from '../components/ui/Spinner';

const BLOCKED_STATUSES = ['suspended', 'deleted', 'banned'];

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (BLOCKED_STATUSES.includes(user.status)) return <Navigate to={ROUTES.LOGIN} replace />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'super-admin') return <Navigate to={ROUTES.DASHBOARD} replace />;
  return children;
}
