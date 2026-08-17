import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { forgotPassword } from '../../services/auth';
import { useDocumentTitle } from '../../hooks';

export default function ForgotPassword() {
  useDocumentTitle('Reset password');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to set a new password.">
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="text-5xl">📬</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If an account exists, a reset link is on its way. Check your inbox (and spam).
          </p>
          <Link to="/login" className="btn-primary w-full">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="College email"
            type="email"
            placeholder="you@college.edu"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
