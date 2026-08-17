import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks';

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue learning and teaching.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="College email"
          type="email"
          placeholder="you@college.edu"
          autoComplete="email"
          {...register('email', { required: 'Email is required' })}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password', { required: 'Password is required' })}
          error={errors.password?.message}
        />
        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>Log in</Button>
      </form>
      <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
        <span className="font-semibold">Demo:</span> demo@skillswap.io · password <code className="font-mono">demo1234</code>
      </div>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New to SkillSwap?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
