import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ForgotPassword() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      const res = await authAPI.forgotPassword(data.email);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset link">
      {message && (
        <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Email" type="email" autoComplete="email" {...register('email', { required: true })} />
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-theme-accent hover:underline">Back to Login</Link>
      </p>
    </AuthLayout>
  );
}
