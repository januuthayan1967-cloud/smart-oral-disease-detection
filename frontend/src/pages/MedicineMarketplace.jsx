import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import MedicineCard from '../components/MedicineCard';
import { medicineMarketAPI, cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MedicineMarketplace() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: search.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      };
      const { data } = await medicineMarketAPI.getAll(params);
      setMedicines(data.data || []);
      setTotalPages(data.totalPages || 1);
      if (data.categories) {
        setCategories(['All', ...data.categories]);
      }
    } catch (err) {
      setErrorMsg('Failed to load medicines from marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMedicines();
  };

  const handleAddToCart = async (med) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (med.quantity < 1) {
      setErrorMsg('This item is currently out of stock.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    try {
      setAddingId(med.itemId);
      setSuccessMsg('');
      setErrorMsg('');

      await cartAPI.add({
        pharmacyId: med.pharmacyId,
        inventoryItemId: med.itemId,
        quantity: 1,
      });

      setSuccessMsg(`Added "${med.medicineName}" to your cart!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add item to cart.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading">Medicine Marketplace</h1>
          <p className="mt-1 text-theme-muted">Order essential dental and general medicines directly from approved pharmacies</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/cart" className="btn-secondary px-5 py-2.5 flex items-center gap-2 text-sm font-semibold shadow-glow border border-theme-border/50">
            <span>🛒</span>
            <span>View Cart</span>
          </Link>
          <Link to="/direct-orders" className="btn-secondary px-5 py-2.5 text-sm font-semibold border border-theme-border/50">
            📋 My Orders
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 rounded-xl p-3 text-sm flex items-center gap-2 transition" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-xl p-3 text-sm flex items-center gap-2 transition" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="card mb-8 border border-theme-border/40 bg-theme-surface/40 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search medicine name, description, active ingredients..."
              className="input-field w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Search Button */}
          <button type="submit" className="btn-primary px-6 py-3 text-sm font-semibold shadow-glow">
            Search
          </button>
        </form>

        {/* Category Pill Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.length > 0
            ? categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    selectedCategory === cat
                      ? 'bg-theme-accent text-theme-primary shadow-glow'
                      : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text border border-theme-border/20'
                  }`}
                >
                  {cat}
                </button>
              ))
            : ['All', 'General', 'Antibiotics', 'Pain Relief', 'Dental'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    selectedCategory === cat
                      ? 'bg-theme-accent text-theme-primary'
                      : 'bg-theme-surface/50 text-theme-muted border border-theme-border/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
        </div>
      </div>

      {/* Medicines Card Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : medicines.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center text-theme-muted">
          <span className="text-5xl mb-4">💊</span>
          <h3 className="text-xl font-bold text-theme-heading">No Medicines Found</h3>
          <p className="mt-1 text-sm">We couldn&apos;t find any medicines matching your search criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setPage(1);
            }}
            className="btn-primary mt-4 px-5 py-2 text-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {medicines.map((med) => (
              <MedicineCard
                key={med.itemId}
                medicine={med}
                onAddToCart={handleAddToCart}
                isAdding={addingId === med.itemId}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-theme-muted">
                Page <strong className="text-theme-heading">{page}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
