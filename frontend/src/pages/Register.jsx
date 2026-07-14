import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      await registerUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Oral AI for smart dental care">
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

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input label="Full Name" {...register('name', { required: true })} />
        </div>
        <div className="md:col-span-2">
          <Input label="Email" type="email" autoComplete="email" {...register('email', { required: true })} />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            {...register('password', { required: true, minLength: 6 })}
          />
        </div>
        <Input label="Phone" {...register('phone')} />
        <Input label="Age" type="number" {...register('age')} />
        <div className="md:col-span-2">
          <Input label="Gender" as="select" {...register('gender')}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Input>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-theme-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-theme-accent hover:underline">
          Login
        </Link>
      </p>

      <div className="mt-5 border-t border-theme-border/40 pt-4">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-theme-muted">
          Register as a professional instead
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/register-dentist"
            className="flex items-center gap-2 rounded-xl border border-theme-border/50 bg-theme-surface/40 px-4 py-3 text-sm font-medium text-theme-text transition hover:border-theme-accent/40 hover:text-theme-accent"
          >
            <span>🦷</span>
            <span>Dentist</span>
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
