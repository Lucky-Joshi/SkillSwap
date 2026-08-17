import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';
import Spinner from '../components/ui/Spinner';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
  return children;
}
