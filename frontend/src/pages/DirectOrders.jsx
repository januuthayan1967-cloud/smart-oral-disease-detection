import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { directOrderAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

const STATUS_BADGES = {
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  accepted: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  out_for_delivery: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  delivered: 'bg-green-500/15 text-green-400 border border-green-500/30',
  completed: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PAYMENT_METHOD_LABELS = {
  card: '💳 Card',
  cod: '💵 COD',
};

const PAYMENT_STATUS_LABELS = {
  paid: '✓ Paid',
  pending: 'Pending',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const PAYMENT_STATUS_BADGES = {
  paid: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400',
  failed: 'bg-red-500/15 text-red-500 border border-red-500/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
};

export default function DirectOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const location = useLocation();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await directOrderAPI.getMyOrders();
      setOrders(data.data || []);
    } catch (_) {
      setErrorMsg('Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId) {
      setExpandedOrderId(orderId);
      setTimeout(() => {
        const el = document.getElementById(`order-card-${orderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location, orders.length]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await directOrderAPI.cancel(orderId);
      // Refresh list
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleConfirmReceived = async (orderId) => {
    if (!window.confirm('Are you sure you have received this delivery?')) return;

    try {
      await directOrderAPI.confirm(orderId);
      // Refresh list
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm delivery receipt.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading">My Medicine Orders</h1>
          <p className="mt-1 text-theme-muted">Track the status of your direct medicine orders</p>
        </div>
        <Link to="/medicines" className="btn-secondary px-4 py-2 text-sm font-semibold border border-theme-border/50">
          ← Back to Marketplace
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl p-4 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center text-theme-muted border border-theme-border/30 bg-theme-surface/30">
          <span className="text-6xl mb-4">📋</span>
          <h3 className="text-xl font-bold text-theme-heading">No Orders Placed Yet</h3>
          <p className="mt-1 text-sm">You haven&apos;t ordered any medicines directly yet.</p>
          <Link to="/medicines" className="btn-primary mt-6 px-6 py-2.5 text-sm font-semibold shadow-glow">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order._id;
            return (
              <div
                key={order._id}
                id={`order-card-${order._id}`}
                className={`card border overflow-hidden transition ${
                  isExpanded
                    ? 'border-theme-accent/80 bg-theme-surface/60 shadow-glow'
                    : 'border-theme-border/40 bg-theme-surface/40 hover:border-theme-border/60'
                }`}
              >
                {/* Order Header Summary */}
                <div
                  onClick={() => toggleExpand(order._id)}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer hover:bg-theme-surface/30 select-none"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">📦</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-theme-muted font-semibold tracking-wider uppercase">Order</span>
                        <span className="font-mono text-xs text-theme-text truncate max-w-[120px] sm:max-w-none">
                          #{order._id.substring(order._id.length - 8)}
                        </span>
                      </div>
                      <h3 className="font-bold text-theme-heading text-sm sm:text-base mt-0.5">
                        {order.pharmacyId?.pharmacyName}
                      </h3>
                      <p className="text-xs text-theme-muted mt-0.5">
                        Placed: {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-theme-muted block">Amount</span>
                      <span className="font-bold text-theme-accent text-sm sm:text-base">
                        Rs. {order.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${STATUS_BADGES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {isExpanded ? (
                        <span className="text-xs text-theme-muted">Collapse ▲</span>
                      ) : (
                        <span className="text-xs text-theme-muted">Expand ▼</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-theme-border/20 bg-theme-surface/20 p-5 space-y-4">
                    {/* Customer, Shipping, Pharmacy & Payment info */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs text-theme-muted border-b border-theme-border/20 pb-4">
                      <div>
                        <span className="font-bold text-theme-heading block uppercase tracking-wider mb-1 text-[10px]">
                          Customer Info
                        </span>
                        <p className="font-semibold text-theme-text">{order.customerName}</p>
                        <p>{order.contactNumber}</p>
                      </div>
                      <div>
                        <span className="font-bold text-theme-heading block uppercase tracking-wider mb-1 text-[10px]">
                          Delivery Address
                        </span>
                        <p className="text-theme-text break-words">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <span className="font-bold text-theme-heading block uppercase tracking-wider mb-1 text-[10px]">
                          Pharmacy Contact
                        </span>
                        <p className="text-theme-text">{order.pharmacyId?.phone || 'N/A'}</p>
                        <p>{order.pharmacyId?.address}, {order.pharmacyId?.city}</p>
                      </div>
                      <div>
                        <span className="font-bold text-theme-heading block uppercase tracking-wider mb-1 text-[10px]">
                          Payment Details
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-semibold text-theme-text">
                            {PAYMENT_METHOD_LABELS[order.paymentMethod] || (order.paymentMethod === 'card' ? '💳 Card' : '💵 COD')}
                          </span>
                          <span className="text-theme-muted">·</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              PAYMENT_STATUS_BADGES[order.paymentStatus] ||
                              (order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400')
                            }`}
                          >
                            {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                              (order.paymentStatus === 'paid'
                                ? '✓ Paid'
                                : order.paymentStatus === 'failed'
                                ? 'Failed'
                                : 'Pending')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ordered items listing */}
                    <div className="space-y-3">
                      <span className="font-bold text-theme-heading block uppercase tracking-wider text-[10px]">
                        Items Ordered
                      </span>
                      <div className="divide-y divide-theme-border/10">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded overflow-hidden border border-theme-border/25 bg-theme-background">
                                <img
                                  src={getImageUrl(item.image, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=50')}
                                  alt={item.medicineName}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=50';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-theme-heading">{item.medicineName}</p>
                                <p className="text-xs text-theme-muted">{item.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="text-xs text-theme-muted">
                                Rs. {item.unitPrice.toFixed(2)} × {item.quantity}
                              </span>
                              <span className="font-bold text-theme-text min-w-[70px] text-right">
                                Rs. {item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total & Payment Summary */}
                    <div className="rounded-xl border border-theme-border/20 bg-theme-surface/40 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-theme-muted font-medium">Payment:</span>
                        <span className="font-semibold text-theme-heading flex items-center gap-1.5">
                          <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] || (order.paymentMethod === 'card' ? '💳 Card' : '💵 COD')}</span>
                          <span className="text-theme-muted">·</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              PAYMENT_STATUS_BADGES[order.paymentStatus] ||
                              (order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400')
                            }`}
                          >
                            {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                              (order.paymentStatus === 'paid'
                                ? '✓ Paid'
                                : order.paymentStatus === 'failed'
                                ? 'Failed'
                                : 'Pending')}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-theme-muted font-medium">Total Order Amount:</span>
                        <span className="text-base font-bold text-theme-accent">
                          Rs. {order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Tracking History Timeline */}
                    <div className="rounded-xl border border-theme-border/25 bg-theme-background/30 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-theme-border/15 pb-2">
                        <span className="font-bold text-theme-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span>🕒</span> Tracking History ({order.trackingHistory?.length || 0})
                        </span>
                        <span className="text-[11px] text-theme-muted font-medium">
                          Current: <strong className="text-theme-accent uppercase">{STATUS_LABELS[order.status] || order.status}</strong>
                        </span>
                      </div>

                      {order.trackingHistory && order.trackingHistory.length > 0 ? (
                        <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border/40 pt-1">
                          {order.trackingHistory.map((ev, idx) => {
                            const isLast = idx === order.trackingHistory.length - 1;
                            const evTime = ev.createdAt || ev.timestamp;
                            return (
                              <div key={ev._id || idx} className="relative text-xs">
                                <div
                                  className={`absolute -left-5 top-1 h-3 w-3 rounded-full border ${
                                    isLast
                                      ? 'border-theme-accent bg-theme-accent ring-4 ring-theme-accent/20'
                                      : 'border-theme-border bg-theme-surface'
                                  }`}
                                />
                                <div className="rounded-lg border border-theme-border/20 bg-theme-surface/40 p-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[ev.status] || 'bg-theme-surface text-theme-muted'}`}>
                                      {STATUS_LABELS[ev.status] || ev.status}
                                    </span>
                                    <span className="text-[10px] text-theme-muted">
                                      {evTime ? new Date(evTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                    </span>
                                  </div>
                                  <p className="text-theme-text text-[11px]">{ev.message}</p>
                                  {(ev.actionByName || ev.actionByRole) && (
                                    <p className="text-[10px] text-theme-muted mt-1">
                                      By: <span className="font-semibold text-theme-heading">{ev.actionByName || ev.actionByRole}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-theme-muted italic">No tracking records logged.</p>
                      )}
                    </div>

                    {/* Notes & Actions */}
                    {order.notes && (
                      <div className="rounded-xl border border-theme-border/20 bg-theme-background/30 p-3 text-xs">
                        <span className="font-bold text-theme-heading block mb-1">Customer Notes:</span>
                        <p className="text-theme-text italic">{order.notes}</p>
                      </div>
                    )}

                    {order.rejectionReason && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                        <span className="font-bold block mb-1">Rejection/Cancellation Reason:</span>
                        <p className="italic">{order.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-theme-border/10">
                      {['pending', 'accepted'].includes(order.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 text-xs font-semibold transition"
                        >
                          Cancel Order
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmReceived(order._id)}
                          className="rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 text-xs font-semibold transition"
                        >
                          Confirm Received
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
