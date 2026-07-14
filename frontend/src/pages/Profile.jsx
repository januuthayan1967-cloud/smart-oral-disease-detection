import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function InfoRow({ icon, label, value }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--border-soft)' }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base">{icon}</span>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>{value}</span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      age: user?.age || '',
      gender: user?.gender || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await authAPI.updateProfile(data);
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
          Profile Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Manage your account information</p>
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Left: Profile card */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            {/* Avatar */}
            <div className="flex flex-col items-center pb-6 text-center" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <div className="relative">
                {/* Outer glow ring */}
                <div
                  className="absolute -inset-1 rounded-full opacity-60"
                  style={{ background: 'var(--gradient-accent)', filter: 'blur(8px)' }}
                />
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-glow"
                  style={{ background: 'var(--gradient-accent)' }}
                >
                  {initials}
                </div>
              </div>
              <h2
                className="mt-4 text-xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
              >
                {user?.name}
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</p>
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize"
                style={{
                  background: 'var(--accent-dim)',
                  borderColor: 'rgba(6,182,212,0.2)',
                  color: 'var(--accent)',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                {user?.role}
              </span>
            </div>

            {/* Account info rows */}
            <div className="mt-4">
              <InfoRow
                icon="📅"
                label="Member Since"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              />
              <InfoRow
                icon="✉️"
                label="Email Verified"
                value={user?.isEmailVerified ? '✓ Verified' : '✗ Not Verified'}
              />
              <InfoRow
                icon="📞"
                label="Phone"
                value={user?.phone || '—'}
              />
              <InfoRow
                icon="👤"
                label="Gender"
                value={user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—'}
              />
              <InfoRow
                icon="🎂"
                label="Age"
                value={user?.age || '—'}
              />
            </div>
          </Card>
        </motion.div>

        {/* Right: Edit form */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <Card>
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
              Edit Profile
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              Update your personal information below
            </p>

            {message && (
              <motion.div
                className="mt-4 flex items-center gap-2 rounded-xl p-3.5 text-sm"
                style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✓ {message}
              </motion.div>
            )}
            {error && (
              <motion.div
                className="mt-4 flex items-center gap-2 rounded-xl p-3.5 text-sm"
                style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠ {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <Input label="Full Name" {...register('name', { required: true })} />
              <Input label="Phone" {...register('phone')} />
              <Input label="Age" type="number" {...register('age')} />
              <Input label="Gender" as="select" {...register('gender')}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Input>
              <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
                {isSubmitting ? 'Saving...' : '💾 Save Changes'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
