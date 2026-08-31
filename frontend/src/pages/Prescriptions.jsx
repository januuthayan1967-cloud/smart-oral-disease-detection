import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { prescriptionAPI, paymentAPI } from '../services/api';

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
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-theme-muted">Card Holder Name</label>
        <input
          className={`input-field w-full text-sm ${errors?.cardHolderName ? 'border-red-400' : ''}`}
          placeholder="John Doe"
          value={cardForm.cardHolderName}
          onChange={(e) => setCardForm((p) => ({ ...p, cardHolderName: e.target.value }))}
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
              setCardForm((p) => ({ ...p, cvv: val }));
            }}
            maxLength={4}
          />
          {errors?.cvv && <p className="mt-1 text-xs text-red-400">{errors.cvv}</p>}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Client-side card validation
// ──────────────────────────────────────────────────────────────
function validateCardForm(cardForm) {
  const errs = {};
  if (!cardForm.cardHolderName.trim()) errs.cardHolderName = 'Cardholder name is required.';
  const rawNumber = cardForm.cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(rawNumber)) errs.cardNumber = 'Enter a valid card number (13–19 digits).';
  if (!/^\d{2}\/\d{2}$/.test(cardForm.cardExpiry)) {
    errs.cardExpiry = 'Enter expiry in MM/YY format.';
  } else {
    const [mm, yy] = cardForm.cardExpiry.split('/');
    const month = parseInt(mm, 10);
    const year = 2000 + parseInt(yy, 10);
    const now = new Date();
    if (month < 1 || month > 12 || new Date(year, month - 1, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) {
      errs.cardExpiry = 'Card has expired or date is invalid.';
    }
  }
  if (!/^\d{3,4}$/.test(cardForm.cvv)) errs.cvv = 'Enter a valid 3 or 4 digit CVV.';
  return errs;
}

