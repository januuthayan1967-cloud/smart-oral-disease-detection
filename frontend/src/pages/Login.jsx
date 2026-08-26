import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage, getDashboardPath } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingAnimation from '../components/LoadingAnimation';

const getWelcomeMessage = (role) => {
  switch (role) {
    case 'dentist':
      return 'Welcome Dentist! You have logged in successfully.';
    case 'pharmacy':
      return 'Welcome Pharmacy! You have logged in successfully.';
    case 'admin':
      return 'Welcome Admin! You have logged in successfully.';
    case 'user':
    default:
      return 'Welcome User! You have logged in successfully.';
  }
};

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [toastMessage, setToastMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (!loading && user) {
      const welcomeMsg = getWelcomeMessage(user.role);
      navigate(getDashboardPath(user.role), {
        replace: true,
        state: { toastMessage: welcomeMsg, message: welcomeMsg },
      });
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      const loggedUser = await login(data);
      const welcomeMsg = getWelcomeMessage(loggedUser?.role);
      setSuccess(welcomeMsg);
      setToastMessage(welcomeMsg);
      setTimeout(() => {
        navigate(getDashboardPath(loggedUser?.role), {
          replace: true,
          state: { toastMessage: welcomeMsg, message: welcomeMsg },
        });
      }, 400);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
    }
  };

  if (loading) {
    return <LoadingAnimation fullScreen message="Checking session..." />;
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Oral AI account">
      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-theme-surface/95 px-4 py-3 text-sm font-semibold text-emerald-400 shadow-glow backdrop-blur-md"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">
              ✓
            </span>
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="ml-2 rounded-lg p-1 text-theme-muted hover:text-theme-text transition"
              aria-label="Close notification"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {success && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm font-medium"
          style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm font-medium"
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
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
          })}
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
