import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import MedicineModal from '../components/MedicineModal';
import { pharmacyAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Premium Pharmacy-Isolated Components
import PharmacyHeroBanner from '../components/pharmacy/PharmacyHeroBanner';
import PharmacyStatCard from '../components/pharmacy/PharmacyStatCard';
import PharmacyMedicineCard from '../components/pharmacy/PharmacyMedicineCard';
import PharmacyRecentOrdersWidget from '../components/pharmacy/PharmacyRecentOrdersWidget';
import PharmacyLowStockWidget from '../components/pharmacy/PharmacyLowStockWidget';
import PharmacyMonthlySalesWidget from '../components/pharmacy/PharmacyMonthlySalesWidget';

const STATUS_FLOW = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_BADGES = {
  pending: 'bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/30',
  accepted: 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30',
  preparing: 'bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30',
  out_for_delivery: 'bg-[#F97316]/15 text-[#FB923C] border border-[#F97316]/30',
  delivered: 'bg-[#18D99B]/15 text-[#18D99B] border border-[#18D99B]/30',
  completed: 'bg-[#00C9E8]/15 text-[#00C9E8] border border-[#00C9E8]/30',
  cancelled: 'bg-[#FF6475]/15 text-[#FF6475] border border-[#FF6475]/30',
};

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function PharmacyDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  // Read URL query parameter ?tab= if present, otherwise default to 'inventory' to match reference image
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'inventory');
  const [loading, setLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({});

  // Prescription orders
  const [prescriptionOrders, setPrescriptionOrders] = useState([]);

  // Direct Marketplace orders
  const [directOrders, setDirectOrders] = useState([]);
  const [directOrdersFilter, setDirectOrdersFilter] = useState('All');
  const [directOrdersSearch, setDirectOrdersSearch] = useState('');
  const [ordersPaymentsTypeFilter, setOrdersPaymentsTypeFilter] = useState('All');

  // Inventory State
  const [inventory, setInventory] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('All Status');

  // Modal & Toast Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Sync activeTab when query string changes (e.g. from Sidebar links)
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
      console.error('Failed to load pharmacy dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Prescription Orders handlers (preserved) ──────────────────────────────
  const handleAcceptPrescriptionOrder = async (id) => {
    await pharmacyAPI.acceptOrder(id);
    loadData();
    setToastMessage('Prescription request accepted!');
  };

  const handleRejectPrescriptionOrder = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    await pharmacyAPI.rejectOrder(id, reason);
    loadData();
    setToastMessage('Prescription order rejected.');
  };

  const handlePrescriptionStatusUpdate = async (id, status) => {
    await pharmacyAPI.updateOrderStatus(id, { status });
    loadData();
    setToastMessage(`Prescription status updated to ${STATUS_LABELS[status] || status}!`);
  };

  const handleUpdatePrescriptionPaymentStatus = async (id, paymentStatus) => {
    if (!window.confirm(`Mark this prescription order as ${paymentStatus === 'paid' ? 'Paid' : paymentStatus}?`)) return;
    try {
      await pharmacyAPI.updatePrescriptionOrderPaymentStatus(id, paymentStatus);
      loadData();
      setToastMessage('Payment status updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment status.');
    }
  };

  // ─── Direct Orders handlers (preserved) ────────────────────────────────────
  const handleUpdateDirectStatus = async (id, status) => {
    let reason = '';
    if (status === 'cancelled') {
      reason = prompt('Reason for cancelling this order:') || 'Cancelled by pharmacy';
    }
    await pharmacyAPI.updateDirectOrderStatus(id, status, reason);
    loadData();
    setToastMessage(`Order status updated to ${STATUS_LABELS[status] || status}!`);
  };

  // ─── Inventory CRUD handlers (preserved) ───────────────────────────────────
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
      setToastMessage('Medicine deleted from inventory.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete medicine.');
    }
  };

  const handleModalSubmit = async (formData) => {
    if (editingMedicine) {
      await pharmacyAPI.updateInventoryItem(editingMedicine._id, formData);
      setToastMessage('Medicine item updated successfully!');
    } else {
      await pharmacyAPI.addInventoryItem(formData);
      setToastMessage('Medicine item added successfully!');
    }
    loadData();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    await pharmacyAPI.updateProfile(profileForm);
    loadData();
    setToastMessage('Pharmacy profile updated successfully!');
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
    let matchesStatus = true;
    if (inventoryStatusFilter === 'In Stock') matchesStatus = item.quantity >= 10;
    else if (inventoryStatusFilter === 'Low Stock') matchesStatus = item.quantity > 0 && item.quantity < 10;
    else if (inventoryStatusFilter === 'Out of Stock') matchesStatus = item.quantity === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const STANDARD_CATEGORIES = [
    'General', 'Antibiotics', 'Pain Relief', 'Antiseptic', 'Anti-inflammatory',
    'Vitamins & Supplements', 'Dental', 'Antifungal', 'Prescription', 'Other',
  ];
  const inventoryCategories = [
    'All Categories',
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

  if (loading && !profile) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Combine direct and prescription orders for recent orders widget
  const combinedRecentOrders = [
    ...directOrders.map((o) => ({ ...o, isDirect: true })),
    ...prescriptionOrders.map((o) => ({ ...o, isDirect: false })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Layout>
      <div className="pharmacy-dashboard-container max-w-[1580px] mx-auto space-y-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#D9AD56]/40 bg-[#0B1B2D]/95 px-5 py-3 text-sm font-semibold text-[#18D99B] shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-md"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18D99B]/20 text-xs">
                ✓
              </span>
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage('')}
                className="ml-2 rounded-lg p-1 text-[#94A9BF] hover:text-[#F8FAFC] transition"
                aria-label="Close notification"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PHASE 4: Premium Pharmacy Hero Banner ────────────────────────── */}
        <PharmacyHeroBanner pharmacyName={profile?.pharmacyName || 'Vandu Pharmacy'} />

        {/* ── PHASE 5: Pharmacy Statistics KPI Cards ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <PharmacyStatCard
            title="Total Medicines"
            value={inventory.length}
            iconType="pill"
            colorTheme="cyan"
            delay={0.05}
          />
          <PharmacyStatCard
            title="In Stock"
            value={inventory.filter((i) => i.quantity >= 10).length}
            iconType="box"
            colorTheme="green"
            delay={0.1}
          />
          <PharmacyStatCard
            title="Low Stock"
            value={inventory.filter((i) => i.quantity > 0 && i.quantity < 10).length}
            iconType="warning"
            colorTheme="amber"
            delay={0.15}
          />
          <PharmacyStatCard
            title="Total Orders"
            value={directOrders.length + prescriptionOrders.length}
            iconType="cart"
            colorTheme="purple"
            delay={0.2}
          />
        </div>

        {/* ── PHASE 6: Pill-Shaped Functional Tab Navigation ──────────────── */}
        <div className="mt-8">
          <div
            className={`flex flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-[#081525]/60 border border-[#D9AD56]/20'
                : 'bg-[#FFFFFF] border border-[#DCE4EC] shadow-sm'
            }`}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(`?tab=${tab.id}`, { replace: true });
                  }}
                  className={`relative rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 select-none ${
                    isActive
                      ? isDark
                        ? 'text-[#050B16] font-extrabold shadow-[0_0_20px_rgba(0,201,232,0.45)]'
                        : 'text-white font-extrabold shadow-[0_4px_14px_rgba(8,127,156,0.35)]'
                      : isDark
                        ? 'text-[#94A9BF] hover:text-[#F8FAFC] hover:bg-[#10243A]/40'
                        : 'text-[#52657A] hover:text-[#14243A] hover:bg-[#F8FAFC]'
                  }`}
                  style={{
                    background: isActive
                      ? isDark
                        ? 'linear-gradient(135deg, #00C9E8 0%, #0891B2 100%)'
                        : 'linear-gradient(135deg, #087F9C 0%, #065F75 100%)'
                      : 'transparent',
                    border: isActive
                      ? isDark
                        ? '1px solid #5CE1E6'
                        : '1px solid #087F9C'
                      : '1px solid transparent',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 ? (
                      <span className="rounded-full bg-[#FF6475] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {tab.count}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Tab Display Views ────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {/* ══════════ TAB 1: INVENTORY (Main Showcase) ══════════ */}
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Inventory Toolbar matching reference image */}
              <div
                className="p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.7) 0%, rgba(11, 27, 45, 0.8) 100%)'
                    : '#FFFFFF',
                  border: isDark
                    ? '1px solid rgba(217, 173, 86, 0.28)'
                    : '1px solid rgba(198, 156, 72, 0.28)',
                  boxShadow: isDark
                    ? 'none'
                    : '0 4px 20px rgba(20, 36, 58, 0.05)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Search input with search icon */}
                <div className="relative flex-1 w-full">
                  <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search inventory medicines..."
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl transition-all shadow-inner focus:outline-none ${
                      isDark
                        ? 'bg-[#081525]/80 border border-[#D9AD56]/30 text-[#F8FAFC] placeholder:text-[#94A9BF]/70 focus:border-[#00C9E8] focus:ring-1 focus:ring-[#00C9E8]'
                        : 'bg-[#F8FAFC] border border-[#DCE4EC] text-[#14243A] placeholder:text-[#52657A] focus:border-[#087F9C] focus:ring-1 focus:ring-[#087F9C]'
                    }`}
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>

                {/* Filter Dropdowns & Add Medicine Button */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Category Dropdown */}
                  <select
                    className={`px-3.5 py-2.5 text-xs sm:text-sm rounded-xl transition shadow-inner focus:outline-none ${
                      isDark
                        ? 'bg-[#081525]/90 border border-[#D9AD56]/30 text-[#F8FAFC] focus:border-[#00C9E8]'
                        : 'bg-[#F8FAFC] border border-[#DCE4EC] text-[#14243A] focus:border-[#087F9C]'
                    }`}
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                  >
                    {inventoryCategories.map((cat) => (
                      <option
                        key={cat}
                        value={cat === 'All Categories' ? 'All' : cat}
                        className={isDark ? 'bg-[#0B1B2D] text-[#F8FAFC]' : 'bg-[#FFFFFF] text-[#14243A]'}
                      >
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Stock Status Dropdown */}
                  <select
                    className={`px-3.5 py-2.5 text-xs sm:text-sm rounded-xl transition shadow-inner focus:outline-none ${
                      isDark
                        ? 'bg-[#081525]/90 border border-[#D9AD56]/30 text-[#F8FAFC] focus:border-[#00C9E8]'
                        : 'bg-[#F8FAFC] border border-[#DCE4EC] text-[#14243A] focus:border-[#087F9C]'
                    }`}
                    value={inventoryStatusFilter}
                    onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  >
                    <option value="All Status" className={isDark ? 'bg-[#0B1B2D] text-[#F8FAFC]' : 'bg-[#FFFFFF] text-[#14243A]'}>All Status</option>
                    <option value="In Stock" className={isDark ? 'bg-[#0B1B2D] text-[#18D99B]' : 'bg-[#FFFFFF] text-[#16835D]'}>In Stock</option>
                    <option value="Low Stock" className={isDark ? 'bg-[#0B1B2D] text-[#F5B942]' : 'bg-[#FFFFFF] text-[#A66A10]'}>Low Stock</option>
                    <option value="Out of Stock" className={isDark ? 'bg-[#0B1B2D] text-[#FF6475]' : 'bg-[#FFFFFF] text-[#C83F4F]'}>Out of Stock</option>
                  </select>

                  {/* Add Medicine Button matching reference image */}
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all hover:brightness-110 active:scale-95 shrink-0 ${
                      isDark
                        ? 'text-[#050B16] shadow-[0_0_20px_rgba(0,201,232,0.4)]'
                        : 'text-white shadow-[0_4px_14px_rgba(8,127,156,0.35)]'
                    }`}
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #00C9E8 0%, #0891B2 100%)'
                        : 'linear-gradient(135deg, #087F9C 0%, #065F75 100%)',
                    }}
                  >
                    <span className="text-base leading-none font-extrabold">+</span>
                    <span>Add Medicine</span>
                  </button>
                </div>
              </div>

              {/* Medicine Cards Grid (5-column on large screens matching reference) */}
              {filteredInventory.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center border border-[#D9AD56]/20 bg-[#0B1B2D]/60"
                  style={{ backdropFilter: 'blur(12px)' }}
                >
                  <p className="text-5xl mb-3">💊</p>
                  <h3 className="text-lg font-bold text-[#F8FAFC]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    No medicines match the selected filter
                  </h3>
                  <p className="text-sm text-[#94A9BF] mt-1">
                    Try adjusting your search terms or click &ldquo;Add Medicine&rdquo; to expand your inventory.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredInventory.map((item) => (
                    <PharmacyMedicineCard
                      key={item._id}
                      medicine={item}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteMedicine}
                    />
                  ))}
                </div>
              )}

              {/* ── PHASE 7: Bottom Dashboard Widgets matching reference ────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
                <PharmacyRecentOrdersWidget
                  orders={combinedRecentOrders}
                  onViewAll={() => {
                    setActiveTab('direct-orders');
                    navigate('?tab=direct-orders', { replace: true });
                  }}
                />
                <PharmacyLowStockWidget
                  items={inventory}
                  onViewAll={() => {
                    setInventoryStatusFilter('Low Stock');
                  }}
                  onRestock={handleOpenEditModal}
                />
                <PharmacyMonthlySalesWidget
                  directOrders={directOrders}
                  prescriptionOrders={prescriptionOrders}
                />
              </div>

              {/* Medicine Add/Edit Modal */}
              <MedicineModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                medicine={editingMedicine}
              />
            </motion.div>
          )}

          {/* ══════════ TAB 2: MARKETPLACE ORDERS ══════════ */}
          {activeTab === 'direct-orders' && (
            <motion.div
              key="direct-orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Search & status filters toolbar */}
              <div
                className="p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between transition-colors"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.7) 0%, rgba(11, 27, 45, 0.8) 100%)'
                    : '#FFFFFF',
                  border: isDark
                    ? '1px solid rgba(217, 173, 86, 0.28)'
                    : '1px solid rgba(198, 156, 72, 0.28)',
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(20, 36, 58, 0.05)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Search by customer name, order ID, or medicine..."
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl transition shadow-inner focus:outline-none ${
                      isDark
                        ? 'bg-[#081525]/80 border border-[#D9AD56]/30 text-[#F8FAFC] placeholder:text-[#94A9BF]/70 focus:border-[#00C9E8]'
                        : 'bg-[#F8FAFC] border border-[#DCE4EC] text-[#14243A] placeholder:text-[#52657A] focus:border-[#087F9C]'
                    }`}
                    value={directOrdersSearch}
                    onChange={(e) => setDirectOrdersSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                  {['All', 'pending', 'accepted', 'out_for_delivery', 'delivered', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setDirectOrdersFilter(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                        directOrdersFilter === status
                          ? isDark
                            ? 'bg-[#00C9E8] text-[#050B16] font-bold shadow-[0_0_12px_rgba(0,201,232,0.4)]'
                            : 'bg-[#087F9C] text-white font-bold shadow-[0_4px_12px_rgba(8,127,156,0.35)]'
                          : isDark
                            ? 'bg-[#10243A]/60 text-[#94A9BF] hover:bg-[#10243A] hover:text-[#F8FAFC] border border-[#D9AD56]/20'
                            : 'bg-[#F8FAFC] text-[#52657A] hover:bg-[#FFFFFF] hover:text-[#14243A] border border-[#DCE4EC]'
                      }`}
                    >
                      {STATUS_LABELS[status] || status}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDirectOrders.length === 0 ? (
                <div className={`rounded-2xl text-center py-12 backdrop-blur-md border ${
                  isDark
                    ? 'text-[#94A9BF] border-[#D9AD56]/20 bg-[#0B1B2D]/60'
                    : 'text-[#52657A] border-[#DCE4EC] bg-[#FFFFFF] shadow-sm'
                }`}>
                  <p className="text-4xl mb-2">📋</p>
                  <p className={`font-semibold text-lg ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>No marketplace orders found</p>
                  <p className="text-sm mt-1">Incoming marketplace orders will appear here automatically.</p>
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
                        className="rounded-2xl p-5 space-y-4 transition duration-200"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
                            : '#FFFFFF',
                          border: isDark
                            ? '1px solid rgba(217, 173, 86, 0.28)'
                            : '1px solid rgba(198, 156, 72, 0.28)',
                          boxShadow: isDark
                            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                            : '0 8px 24px rgba(20, 36, 58, 0.06)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className={`font-bold text-base ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Order #{order._id.slice(-8)}
                              </span>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[order.status]}`}>
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                              Placed: {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs block ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>Total Amount</span>
                            <span
                              className="text-lg font-bold bg-clip-text text-transparent"
                              style={{
                                fontFamily: 'Outfit, sans-serif',
                                backgroundImage: isDark
                                  ? 'linear-gradient(135deg, #FFFFFF 30%, #F4D58D 100%)'
                                  : 'linear-gradient(135deg, #14243A 30%, #8C6D23 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                color: 'transparent',
                              }}
                            >
                              Rs. {order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className={`grid gap-4 sm:grid-cols-3 text-xs py-3 px-3.5 rounded-xl border-t border-b ${
                          isDark
                            ? 'text-[#94A9BF] border-[#D9AD56]/15 bg-[#081525]/40'
                            : 'text-[#52657A] border-[#DCE4EC] bg-[#F8FAFC]'
                        }`}>
                          <div>
                            <span className={`font-bold block ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Customer</span>
                            <p className={`font-medium mt-0.5 ${isDark ? 'text-[#F8FAFC]/90' : 'text-[#14243A]/90'}`}>{order.customerName}</p>
                          </div>
                          <div>
                            <span className={`font-bold block ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Contact</span>
                            <p className={`font-medium mt-0.5 ${isDark ? 'text-[#F8FAFC]/90' : 'text-[#14243A]/90'}`}>{order.contactNumber}</p>
                          </div>
                          <div>
                            <span className={`font-bold block ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Delivery Address</span>
                            <p className={`font-medium mt-0.5 break-words ${isDark ? 'text-[#F8FAFC]/90' : 'text-[#14243A]/90'}`}>{order.deliveryAddress}</p>
                          </div>
                        </div>

                        {/* Medicines Ordered */}
                        <div className="space-y-2">
                          <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Items Ordered</span>
                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className={`flex justify-between items-center text-sm border-b pb-1.5 ${isDark ? 'border-[#D9AD56]/10' : 'border-[#DCE4EC]'}`}>
                                <div>
                                  <span className={`font-semibold ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>{item.medicineName}</span>
                                  <span className={`text-xs ml-2 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>({item.category})</span>
                                </div>
                                <span className={`text-sm font-mono ${isDark ? 'text-[#F4D58D]' : 'text-[#8C6D23]'}`}>
                                  Rs. {item.unitPrice.toFixed(2)} × {item.quantity} = Rs. {item.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes / Reason */}
                        {order.notes && (
                          <div className={`text-xs p-2.5 rounded-lg border ${isDark ? 'bg-[#081525]/50 border-[#D9AD56]/20' : 'bg-[#F8FAFC] border-[#DCE4EC]'}`}>
                            <span className={`font-bold block ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Customer Note:</span>
                            <p className={`italic mt-0.5 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>{order.notes}</p>
                          </div>
                        )}

                        {order.rejectionReason && (
                          <div className="text-xs bg-[#FF6475]/10 p-2.5 rounded-lg border border-[#FF6475]/30 text-[#FF6475]">
                            <span className="font-bold block">Cancellation Reason:</span>
                            <p className="italic mt-0.5">{order.rejectionReason}</p>
                          </div>
                        )}

                        {/* Status change actions */}
                        <div className={`flex flex-wrap justify-end gap-2.5 pt-2 border-t ${isDark ? 'border-[#D9AD56]/15' : 'border-[#DCE4EC]'}`}>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateDirectStatus(order._id, 'cancelled')}
                                className="rounded-xl bg-[#FF6475]/10 hover:bg-[#FF6475]/20 border border-[#FF6475]/30 text-[#FF6475] px-4 py-2 text-xs font-semibold transition"
                              >
                                Cancel Order
                              </button>
                              {nextStatus && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDirectStatus(order._id, nextStatus)}
                                  className={`rounded-xl py-2 px-5 text-xs font-bold transition shadow-md ${
                                    nextStatus === 'delivered'
                                      ? 'bg-[#18D99B] text-[#050B16] hover:brightness-110 shadow-[0_0_15px_rgba(24,217,155,0.4)]'
                                      : isDark
                                        ? 'bg-[#00C9E8] text-[#050B16] hover:brightness-110 shadow-[0_0_15px_rgba(0,201,232,0.4)]'
                                        : 'bg-[#087F9C] text-white hover:brightness-110 shadow-[0_4px_12px_rgba(8,127,156,0.35)]'
                                  }`}
                                >
                                  {nextStatus === 'delivered' ? 'Mark as Delivered' : `Advance to: ${STATUS_LABELS[nextStatus]}`}
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

          {/* ══════════ TAB 3: ORDERS & PAYMENTS ══════════ */}
          {activeTab === 'orders-payments' && (
            <motion.div
              key="orders-payments"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Filter Pills */}
              <div
                className="flex flex-wrap gap-2 items-center justify-between p-3.5 rounded-2xl transition-colors"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.7) 0%, rgba(11, 27, 45, 0.8) 100%)'
                    : '#FFFFFF',
                  border: isDark
                    ? '1px solid rgba(217, 173, 86, 0.28)'
                    : '1px solid rgba(198, 156, 72, 0.28)',
                  boxShadow: isDark ? 'none' : '0 4px 20px rgba(20, 36, 58, 0.05)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>Filter By Type:</span>
                  {['All', 'Marketplace', 'Prescription'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrdersPaymentsTypeFilter(type)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        ordersPaymentsTypeFilter === type
                          ? isDark
                            ? 'bg-[#00C9E8] text-[#050B16] font-bold shadow-[0_0_12px_rgba(0,201,232,0.4)]'
                            : 'bg-[#087F9C] text-white font-bold shadow-[0_4px_12px_rgba(8,127,156,0.35)]'
                          : isDark
                            ? 'bg-[#10243A]/60 text-[#94A9BF] hover:text-[#F8FAFC] border border-[#D9AD56]/20'
                            : 'bg-[#F8FAFC] text-[#52657A] hover:text-[#14243A] border border-[#DCE4EC]'
                      }`}
                    >
                      {type} Orders
                    </button>
                  ))}
                </div>
                <span className={`text-xs ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                  Showing {combinedRecentOrders.length} orders
                </span>
              </div>

              {/* Table */}
              <div
                className="overflow-x-auto rounded-2xl shadow-xl transition-colors"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
                    : '#FFFFFF',
                  border: isDark
                    ? '1px solid rgba(217, 173, 86, 0.28)'
                    : '1px solid rgba(198, 156, 72, 0.28)',
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                    : '0 8px 24px rgba(20, 36, 58, 0.06)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <table className={`w-full border-collapse text-left text-sm ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>
                  <thead>
                    <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                      isDark
                        ? 'border-[#D9AD56]/20 bg-[#081525]/60 text-[#94A9BF]'
                        : 'border-[#DCE4EC] bg-[#F8FAFC] text-[#52657A]'
                    }`}>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Customer Name</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Type</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Order ID</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">Ordered Products / Rx</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Payment Method</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Payment Status</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Order Status</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Order Date</th>
                      <th className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-[#D9AD56]/10' : 'divide-y divide-[#DCE4EC]'}>
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
                        <tr key={order._id} className={`transition duration-150 ${isDark ? 'hover:bg-[#10243A]/40' : 'hover:bg-[#F8FAFC]'}`}>
                          <td className={`px-3.5 py-3 xl:px-5 xl:py-3.5 font-semibold whitespace-nowrap ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>
                            {order.customerName}
                          </td>
                          <td className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">
                            <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              order.isDirect
                                ? isDark
                                  ? 'bg-[#00C9E8]/15 text-[#00C9E8] border border-[#00C9E8]/30'
                                  : 'bg-[#087F9C]/10 text-[#087F9C] border border-[#087F9C]/30'
                                : 'bg-[#C084FC]/15 text-[#8B5CF6] border border-[#8B5CF6]/30'
                            }`}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className={`px-3.5 py-3 xl:px-5 xl:py-3.5 font-mono text-xs font-semibold whitespace-nowrap ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                            #{order._id.slice(-8)}
                          </td>
                          <td className="px-3.5 py-3 xl:px-5 xl:py-3.5">
                            <div className={`max-w-[200px] xl:max-w-xs truncate font-medium ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`} title={order.itemsSummary}>
                              {order.itemsSummary}
                            </div>
                          </td>
                          <td className={`px-3.5 py-3 xl:px-5 xl:py-3.5 font-bold uppercase text-xs whitespace-nowrap ${isDark ? 'text-[#F4D58D]' : 'text-[#8C6D23]'}`}>
                            {order.paymentMethod === 'card' ? '💳 Card' : '💵 COD'}
                          </td>
                          <td className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-[#18D99B]/15 text-[#18D99B] border-[#18D99B]/30'
                                  : isDark
                                    ? 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30'
                                    : 'bg-[#A66A10]/10 text-[#A66A10] border-[#A66A10]/25'
                              }`}
                            >
                              {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">
                            <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGES[order.orderStatus]}`}>
                              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                            </span>
                          </td>
                          <td className={`px-3.5 py-3 xl:px-5 xl:py-3.5 text-xs whitespace-nowrap ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3.5 py-3 xl:px-5 xl:py-3.5 whitespace-nowrap">
                            {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm('Mark this COD order as Paid?')) {
                                    try {
                                      if (order.isDirect) {
                                        await pharmacyAPI.updateDirectOrderPaymentStatus(order._id, 'paid');
                                      } else {
                                        await pharmacyAPI.updatePrescriptionOrderPaymentStatus(order._id, 'paid');
                                      }
                                      loadData();
                                      setToastMessage('Marked as Paid successfully!');
                                    } catch (err) {
                                      alert(err.response?.data?.message || 'Failed to update payment status.');
                                    }
                                  }
                                }}
                                className="whitespace-nowrap rounded-lg bg-[#18D99B]/15 hover:bg-[#18D99B]/25 border border-[#18D99B]/40 text-[#18D99B] px-3 py-1.5 text-xs font-bold transition cursor-pointer"
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
            </motion.div>
          )}

          {/* ══════════ TAB 4: PRESCRIPTION REQUESTS ══════════ */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {pendingPrescriptionOrders.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border backdrop-blur-md ${
                  isDark
                    ? 'text-[#94A9BF] border-[#D9AD56]/20 bg-[#0B1B2D]/60'
                    : 'text-[#52657A] border-[#DCE4EC] bg-[#FFFFFF] shadow-sm'
                }`}>
                  <p className="text-4xl mb-2">📝</p>
                  <p className={`font-semibold text-lg ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>No pending prescription requests</p>
                </div>
              ) : (
                pendingPrescriptionOrders.map((order, i) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-5 transition-colors"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
                        : '#FFFFFF',
                      border: isDark
                        ? '1px solid rgba(217, 173, 86, 0.28)'
                        : '1px solid rgba(198, 156, 72, 0.28)',
                      boxShadow: isDark
                        ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                        : '0 8px 24px rgba(20, 36, 58, 0.06)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className={`font-bold text-lg ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {order.userId?.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                          {order.userId?.phone} · {order.userId?.email}
                        </p>
                        <div className={`mt-3 text-sm space-y-1 p-3.5 rounded-xl border ${
                          isDark
                            ? 'bg-[#081525]/40 border-[#D9AD56]/15'
                            : 'bg-[#F8FAFC] border-[#DCE4EC]'
                        }`}>
                          <p><span className={`font-bold text-xs uppercase tracking-wider block mb-1 ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Delivery Address</span> <span className={isDark ? 'text-[#F8FAFC]/90' : 'text-[#14243A]/90'}>{order.deliveryAddress}</span></p>
                          <p className="mt-2"><span className={`font-bold text-xs uppercase tracking-wider block mb-1 ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Total Bill</span> <span className={`font-bold ${isDark ? 'text-[#F4D58D]' : 'text-[#8C6D23]'}`}>Rs. {order.totalAmount?.toFixed(2) || '0.00'}</span></p>
                          <div className={`mt-2 pt-2 border-t flex flex-wrap items-center gap-2 ${isDark ? 'border-[#D9AD56]/15' : 'border-[#DCE4EC]'}`}>
                            <span className={`text-xs font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>Payment:</span>
                            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                              {order.paymentMethod === 'card' ? '💳 Card (Paid Online)' : '💵 Cash on Delivery'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-[#18D99B]/15 text-[#18D99B] border-[#18D99B]/30'
                                  : isDark
                                    ? 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30'
                                    : 'bg-[#A66A10]/10 text-[#A66A10] border-[#A66A10]/25'
                              }`}
                            >
                              {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Payment Pending'}
                            </span>
                          </div>
                        </div>
                        {order.prescriptionId?.medicines && (
                          <div className="mt-4">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-[#00C9E8]' : 'text-[#087F9C]'}`}>Prescribed Medicines:</p>
                            <div className="space-y-1.5 pl-2">
                              {order.prescriptionId.medicines.map((m, idx) => (
                                <div key={idx} className={`text-sm flex items-center gap-2 ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-[#00C9E8]' : 'bg-[#087F9C]'}`} />
                                  <span>{m.medicineName} — <span className={isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}>{m.dosage}, {m.duration}, Qty: {m.quantity}</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptPrescriptionOrder(order._id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition hover:brightness-110 ${
                            isDark
                              ? 'text-[#050B16] bg-[#00C9E8] shadow-[0_0_15px_rgba(0,201,232,0.4)]'
                              : 'text-white bg-[#087F9C] shadow-[0_4px_12px_rgba(8,127,156,0.35)]'
                          }`}
                        >
                          Accept Request
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPrescriptionOrder(order._id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#FF6475] bg-[#FF6475]/10 border border-[#FF6475]/30 hover:bg-[#FF6475]/20 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ══════════ TAB 5: ACTIVE PRESCRIPTION ORDERS ══════════ */}
          {activeTab === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {activePrescriptionOrders.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border backdrop-blur-md ${
                  isDark
                    ? 'text-[#94A9BF] border-[#D9AD56]/20 bg-[#0B1B2D]/60'
                    : 'text-[#52657A] border-[#DCE4EC] bg-[#FFFFFF] shadow-sm'
                }`}>
                  <p className="text-4xl mb-2">🚚</p>
                  <p className={`font-semibold text-lg ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>No active prescription orders</p>
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
                      className="rounded-2xl p-5 transition-colors"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
                          : '#FFFFFF',
                        border: isDark
                          ? '1px solid rgba(217, 173, 86, 0.28)'
                          : '1px solid rgba(198, 156, 72, 0.28)',
                        boxShadow: isDark
                          ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                          : '0 8px 24px rgba(20, 36, 58, 0.06)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className={`font-bold text-lg ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {order.userId?.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>{order.deliveryAddress}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGES[order.status]}`}>
                              {STATUS_LABELS[order.status]}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-[#18D99B]/15 text-[#18D99B] border-[#18D99B]/30'
                                  : isDark
                                    ? 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/30'
                                    : 'bg-[#A66A10]/10 text-[#A66A10] border-[#A66A10]/25'
                              }`}
                            >
                              {order.paymentMethod === 'card' ? '💳 Card' : '💵 COD'} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                            {order.paymentStatus === 'pending' && order.paymentMethod === 'cod' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePrescriptionPaymentStatus(order._id, 'paid')}
                                className="rounded-lg bg-[#18D99B]/15 hover:bg-[#18D99B]/25 border border-[#18D99B]/40 text-[#18D99B] px-2 py-0.5 text-[10px] font-bold transition cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </div>
                        {nextStatus && (
                          <button
                            type="button"
                            onClick={() => handlePrescriptionStatusUpdate(order._id, nextStatus)}
                            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-md ${
                              nextStatus === 'delivered'
                                ? 'bg-[#18D99B] text-[#050B16] hover:brightness-110 shadow-[0_0_15px_rgba(24,217,155,0.4)]'
                                : isDark
                                  ? 'bg-[#00C9E8] text-[#050B16] hover:brightness-110 shadow-[0_0_15px_rgba(0,201,232,0.4)]'
                                  : 'bg-[#087F9C] text-white hover:brightness-110 shadow-[0_4px_12px_rgba(8,127,156,0.35)]'
                            }`}
                          >
                            {nextStatus === 'delivered' ? 'Mark as Delivered' : `Advance to: ${STATUS_LABELS[nextStatus]}`}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ══════════ TAB 6: PRESCRIPTION ORDER HISTORY ══════════ */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {completedPrescriptionOrders.map((order, i) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4 flex items-center justify-between transition duration-150"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
                      : '#FFFFFF',
                    border: isDark
                      ? '1px solid rgba(217, 173, 86, 0.28)'
                      : '1px solid rgba(198, 156, 72, 0.28)',
                    boxShadow: isDark
                      ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                      : '0 8px 24px rgba(20, 36, 58, 0.06)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>{order.userId?.name}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                      Completed: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </motion.div>
              ))}
              {completedPrescriptionOrders.length === 0 && (
                <div className={`text-center py-12 rounded-2xl border backdrop-blur-md ${
                  isDark
                    ? 'text-[#94A9BF] border-[#D9AD56]/20 bg-[#0B1B2D]/60'
                    : 'text-[#52657A] border-[#DCE4EC] bg-[#FFFFFF] shadow-sm'
                }`}>
                  <p className="text-4xl mb-2">📁</p>
                  <p className={`font-semibold text-lg ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>No prescription order history yet</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB 7: PHARMACY PROFILE ══════════ */}
          {activeTab === 'profile' && (
            <motion.form
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleProfileUpdate}
              className="rounded-2xl p-6 grid gap-5 md:grid-cols-2 transition-colors"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
                  : '#FFFFFF',
                border: isDark
                  ? '1px solid rgba(217, 173, 86, 0.28)'
                  : '1px solid rgba(198, 156, 72, 0.28)',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                  : '0 8px 24px rgba(20, 36, 58, 0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className={`md:col-span-2 border-b pb-4 mb-1 ${isDark ? 'border-[#D9AD56]/15' : 'border-[#DCE4EC]'}`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Pharmacy Profile
                </h2>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                  Manage your pharmacy business details, credentials, and dispatch address.
                </p>
              </div>

              {['pharmacyName', 'ownerName', 'phone', 'address', 'city', 'district'].map((field) => (
                <div key={field}>
                  <label className={`mb-2 block text-xs sm:text-sm font-semibold capitalize ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}>
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none shadow-inner ${
                      isDark
                        ? 'border-[#D9AD56]/30 bg-[#081525]/80 text-[#F8FAFC] placeholder:text-[#94A9BF]/60 focus:border-[#00C9E8] focus:ring-1 focus:ring-[#00C9E8]'
                        : 'border-[#DCE4EC] bg-[#F8FAFC] text-[#14243A] placeholder:text-[#52657A]/60 focus:border-[#087F9C] focus:ring-1 focus:ring-[#087F9C]'
                    }`}
                    value={profileForm[field] || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                  />
                </div>
              ))}

              <div className={`md:col-span-2 pt-3 border-t ${isDark ? 'border-[#D9AD56]/15' : 'border-[#DCE4EC]'}`}>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition active:scale-95 ${
                    isDark
                      ? 'text-[#050B16] bg-[#00C9E8] shadow-[0_0_20px_rgba(0,201,232,0.4)] hover:brightness-110'
                      : 'text-white bg-[#087F9C] shadow-[0_4px_14px_rgba(8,127,156,0.35)] hover:brightness-110'
                  }`}
                >
                  Update Profile Settings
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
