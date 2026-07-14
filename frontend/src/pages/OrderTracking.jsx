import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { orderAPI } from '../services/api';

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  accepted: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  out_for_delivery: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  delivered: 'bg-green-500/15 text-green-400 border border-green-500/30',
  completed: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const STATUS_STEPS = ['pending', 'accepted', 'out_for_delivery', 'delivered', 'completed'];

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const loadOrders = () => {
    orderAPI.getHistory()
      .then(({ data }) => setOrders(data.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId && orders.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`order-card-${orderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location, orders.length]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    await orderAPI.cancel(id);
    loadOrders();
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

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-theme-heading">Track Orders</h1>
      <p className="mt-1 text-theme-muted">Monitor your medicine delivery orders</p>

      <div className="mt-8 space-y-6">
        {orders.length === 0 ? (
          <div className="card text-center">
            <p className="text-theme-muted">No orders yet.</p>
          </div>
        ) : (
          orders.map((order) => {
            const currentStep = STATUS_STEPS.indexOf(order.status);
            const params = new URLSearchParams(location.search);
            const targetOrderId = params.get('orderId');
            const isHighlighted = targetOrderId === order._id;
            return (
              <div
                key={order._id}
                id={`order-card-${order._id}`}
                className={`card border transition ${
                  isHighlighted
                    ? 'border-theme-accent/80 bg-theme-surface/60 shadow-glow'
                    : 'border-theme-border/40 bg-theme-surface/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-theme-heading">{order.pharmacyId?.pharmacyName}</p>
                    <p className="text-sm text-theme-muted">{order.deliveryAddress}</p>
                    <p className="text-xs text-theme-muted">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    {order.totalAmount > 0 && (
                      <p className="mt-1 text-sm font-medium text-theme-text">${order.totalAmount.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {order.status !== 'cancelled' && (
                  <div className="mt-4 flex items-center gap-1">
                    {STATUS_STEPS.map((step, idx) => (
                      <div key={step} className="flex flex-1 items-center">
                        <div className={`h-2 flex-1 rounded-full ${idx <= currentStep ? 'bg-theme-accent' : 'bg-theme-border/40'}`} />
                      </div>
                    ))}
                  </div>
                )}

                {order.prescriptionId?.medicines && (
                  <div className="mt-4">
                    {order.prescriptionId.medicines.map((m, i) => (
                      <p key={i} className="text-sm text-theme-muted">{m.medicineName} × {m.quantity}</p>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  {['pending', 'accepted'].includes(order.status) && (
                    <button onClick={() => handleCancel(order._id)} className="btn-secondary text-sm text-red-400">
                      Cancel Order
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button onClick={() => handleConfirmReceived(order._id)} className="btn-primary text-sm bg-green-600 hover:bg-green-700">
                      Confirm Received
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
