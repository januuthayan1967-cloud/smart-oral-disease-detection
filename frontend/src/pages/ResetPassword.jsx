import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { token: searchParams.get('token') || '' },
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await authAPI.resetPassword(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password">
      {error && (
        <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <input type="hidden" {...register('token', { required: true })} />
        <Input label="New Password" type="password" autoComplete="new-password" {...register('password', { required: true, minLength: 6 })} />
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          Reset Password
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-theme-accent hover:underline">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
