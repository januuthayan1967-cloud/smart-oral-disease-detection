import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

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
    <div className="page-gradient min-h-screen px-4 py-8">
      <div className="card mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme-accent/15">
            <span className="text-2xl">🦷</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-heading">Dentist Registration</h1>
            <p className="text-sm text-theme-muted">Register your professional account for approval</p>
          </div>
        </div>

        {/* Pending notice */}
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
          <strong>⏳ Approval Required:</strong> Dentist accounts are reviewed by an admin before you can log in.
        </div>

        {error && (
          <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            ✅ {success} <br />
            <span className="text-xs opacity-75">Redirecting to login in a few seconds…</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-theme-text">Full Name</label>
            <input
              className="input-field"
              placeholder="Dr. John Smith"
              {...register('name', { required: true })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-theme-text">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="dentist@example.com"
              {...register('email', { required: true })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-theme-text">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Min. 6 characters"
              {...register('password', { required: true, minLength: 6 })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-theme-text">Phone Number</label>
            <input
              className="input-field"
              placeholder="+1 234 567 8900"
              {...register('phone')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-theme-text">
              Professional License Number <span className="text-red-400">*</span>
            </label>
            <input
              className="input-field"
              placeholder="e.g. DDS-2024-001234"
              {...register('professionalLicenseNumber', { required: true })}
            />
            <p className="mt-1 text-xs text-theme-muted">
              Your official dental council license / registration number.
            </p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Submitting application…' : 'Submit Dentist Registration'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-theme-muted">
          Already approved?{' '}
          <Link to="/login" className="text-theme-accent hover:underline">Login</Link>
          {' · '}
          <Link to="/register" className="text-theme-accent hover:underline">User Registration</Link>
          {' · '}
          <Link to="/register-pharmacy" className="text-theme-accent hover:underline">Pharmacy Registration</Link>
        </p>
      </div>
    </div>
  );
}
