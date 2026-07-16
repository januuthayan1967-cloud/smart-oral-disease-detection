import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
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
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

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
        setError('All three documents are required.');
        return;
      }

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, value));
      formData.append('pharmacyLicense', docs.pharmacyLicense);
      formData.append('businessRegistration', docs.businessRegistration);
      formData.append('pharmacistQualification', docs.pharmacistQualification);

      const result = await registerPharmacy(formData);
      setSuccess(result.message || 'Registration submitted successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          {success}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input label="Pharmacy Name" {...register('pharmacyName', { required: true })} />
        </div>
        <div className="md:col-span-2">
          <Input label="Owner Name" {...register('ownerName', { required: true })} />
        </div>
        <div>
          <Input label="Email" type="email" {...register('email', { required: true })} />
        </div>
        <div>
          <Input label="Password" type="password" {...register('password', { required: true, minLength: 6 })} />
        </div>
        <div>
          <Input label="Phone" {...register('phone', { required: true })} />
        </div>
        <div>
          <Input label="License Number" {...register('licenseNumber', { required: true })} />
        </div>
        <div className="md:col-span-2">
          <Input label="Address" {...register('address', { required: true })} />
        </div>
        <div>
          <Input label="District" {...register('district', { required: true })} />
        </div>
        <div>
          <Input label="City" {...register('city', { required: true })} />
        </div>
        <div>
          <Input id="latitude" label="Latitude" type="number" step="any" {...register('latitude', { required: true })} />
        </div>
        <div>
          <Input id="longitude" label="Longitude" type="number" step="any" {...register('longitude', { required: true })} />
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
