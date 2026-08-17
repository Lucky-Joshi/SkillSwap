import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PublicLayout from './layouts/PublicLayout';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageSkeleton from './components/ui/PageSkeleton';

const PageLoader = () => <PageSkeleton />;

const Loadable = (Component) => {
  const Wrapped = (props) => (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
  Wrapped.displayName = `LazyLoad(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};

const Home = Loadable(lazy(() => import('./pages/public/Home')));
const Features = Loadable(lazy(() => import('./pages/public/Features')));
const HowItWorks = Loadable(lazy(() => import('./pages/public/HowItWorks')));
const AIPage = Loadable(lazy(() => import('./pages/public/AI')));
const About = Loadable(lazy(() => import('./pages/public/About')));
const FAQ = Loadable(lazy(() => import('./pages/public/FAQ')));
const Contact = Loadable(lazy(() => import('./pages/public/Contact')));

const Login = Loadable(lazy(() => import('./pages/auth/Login')));
const Register = Loadable(lazy(() => import('./pages/auth/Register')));
const ForgotPassword = Loadable(lazy(() => import('./pages/auth/ForgotPassword')));
const ResetPassword = Loadable(lazy(() => import('./pages/auth/ResetPassword')));
const VerifyEmail = Loadable(lazy(() => import('./pages/auth/VerifyEmail')));

const Dashboard = Loadable(lazy(() => import('./pages/app/Dashboard')));
const Discover = Loadable(lazy(() => import('./pages/app/Discover')));
const Recommendations = Loadable(lazy(() => import('./pages/app/Recommendations')));
const Mentorships = Loadable(lazy(() => import('./pages/app/Mentorships')));
const Sessions = Loadable(lazy(() => import('./pages/app/Sessions')));
const Calendar = Loadable(lazy(() => import('./pages/app/Calendar')));
const Chat = Loadable(lazy(() => import('./pages/app/Chat')));
const Notifications = Loadable(lazy(() => import('./pages/app/Notifications')));
const Leaderboard = Loadable(lazy(() => import('./pages/app/Leaderboard')));
const Roadmap = Loadable(lazy(() => import('./pages/app/Roadmap')));
const Profile = Loadable(lazy(() => import('./pages/app/Profile')));
const Settings = Loadable(lazy(() => import('./pages/app/Settings')));
const Certificates = Loadable(lazy(() => import('./pages/app/Certificates')));
const Admin = Loadable(lazy(() => import('./pages/app/Admin')));
const NotFound = Loadable(lazy(() => import('./pages/NotFound')));

function AppLayout() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
  );
}

function AuthPage({ title, subtitle, children }) {
  return (
    <PublicOnlyRoute>
      <AuthLayout title={title} subtitle={subtitle}>
        {children}
      </AuthLayout>
    </PublicOnlyRoute>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <ErrorBoundary>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route path="/login" element={<AuthPage title="Welcome back" subtitle="Log in to continue learning and teaching."><Login /></AuthPage>} />
            <Route path="/register" element={<AuthPage title="Create your account" subtitle=""><Register /></AuthPage>} />
            <Route path="/forgot-password" element={<AuthPage title="Reset your password" subtitle="Enter your email and we'll send you a reset link."><ForgotPassword /></AuthPage>} />
            <Route path="/reset-password/:token" element={<AuthPage title="Set new password" subtitle=""><ResetPassword /></AuthPage>} />
            <Route path="/verify-email" element={<AuthPage title="Verify your email" subtitle=""><VerifyEmail /></AuthPage>} />

            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="discover" element={<Discover />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="connections" element={<Mentorships />} />
              <Route path="mentors" element={<Mentorships initialTab="learner" />} />
              <Route path="learners" element={<Mentorships initialTab="mentor" />} />
              <Route path="peers" element={<Mentorships initialTab="peer" />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="chat" element={<Chat />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </AnimatePresence>
    </Suspense>
  );
}