// ──────────────────────────────────────────────────────────────
// Payment Modal
// ──────────────────────────────────────────────────────────────
function PaymentModal({ prescription, onClose, onSuccess }) {
  const [cardForm, setCardForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validateCardForm(cardForm);
    setCardErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setIsProcessing(true);
      await paymentAPI.processPrescription({
        prescriptionId: prescription._id,
        cardHolderName: cardForm.cardHolderName,
        cardNumber: cardForm.cardNumber.replace(/\s/g, ''),
        cardExpiry: cardForm.cardExpiry,
        cvv: cardForm.cvv,
      });
      onSuccess(prescription._id);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Payment failed. Please check your card details and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl border border-theme-border/40 bg-theme-background shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border/30 bg-theme-accent/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="font-bold text-theme-heading text-base">Pay to Download</h2>
              <p className="text-xs text-theme-muted">Prescription from Dr. {prescription.dentistId?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:bg-red-500/10 hover:text-red-400 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-5">
          {/* Amount */}
          <div className="rounded-xl bg-theme-surface/50 border border-theme-border/30 p-4 flex items-center justify-between">
            <span className="text-sm text-theme-muted">Prescription Fee</span>
            <span className="text-xl font-bold text-theme-accent">
              Rs. {prescription.prescriptionFee ?? 500}
            </span>
          </div>

          {/* Card Form */}
          <CardPaymentForm cardForm={cardForm} setCardForm={setCardForm} errors={cardErrors} />

          {/* Security Notice */}
          <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="mt-0.5">🔒</span>
            <span>Your payment is secure. We never store your full card number — only the last 4 digits are kept for reference.</span>
          </div>

          {apiError && (
            <div className="rounded-lg px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20">
              ⚠️ {apiError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 text-sm font-semibold"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary flex-1 py-2.5 text-sm font-semibold shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? '⏳ Processing...' : `💳 Pay Rs. ${prescription.prescriptionFee ?? 500}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Prescriptions Component
// ──────────────────────────────────────────────────────────────
export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingFor, setPayingFor] = useState(null); // prescription being paid for
  const [successId, setSuccessId] = useState(null); // recently paid prescription id
  const [downloading, setDownloading] = useState(null); // prescription being downloaded

  useEffect(() => {
    prescriptionAPI.getMy()
      .then(({ data }) => setPrescriptions(data.data))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePaymentSuccess = (prescriptionId) => {
    // Update local state to reflect paid status
    setPrescriptions((prev) =>
      prev.map((rx) =>
        rx._id === prescriptionId ? { ...rx, paymentStatus: 'paid' } : rx
      )
    );
    setSuccessId(prescriptionId);
    setPayingFor(null);
    setTimeout(() => setSuccessId(null), 5000);
  };

  const handleDownload = async (prescriptionId) => {
    try {
      setDownloading(prescriptionId);
      const { data } = await prescriptionAPI.download(prescriptionId);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download prescription.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      {/* Payment Modal */}
      {payingFor && (
        <PaymentModal
          prescription={payingFor}
          onClose={() => setPayingFor(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <h1 className="text-3xl font-bold text-theme-heading">My Prescriptions</h1>
      <p className="mt-1 text-theme-muted">View and download prescriptions from your dentist consultations</p>

      <div className="mt-8 space-y-4">
        {prescriptions.length === 0 ? (
          <div className="card text-center">
            <p className="text-theme-muted">No prescriptions yet.</p>
            <Link to="/consultation" className="btn-primary mt-4 inline-block">Book a Consultation</Link>
          </div>
        ) : (
          prescriptions.map((rx) => {
            const isPaid = rx.paymentStatus === 'paid';
            const isJustPaid = successId === rx._id;
            const isDownloading = downloading === rx._id;

            return (
              <div
                key={rx._id}
                className={`card transition-all ${isJustPaid ? 'ring-2 ring-emerald-500/50' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-theme-heading">Dr. {rx.dentistId?.name}</p>
                      {/* Payment status badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                        }`}
                      >
                        {isPaid ? '✓ Paid' : '⏳ Payment Pending'}
                      </span>
                      {isJustPaid && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 animate-pulse">
                          🎉 Payment Successful!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-theme-muted">{rx.dentistId?.specialization}</p>
                    <p className="mt-1 text-xs text-theme-muted">
                      <strong>Case / Diagnosis:</strong> <span className="text-theme-heading font-medium">{rx.caseDiagnosis || 'Not specified'}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-theme-muted">{new Date(rx.date || rx.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {isPaid ? (
                      <Link to={`/orders/send/${rx._id}`} className="btn-secondary text-sm text-center">
                        Send to Pharmacy
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="btn-secondary text-sm text-center opacity-50 cursor-not-allowed flex items-center justify-center gap-1"
                        title="Payment required before sending prescription to pharmacy"
                      >
                        <span>🔒</span> Send to Pharmacy
                      </button>
                    )}

                    {isPaid ? (
                      <button
                        onClick={() => handleDownload(rx._id)}
                        disabled={isDownloading}
                        className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isDownloading ? (
                          <>⏳ Downloading...</>
                        ) : (
                          <>📥 Download Prescription</>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setPayingFor(rx)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm"
                      >
                        💳 Pay to Unlock
                        <span className="text-xs font-normal opacity-80">(Rs. {rx.prescriptionFee ?? 500})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Prescription Fee Info for unpaid */}
                {!isPaid && (
                  <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    💡 Pay <strong>Rs. {rx.prescriptionFee ?? 500}</strong> by card to unlock download and pharmacy delivery for this prescription.
                  </div>
                )}

                {/* Medicine List */}
                <div className="mt-4 space-y-2">
                  {rx.medicines?.map((med, i) => (
                    <div key={i} className="rounded-lg border border-theme-border/30 bg-theme-surface/50 p-3">
                      <p className="font-medium text-theme-heading">{med.medicineName}</p>
                      <p className="text-sm text-theme-muted">
                        {med.dosage} · {med.duration} · Qty: {med.quantity}
                      </p>
                      {med.instructions && <p className="text-sm text-theme-muted">{med.instructions}</p>}
                    </div>
                  ))}
                </div>

                {rx.notes && <p className="mt-3 text-sm text-theme-muted">Notes: {rx.notes}</p>}
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
