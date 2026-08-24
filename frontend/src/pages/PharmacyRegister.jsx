import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';

export default function PharmacyRegister() {
  const { registerPharmacy } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [docs, setDocs] = useState({
    pharmacyLicense: null,
    businessRegistration: null,
    pharmacistQualification: null,
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password', '');

  const handleDocChange = (field, file) => {
    setDocs((prev) => ({ ...prev, [field]: file }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('latitude').value = pos.coords.latitude;
        document.getElementById('longitude').value = pos.coords.longitude;
      },
      () => setError('Unable to detect location. Please enter coordinates manually.')
    );
  };

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');

      if (!docs.pharmacyLicense || !docs.businessRegistration || !docs.pharmacistQualification) {
        setError('All three documents are required: Pharmacy License, Business Registration, and Pharmacist Qualification.');
        return;
      }

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'confirmPassword') {
          formData.append(key, value);
        }
      });
      formData.append('pharmacyLicense', docs.pharmacyLicense);
      formData.append('businessRegistration', docs.businessRegistration);
      formData.append('pharmacistQualification', docs.pharmacistQualification);

      const result = await registerPharmacy(formData);
      const msg = result?.message || 'Pharmacy registration submitted. Please wait for admin approval before logging in.';
      setSuccess(msg);
      setTimeout(() => navigate('/login', { state: { message: msg } }), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <AuthLayout title="Pharmacy Registration" subtitle="Register your pharmacy for medicine delivery services">
      <motion.div
        className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <strong>⏳ Approval Required:</strong> Pharmacy accounts are reviewed by an admin before you can log in.
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
          {success}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Pharmacy Name"
            placeholder="City Care Pharmacy"
            error={errors.pharmacyName?.message}
            {...register('pharmacyName', { required: 'Pharmacy name is required' })}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Owner Name"
            placeholder="Jane Doe"
            error={errors.ownerName?.message}
            {...register('ownerName', { required: 'Owner name is required' })}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Email"
            type="email"
            placeholder="pharmacy@example.com"
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
        <div>
          <Input
            label="Phone"
            placeholder="+1 234 567 8900"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Phone number is required',
              validate: (val) =>
                /^[+]?[\d\s().-]{7,20}$/.test(val) || 'Please enter a valid phone number',
            })}
          />
        </div>
        <div>
          <Input
            label="License Number"
            placeholder="PH-2024-001"
            error={errors.licenseNumber?.message}
            {...register('licenseNumber', { required: 'License number is required' })}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Address"
            placeholder="123 Main Street"
            error={errors.address?.message}
            {...register('address', { required: 'Address is required' })}
          />
        </div>
        <div>
          <Input
            label="District"
            placeholder="Central"
            error={errors.district?.message}
            {...register('district', { required: 'District is required' })}
          />
        </div>
        <div>
          <Input
            label="City"
            placeholder="Metropolis"
            error={errors.city?.message}
            {...register('city', { required: 'City is required' })}
          />
        </div>
        <div>
          <Input
            id="latitude"
            label="Latitude"
            type="number"
            step="any"
            placeholder="40.7128"
            error={errors.latitude?.message}
            {...register('latitude', {
              required: 'Latitude is required',
              min: { value: -90, message: 'Latitude must be between -90 and 90' },
              max: { value: 90, message: 'Latitude must be between -90 and 90' },
            })}
          />
        </div>
        <div>
          <Input
            id="longitude"
            label="Longitude"
            type="number"
            step="any"
            placeholder="-74.0060"
            error={errors.longitude?.message}
            {...register('longitude', {
              required: 'Longitude is required',
              min: { value: -180, message: 'Longitude must be between -180 and 180' },
              max: { value: 180, message: 'Longitude must be between -180 and 180' },
            })}
          />
        </div>
        
        <div className="md:col-span-2">
          <Button type="button" variant="secondary" onClick={detectLocation} className="w-full text-sm">
            Detect Current Location
          </Button>
        </div>

        <div>
          <Input
            label="Pharmacy License Certificate"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleDocChange('pharmacyLicense', e.target.files[0])}
          />
        </div>
        <div>
          <Input
            label="Business Registration Certificate"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleDocChange('businessRegistration', e.target.files[0])}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Pharmacist Qualification Certificate"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleDocChange('pharmacistQualification', e.target.files[0])}
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? 'Submitting...' : 'Register Pharmacy'}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-theme-muted">
        Already registered?{' '}
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
            to="/register-dentist"
            className="flex items-center gap-2 rounded-xl border border-theme-border/50 bg-theme-surface/40 px-4 py-3 text-sm font-medium text-theme-text transition hover:border-theme-accent/40 hover:text-theme-accent"
          >
            <span>🦷</span>
            <span>Dentist</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
