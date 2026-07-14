import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import { cartAPI, directOrderAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ──────────────────────────────────────────────────────────────
// Reusable Card Payment Form
// ──────────────────────────────────────────────────────────────
function CardPaymentForm({ cardForm, setCardForm, errors }) {
  const handleCardNumber = (e) => {
    // Format as XXXX XXXX XXXX XXXX
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
    const expDate = new Date(year, month - 1, 1);
    if (month < 1 || month > 12 || expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
      errs.cardExpiry = 'Card has expired or date is invalid.';
    }
  }

  if (!/^\d{3,4}$/.test(cardForm.cvv)) errs.cvv = 'Enter a valid 3 or 4 digit CVV.';

  return errs;
}

// ──────────────────────────────────────────────────────────────
// Main Cart Component
// ──────────────────────────────────────────────────────────────
export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutPharmacyId, setCheckoutPharmacyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout delivery form
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    deliveryAddress: '',
    contactNumber: '',
    notes: '',
  });

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

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await cartAPI.get();
      setCart(data.data || { items: [] });
    } catch (_) {
      setErrorMsg('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (user) {
      setCheckoutForm({
        customerName: user.name || '',
        deliveryAddress: user.address || '',
        contactNumber: user.phone || '',
        notes: '',
      });
    }
  }, [user]);

  const handleQuantityChange = async (itemId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    try {
      const { data } = await cartAPI.updateItem(itemId, newQty);
      setCart(data.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update item quantity.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const { data } = await cartAPI.removeItem(itemId);
      setCart(data.data);
    } catch (_) {
      setErrorMsg('Failed to remove item.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Group cart items by pharmacy
  const groupedItems = cart.items.reduce((acc, item) => {
    const pId = item.pharmacyId.toString();
    if (!acc[pId]) {
      acc[pId] = {
        pharmacyName: item.pharmacyName,
        pharmacyId: item.pharmacyId,
        items: [],
        total: 0,
      };
    }
    acc[pId].items.push(item);
    acc[pId].total += item.unitPrice * item.quantity;
    return acc;
  }, {});

  const handlePlaceOrder = async (pharmacyId, e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!checkoutForm.customerName || !checkoutForm.deliveryAddress || !checkoutForm.contactNumber) {
      setErrorMsg('Please fill in all required customer details.');
      return;
    }

    // Validate card if selected
    if (paymentMethod === 'card') {
      const errs = validateCardForm(cardForm);
      setCardErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Place the order
      const orderPayload = {
        pharmacyId,
        customerName: checkoutForm.customerName,
        deliveryAddress: checkoutForm.deliveryAddress,
        contactNumber: checkoutForm.contactNumber,
        notes: checkoutForm.notes,
      };
      const { data: orderData } = await directOrderAPI.place(orderPayload);
      const orderId = orderData.data._id;

      // Step 2: Process payment
      const paymentPayload = { orderId, method: paymentMethod };
      if (paymentMethod === 'card') {
        paymentPayload.cardHolderName = cardForm.cardHolderName;
        paymentPayload.cardNumber = cardForm.cardNumber.replace(/\s/g, '');
        paymentPayload.cardExpiry = cardForm.cardExpiry;
        paymentPayload.cvv = cardForm.cvv;
      }

      await paymentAPI.processPharmacyOrder(paymentPayload);

      const msg =
        paymentMethod === 'card'
          ? '✅ Payment successful! Order confirmed. Redirecting...'
          : '✅ Order placed! You will pay on delivery. Redirecting...';
      setSuccessMsg(msg);
      setCheckoutPharmacyId(null);

      setTimeout(() => navigate('/direct-orders'), 2500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading">Shopping Cart</h1>
          <p className="mt-1 text-theme-muted">Manage items and proceed to pharmacy checkout</p>
        </div>
        <Link to="/medicines" className="btn-secondary px-4 py-2 text-sm font-semibold border border-theme-border/50">
          ← Back to Marketplace
        </Link>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-xl p-4 text-sm flex items-center gap-2" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-xl p-4 text-sm flex items-center gap-2" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center text-theme-muted border border-theme-border/30 bg-theme-surface/30">
          <span className="text-6xl mb-4">🛒</span>
          <h3 className="text-xl font-bold text-theme-heading">Your Cart is Empty</h3>
          <p className="mt-1 text-sm">Add some medicines from the marketplace to check out.</p>
          <Link to="/medicines" className="btn-primary mt-6 px-6 py-2.5 text-sm font-semibold shadow-glow">
            Browse Medicines
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart list (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {Object.values(groupedItems).map((group) => (
              <div key={group.pharmacyId} className="card border border-theme-border/40 bg-theme-surface/50 overflow-hidden">
                {/* Pharmacy Group Header */}
                <div className="border-b border-theme-border/30 bg-theme-accent/5 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-theme-muted block font-semibold uppercase tracking-wider">Pharmacy</span>
                    <h3 className="font-bold text-theme-heading text-base">{group.pharmacyName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-theme-muted block">Group Total</span>
                    <span className="font-bold text-theme-accent">Rs. {group.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-theme-border/20 px-4">
                  {group.items.map((item) => (
                    <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-theme-border/30 bg-theme-background">
                          <img
                            src={item.image ? `${import.meta.env.VITE_API_URL || ''}${item.image}` : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                            alt={item.medicineName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100';
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-theme-heading text-sm">{item.medicineName}</h4>
                          <span className="rounded bg-theme-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-theme-accent inline-block mt-0.5">
                            {item.category}
                          </span>
                          <p className="mt-1 text-xs text-theme-muted">Rs. {item.unitPrice.toFixed(2)} / unit</p>
                        </div>
                      </div>

                      {/* Quantity & Delete actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                            className="h-8 w-8 rounded-lg border border-theme-border/60 bg-theme-surface/50 flex items-center justify-center text-theme-text font-bold hover:bg-theme-surface transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-theme-heading">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                            className="h-8 w-8 rounded-lg border border-theme-border/60 bg-theme-surface/50 flex items-center justify-center text-theme-text font-bold hover:bg-theme-surface transition"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-sm font-bold text-theme-heading block">
                            Rs. {(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item._id)}
                          className="rounded-lg p-2 text-theme-muted hover:bg-red-500/10 hover:text-red-400 transition"
                          title="Remove item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checkout Trigger */}
                <div className="border-t border-theme-border/20 px-4 py-3 bg-theme-surface/30 flex justify-end">
                  {checkoutPharmacyId === group.pharmacyId ? (
                    <button
                      onClick={() => setCheckoutPharmacyId(null)}
                      className="text-xs font-semibold text-red-400 hover:underline"
                    >
                      Cancel Checkout
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCheckoutPharmacyId(group.pharmacyId);
                        setPaymentMethod('cod');
                        setCardForm({ cardHolderName: '', cardNumber: '', cardExpiry: '', cvv: '' });
                        setCardErrors({});
                      }}
                      className="btn-primary py-2 px-5 text-xs font-semibold shadow-glow"
                    >
                      Checkout from this Pharmacy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form Sidebar (1/3 width) */}
          <div>
            <div className="card sticky top-24 border border-theme-border/40 bg-theme-surface/50 p-5 space-y-4">
              <h2 className="text-lg font-bold text-theme-heading border-b border-theme-border/20 pb-2">
                Checkout Details
              </h2>

              {!checkoutPharmacyId ? (
                <div className="py-6 text-center text-sm text-theme-muted">
                  <p className="text-2xl mb-1">👈</p>
                  <p>Please select a pharmacy checkout button to proceed.</p>
                </div>
              ) : (
                <form onSubmit={(e) => handlePlaceOrder(checkoutPharmacyId, e)} className="space-y-4">
                  <div>
                    <span className="text-xs text-theme-accent font-bold uppercase tracking-wider">
                      Fulfilling Pharmacy
                    </span>
                    <p className="text-sm font-bold text-theme-heading mt-0.5">
                      {groupedItems[checkoutPharmacyId]?.pharmacyName}
                    </p>
                  </div>

                  <Input
                    label="Customer Name"
                    name="customerName"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                    required
                  />

                  <Input
                    label="Contact Number"
                    name="contactNumber"
                    value={checkoutForm.contactNumber}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, contactNumber: e.target.value })}
                    required
                  />

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-theme-text">Delivery Address</label>
                    <textarea
                      rows="3"
                      className="input-field w-full text-sm"
                      value={checkoutForm.deliveryAddress}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, deliveryAddress: e.target.value })}
                      required
                      placeholder="Street address, city, district..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-theme-text">Notes (Optional)</label>
                    <textarea
                      rows="2"
                      className="input-field w-full text-sm"
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                      placeholder="Add any specific instructions..."
                    />
                  </div>

                  {/* ── Payment Method Selection ── */}
                  <div className="border-t border-theme-border/20 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                      Payment Method
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {/* COD Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 transition text-center ${
                          paymentMethod === 'cod'
                            ? 'border-theme-accent bg-theme-accent/10 text-theme-accent'
                            : 'border-theme-border/40 bg-theme-surface/30 text-theme-muted hover:border-theme-border'
                        }`}
                      >
                        <span className="text-xl">💵</span>
                        <span className="text-xs font-semibold">Cash on Delivery</span>
                        {paymentMethod === 'cod' && (
                          <span className="text-[10px] bg-theme-accent/20 rounded px-1.5 py-0.5">Selected ✓</span>
                        )}
                      </button>

                      {/* Card Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 transition text-center ${
                          paymentMethod === 'card'
                            ? 'border-theme-accent bg-theme-accent/10 text-theme-accent'
                            : 'border-theme-border/40 bg-theme-surface/30 text-theme-muted hover:border-theme-border'
                        }`}
                      >
                        <span className="text-xl">💳</span>
                        <span className="text-xs font-semibold">Pay by Card</span>
                        {paymentMethod === 'card' && (
                          <span className="text-[10px] bg-theme-accent/20 rounded px-1.5 py-0.5">Selected ✓</span>
                        )}
                      </button>
                    </div>

                    {/* COD info badge */}
                    {paymentMethod === 'cod' && (
                      <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                        💡 Payment will be collected at the time of delivery. Status: <strong>Pending</strong> until delivered.
                      </div>
                    )}

                    {/* Card form */}
                    {paymentMethod === 'card' && (
                      <CardPaymentForm
                        cardForm={cardForm}
                        setCardForm={setCardForm}
                        errors={cardErrors}
                      />
                    )}
                  </div>

                  <div className="border-t border-theme-border/20 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-theme-muted font-medium">Order Total:</span>
                      <span className="text-xl font-bold text-theme-accent">
                        Rs. {groupedItems[checkoutPharmacyId]?.total.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full py-3 text-sm font-semibold shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? '⏳ Processing...'
                        : paymentMethod === 'card'
                        ? '💳 Pay & Place Order'
                        : '🚀 Place Order (COD)'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
