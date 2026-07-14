import { useState, useEffect } from 'react';
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

  // Extract unique categories from inventory
  const inventoryCategories = ['All', ...new Set(inventory.map((item) => item.category || 'General'))];

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
          <h1 className="text-3xl font-bold text-theme-heading">Pharmacy Dashboard</h1>
          <p className="mt-1 text-theme-muted">{profile?.pharmacyName} — Fulfill orders and manage inventory</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-theme-border/40 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-theme-accent text-theme-primary font-bold shadow-glow'
                : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text border border-theme-border/20'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 ? (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ─── NEW PAGE: Direct Orders (Marketplace Orders) ────────────────────── */}
      {activeTab === 'direct-orders' && (
        <div className="mt-6 space-y-6">
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
                      ? 'bg-theme-accent text-theme-primary font-bold shadow-glow'
                      : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text border border-theme-border/20'
                  }`}
                >
                  {STATUS_LABELS[status] || status}
                </button>
              ))}
            </div>
          </div>

          {filteredDirectOrders.length === 0 ? (
            <div className="card text-center py-12 text-theme-muted border border-theme-border/30 bg-theme-surface/30">
              <p className="text-4xl mb-2">📋</p>
              <p className="font-semibold text-theme-heading text-lg">No direct orders found</p>
              <p className="text-sm mt-1">Incoming marketplace orders will show up here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDirectOrders.map((order) => {
                const currentIdx = STATUS_FLOW.indexOf(order.status);
                const nextStatus = STATUS_FLOW[currentIdx + 1];

                return (
                  <div key={order._id} className="card border border-theme-border/40 bg-theme-surface/50 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-theme-heading">Order #{order._id.substring(order._id.length - 8)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[order.status]}`}>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── NEW PAGE: Orders & Payments (COD / Card status management) ───────── */}
      {activeTab === 'orders-payments' && (
        <div className="mt-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-theme-border/40 bg-theme-surface/30">
            <table className="w-full border-collapse text-left text-sm text-theme-text font-normal">
              <thead>
                <tr className="border-b border-theme-border/40 bg-theme-surface/50 text-xs font-semibold uppercase text-theme-muted">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Ordered Products</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Order Status</th>
                  <th className="px-6 py-4">Order Date & Time</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {directOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-theme-surface/20 transition">
                    <td className="px-6 py-4 font-medium text-theme-heading">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-theme-muted font-semibold">
                      #{order._id.substring(order._id.length - 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate" title={order.items?.map(item => `${item.medicineName} (${item.quantity})`).join(', ')}>
                        {order.items?.map(item => `${item.medicineName} (${item.quantity})`).join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold uppercase">
                      {order.paymentMethod === 'card' ? '💳 Card' : '💵 COD'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-theme-muted">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Mark this COD order as Paid?')) {
                              try {
                                await pharmacyAPI.updateDirectOrderPaymentStatus(order._id, 'paid');
                                loadData();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to update payment status.');
                              }
                            }
                          }}
                          className="rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-semibold transition cursor-pointer"
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
          {directOrders.length === 0 && (
            <p className="text-center py-8 text-theme-muted bg-theme-surface/10 rounded-xl border border-theme-border/20">
              No orders placed yet.
            </p>
          )}
        </div>
      )}

      {/* ─── REDESIGNED PAGE: Inventory Card/Grid Layout ───────────────────── */}
      {activeTab === 'inventory' && (
        <div className="mt-6 space-y-6">
          {/* Header & filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Search inventory medicines..."
                className="input-field flex-1 text-sm"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
              <select
                className="input-field rounded-xl border border-theme-border bg-theme-surface px-4 text-theme-text text-sm"
                value={inventoryFilter}
                onChange={(e) => setInventoryFilter(e.target.value)}
              >
                {inventoryCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="btn-primary px-5 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-glow shrink-0"
            >
              <span>➕</span>
              <span>Add Medicine</span>
            </button>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="card text-center py-16 text-theme-muted border border-theme-border/30 bg-theme-surface/30">
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
        </div>
      )}

      {/* ─── Prescription Requests (existing) ────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="mt-6 space-y-4">
          {pendingPrescriptionOrders.length === 0 ? (
            <p className="text-theme-muted">No pending prescription requests.</p>
          ) : (
            pendingPrescriptionOrders.map((order) => (
              <div key={order._id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-theme-heading">{order.userId?.name}</p>
                    <p className="text-sm text-theme-muted">{order.userId?.phone} · {order.userId?.email}</p>
                    <p className="mt-2 text-sm text-theme-text">Delivery: {order.deliveryAddress}</p>
                    <p className="text-sm text-theme-text">Amount: Rs. {order.totalAmount?.toFixed(2) || '0.00'}</p>
                    {order.prescriptionId?.medicines && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-theme-text">Medicines:</p>
                        {order.prescriptionId.medicines.map((m, i) => (
                          <p key={i} className="text-sm text-theme-muted">
                            {m.medicineName} — {m.dosage}, {m.duration}, Qty: {m.quantity}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptPrescriptionOrder(order._id)} className="btn-primary text-sm">Accept</button>
                    <button onClick={() => handleRejectPrescriptionOrder(order._id)} className="btn-secondary text-sm text-red-600">Reject</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Active Prescription Orders (existing) ────────────────────────────── */}
      {activeTab === 'active' && (
        <div className="mt-6 space-y-4">
          {activePrescriptionOrders.length === 0 ? (
            <p className="text-theme-muted">No active prescription orders.</p>
          ) : (
            activePrescriptionOrders.map((order) => {
              const currentIdx = STATUS_FLOW.indexOf(order.status);
              const nextStatus = STATUS_FLOW[currentIdx + 1];
              return (
                <div key={order._id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-theme-heading">{order.userId?.name}</p>
                      <p className="text-sm text-theme-muted">{order.deliveryAddress}</p>
                      <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    {nextStatus && (
                      <button
                        onClick={() => handlePrescriptionStatusUpdate(order._id, nextStatus)}
                        className={`btn-primary text-sm ${
                          nextStatus === 'delivered' ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                      >
                        {nextStatus === 'delivered' ? 'Mark as Delivered' : `Mark as ${STATUS_LABELS[nextStatus]}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Prescription Order History (existing) ─────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="mt-6 space-y-3">
          {completedPrescriptionOrders.map((order) => (
            <div key={order._id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-theme-heading">{order.userId?.name}</p>
                <p className="text-xs text-theme-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
          ))}
          {completedPrescriptionOrders.length === 0 && <p className="text-theme-muted">No order history yet.</p>}
        </div>
      )}

      {/* ─── Profile Tab (existing) ───────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="card mt-6 grid gap-4 md:grid-cols-2">
          {['pharmacyName', 'ownerName', 'phone', 'address', 'city', 'district'].map((field) => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium capitalize text-theme-text">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input className="input-field" value={profileForm[field] || ''} onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })} />
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">Update Profile</button>
          </div>
        </form>
      )}
    </Layout>
  );
}
