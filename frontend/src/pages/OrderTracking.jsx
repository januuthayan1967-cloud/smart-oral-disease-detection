import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { orderAPI } from '../services/api';

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  accepted: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  preparing: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  out_for_delivery: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  delivered: 'bg-green-500/15 text-green-400 border border-green-500/30',
  completed: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const STATUS_ICONS = {
  pending: '⏳',
  accepted: '✅',
  preparing: '📦',
  out_for_delivery: '🚚',
  delivered: '📬',
  completed: '🎉',
  cancelled: '❌',
};

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed'];

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState({});
  const location = useLocation();

  const loadOrders = async () => {
    try {
      const { data } = await orderAPI.getHistory();
      const fetchedOrders = data.data || [];
      setOrders(fetchedOrders);
      // Default all order history sections to expanded
      const initialExpanded = {};
      fetchedOrders.forEach((o) => {
        initialExpanded[o._id] = true;
      });
      setExpandedHistory((prev) => ({ ...initialExpanded, ...prev }));
    } catch (_) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId && orders.length > 0) {
      setExpandedHistory((prev) => ({ ...prev, [orderId]: true }));
      setTimeout(() => {
        const el = document.getElementById(`order-card-${orderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location, orders.length]);

  const toggleHistory = (orderId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await orderAPI.cancel(id);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleConfirmReceived = async (id) => {
    if (!confirm('Are you sure you have received this delivery?')) return;
    try {
      await orderAPI.confirm(id);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm receipt.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading">Track Orders</h1>
          <p className="mt-1 text-theme-muted">Monitor prescription medicine orders and live tracking history</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="btn-secondary text-xs px-3.5 py-2 font-medium flex items-center gap-1.5"
            title="Refresh Orders"
          >
            🔄 Refresh
          </button>
          <Link to="/prescriptions" className="btn-secondary text-xs px-3.5 py-2 font-medium">
            ← Prescriptions
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {orders.length === 0 ? (
          <div className="card text-center py-16 border border-theme-border/40 bg-theme-surface/30">
            <span className="text-5xl mb-3 block">📦</span>
            <h3 className="text-lg font-bold text-theme-heading">No Prescription Orders Yet</h3>
            <p className="text-sm text-theme-muted mt-1">When you send a prescription to a pharmacy, it will appear here for live tracking.</p>
            <Link to="/prescriptions" className="btn-primary mt-5 inline-block text-xs px-5 py-2.5">
              View Prescriptions
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const currentStep = STATUS_STEPS.indexOf(order.status);
            const params = new URLSearchParams(location.search);
            const targetOrderId = params.get('orderId');
            const isHighlighted = targetOrderId === order._id;
            const isHistoryOpen = !!expandedHistory[order._id];
            const trackingEvents = order.trackingHistory || [];

            return (
              <div
                key={order._id}
                id={`order-card-${order._id}`}
                className={`card border transition-all duration-300 ${
                  isHighlighted
                    ? 'border-theme-accent/80 bg-theme-surface/60 shadow-glow ring-1 ring-theme-accent/50'
                    : 'border-theme-border/40 bg-theme-surface/40 hover:border-theme-border/60'
                }`}
              >
                {/* Header Information */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-theme-muted font-semibold tracking-wider uppercase">Order</span>
                      <span className="font-mono text-xs font-bold text-theme-heading">
                        #{order._id.toString().slice(-8)}
                      </span>
                    </div>
                    <p className="text-base font-bold text-theme-heading">{order.pharmacyId?.pharmacyName || 'Pharmacy'}</p>
                    <p className="text-xs text-theme-muted mt-0.5">{order.deliveryAddress}</p>
                    <p className="text-[11px] text-theme-muted mt-1">
                      Placed: {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        <span>{STATUS_ICONS[order.status] || '📋'}</span>
                        <span>{STATUS_LABELS[order.status] || order.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                        }`}
                      >
                        {order.paymentMethod === 'card' ? '💳 Card' : '💵 COD'} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                      {order.totalAmount > 0 && (
                        <span className="text-sm font-bold text-theme-accent">
                          Rs. {order.totalAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar for Non-Cancelled Orders */}
                {order.status !== 'cancelled' ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-theme-muted mb-1.5 px-1">
                      <span>Order Placed</span>
                      <span>Accepted</span>
                      <span>Preparing</span>
                      <span>Out for Delivery</span>
                      <span>Delivered</span>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {STATUS_STEPS.map((step, idx) => (
                        <div key={step} className="flex flex-1 items-center">
                          <div
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                              idx <= currentStep
                                ? 'bg-gradient-to-r from-theme-accent to-emerald-500 shadow-glow-sm'
                                : 'bg-theme-border/30'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 flex items-center gap-2">
                    <span>❌</span>
                    <span>This order has been cancelled.{order.rejectionReason ? ` Reason: ${order.rejectionReason}` : ''}</span>
                  </div>
                )}

                {/* Medicines List */}
                {order.prescriptionId?.medicines && order.prescriptionId.medicines.length > 0 && (
                  <div className="mt-4 rounded-xl border border-theme-border/20 bg-theme-surface/30 p-3">
                    <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider block mb-1.5">
                      Prescribed Medicines ({order.prescriptionId.medicines.length})
                    </span>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {order.prescriptionId.medicines.map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-theme-background/40">
                          <span className="font-medium text-theme-text">{m.medicineName}</span>
                          <span className="text-theme-muted font-mono">× {m.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tracking History Section ────────────────────────────────────────── */}
                <div className="mt-5 border-t border-theme-border/20 pt-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleHistory(order._id)}
                      className="flex items-center gap-2 text-xs font-bold text-theme-heading hover:text-theme-accent transition"
                    >
                      <span>🕒</span>
                      <span>Tracking History ({trackingEvents.length})</span>
                      <span className="text-[10px] text-theme-muted">
                        {isHistoryOpen ? '▲ Hide' : '▼ View Audit Log'}
                      </span>
                    </button>

                    <div className="text-[11px] text-theme-muted">
                      Latest: <span className="font-semibold text-theme-accent uppercase">{STATUS_LABELS[order.status] || order.status}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isHistoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="rounded-xl border border-theme-border/30 bg-theme-background/30 p-4 space-y-3">
                          {trackingEvents.length === 0 ? (
                            <p className="text-xs text-theme-muted text-center py-2">No tracking records available for this order.</p>
                          ) : (
                            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border/40">
                              {trackingEvents.map((event, idx) => {
                                const isLatest = idx === trackingEvents.length - 1;
                                const eventTime = event.createdAt || event.timestamp;
                                const badgeColor = STATUS_COLORS[event.status] || 'bg-theme-surface text-theme-muted border border-theme-border/40';

                                return (
                                  <div key={event._id || idx} className="relative group">
                                    {/* Timeline dot */}
                                    <div
                                      className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 transition-all ${
                                        isLatest
                                          ? 'border-theme-accent bg-theme-accent ring-4 ring-theme-accent/20 animate-pulse'
                                          : 'border-theme-border/80 bg-theme-surface'
                                      }`}
                                    />

                                    <div className="rounded-lg border border-theme-border/20 bg-theme-surface/40 p-3 transition hover:border-theme-border/50">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                                            {STATUS_ICONS[event.status] || '•'} {STATUS_LABELS[event.status] || event.status}
                                          </span>
                                          {event.previousStatus && (
                                            <span className="text-[10px] text-theme-muted font-mono">
                                              from <span className="underline">{STATUS_LABELS[event.previousStatus] || event.previousStatus}</span>
                                            </span>
                                          )}
                                        </div>

                                        <span className="text-[10px] text-theme-muted">
                                          {eventTime ? new Date(eventTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                        </span>
                                      </div>

                                      {event.message && (
                                        <p className="mt-1.5 text-xs text-theme-text">
                                          {event.message}
                                        </p>
                                      )}

                                      {(event.actionByName || event.actionByRole) && (
                                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-theme-muted">
                                          <span>Action by:</span>
                                          <span className="font-semibold text-theme-heading">
                                            {event.actionByName || (event.actionByRole === 'pharmacy' ? 'Pharmacy' : event.actionByRole === 'user' ? 'Customer' : 'System')}
                                          </span>
                                          <span className="rounded bg-theme-surface px-1 py-0.2 text-[9px] uppercase font-bold text-theme-muted">
                                            {event.actionByRole}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-theme-border/10">
                  {['pending', 'accepted'].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="btn-secondary text-xs text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40 px-3.5 py-1.5"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => handleConfirmReceived(order._id)}
                      className="btn-primary text-xs bg-green-600 hover:bg-green-700 px-4 py-2"
                    >
                      ✓ Confirm Received
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
