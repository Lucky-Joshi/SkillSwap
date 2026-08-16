import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { verifyEmail } from '../services/auth';
import { useDocumentTitle } from '../hooks';

export default function VerifyEmail() {
  useDocumentTitle('Verify email');
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <AuthLayout title="Email verification" subtitle="One last step.">
      {status === 'loading' && <Spinner />}
      {status === 'success' && (
        <div className="space-y-4 text-center">
          <div className="text-5xl">✅</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your email is verified. You can now log in.</p>
          <Link to="/login" className="btn-primary w-full">Log in</Link>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-4 text-center">
          <div className="text-5xl">⚠️</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Invalid or expired verification link.</p>
          <Link to="/login" className="btn-primary w-full">Go to login</Link>
        </div>
      )}
    </AuthLayout>
  );
}
