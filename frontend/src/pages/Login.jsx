import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage, getDashboardPath } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingAnimation from '../components/LoadingAnimation';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (!loading && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data) => {
    try {
      setError('');
      await login(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
    }
  };

  if (loading) {
    return <LoadingAnimation fullScreen message="Checking session..." />;
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Oral AI account">
      {error && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm"
          style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          {...register('email', { required: true })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password', { required: true })}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? 'Signing in...' : 'Login'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="text-theme-accent transition hover:underline">
          Forgot password?
        </Link>
      </div>

      <div className="mt-6 space-y-3 border-t border-theme-border/40 pt-5">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-theme-muted">
          Create a new account
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: '/register', icon: '👤', label: 'User' },
            { to: '/register-dentist', icon: '🦷', label: 'Dentist' },
            { to: '/register-pharmacy', icon: '💊', label: 'Pharmacy' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 rounded-xl border border-theme-border/50 bg-theme-surface/40 px-2 py-3 text-xs font-medium text-theme-muted transition hover:border-theme-accent/40 hover:text-theme-accent"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
