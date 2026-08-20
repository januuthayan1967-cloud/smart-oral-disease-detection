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
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      email: emailParam,
      token: token,
      otp: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      await authAPI.resetPassword(data);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please check your credentials.');
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your reset details to update your password">
      {success && (
        <div className="mt-4 rounded-xl p-3.5 text-sm font-medium" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl p-3.5 text-sm font-medium" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {!token && (
          <>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="6-Digit OTP Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              className="tracking-widest font-mono text-center"
              {...register('otp', { required: 'OTP code is required' })}
            />
          </>
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('password', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="text-theme-accent hover:underline">
          Request new OTP
        </Link>
        {' • '}
        <Link to="/login" className="text-theme-accent hover:underline">
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}
