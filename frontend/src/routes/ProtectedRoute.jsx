import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';
import Spinner from '../components/ui/Spinner';

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
  if (user?.isSuspended) return <Navigate to="/" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to={ROUTES.DASHBOARD} replace />;
  return children;
}
