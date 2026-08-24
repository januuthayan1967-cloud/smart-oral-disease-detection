import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function DentistRegister() {
  const { registerDentist } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      const { confirmPassword, ...dentistData } = data;
      const result = await registerDentist(dentistData);
      const msg = result?.message || 'Registration submitted! Awaiting admin approval.';
      setSuccess(msg);
      setTimeout(() => navigate('/login', { state: { message: msg } }), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <AuthLayout title="Dentist Registration" subtitle="Register your professional account for approval">
      <motion.div
        className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <strong>⏳ Approval Required:</strong> Dentist accounts are reviewed by an admin before you can log in.
      </motion.div>

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
      
      {success && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm font-medium"
          style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✅ {success} <br />
          <span className="text-xs opacity-75">Redirecting to login in a few seconds…</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Full Name"
            placeholder="Dr. John Smith"
            error={errors.name?.message}
            {...register('name', { required: 'Full name is required' })}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Email Address"
            type="email"
            placeholder="dentist@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters.',
              },
            })}
          />
        </div>

        <div>
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === password || 'Passwords do not match',
            })}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Phone Number"
            placeholder="+1 234 567 8900"
            error={errors.phone?.message}
            {...register('phone', {
              validate: (val) =>
                !val || /^[+]?[\d\s().-]{7,20}$/.test(val) || 'Please enter a valid phone number',
            })}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Professional License Number"
            placeholder="e.g. DDS-2024-001234"
            error={errors.professionalLicenseNumber?.message}
            {...register('professionalLicenseNumber', {
              required: 'Professional license number is required',
            })}
          />
          <p className="mt-1 text-xs text-theme-muted">
            Your official dental council license / registration number.
          </p>
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? 'Submitting application…' : 'Submit Dentist Registration'}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-theme-muted">
        Already approved?{' '}
        <Link to="/login" className="text-theme-accent hover:underline">
          Login
        </Link>
      </p>

      <div className="mt-5 border-t border-theme-border/40 pt-4">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-theme-muted">
          Register other accounts instead
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded-xl border border-theme-border/50 bg-theme-surface/40 px-4 py-3 text-sm font-medium text-theme-text transition hover:border-theme-accent/40 hover:text-theme-accent"
          >
            <span>👤</span>
            <span>User</span>
          </Link>
          <Link
            to="/register-pharmacy"
            className="flex items-center gap-2 rounded-xl border border-theme-border/50 bg-theme-surface/40 px-4 py-3 text-sm font-medium text-theme-text transition hover:border-theme-accent/40 hover:text-theme-accent"
          >
            <span>💊</span>
            <span>Pharmacy</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
