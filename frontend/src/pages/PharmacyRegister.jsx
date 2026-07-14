import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

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
    <div className="page-gradient min-h-screen px-4 py-8">
      <div className="card mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-theme-heading">Pharmacy Registration</h1>
        <p className="mt-1 text-sm text-theme-muted">Register your pharmacy for medicine delivery services</p>

        {error && <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>{error}</div>}
        {success && <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>{success}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Pharmacy Name</label>
            <input className="input-field" {...register('pharmacyName', { required: true })} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Owner Name</label>
            <input className="input-field" {...register('ownerName', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" className="input-field" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" className="input-field" {...register('password', { required: true, minLength: 6 })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input className="input-field" {...register('phone', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">License Number</label>
            <input className="input-field" {...register('licenseNumber', { required: true })} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Address</label>
            <input className="input-field" {...register('address', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">District</label>
            <input className="input-field" {...register('district', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <input className="input-field" {...register('city', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input id="latitude" type="number" step="any" className="input-field" {...register('latitude', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input id="longitude" type="number" step="any" className="input-field" {...register('longitude', { required: true })} />
          </div>
          <div className="md:col-span-2">
            <button type="button" onClick={detectLocation} className="btn-secondary text-sm">
              Detect Current Location
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Pharmacy License Certificate</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="input-field" onChange={(e) => handleDocChange('pharmacyLicense', e.target.files[0])} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Business Registration Certificate</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="input-field" onChange={(e) => handleDocChange('businessRegistration', e.target.files[0])} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Pharmacist Qualification Certificate</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="input-field" onChange={(e) => handleDocChange('pharmacistQualification', e.target.files[0])} />
          </div>

          <div className="md:col-span-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Submitting...' : 'Register Pharmacy'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-theme-muted">
          Already registered? <Link to="/login" className="text-theme-accent hover:underline">Login</Link>
          {' · '}
          <Link to="/register" className="text-theme-accent hover:underline">User Registration</Link>
        </p>
      </div>
    </div>
  );
}
