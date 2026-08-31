import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { prescriptionAPI, pharmacySearchAPI, orderAPI, getApiErrorMessage } from '../services/api';
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
  const [searchStatus, setSearchStatus] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
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

  const searchPharmacies = async (coords, searchRadius = radius) => {
    const searchCoords = coords || location;
    if (
      !searchCoords ||
      typeof searchCoords.latitude !== 'number' ||
      typeof searchCoords.longitude !== 'number' ||
      isNaN(searchCoords.latitude) ||
      isNaN(searchCoords.longitude) ||
      searchCoords.latitude < -90 ||
      searchCoords.latitude > 90 ||
      searchCoords.longitude < -180 ||
      searchCoords.longitude > 180
    ) {
      setError('Unable to determine your current location. Please enable location services and try again.');
      return;
    }
    setError('');
    setSearching(true);
    try {
      const { data } = await pharmacySearchAPI.getNearby({
        latitude: searchCoords.latitude,
        longitude: searchCoords.longitude,
        radius: searchRadius,
      });
      const results = data.data || [];
      setPharmacies(results);
      setHasSearched(true);
      if (selectedPharmacy) {
        const stillInList = results.find((p) => p._id === selectedPharmacy._id);
        if (!stillInList) setSelectedPharmacy(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to find nearby pharmacies.'));
    } finally {
      setSearching(false);
      setSearchStatus('');
    }
  };

  const detectAndSearch = () => {
    if (!navigator.geolocation) {
      setError('Unable to determine your current location. Please enable location services and try again.');
      return;
    }
    setError('');
    setSearching(true);
    setSearchStatus('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (
          !pos ||
          !pos.coords ||
          typeof pos.coords.latitude !== 'number' ||
          typeof pos.coords.longitude !== 'number' ||
          isNaN(pos.coords.latitude) ||
          isNaN(pos.coords.longitude) ||
          pos.coords.latitude < -90 ||
          pos.coords.latitude > 90 ||
          pos.coords.longitude < -180 ||
          pos.coords.longitude > 180
        ) {
          setSearching(false);
          setSearchStatus('');
          setError('Unable to determine your current location. Please enable location services and try again.');
          return;
        }
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(coords);
        setSearchStatus(`Finding nearby pharmacies within ${radius} km...`);
        await searchPharmacies(coords, radius);
      },
      (geoErr) => {
        setSearching(false);
        setSearchStatus('');
        switch (geoErr.code) {
          case 1: // PERMISSION_DENIED
            setError('Location access was denied. Please allow location permissions in your browser to find nearby pharmacies.');
            break;
          case 2: // POSITION_UNAVAILABLE
            setError('Unable to determine your current location. Please enable location services and try again.');
            break;
          case 3: // TIMEOUT
            setError('The request to get your location timed out. Please try clicking "Use My Location" again.');
            break;
          default:
            setError('Unable to determine your current location. Please enable location services and try again.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (location) {
      searchPharmacies(location, newRadius);
    }
  };

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

      {prescription && prescription.paymentStatus !== 'paid' ? (
        <div className="card mt-6 border border-amber-500/40 bg-amber-500/10 p-8 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold text-amber-500">Doctor Consultation Payment Required</h2>
          <p className="text-sm text-theme-muted max-w-md mx-auto">
            Payment for Dr. {prescription.dentistId?.name}&apos;s prescription (Rs. {prescription.prescriptionFee ?? 500}) must be completed before you can select a pharmacy or place an order.
          </p>
          <div className="pt-2">
            <Link to="/prescriptions" className="btn-primary inline-flex items-center gap-2 font-semibold shadow-glow px-6 py-2.5">
              <span>💳</span> Pay Prescription Fee on Prescriptions Page
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card mt-6 border border-theme-border/40 bg-theme-surface/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-bold text-theme-heading text-lg">1. Find Nearby Pharmacies</h2>
                <p className="text-xs text-theme-muted">Find approved pharmacies near your current location to deliver your prescription.</p>
              </div>
              {location && (
                <span className="text-xs text-theme-muted bg-theme-surface/60 px-2.5 py-1 rounded-lg border border-theme-border/30">
                  📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={detectAndSearch}
                disabled={searching}
                className="btn-primary shadow-glow flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>{searchStatus || 'Searching...'}</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>{location ? 'Refresh Location & Search' : 'Use My Location'}</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-theme-muted">Radius:</label>
                <select
                  className="input-field w-auto font-medium py-2 text-sm"
                  value={radius}
                  onChange={(e) => handleRadiusChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                  disabled={searching}
                >
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                  <option value={25}>Within 25 km</option>
                  <option value={50}>Within 50 km</option>
                  <option value={100}>Within 100 km</option>
                  <option value={500}>Within 500 km (Nationwide)</option>
                  <option value="all">All Pharmacies</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {searching && (
                <div className="py-8 text-center text-sm text-theme-muted animate-pulse">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="font-medium text-theme-heading">{searchStatus || 'Searching for nearby pharmacies...'}</p>
                  <p className="text-xs text-theme-muted mt-1">Please ensure your browser location permission is granted.</p>
                </div>
              )}

              {!searching && pharmacies.map((pharmacy) => (
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

              {!searching && hasSearched && pharmacies.length === 0 && (
                <div className="py-8 text-center text-sm text-theme-muted rounded-xl bg-theme-surface/30 border border-theme-border/30 p-4 space-y-3">
                  <p className="text-2xl mb-1">🏥</p>
                  <p className="font-semibold text-theme-heading">
                    No registered pharmacies found within {radius === 'all' ? 'any' : `${radius} km`}.
                  </p>
                  <p className="text-xs">
                    Try expanding your search radius to find registered pharmacies across all districts.
                  </p>
                  {radius !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleRadiusChange('all')}
                      className="btn-secondary text-xs px-4 py-2 mt-2 font-semibold border border-theme-border/60 hover:border-theme-accent"
                    >
                      Search All Pharmacies Nationwide
                    </button>
                  )}
                </div>
              )}

              {!searching && !hasSearched && (
                <div className="py-8 text-center text-sm text-theme-muted rounded-xl bg-theme-surface/20 border border-dashed border-theme-border/40 p-4">
                  <p className="text-2xl mb-1">📍</p>
                  <p>Click &ldquo;Use My Location&rdquo; to find approved pharmacies nearest to your current location.</p>
                </div>
              )}
            </div>
          </div>

          {selectedPharmacy && (
            <form onSubmit={handleSubmitOrder} className="card mt-6 border border-theme-border/40 bg-theme-surface/50 space-y-5">
              <div>
                <h2 className="font-bold text-theme-heading text-lg">
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

              <div className="border-t border-theme-border/20 pt-4">
                <label className="mb-2 block text-sm font-bold text-theme-heading">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {paymentMethod === 'cod' && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                    💡 <strong>Cash on Delivery selected:</strong> Total bill will be calculated by {selectedPharmacy.pharmacyName} based on available stock, and collected upon delivery.
                  </div>
                )}

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
        </>
      )}
    </Layout>
  );
}

