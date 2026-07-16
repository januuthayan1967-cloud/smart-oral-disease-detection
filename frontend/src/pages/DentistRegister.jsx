import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function DentistRegister() {
  const { registerDentist } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      const result = await registerDentist(data);
      setSuccess(result.message || 'Registration submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          className="mt-4 rounded-xl p-3 text-sm"
          style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
      
      {success && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm"
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
            {...register('name', { required: true })}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Email Address"
            type="email"
            placeholder="dentist@example.com"
            {...register('email', { required: true })}
          />
        </div>

        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          {...register('password', { required: true, minLength: 6 })}
        />

        <Input
          label="Phone Number"
          placeholder="+1 234 567 8900"
          {...register('phone')}
        />

        <div className="md:col-span-2">
          <Input
            label="Professional License Number"
            placeholder="e.g. DDS-2024-001234"
            {...register('professionalLicenseNumber', { required: true })}
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
