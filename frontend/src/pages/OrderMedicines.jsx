import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { prescriptionAPI, pharmacySearchAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ──────────────────────────────────────────────────────────────
// Reusable Card Payment Form
// ──────────────────────────────────────────────────────────────
function CardPaymentForm({ cardForm, setCardForm, errors }) {
  const handleCardNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiry = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2);
    setCardForm((prev) => ({ ...prev, cardExpiry: raw }));
  };

  return (
    <div className="mt-4 rounded-xl border border-theme-accent/30 bg-theme-accent/5 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💳</span>
        <span className="text-sm font-bold text-theme-heading">Card Details</span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-theme-muted">Card Holder Name</label>
        <input
          className={`input-field w-full text-sm ${errors?.cardHolderName ? 'border-red-400' : ''}`}
          placeholder="John Doe"
          value={cardForm.cardHolderName}
          onChange={(e) => setCardForm((prev) => ({ ...prev, cardHolderName: e.target.value }))}
        />
        {errors?.cardHolderName && <p className="mt-1 text-xs text-red-400">{errors.cardHolderName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-theme-muted">Card Number</label>
        <input
          className={`input-field w-full text-sm font-mono tracking-widest ${errors?.cardNumber ? 'border-red-400' : ''}`}
          placeholder="1234 5678 9012 3456"
          value={cardForm.cardNumber}
          onChange={handleCardNumber}
          maxLength={19}
        />
        {errors?.cardNumber && <p className="mt-1 text-xs text-red-400">{errors.cardNumber}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-theme-muted">Expiry (MM/YY)</label>
          <input
            className={`input-field w-full text-sm font-mono ${errors?.cardExpiry ? 'border-red-400' : ''}`}
            placeholder="MM/YY"
            value={cardForm.cardExpiry}
            onChange={handleExpiry}
            maxLength={5}
          />
          {errors?.cardExpiry && <p className="mt-1 text-xs text-red-400">{errors.cardExpiry}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-theme-muted">CVV</label>
          <input
            className={`input-field w-full text-sm font-mono ${errors?.cvv ? 'border-red-400' : ''}`}
            placeholder="•••"
            type="password"
            value={cardForm.cvv}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setCardForm((prev) => ({ ...prev, cvv: val }));
            }}
            maxLength={4}
          />
          {errors?.cvv && <p className="mt-1 text-xs text-red-400">{errors.cvv}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-theme-muted pt-1">
        <span>🔒</span>
        <span>Your card details are encrypted and secure. We never store your full card number.</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Client-side card validation
// ──────────────────────────────────────────────────────────────
function validateCardForm(cardForm) {
  const errs = {};
  if (!cardForm.cardHolderName?.trim()) errs.cardHolderName = 'Cardholder name is required.';

  const rawNumber = (cardForm.cardNumber || '').replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(rawNumber)) errs.cardNumber = 'Enter a valid card number (13–19 digits).';

  if (!/^\d{2}\/\d{2}$/.test(cardForm.cardExpiry || '')) {
    errs.cardExpiry = 'Enter expiry in MM/YY format.';
  } else {
    const [mm, yy] = cardForm.cardExpiry.split('/');
    const month = parseInt(mm, 10);
    const year = 2000 + parseInt(yy, 10);
    const now = new Date();
    const expDate = new Date(year, month - 1, 1);
    if (month < 1 || month > 12 || expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
      errs.cardExpiry = 'Card has expired or date is invalid.';
    }
  }

  if (!/^\d{3,4}$/.test(cardForm.cvv || '')) errs.cvv = 'Enter a valid 3 or 4 digit CVV.';

  return errs;
}

export default function OrderMedicines() {
  const { prescriptionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [radius, setRadius] = useState(10);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState(null);

  // Payment method: 'cod' | 'card'
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Card details form
  const [cardForm, setCardForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState({});

  useEffect(() => {
    prescriptionAPI.getById(prescriptionId)
      .then(({ data }) => setPrescription(data.data))
      .catch(() => setError('Prescription not found'))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  useEffect(() => {
    if (user) {
      if (user.address && !deliveryAddress) {
        setDeliveryAddress(user.address);
      }
      if (user.name && !cardForm.cardHolderName) {
        setCardForm((prev) => ({ ...prev, cardHolderName: user.name }));
      }
    }
  }, [user]);

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

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedPharmacy || !deliveryAddress.trim()) {
      setError('Please select a pharmacy and enter a delivery address.');
      return;
    }

    if (paymentMethod === 'card') {
      const errs = validateCardForm(cardForm);
      setCardErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }

    try {
      setSubmitting(true);
      const payload = {
        prescriptionId,
        pharmacyId: selectedPharmacy._id,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
      };

      if (paymentMethod === 'card') {
        payload.cardHolderName = cardForm.cardHolderName;
        payload.cardNumber = cardForm.cardNumber.replace(/\s/g, '');
        payload.cardExpiry = cardForm.cardExpiry;
        payload.cvv = cardForm.cvv;
      }

      await orderAPI.sendPrescription(payload);

      setSuccessMsg(
        paymentMethod === 'card'
          ? '✅ Prescription sent and payment processed successfully! Redirecting...'
          : '✅ Prescription sent with Cash on Delivery! Redirecting...'
      );

      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading">Order Medicines</h1>
          <p className="mt-1 text-theme-muted">Select a nearby pharmacy and payment option to fulfill your prescription</p>
        </div>
        <Link to="/prescriptions" className="btn-secondary px-4 py-2 text-sm font-semibold border border-theme-border/50">
          ← Back to Prescriptions
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-xl p-4 text-sm flex items-center gap-2" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl p-4 text-sm flex items-center gap-2" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {prescription && (
        <div className="card border border-theme-border/40 bg-theme-surface/50">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-border/20 pb-3 mb-3">
            <div>
              <h2 className="font-bold text-theme-heading text-base">Prescription from Dr. {prescription.dentistId?.name}</h2>
              <p className="text-xs text-theme-muted">{prescription.dentistId?.specialization}</p>
            </div>
            {prescription.caseDiagnosis && (
              <span className="rounded-lg bg-theme-accent/10 px-2.5 py-1 text-xs font-semibold text-theme-accent">
                {prescription.caseDiagnosis}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-muted block">Prescribed Medications:</span>
            {prescription.medicines?.map((m, i) => (
              <div key={i} className="flex justify-between items-center text-sm rounded-lg bg-theme-surface/40 p-2.5 border border-theme-border/20">
                <span className="font-medium text-theme-heading">{m.medicineName}</span>
                <span className="text-xs text-theme-muted">{m.dosage} · {m.duration} · Qty: <strong>{m.quantity}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-6 border border-theme-border/40 bg-theme-surface/50">
        <h2 className="mb-4 font-bold text-theme-heading text-lg">1. Find Nearby Pharmacies</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={detectAndSearch} disabled={searching} className="btn-primary shadow-glow">
            {searching ? 'Searching...' : '📍 Use My Location'}
          </button>
          <select
            className="input-field w-auto font-medium"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={20}>Within 20 km</option>
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
                  ? 'border-theme-accent bg-theme-accent/10 shadow-glow-sm'
                  : 'border-theme-border/50 bg-theme-surface/40 hover:bg-theme-surface/70'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏥</span>
                  <p className="font-bold text-theme-heading">{pharmacy.pharmacyName}</p>
                </div>
                <span className="text-xs font-bold text-theme-accent bg-theme-accent/15 px-2.5 py-1 rounded-full border border-theme-accent/30">
                  {pharmacy.distanceKm} km away
                </span>
              </div>
              <p className="text-sm text-theme-muted mt-1.5">{pharmacy.address}, {pharmacy.city}</p>
              <p className="text-xs text-theme-muted mt-0.5">📞 {pharmacy.phone}</p>
              {selectedPharmacy?._id === pharmacy._id && (
                <span className="inline-block mt-2 text-xs font-semibold text-theme-accent">
                  ✓ Selected Pharmacy
                </span>
              )}
            </button>
          ))}
          {pharmacies.length === 0 && !searching && (
            <div className="py-8 text-center text-sm text-theme-muted">
              <p className="text-2xl mb-1">🔍</p>
              <p>Click &quot;Use My Location&quot; to find registered pharmacies near you.</p>
            </div>
          )}
        </div>
      </div>

      {selectedPharmacy && (
        <form onSubmit={handleSubmitOrder} className="card mt-6 border border-theme-border/40 bg-theme-surface/50 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-theme-heading border-b border-theme-border/20 pb-3">
              2. Delivery & Payment Details
            </h2>
            <div className="mt-3 p-3 rounded-xl bg-theme-accent/5 border border-theme-accent/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-theme-muted block font-semibold uppercase tracking-wider">Fulfilling Pharmacy</span>
                <span className="font-bold text-theme-heading text-sm">{selectedPharmacy.pharmacyName}</span>
              </div>
              <span className="text-xs text-theme-muted">{selectedPharmacy.city}</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-theme-text">Delivery Address *</label>
            <textarea
              className="input-field w-full text-sm"
              rows={3}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your full street address, landmark, city, postal code..."
              required
            />
          </div>

          {/* ── Payment Method Selection ── */}
          <div className="border-t border-theme-border/20 pt-4">
            <label className="mb-2 block text-sm font-bold text-theme-heading">
              Select Payment Method *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* COD Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-4 transition text-center ${
                  paymentMethod === 'cod'
                    ? 'border-theme-accent bg-theme-accent/10 text-theme-accent shadow-glow-sm'
                    : 'border-theme-border/40 bg-theme-surface/30 text-theme-muted hover:border-theme-border'
                }`}
              >
                <span className="text-2xl">💵</span>
                <span className="text-sm font-bold">Cash on Delivery (COD)</span>
                <span className="text-xs text-theme-muted">Pay the pharmacy when medicines arrive</span>
                {paymentMethod === 'cod' && (
                  <span className="text-[10px] font-bold bg-theme-accent/20 rounded px-2 py-0.5 mt-1">Selected ✓</span>
                )}
              </button>

              {/* Card Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-4 transition text-center ${
                  paymentMethod === 'card'
                    ? 'border-theme-accent bg-theme-accent/10 text-theme-accent shadow-glow-sm'
                    : 'border-theme-border/40 bg-theme-surface/30 text-theme-muted hover:border-theme-border'
                }`}
              >
                <span className="text-2xl">💳</span>
                <span className="text-sm font-bold">Pay by Card</span>
                <span className="text-xs text-theme-muted">Instant secure online card payment</span>
                {paymentMethod === 'card' && (
                  <span className="text-[10px] font-bold bg-theme-accent/20 rounded px-2 py-0.5 mt-1">Selected ✓</span>
                )}
              </button>
            </div>

            {/* COD Explanation */}
            {paymentMethod === 'cod' && (
              <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                💡 <strong>Cash on Delivery selected:</strong> Total bill will be calculated by {selectedPharmacy.pharmacyName} based on available stock, and collected upon delivery.
              </div>
            )}

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <CardPaymentForm
                cardForm={cardForm}
                setCardForm={setCardForm}
                errors={cardErrors}
              />
            )}
          </div>

          <div className="border-t border-theme-border/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-theme-muted">
              Prescription Order to <strong className="text-theme-heading">{selectedPharmacy.pharmacyName}</strong>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto px-8 py-3 text-sm font-bold shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? '⏳ Processing Order...'
                : paymentMethod === 'card'
                ? `💳 Pay & Send to ${selectedPharmacy.pharmacyName}`
                : `🚀 Send Order (COD) to ${selectedPharmacy.pharmacyName}`}
            </button>
          </div>
        </form>
      )}
    </Layout>
  );
}

