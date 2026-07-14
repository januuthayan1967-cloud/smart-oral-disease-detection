import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { prescriptionAPI, pharmacySearchAPI, orderAPI } from '../services/api';

export default function OrderMedicines() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [radius, setRadius] = useState(10);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    prescriptionAPI.getById(prescriptionId)
      .then(({ data }) => setPrescription(data.data))
      .catch(() => setError('Prescription not found'))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  const searchPharmacies = async (coords) => {
    const searchCoords = coords || location;
    if (!searchCoords) return;
    setSearching(true);
    try {
      const { data } = await pharmacySearchAPI.getNearby({ ...searchCoords, radius });
      setPharmacies(data.data);
    } catch {
      setError('Failed to find nearby pharmacies.');
    } finally {
      setSearching(false);
    }
  };

  const detectAndSearch = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(coords);
        await searchPharmacies(coords);
      },
      () => {
        setError('Unable to detect location.');
        setSearching(false);
      }
    );
  };

  useEffect(() => {
    if (location) searchPharmacies();
  }, [radius]);

  const handleSubmitOrder = async () => {
    if (!selectedPharmacy || !deliveryAddress) {
      setError('Please select a pharmacy and enter delivery address.');
      return;
    }
    try {
      await orderAPI.sendPrescription({
        prescriptionId,
        pharmacyId: selectedPharmacy._id,
        deliveryAddress,
      });
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-theme-heading">Order Medicines</h1>
      <p className="mt-1 text-theme-muted">Select a nearby pharmacy to fulfill your prescription</p>

      {error && <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>{error}</div>}

      {prescription && (
        <div className="card mt-6">
          <h2 className="font-semibold text-theme-heading">Prescription from Dr. {prescription.dentistId?.name}</h2>
          <div className="mt-3 space-y-1">
            {prescription.medicines?.map((m, i) => (
              <p key={i} className="text-sm text-theme-muted">{m.medicineName} — {m.dosage}, Qty: {m.quantity}</p>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-6">
        <h2 className="mb-4 font-semibold">Find Nearby Pharmacies</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={detectAndSearch} disabled={searching} className="btn-primary">
            {searching ? 'Searching...' : 'Use My Location'}
          </button>
          <select className="input-field w-auto" value={radius} onChange={(e) => setRadius(parseInt(e.target.value, 10))}>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
          </select>
        </div>

        <div className="mt-6 space-y-3">
          {pharmacies.map((pharmacy) => (
            <button
              key={pharmacy._id}
              type="button"
              onClick={() => setSelectedPharmacy(pharmacy)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedPharmacy?._id === pharmacy._id
                  ? 'border-theme-accent bg-theme-accent/10'
                  : 'border-theme-border/50 bg-theme-surface/40 hover:bg-theme-surface/70'
              }`}
            >
              <div className="flex justify-between">
                <p className="font-semibold text-theme-heading">{pharmacy.pharmacyName}</p>
                <span className="text-sm text-theme-accent">{pharmacy.distanceKm} km</span>
              </div>
              <p className="text-sm text-theme-muted">{pharmacy.address}, {pharmacy.city}</p>
              <p className="text-sm text-theme-muted">{pharmacy.phone}</p>
            </button>
          ))}
          {pharmacies.length === 0 && !searching && (
            <p className="text-sm text-theme-muted">Click &quot;Use My Location&quot; to find pharmacies nearby.</p>
          )}
        </div>
      </div>

      {selectedPharmacy && (
        <div className="card mt-6">
          <h2 className="mb-4 font-semibold text-theme-heading">Delivery Details</h2>
          <label className="mb-1 block text-sm font-medium text-theme-text">Delivery Address</label>
          <textarea
            className="input-field"
            rows={3}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your full delivery address"
          />
          <button onClick={handleSubmitOrder} className="btn-primary mt-4">
            Send Prescription to {selectedPharmacy.pharmacyName}
          </button>
        </div>
      )}
    </Layout>
  );
}
