import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';
import Spinner from '../components/ui/Spinner';

export default function PublicOnlyRoute({ children }) {
  const { token, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (token) {
    if (user?.role === 'admin' || user?.role === 'super-admin') return <Navigate to="/admin" replace />;
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return children;
}
