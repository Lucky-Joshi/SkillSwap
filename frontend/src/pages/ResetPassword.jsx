import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { resetPassword } from '../services/auth';
import { useDocumentTitle } from '../hooks';

export default function ResetPassword() {
  useDocumentTitle('Set new password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async ({ password: pwd }) => {
    setLoading(true);
    try {
      await resetPassword(params.get('token') || '', pwd);
      toast.success('Password updated. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to continue.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="Min 8 characters"
          {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
          error={errors.password?.message}
        />
        <Input
          label="Confirm password"
          type="password"
          {...register('confirm', {
            required: 'Confirm your password',
            validate: (v) => v === password || 'Passwords do not match',
          })}
          error={errors.confirm?.message}
        />
        <Button type="submit" className="w-full" loading={loading}>Update password</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Back to login</Link>
      </p>
    </AuthLayout>
  );
}
