import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import SeverityBadge from '../components/SeverityBadge';
import { adminAPI, predictionAPI, reportAPI } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ── Animated Count Up ──────────────────────────────────────────────── */
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const target = parseInt(value, 10);

  useEffect(() => {
    if (isNaN(target)) {
      setCount(value);
      return;
    }
    let start = 0;
    const duration = 800; // 0.8s
    const stepTime = 16;
    const increment = target / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, value]);

  return isNaN(target) ? <span>{value ?? 0}</span> : <span>{count}</span>;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [pendingDentists, setPendingDentists] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [dentistForm, setDentistForm] = useState({
    name: '', email: '', password: '', qualification: '', specialization: '', experience: '', contact: '', professionalLicenseNumber: '',
  });

  const viewPatientHistory = async (patientId) => {
    setSelectedPatient(patientId);
    setHistoryLoading(true);
    setHistoryError(null);
    setPatientHistory(null);
    try {
      const { data: res } = await adminAPI.getPatientHistory(patientId);
      setPatientHistory(res.data);
    } catch (err) {
      setHistoryError(err.response?.data?.message || 'Unable to load patient history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setHistoryError(null);
  };

  const handleDownloadReport = async (p) => {
    setDownloadingId(p._id);
    try {
      let blobData;
      try {
        const response = await predictionAPI.downloadReport(p._id);
        blobData = response.data;
      } catch {
        const response = await reportAPI.download(p.reportId || p._id);
        blobData = response.data;
      }
      const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-prediction-report-${p._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 150);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to download PDF report. Please try again later.');
    } finally {
      setDownloadingId(null);
    }
  };

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
    { id: 'dentist-approvals', label: 'Dentist Approvals' },
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
    {
      label: 'Total Users',
      value: stats.totalUsers,
      color: '#06B6D4',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-cyan-400 animate-pulse-glow" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      label: 'Total Dentists',
      value: stats.totalDentists,
      color: '#0D9488',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-teal-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      label: 'Approved Pharmacies',
      value: stats.totalPharmacies,
      color: '#10B981',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 12h6m-3-3v6" />
        </svg>
      )
    },
    {
      label: 'Pending Pharmacies',
      value: stats.pendingPharmacies,
      color: '#F59E0B',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-amber-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      label: 'Total Predictions',
      value: stats.totalPredictions,
      color: '#6366F1',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-indigo-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M12 9v6m-3-3h6" />
        </svg>
      )
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      color: '#F97316',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-orange-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 16 12 21 3 16 3 8 12 3 21 8 21 16" />
          <polyline points="3 8 12 13 21 8" />
          <line x1="12" y1="13" x2="12" y2="21" />
        </svg>
      )
    },
    {
      label: 'Appointments',
      value: stats.totalAppointments,
      color: '#0EA5E9',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-sky-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      label: 'Content Items',
      value: stats.totalContent,
      color: '#8B5CF6',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-purple-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
  ];

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-theme-heading font-heading">Admin Dashboard</h1>
      <p className="mt-1 text-theme-muted">System overview and management</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-theme-border/40 pb-4 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          let countVal = 0;
          let countColor = 'bg-red-500 text-white';
          if (tab.id === 'pharmacies') {
            countVal = stats.pendingPharmacies || 0;
          } else if (tab.id === 'dentist-approvals') {
            countVal = pendingDentists.length || 0;
            countColor = 'bg-amber-500 text-white';
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                isActive ? 'text-theme-primary z-10 font-bold shadow-glow-sm' : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/30'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-active-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--gradient-accent)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20 flex items-center gap-1.5">
                {tab.label}
                {countVal > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${countColor}`}>
                    {countVal}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && data && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card flex items-center gap-4 border border-theme-border/40 hover:border-theme-accent/20 transition duration-150"
                  whileHover={{ y: -3 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme-surface-2 border border-theme-border/40">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl font-extrabold text-theme-heading mt-0.5">
                      <AnimatedCounter value={card.value} />
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card border border-theme-border/50">
                <h2 className="mb-4 text-base font-bold text-theme-heading uppercase tracking-wider">Disease Distribution</h2>
                {charts.diseaseDistribution?.length > 0 ? (
                  <div className="max-h-[300px] flex justify-center">
                    <Doughnut data={diseaseChart} options={{ responsive: true, maintainAspectRatio: true }} />
                  </div>
                ) : (
                  <p className="text-sm text-theme-muted italic">No prediction data yet.</p>
                )}
              </div>
              <div className="card border border-theme-border/50">
                <h2 className="mb-4 text-base font-bold text-theme-heading uppercase tracking-wider">Monthly Predictions</h2>
                {charts.monthlyPredictions?.length > 0 ? (
                  <Bar data={monthlyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                ) : (
                  <p className="text-sm text-theme-muted italic">No monthly data yet.</p>
                )}
              </div>
              <div className="card border border-theme-border/50">
                <h2 className="mb-4 text-base font-bold text-theme-heading uppercase tracking-wider">Order Statistics</h2>
                <div className="space-y-3">
                  {charts.orderStats?.map((o) => (
                    <div key={o.status} className="flex items-center justify-between rounded-xl bg-theme-surface/50 border border-theme-border/20 p-3.5">
                      <span className="capitalize text-theme-text font-medium">{o.status?.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-theme-heading text-base"><AnimatedCounter value={o.count} /></span>
                    </div>
                  ))}
                  {!charts.orderStats?.length && <p className="text-sm text-theme-muted italic">No order data yet.</p>}
                </div>
              </div>
              <div className="card border border-theme-border/50">
                <h2 className="mb-4 text-base font-bold text-theme-heading uppercase tracking-wider">Consultation Statistics</h2>
                <div className="space-y-3">
                  {charts.consultationStats?.map((c) => (
                    <div key={c.status} className="flex items-center justify-between rounded-xl bg-theme-surface/50 border border-theme-border/20 p-3.5">
                      <span className="capitalize text-theme-text font-medium">{c.status}</span>
                      <span className="font-bold text-theme-heading text-base"><AnimatedCounter value={c.count} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-6"
          >
            {selectedPatient ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme-border/30 pb-4">
                  <button
                    onClick={clearSelectedPatient}
                    className="inline-flex items-center gap-2 text-sm font-bold text-theme-accent hover:underline"
                  >
                    <span>←</span> Back to Users List
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                    <span>🔒</span> Read-Only Admin Patient History
                  </span>
                </div>

                {historyLoading ? (
                  <LoadingSpinner />
                ) : historyError ? (
                  <div className="card border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
                    <p className="font-bold text-base">⚠️ {historyError}</p>
                    <button
                      onClick={() => viewPatientHistory(selectedPatient)}
                      className="mt-4 btn-primary text-xs py-2 px-4"
                    >
                      Retry Loading
                    </button>
                  </div>
                ) : patientHistory ? (
                  <div className="space-y-8">
                    {/* Patient Info Header */}
                    <div className="card border border-theme-border/50 bg-theme-surface/40 p-5 rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-theme-heading font-heading">
                            {patientHistory.patient?.name || 'Patient Details'}
                          </h2>
                          <p className="text-xs text-theme-muted mt-1">
                            Email: <span className="text-theme-text font-medium">{patientHistory.patient?.email}</span>
                            {patientHistory.patient?.phone && (
                              <span> · Phone: <span className="text-theme-text font-medium">{patientHistory.patient.phone}</span></span>
                            )}
                            {patientHistory.patient?.gender && (
                              <span> · Gender: <span className="text-theme-text font-medium">{patientHistory.patient.gender}</span></span>
                            )}
                            {patientHistory.patient?.age && (
                              <span> · Age: <span className="text-theme-text font-medium">{patientHistory.patient.age}</span></span>
                            )}
                          </p>
                        </div>
                        <span className="rounded-full border border-theme-border/50 bg-theme-surface/60 px-3.5 py-1 text-xs capitalize font-bold text-theme-accent">
                          Role: {patientHistory.patient?.role || 'user'}
                        </span>
                      </div>
                    </div>

                    {/* 🧠 Section 1: AI Predictions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-theme-border/20 pb-2">
                        <h3 className="text-lg font-bold text-theme-heading flex items-center gap-2">
                          <span>🧠</span> AI Predictions ({patientHistory.predictions?.length || patientHistory.aiPredictions?.length || 0})
                        </h3>
                      </div>

                      {(!patientHistory.predictions?.length && !patientHistory.aiPredictions?.length) ? (
                        <div className="card border border-theme-border/30 bg-theme-surface/20 p-6 text-center text-theme-muted rounded-2xl">
                          <p className="text-3xl mb-1">📋</p>
                          <p className="text-sm font-semibold">No AI prediction history recorded for this patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(patientHistory.predictions || patientHistory.aiPredictions || []).map((p) => {
                            const riskLevel = p.riskLevel || (p.confidence >= 80 ? 'HIGH' : p.confidence >= 60 ? 'MEDIUM' : 'LOW');
                            const displayName = p.displayName || p.diseaseName || 'Oral Condition';

                            return (
                              <div
                                key={p._id}
                                className="card flex flex-col gap-4 md:flex-row md:items-center p-5 border border-theme-border/40 bg-theme-surface/40 hover:border-theme-accent/25 transition duration-150 rounded-2xl"
                              >
                                {p.imageUrl && (
                                  <img
                                    src={p.imageUrl}
                                    alt="Oral scan"
                                    className="h-24 w-24 rounded-xl object-cover border border-theme-border/40 shrink-0"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                )}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold text-base text-theme-heading">{displayName}</h4>
                                    <SeverityBadge severity={riskLevel === 'HIGH' ? 'High' : riskLevel === 'MEDIUM' ? 'Moderate' : 'Low'} />
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        riskLevel === 'HIGH'
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                          : riskLevel === 'MEDIUM'
                                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      }`}
                                    >
                                      Risk: {riskLevel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-theme-muted">
                                    Confidence: <strong className="text-theme-text">{(p.confidence || 0).toFixed(1)}%</strong> · {new Date(p.createdAt).toLocaleString()}
                                  </p>
                                  {p.riskReason && (
                                    <p className="text-xs text-amber-400 font-medium">
                                      ⚠️ {p.riskReason}
                                    </p>
                                  )}
                                  <p className="text-xs text-theme-text leading-relaxed">{p.recommendation || p.description}</p>
                                </div>

                                <div className="flex shrink-0">
                                  <button
                                    disabled={downloadingId === p._id}
                                    onClick={() => handleDownloadReport(p)}
                                    className="rounded-xl border border-theme-border/50 bg-theme-surface/80 px-3.5 py-2 text-xs font-bold text-theme-accent hover:border-theme-accent hover:bg-theme-accent/10 transition disabled:opacity-50"
                                  >
                                    {downloadingId === p._id ? 'Generating PDF...' : '📄 Download PDF'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 📅 Section 2: Consultations */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-theme-border/20 pb-2">
                        <h3 className="text-lg font-bold text-theme-heading flex items-center gap-2">
                          <span>📅</span> Consultations ({patientHistory.consultations?.length || patientHistory.appointments?.length || 0})
                        </h3>
                      </div>

                      {(!patientHistory.consultations?.length && !patientHistory.appointments?.length) ? (
                        <div className="card border border-theme-border/30 bg-theme-surface/20 p-6 text-center text-theme-muted rounded-2xl">
                          <p className="text-3xl mb-1">👨‍⚕️</p>
                          <p className="text-sm font-semibold">No consultation history recorded for this patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(patientHistory.consultations || patientHistory.appointments || []).map((c) => {
                            const statusColors = {
                              completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                              confirmed: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
                              pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                              cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
                            };

                            return (
                              <div
                                key={c._id}
                                className="card border border-theme-border/40 bg-theme-surface/40 p-4 rounded-2xl space-y-2"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="font-bold text-theme-heading text-sm">
                                      Dr. {c.dentistId?.name || 'Assigned Dentist'}
                                    </p>
                                    <p className="text-xs text-theme-muted">
                                      {c.dentistId?.specialization || 'General Dentistry'}
                                      {c.dentistId?.qualification && ` · ${c.dentistId.qualification}`}
                                    </p>
                                  </div>
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                      statusColors[c.status] || 'bg-theme-surface text-theme-muted border-theme-border/40'
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </div>
                                <div className="text-xs text-theme-muted flex flex-wrap gap-4 pt-1 border-t border-theme-border/10">
                                  <span>📅 Date: <strong className="text-theme-text">{c.appointmentDate ? new Date(c.appointmentDate).toLocaleDateString() : 'N/A'}</strong></span>
                                  <span>⏰ Time: <strong className="text-theme-text">{c.appointmentTime || 'N/A'}</strong></span>
                                </div>
                                {c.notes && (
                                  <p className="text-xs text-theme-text bg-theme-surface/50 p-2.5 rounded-xl border border-theme-border/20 mt-1">
                                    <strong>Notes:</strong> {c.notes}
                                  </p>
                                )}
                                {(c.meetingUrl || c.videoUrl) && (
                                  <a
                                    href={c.meetingUrl || c.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-theme-accent hover:underline pt-1"
                                  >
                                    <span>🔗</span> Video Meeting Info Link
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 💊 Section 3: Prescriptions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-theme-border/20 pb-2">
                        <h3 className="text-lg font-bold text-theme-heading flex items-center gap-2">
                          <span>💊</span> Prescriptions ({patientHistory.prescriptions?.length || 0})
                        </h3>
                      </div>

                      {!patientHistory.prescriptions?.length ? (
                        <div className="card border border-theme-border/30 bg-theme-surface/20 p-6 text-center text-theme-muted rounded-2xl">
                          <p className="text-3xl mb-1">📝</p>
                          <p className="text-sm font-semibold">No prescription history recorded for this patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientHistory.prescriptions.map((rx) => {
                            const caseDiag = rx.caseDiagnosis === 'Other' && rx.customCaseDiagnosis
                              ? rx.customCaseDiagnosis
                              : rx.caseDiagnosis || 'Not specified';

                            return (
                              <div
                                key={rx._id}
                                className="card border border-theme-border/40 bg-theme-surface/40 p-5 rounded-2xl space-y-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="font-bold text-theme-heading text-sm">
                                      Diagnosis: <span className="text-theme-accent font-semibold">{caseDiag}</span>
                                    </p>
                                    <p className="text-xs text-theme-muted mt-0.5">
                                      Prescribed by Dr. {rx.dentistId?.name || 'Dentist'} · {new Date(rx.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                        rx.paymentStatus === 'paid'
                                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                      }`}
                                    >
                                      Fee: LKR {rx.prescriptionFee || 500} ({rx.paymentStatus || 'pending'})
                                    </span>
                                  </div>
                                </div>

                                {rx.medicines?.length > 0 && (
                                  <div className="border-t border-theme-border/10 pt-2.5 space-y-2">
                                    <p className="text-xs font-bold text-theme-heading uppercase tracking-wider">Prescribed Medicines:</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {rx.medicines.map((m, idx) => (
                                        <div
                                          key={idx}
                                          className="rounded-xl border border-theme-border/30 bg-theme-surface/50 p-2.5 text-xs space-y-0.5"
                                        >
                                          <p className="font-bold text-theme-heading text-xs">💊 {m.medicineName}</p>
                                          <p className="text-theme-muted text-[11px]">Dosage: {m.dosage} · Duration: {m.duration}</p>
                                          {m.quantity && <p className="text-theme-muted text-[11px]">Qty: {m.quantity}</p>}
                                          {m.instructions && <p className="text-theme-text text-[11px] italic mt-1">"{m.instructions}"</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u, i) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="card flex flex-wrap items-center justify-between gap-3 border border-theme-border/40 bg-theme-surface/50 p-4 hover:border-theme-accent/25 transition duration-150"
                  >
                    <div>
                      <p className="font-bold text-theme-heading text-base">{u.name}</p>
                      <p className="text-xs text-theme-muted mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-theme-border/50 bg-theme-surface/60 px-3 py-1 text-xs capitalize font-bold text-theme-accent">
                        {u.role}
                      </span>
                      <button
                        onClick={() => viewPatientHistory(u._id)}
                        className="rounded-xl border border-theme-accent/40 bg-theme-accent/15 px-3 py-1.5 text-xs font-bold text-theme-accent hover:bg-theme-accent/25 transition"
                      >
                        👁️ View Patient History
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline transition ml-1"
                        >
                          Delete User
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'dentists' && (
          <motion.div
            key="dentists"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6"
          >
            <form onSubmit={handleCreateDentist} className="card mb-6 grid gap-4 md:grid-cols-3 border border-theme-border/50 bg-theme-surface/40 p-5">
              <h2 className="md:col-span-3 font-bold text-lg text-theme-heading border-b border-theme-border/10 pb-2 mb-1">Create Dentist Account</h2>
              {['name', 'email', 'password', 'qualification', 'specialization', 'experience', 'contact', 'professionalLicenseNumber'].map((field) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-theme-muted">
                    {field === 'professionalLicenseNumber' ? 'License Number' : field}
                  </label>
                  <input
                    type={field === 'password' ? 'password' : field === 'experience' ? 'number' : field === 'email' ? 'email' : 'text'}
                    className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-3.5 py-2.5 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                    value={dentistForm[field] || ''}
                    onChange={(e) => setDentistForm({ ...dentistForm, [field]: e.target.value })}
                    required
                  />
                </div>
              ))}
              <div className="md:col-span-3 pt-2 border-t border-theme-border/10">
                <button type="submit" className="btn-primary py-2.5 px-6 shadow-glow text-sm font-bold">Create Account</button>
              </div>
            </form>
            <div className="space-y-3">
              {dentists.map((d, i) => (
                <motion.div
                  key={d._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card flex items-center justify-between border border-theme-border/40 bg-theme-surface/50 p-4 hover:border-theme-accent/25 transition duration-150"
                >
                  <div>
                    <p className="font-bold text-theme-heading text-base">{d.name}</p>
                    <p className="text-xs text-theme-muted mt-0.5">
                      {d.specialization} · {d.email}
                      {(d.professionalLicenseNumber || d.userId?.professionalLicenseNumber) && ` · License: ${d.professionalLicenseNumber || d.userId?.professionalLicenseNumber}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDentist(d._id)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline transition"
                  >
                    Delete Dentist
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'pharmacies' && (
          <motion.div
            key="pharmacies"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-4"
          >
            {pharmacies.map((p, i) => {
              const statusColors = {
                approved: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400',
                rejected: 'bg-red-500/15 text-red-600 border border-red-500/30 dark:text-red-400',
                pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400',
              };

              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card border border-theme-border/40 bg-theme-surface/50 p-5 hover:border-theme-accent/25 transition duration-150"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-theme-heading text-lg">{p.pharmacyName}</p>
                      <p className="text-xs text-theme-muted mt-1">Owner: {p.ownerName} · {p.email}</p>
                      <p className="text-xs text-theme-muted">{p.address}, {p.city}, {p.district}</p>
                      <p className="text-xs text-theme-text font-mono inline-block rounded border border-theme-border/50 bg-theme-background/30 px-2 py-0.5 mt-2">License: {p.licenseNumber}</p>
                      <div className="mt-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[p.status] || statusColors.pending}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprovePharmacy(p._id)} className="btn-primary text-xs py-2 px-4 shadow-glow">Approve</button>
                        <button onClick={() => handleRejectPharmacy(p._id)} className="btn-secondary text-xs py-2 px-4 font-semibold text-red-400 hover:text-red-300">Reject</button>
                      </div>
                    )}
                  </div>
                  {p.documents && (
                    <div className="mt-4 flex flex-wrap gap-3 border-t border-theme-border/10 pt-3">
                      {Object.entries(p.documents).map(([key, url]) => url && (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-theme-accent font-semibold hover:underline capitalize flex items-center gap-1">
                          <span>📄</span>
                          <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
            {pharmacies.length === 0 && (
              <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
                <p className="text-4xl mb-2">💊</p>
                <p className="font-semibold text-theme-heading text-lg">No pharmacy applications</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Dentist Approvals (User model, role = dentist) ──────────────────── */}
        {activeTab === 'dentist-approvals' && (
          <motion.div
            key="dentist-approvals"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-4"
          >
            <div className="rounded-xl border border-theme-accent/20 bg-theme-accent/10 p-4 text-xs font-semibold text-theme-accent">
              <strong>🦷 Dentist Approval Queue</strong> — These accounts registered directly as dentists and are awaiting your review. Only approved dentists can log in.
            </div>

            {pendingDentists.length === 0 && (
              <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
                <p className="text-4xl mb-2">✅</p>
                <p className="font-semibold text-theme-heading text-lg">No pending dentist applications</p>
                <p className="text-sm mt-1">All dentist accounts have been reviewed.</p>
              </div>
            )}

            {pendingDentists.map((doc, i) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card border border-theme-border/50 bg-theme-surface/50 p-5 hover:border-theme-accent/25 transition duration-150"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🦷</span>
                      <p className="font-bold text-theme-heading text-base">{doc.name}</p>
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-theme-muted">{doc.email}</p>
                    {doc.phone && (
                      <p className="text-xs text-theme-muted">📞 {doc.phone}</p>
                    )}
                    {doc.professionalLicenseNumber && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-md border border-theme-border/50 bg-theme-background/30 px-2 py-1 text-xs font-mono text-theme-text">
                        🪪 License: {doc.professionalLicenseNumber}
                      </p>
                    )}
                    <p className="text-[10px] text-theme-muted mt-2 block">
                      Registered: {new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveDentist(doc._id)}
                      className="btn-primary text-xs py-2.5 px-4 shadow-glow"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleRejectDentist(doc._id)}
                      className="btn-secondary text-xs py-2.5 px-4 font-semibold text-red-400 hover:text-red-300"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
