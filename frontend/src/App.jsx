import { lazy, Suspense, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layouts/MainLayout';
import Spinner from './components/ui/Spinner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Discover = lazy(() => import('./pages/Discover'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Profile = lazy(() => import('./pages/Profile'));
const Chat = lazy(() => import('./pages/Chat'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Mentorships = lazy(() => import('./pages/Mentorships'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Settings = lazy(() => import('./pages/Settings'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Spinner />
  </div>
);

function Protected({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!token) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

function PublicOnly({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const auth = useAuth();
  const appShell = useMemo(() => auth.token, [auth.token]);

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes key={appShell ? 'authed' : 'guest'}>
          <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
          <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/discover" element={<Protected><Discover /></Protected>} />
          <Route path="/recommendations" element={<Protected><Recommendations /></Protected>} />
          <Route path="/chat" element={<Protected><Chat /></Protected>} />
          <Route path="/sessions" element={<Protected><Sessions /></Protected>} />
          <Route path="/calendar" element={<Protected><Calendar /></Protected>} />
          <Route path="/mentorships" element={<Protected><Mentorships /></Protected>} />
          <Route path="/mentors" element={<Protected><Mentorships initialRole="learner" /></Protected>} />
          <Route path="/learners" element={<Protected><Mentorships initialRole="mentor" /></Protected>} />
          <Route path="/roadmap" element={<Protected><Roadmap /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
          <Route path="/certificates" element={<Protected><Certificates /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/profile/:id" element={<Protected><Profile /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
