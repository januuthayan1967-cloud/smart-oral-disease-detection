import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { adminAPI } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [pendingDentists, setPendingDentists] = useState([]);
  const [dentistForm, setDentistForm] = useState({
    name: '', email: '', password: '', qualification: '', specialization: '', experience: '', contact: '', professionalLicenseNumber: '',
  });

  const loadDashboard = () => {
    adminAPI.getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const loadTabData = async (tab) => {
    if (tab === 'users') {
      const { data: res } = await adminAPI.getUsers();
      setUsers(res.data);
    } else if (tab === 'pharmacies') {
      const { data: res } = await adminAPI.getPharmacyApplications();
      setPharmacies(res.data);
    } else if (tab === 'dentists') {
      const { data: res } = await adminAPI.getDentists();
      setDentists(res.data);
    } else if (tab === 'dentist-approvals') {
      const { data: res } = await adminAPI.getPendingDentists();
      setPendingDentists(res.data);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (activeTab !== 'overview') loadTabData(activeTab);
  }, [activeTab]);

  const handleApprovePharmacy = async (id) => {
    await adminAPI.approvePharmacy(id);
    loadTabData('pharmacies');
    loadDashboard();
  };

  const handleRejectPharmacy = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason !== null) {
      await adminAPI.rejectPharmacy(id, reason);
      loadTabData('pharmacies');
    }
  };

  const handleCreateDentist = async (e) => {
    e.preventDefault();
    await adminAPI.createDentist({ ...dentistForm, experience: parseInt(dentistForm.experience, 10) });
    setDentistForm({ name: '', email: '', password: '', qualification: '', specialization: '', experience: '', contact: '', professionalLicenseNumber: '' });
    loadTabData('dentists');
    alert('Dentist account created! Credentials sent via email notification.');
  };

  const handleDeleteDentist = async (id) => {
    if (!confirm('Delete this dentist?')) return;
    await adminAPI.deleteDentist(id);
    loadTabData('dentists');
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await adminAPI.deleteUser(id);
    loadTabData('users');
  };

  const handleApproveDentist = async (id) => {
    await adminAPI.approveDentist(id);
    loadTabData('dentist-approvals');
    loadDashboard();
  };

  const handleRejectDentist = async (id) => {
    if (!confirm('Reject this dentist application?')) return;
    await adminAPI.rejectDentist(id);
    loadTabData('dentist-approvals');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'dentists', label: 'Dentists' },
    { id: 'pharmacies', label: 'Pharmacy Applications' },
    { id: 'dentist-approvals', label: '🦷 Dentist Approvals' },
  ];

  if (loading && activeTab === 'overview') return <Layout><LoadingSpinner /></Layout>;

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const diseaseChart = {
    labels: charts.diseaseDistribution?.map((d) => d.disease) || [],
    datasets: [{
      data: charts.diseaseDistribution?.map((d) => d.count) || [],
      backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    }],
  };

  const monthlyChart = {
    labels: charts.monthlyPredictions?.map((m) => m.month) || [],
    datasets: [{
      label: 'Predictions',
      data: charts.monthlyPredictions?.map((m) => m.count) || [],
      backgroundColor: '#14b8a6',
    }],
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
    { label: 'Total Dentists', value: stats.totalDentists, icon: '👨‍⚕️' },
    { label: 'Approved Pharmacies', value: stats.totalPharmacies, icon: '💊' },
    { label: 'Pending Pharmacies', value: stats.pendingPharmacies, icon: '⏳' },
    { label: 'Total Predictions', value: stats.totalPredictions, icon: '🔬' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦' },
    { label: 'Appointments', value: stats.totalAppointments, icon: '📅' },
    { label: 'Content Items', value: stats.totalContent, icon: '📚' },
  ];

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-theme-heading">Admin Dashboard</h1>
      <p className="mt-1 text-theme-muted">System overview and management</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-theme-border/40 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-theme-accent text-theme-primary' : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text'
            }`}
          >
            {tab.label}
            {tab.id === 'pharmacies' && stats.pendingPharmacies > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{stats.pendingPharmacies}</span>
            )}
            {tab.id === 'dentist-approvals' && pendingDentists.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs text-white">{pendingDentists.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className="card flex items-center gap-4">
                <span className="text-3xl">{card.icon}</span>
                <div>
                  <p className="text-sm text-theme-muted">{card.label}</p>
                  <p className="text-2xl font-bold text-theme-heading">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-theme-heading">Disease Distribution</h2>
              {charts.diseaseDistribution?.length > 0 ? (
                <Doughnut data={diseaseChart} />
              ) : (
                <p className="text-sm text-theme-muted">No prediction data yet.</p>
              )}
            </div>
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-theme-heading">Monthly Predictions</h2>
              {charts.monthlyPredictions?.length > 0 ? (
                <Bar data={monthlyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              ) : (
                <p className="text-sm text-theme-muted">No monthly data yet.</p>
              )}
            </div>
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-theme-heading">Order Statistics</h2>
              <div className="space-y-3">
                {charts.orderStats?.map((o) => (
                  <div key={o.status} className="flex items-center justify-between rounded-lg bg-theme-surface/50 p-3">
                    <span className="capitalize text-theme-text">{o.status?.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-theme-heading">{o.count}</span>
                  </div>
                ))}
                {!charts.orderStats?.length && <p className="text-sm text-theme-muted">No order data yet.</p>}
              </div>
            </div>
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-theme-heading">Consultation Statistics</h2>
              <div className="space-y-3">
                {charts.consultationStats?.map((c) => (
                  <div key={c.status} className="flex items-center justify-between rounded-lg bg-theme-surface/50 p-3">
                    <span className="capitalize text-theme-text">{c.status}</span>
                    <span className="font-bold text-theme-heading">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="mt-6 space-y-3">
          {users.map((u) => (
            <div key={u._id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-theme-heading">{u.name}</p>
                <p className="text-sm text-theme-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-theme-border/50 bg-theme-surface/60 px-3 py-1 text-xs capitalize text-theme-text">{u.role}</span>
                {u.role !== 'admin' && (
                  <button onClick={() => handleDeleteUser(u._id)} className="text-sm text-red-400 hover:underline">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dentists' && (
        <div className="mt-6">
          <form onSubmit={handleCreateDentist} className="card mb-6 grid gap-4 md:grid-cols-3">
            <h2 className="md:col-span-3 font-semibold text-theme-heading">Create Dentist Account</h2>
            {['name', 'email', 'password', 'qualification', 'specialization', 'experience', 'contact', 'professionalLicenseNumber'].map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium capitalize text-theme-text">
                  {field === 'professionalLicenseNumber' ? 'Professional License Number' : field}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'experience' ? 'number' : field === 'email' ? 'email' : 'text'}
                  className="input-field"
                  value={dentistForm[field]}
                  onChange={(e) => setDentistForm({ ...dentistForm, [field]: e.target.value })}
                  required
                />
              </div>
            ))}
            <div className="md:col-span-3">
              <button type="submit" className="btn-primary">Create Dentist</button>
            </div>
          </form>
          <div className="space-y-3">
            {dentists.map((d) => (
              <div key={d._id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-heading">{d.name}</p>
                  <p className="text-sm text-theme-muted">
                    {d.specialization} · {d.email}
                    {(d.professionalLicenseNumber || d.userId?.professionalLicenseNumber) && ` · License: ${d.professionalLicenseNumber || d.userId?.professionalLicenseNumber}`}
                  </p>
                </div>
                <button onClick={() => handleDeleteDentist(d._id)} className="text-sm text-red-400 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pharmacies' && (
        <div className="mt-6 space-y-4">
          {pharmacies.map((p) => (
            <div key={p._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-theme-heading">{p.pharmacyName}</p>
                  <p className="text-sm text-theme-muted">Owner: {p.ownerName} · {p.email}</p>
                  <p className="text-sm text-theme-muted">{p.address}, {p.city}, {p.district}</p>
                  <p className="text-sm text-theme-text">License: {p.licenseNumber}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    p.status === 'approved' ? 'bg-green-100 text-green-800' :
                    p.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                {p.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovePharmacy(p._id)} className="btn-primary text-sm">Approve</button>
                    <button onClick={() => handleRejectPharmacy(p._id)} className="btn-secondary text-sm text-red-600">Reject</button>
                  </div>
                )}
              </div>
              {p.documents && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(p.documents).map(([key, url]) => url && (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-theme-accent hover:underline capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {pharmacies.length === 0 && <p className="text-theme-muted">No pharmacy applications.</p>}
        </div>
      )}

      {/* ── Dentist Approvals (User model, role = dentist) ──────────────────── */}
      {activeTab === 'dentist-approvals' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-theme-accent/20 bg-theme-accent/10 p-4 text-sm text-theme-accent">
            <strong>🦷 Dentist Approval Queue</strong> — These accounts registered directly as dentists and are awaiting your review. Only approved dentists can log in.
          </div>

          {pendingDentists.length === 0 && (
            <div className="card flex flex-col items-center gap-2 py-10 text-center text-theme-muted">
              <span className="text-4xl">✅</span>
              <p className="font-medium text-theme-heading">No pending dentist applications</p>
              <p className="text-sm">All dentist accounts have been reviewed.</p>
            </div>
          )}

          {pendingDentists.map((doc) => (
            <div key={doc._id} className="card border border-theme-border/50">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🦷</span>
                    <p className="font-semibold text-theme-heading">{doc.name}</p>
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm text-theme-muted">{doc.email}</p>
                  {doc.phone && (
                    <p className="text-sm text-theme-muted">📞 {doc.phone}</p>
                  )}
                  {doc.professionalLicenseNumber && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-md border border-theme-border/50 bg-theme-surface/60 px-2 py-1 text-xs font-mono text-theme-text">
                      🪪 License: {doc.professionalLicenseNumber}
                    </p>
                  )}
                  <p className="text-xs text-theme-muted">
                    Registered: {new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => handleApproveDentist(doc._id)}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectDentist(doc._id)}
                    className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </Layout>
  );
}
