import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import MedicineCard from '../components/MedicineCard';
import MedicineModal from '../components/MedicineModal';
import { pharmacyAPI } from '../services/api';

const STATUS_FLOW = ['pending', 'accepted', 'out_for_delivery', 'delivered'];

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

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('direct-orders');
  const [loading, setLoading] = useState(true);

  // Profile
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({});

  // Prescription orders (existing)
  const [prescriptionOrders, setPrescriptionOrders] = useState([]);

  // Direct orders (new)
  const [directOrders, setDirectOrders] = useState([]);
  const [directOrdersFilter, setDirectOrdersFilter] = useState('All');
  const [directOrdersSearch, setDirectOrdersSearch] = useState('');
  const [ordersPaymentsTypeFilter, setOrdersPaymentsTypeFilter] = useState('All');

  // Inventory (new)
  const [inventory, setInventory] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('All');

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, inventoryRes, prescriptionOrdersRes, directOrdersRes] = await Promise.all([
        pharmacyAPI.getProfile(),
        pharmacyAPI.getInventory(),
        pharmacyAPI.getOrders(),
        pharmacyAPI.getDirectOrders(),
      ]);

      setProfile(profileRes.data.data);
      setInventory(inventoryRes.data.data || []);
      setPrescriptionOrders(prescriptionOrdersRes.data.data || []);
      setDirectOrders(directOrdersRes.data.data || []);

      setProfileForm({
        pharmacyName: profileRes.data.data.pharmacyName || '',
        ownerName: profileRes.data.data.ownerName || '',
        phone: profileRes.data.data.phone || '',
        address: profileRes.data.data.address || '',
        city: profileRes.data.data.city || '',
        district: profileRes.data.data.district || '',
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Prescription Orders handlers (existing) ──────────────────────────────
  const handleAcceptPrescriptionOrder = async (id) => {
    await pharmacyAPI.acceptOrder(id);
    loadData();
  };

  const handleRejectPrescriptionOrder = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    await pharmacyAPI.rejectOrder(id, reason);
    loadData();
  };

  const handlePrescriptionStatusUpdate = async (id, status) => {
    await pharmacyAPI.updateOrderStatus(id, { status });
    loadData();
  };

  const handleUpdatePrescriptionPaymentStatus = async (id, paymentStatus) => {
    if (!window.confirm(`Mark this prescription order as ${paymentStatus === 'paid' ? 'Paid' : paymentStatus}?`)) return;
    try {
      await pharmacyAPI.updatePrescriptionOrderPaymentStatus(id, paymentStatus);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment status.');
    }
  };

  // ─── Direct Orders handlers (new) ──────────────────────────────────────────
  const handleUpdateDirectStatus = async (id, status) => {
    let reason = '';
    if (status === 'cancelled') {
      reason = prompt('Reason for cancelling this order:') || 'Cancelled by pharmacy';
    }
    await pharmacyAPI.updateDirectOrderStatus(id, status, reason);
    loadData();
  };

  // ─── Inventory CRUD handlers (new) ─────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (med) => {
    setEditingMedicine(med);
    setIsModalOpen(true);
  };

  const handleDeleteMedicine = async (med) => {
    if (!window.confirm(`Are you sure you want to delete ${med.medicineName}?`)) return;
    try {
      await pharmacyAPI.deleteInventoryItem(med._id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete medicine.');
    }
  };

  const handleModalSubmit = async (formData) => {
    if (editingMedicine) {
      await pharmacyAPI.updateInventoryItem(editingMedicine._id, formData);
    } else {
      await pharmacyAPI.addInventoryItem(formData);
    }
    loadData();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    await pharmacyAPI.updateProfile(profileForm);
    loadData();
    alert('Profile updated successfully!');
  };

  // Filter lists
  const pendingPrescriptionOrders = prescriptionOrders.filter((o) => o.status === 'pending');
  const activePrescriptionOrders = prescriptionOrders.filter((o) => !['delivered', 'completed', 'cancelled', 'pending'].includes(o.status));
  const completedPrescriptionOrders = prescriptionOrders.filter((o) => ['delivered', 'completed', 'cancelled'].includes(o.status));

  const filteredDirectOrders = directOrders.filter((order) => {
    const matchesStatus = directOrdersFilter === 'All' || order.status === directOrdersFilter;
    const matchesSearch =
      !directOrdersSearch ||
      order.customerName.toLowerCase().includes(directOrdersSearch.toLowerCase()) ||
      order._id.includes(directOrdersSearch) ||
      order.items.some((item) => item.medicineName.toLowerCase().includes(directOrdersSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      !inventorySearch ||
      item.medicineName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(inventorySearch.toLowerCase()));
    const matchesCategory =
      inventoryFilter === 'All' ||
      item.category.toLowerCase() === inventoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories from inventory merged with all standard categories (Fix BUG 3)
  const STANDARD_CATEGORIES = [
    'General', 'Antibiotics', 'Pain Relief', 'Antiseptic', 'Anti-inflammatory',
    'Vitamins & Supplements', 'Dental', 'Antifungal', 'Prescription', 'Other',
  ];
  const inventoryCategories = [
    'All',
    ...new Set([...STANDARD_CATEGORIES, ...inventory.map((item) => item.category).filter(Boolean)]),
  ];

  const tabs = [
    { id: 'direct-orders', label: 'Marketplace Orders', count: directOrders.filter((o) => o.status === 'pending').length },
    { id: 'orders-payments', label: 'Orders & Payments' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'orders', label: 'Prescription Requests', count: pendingPrescriptionOrders.length },
    { id: 'active', label: 'Active Prescription Orders', count: activePrescriptionOrders.length },
    { id: 'history', label: 'Prescription Order History', count: completedPrescriptionOrders.length },
    { id: 'profile', label: 'Profile' },
  ];

  if (loading && !profile) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading font-heading">Pharmacy Dashboard</h1>
          <p className="mt-1 text-theme-muted">{profile?.pharmacyName} — Fulfill orders and manage inventory</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-theme-border/40 pb-4 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                isActive
                  ? 'text-theme-primary z-10 font-bold shadow-glow-sm'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/30 border border-theme-border/20'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="pharmacy-active-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--gradient-accent)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20 flex items-center gap-1.5">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-theme-primary text-theme-accent' : 'bg-red-500 text-white'}`}>
                    {tab.count}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── NEW PAGE: Direct Orders (Marketplace Orders) ────────────────────── */}
        {activeTab === 'direct-orders' && (
          <motion.div
            key="direct-orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-6"
          >
            {/* Search and status filters */}
            <div className="card p-4 border border-theme-border/40 bg-theme-surface/40 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by customer name, order ID, or medicine..."
                  className="input-field w-full text-sm"
                  value={directOrdersSearch}
                  onChange={(e) => setDirectOrdersSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {['All', 'pending', 'accepted', 'out_for_delivery', 'delivered', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setDirectOrdersFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                      directOrdersFilter === status
                        ? 'bg-theme-accent text-theme-primary font-bold shadow-glow-sm'
                        : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text border border-theme-border/20'
                    }`}
                  >
                    {STATUS_LABELS[status] || status}
                  </button>
                ))}
              </div>
            </div>

            {filteredDirectOrders.length === 0 ? (
              <div className="card text-center py-12 text-theme-muted border border-theme-border/30 bg-theme-surface/30 shadow-inner">
                <p className="text-4xl mb-2">📋</p>
                <p className="font-semibold text-theme-heading text-lg">No direct orders found</p>
                <p className="text-sm mt-1">Incoming marketplace orders will show up here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDirectOrders.map((order, i) => {
                  const currentIdx = STATUS_FLOW.indexOf(order.status);
                  const nextStatus = STATUS_FLOW[currentIdx + 1];

                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="card border border-theme-border/40 bg-theme-surface/50 p-5 space-y-4 hover:border-theme-accent/30 hover:shadow-glow-sm transition duration-200"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-theme-heading text-base">Order #{order._id.slice(-8)}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[order.status]}`}>
                              {STATUS_LABELS[order.status]}
                            </span>
                          </div>
                          <p className="text-xs text-theme-muted mt-1">
                            Placed: {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-theme-muted block">Total Amount</span>
                          <span className="text-lg font-bold text-theme-accent">Rs. {order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid gap-4 sm:grid-cols-3 text-xs text-theme-muted border-t border-b border-theme-border/20 py-3 bg-theme-background/20 px-3 rounded-xl">
                        <div>
                          <span className="font-bold text-theme-heading block">Customer</span>
                          <p className="font-medium text-theme-text mt-0.5">{order.customerName}</p>
                        </div>
                        <div>
                          <span className="font-bold text-theme-heading block">Contact</span>
                          <p className="font-medium text-theme-text mt-0.5">{order.contactNumber}</p>
                        </div>
                        <div>
                          <span className="font-bold text-theme-heading block">Delivery Address</span>
                          <p className="font-medium text-theme-text mt-0.5 break-words">{order.deliveryAddress}</p>
                        </div>
                      </div>

                      {/* Medicines Ordered */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-theme-heading uppercase tracking-wider block">Items Ordered</span>
                        <div className="space-y-1.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-theme-border/10 pb-1.5">
                              <div>
                                <span className="font-semibold text-theme-heading">{item.medicineName}</span>
                                <span className="text-xs text-theme-muted ml-2">({item.category})</span>
                              </div>
                              <span className="text-sm text-theme-text font-mono">
                                Rs. {item.unitPrice.toFixed(2)} × {item.quantity} = Rs. {item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes / Reason */}
                      {order.notes && (
                        <div className="text-xs bg-theme-background/30 p-2.5 rounded-lg border border-theme-border/25">
                          <span className="font-bold text-theme-heading block">Customer Note:</span>
                          <p className="text-theme-text italic mt-0.5">{order.notes}</p>
                        </div>
                      )}

                      {order.rejectionReason && (
                        <div className="text-xs bg-red-500/5 p-2.5 rounded-lg border border-red-500/20 text-red-400">
                          <span className="font-bold block">Rejection/Cancellation Reason:</span>
                          <p className="italic mt-0.5">{order.rejectionReason}</p>
                        </div>
                      )}

                      {/* Status change actions */}
                      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-theme-border/20">
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <>
                            <button
                              onClick={() => handleUpdateDirectStatus(order._id, 'cancelled')}
                              className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 text-xs font-semibold transition"
                            >
                              Cancel Order
                            </button>
                            {nextStatus && (
                              <button
                                onClick={() => handleUpdateDirectStatus(order._id, nextStatus)}
                                className={`btn-primary py-2 px-5 text-xs font-bold shadow-glow ${
                                  nextStatus === 'delivered' ? 'bg-green-600 hover:bg-green-700' : ''
                                }`}
                              >
                                {nextStatus === 'delivered' ? 'Mark as Delivered' : `Update status to: ${STATUS_LABELS[nextStatus]}`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Orders & Payments (COD / Card status management for all orders) ─── */}
        {activeTab === 'orders-payments' && (
          <motion.div
            key="orders-payments"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-4"
          >
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 items-center justify-between card p-3 border border-theme-border/40 bg-theme-surface/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Filter By Type:</span>
                {['All', 'Marketplace', 'Prescription'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrdersPaymentsTypeFilter(type)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      ordersPaymentsTypeFilter === type
                        ? 'bg-theme-accent text-theme-primary font-bold shadow-glow-sm'
                        : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text border border-theme-border/20'
                    }`}
                  >
                    {type} Orders
                  </button>
                ))}
              </div>
              <span className="text-xs text-theme-muted">
                Showing {
                  [
                    ...directOrders.map((o) => ({ ...o, isDirect: true })),
                    ...prescriptionOrders.map((o) => ({ ...o, isDirect: false })),
                  ].filter((o) => {
                    if (ordersPaymentsTypeFilter === 'Marketplace') return o.isDirect;
                    if (ordersPaymentsTypeFilter === 'Prescription') return !o.isDirect;
                    return true;
                  }).length
                } orders
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-theme-border/40 bg-theme-surface/30 shadow-theme">
              <table className="w-full border-collapse text-left text-sm text-theme-text font-normal">
                <thead>
                  <tr className="border-b border-theme-border/40 bg-theme-surface/50 text-xs font-bold uppercase tracking-wider text-theme-muted">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Ordered Products / Rx</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Order Status</th>
                    <th className="px-6 py-4">Order Date & Time</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {[
                    ...directOrders.map((o) => ({
                      _id: o._id,
                      customerName: o.customerName || o.userId?.name || 'Customer',
                      orderType: 'Marketplace',
                      itemsSummary: o.items?.map((item) => `${item.medicineName} (${item.quantity})`).join(', ') || 'N/A',
                      paymentMethod: o.paymentMethod || 'cod',
                      paymentStatus: o.paymentStatus || 'pending',
                      orderStatus: o.status,
                      createdAt: o.createdAt,
                      isDirect: true,
                    })),
                    ...prescriptionOrders.map((o) => ({
                      _id: o._id,
                      customerName: o.userId?.name || 'Patient',
                      orderType: 'Prescription',
                      itemsSummary: o.prescriptionId?.medicines?.map((item) => `${item.medicineName} (${item.quantity})`).join(', ') || 'Prescription Medicines',
                      paymentMethod: o.paymentMethod || 'cod',
                      paymentStatus: o.paymentStatus || 'pending',
                      orderStatus: o.status,
                      createdAt: o.createdAt,
                      isDirect: false,
                    })),
                  ]
                    .filter((order) => {
                      if (ordersPaymentsTypeFilter === 'Marketplace') return order.isDirect;
                      if (ordersPaymentsTypeFilter === 'Prescription') return !order.isDirect;
                      return true;
                    })
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((order) => (
                      <tr key={order._id} className="hover:bg-theme-surface/20 transition duration-150">
                        <td className="px-6 py-4 font-semibold text-theme-heading">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.isDirect
                              ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          }`}>
                            {order.orderType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-theme-muted font-semibold">
                          #{order._id.slice(-8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs truncate font-medium" title={order.itemsSummary}>
                            {order.itemsSummary}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold uppercase text-xs">
                          {order.paymentMethod === 'card' ? '💳 Card' : '💵 COD'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[order.orderStatus]}`}>
                            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-theme-muted text-xs">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Mark this COD order as Paid?')) {
                                  try {
                                    if (order.isDirect) {
                                      await pharmacyAPI.updateDirectOrderPaymentStatus(order._id, 'paid');
                                    } else {
                                      await pharmacyAPI.updatePrescriptionOrderPaymentStatus(order._id, 'paid');
                                    }
                                    loadData();
                                  } catch (err) {
                                    alert(err.response?.data?.message || 'Failed to update payment status.');
                                  }
                                }
                              }}
                              className="rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {directOrders.length === 0 && prescriptionOrders.length === 0 && (
              <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
                <p className="text-4xl mb-2">💵</p>
                <p className="font-semibold text-theme-heading text-lg">No orders placed yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── REDESIGNED PAGE: Inventory Card/Grid Layout ───────────────────── */}
        {activeTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-6"
          >
            {/* Header & filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="flex-1 flex gap-3">
                <input
                  type="text"
                  placeholder="Search inventory medicines..."
                  className="input-field flex-1 text-sm bg-theme-surface/50 border border-theme-border/60"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                <select
                  className="rounded-xl border border-theme-border bg-theme-surface px-4 text-theme-text text-sm transition focus:border-theme-accent focus:outline-none"
                  value={inventoryFilter}
                  onChange={(e) => setInventoryFilter(e.target.value)}
                  style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                >
                  {inventoryCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-theme-surface text-theme-text">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="btn-primary px-5 py-3 text-sm font-bold flex items-center justify-center gap-1.5 shadow-glow shrink-0"
              >
                <span>➕</span>
                <span>Add Medicine</span>
              </button>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="card text-center py-16 text-theme-muted border border-theme-border/30 bg-theme-surface/30 shadow-inner">
                <p className="text-5xl mb-3">💊</p>
                <h3 className="text-lg font-bold text-theme-heading">No medicines in inventory</h3>
                <p className="text-sm mt-1">Get started by clicking &quot;Add Medicine&quot; above.</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredInventory.map((item) => (
                  <MedicineCard
                    key={item._id}
                    medicine={{ ...item, pharmacyName: profile?.pharmacyName }}
                    isPharmacyView
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteMedicine}
                  />
                ))}
              </div>
            )}

            {/* Reusable Medicine modal */}
            <MedicineModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleModalSubmit}
              medicine={editingMedicine}
            />
          </motion.div>
        )}

        {/* ─── Prescription Requests (existing) ────────────────────────────────── */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-4"
          >
            {pendingPrescriptionOrders.length === 0 ? (
              <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
                <p className="text-4xl mb-2">📝</p>
                <p className="font-semibold text-theme-heading text-lg">No pending prescription requests</p>
              </div>
            ) : (
              pendingPrescriptionOrders.map((order, i) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card border border-theme-border/40 bg-theme-surface/50 p-5 hover:border-theme-accent/30 transition duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-theme-heading text-lg">{order.userId?.name}</p>
                      <p className="text-xs text-theme-muted mt-0.5">{order.userId?.phone} · {order.userId?.email}</p>
                      <div className="mt-3 text-sm space-y-1 text-theme-text bg-theme-background/30 p-3 rounded-xl border border-theme-border/20">
                        <p><span className="font-bold text-theme-heading text-xs uppercase tracking-wider block mb-1">Delivery Address</span> {order.deliveryAddress}</p>
                        <p className="mt-2"><span className="font-bold text-theme-heading text-xs uppercase tracking-wider block mb-1">Total Bill</span> <span className="text-theme-accent font-bold">Rs. {order.totalAmount?.toFixed(2) || '0.00'}</span></p>
                        <div className="mt-2 pt-2 border-t border-theme-border/20 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-theme-heading">Payment:</span>
                          <span className="text-xs font-semibold text-theme-text">
                            {order.paymentMethod === 'card' ? '💳 Card (Paid Online)' : '💵 Cash on Delivery'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Payment Pending'}
                          </span>
                          {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' && (
                            <button
                              onClick={() => handleUpdatePrescriptionPaymentStatus(order._id, 'paid')}
                              className="rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold transition cursor-pointer"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </div>
                      {order.prescriptionId?.medicines && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-theme-accent uppercase tracking-wider mb-2">Prescribed Medicines:</p>
                          <div className="space-y-1.5 pl-2">
                            {order.prescriptionId.medicines.map((m, i) => (
                              <div key={i} className="text-sm text-theme-text flex items-center gap-2">
                                <span className="h-1.5 w-1.5 bg-theme-accent rounded-full" />
                                <span>{m.medicineName} — <span className="text-theme-muted">{m.dosage}, {m.duration}, Qty: {m.quantity}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleAcceptPrescriptionOrder(order._id)} className="btn-primary text-xs py-2 px-4 shadow-glow">Accept Request</button>
                      <button onClick={() => handleRejectPrescriptionOrder(order._id)} className="btn-secondary text-xs py-2 px-4 font-semibold text-red-400 hover:text-red-300">Reject</button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ─── Active Prescription Orders (existing) ────────────────────────────── */}
        {activeTab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-4"
          >
            {activePrescriptionOrders.length === 0 ? (
              <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
                <p className="text-4xl mb-2">🚚</p>
                <p className="font-semibold text-theme-heading text-lg">No active prescription orders</p>
              </div>
            ) : (
              activePrescriptionOrders.map((order, i) => {
                const currentIdx = STATUS_FLOW.indexOf(order.status);
                const nextStatus = STATUS_FLOW[currentIdx + 1];
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card border border-theme-border/40 bg-theme-surface/50 p-5 hover:border-theme-accent/30 transition duration-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-theme-heading text-lg">{order.userId?.name}</p>
                        <p className="text-xs text-theme-muted mt-0.5">{order.deliveryAddress}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGES[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                            }`}
                          >
                            {order.paymentMethod === 'card' ? '💳 Card' : '💵 COD'} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                          {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' && (
                            <button
                              onClick={() => handleUpdatePrescriptionPaymentStatus(order._id, 'paid')}
                              className="rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold transition cursor-pointer"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </div>
                      {nextStatus && (
                        <button
                          onClick={() => handlePrescriptionStatusUpdate(order._id, nextStatus)}
                          className={`btn-primary text-xs py-2.5 px-5 shadow-glow ${
                            nextStatus === 'delivered' ? 'bg-green-600 hover:bg-green-700' : ''
                          }`}
                        >
                          {nextStatus === 'delivered' ? 'Mark as Delivered' : `Mark as ${STATUS_LABELS[nextStatus]}`}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ─── Prescription Order History (existing) ─────────────────────────────── */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-3"
          >
            {completedPrescriptionOrders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card border border-theme-border/40 bg-theme-surface/50 p-4 flex items-center justify-between hover:border-theme-accent/20 transition duration-150"
              >
                <div>
                  <p className="font-semibold text-theme-heading">{order.userId?.name}</p>
                  <p className="text-xs text-theme-muted mt-0.5">Completed: {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </motion.div>
            ))}
            {completedPrescriptionOrders.length === 0 && (
              <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
                <p className="text-4xl mb-2">📁</p>
                <p className="font-semibold text-theme-heading text-lg">No prescription order history yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Profile Tab (existing) ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <motion.form
            key="profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleProfileUpdate}
            className="card mt-6 grid gap-4 md:grid-cols-2 border border-theme-border/50 bg-theme-surface/40"
          >
            <div className="md:col-span-2 border-b border-theme-border/10 pb-3 mb-2">
              <h2 className="text-xl font-bold text-theme-heading font-heading">Pharmacy Profile</h2>
              <p className="text-sm text-theme-muted mt-0.5">Manage your pharmacy business details and address.</p>
            </div>
            {['pharmacyName', 'ownerName', 'phone', 'address', 'city', 'district'].map((field) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-semibold text-theme-heading capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                  value={profileForm[field] || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                />
              </div>
            ))}
            <div className="md:col-span-2 pt-2 border-t border-theme-border/10">
              <button type="submit" className="btn-primary py-3 px-6 shadow-glow font-bold text-sm">
                Update Profile Settings
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Layout>
  );
}
