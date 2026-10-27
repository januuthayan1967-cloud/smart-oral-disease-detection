import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import SparklineWave from '../components/dashboard/SparklineWave';
import DentalHeroVisual from '../components/dashboard/DentalHeroVisual';
import { dentistDashboardAPI, prescriptionAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const generateSlots = (startTime, endTime) => {
  if (!startTime || !endTime) return [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (endMins <= startMins) return [];
  const slots = [];
  for (let cur = startMins; cur < endMins; cur += 30) {
    const h = Math.floor(cur / 60).toString().padStart(2, '0');
    const m = (cur % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
};

// Reusable Animated Counter for Live Metrics
function AnimatedCounter({ value, duration = 1.0, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10) || 0;

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    if (start === end) {
      setCount(end);
      return;
    }
    const stepTime = Math.max(Math.floor((duration * 1000) / (end || 1)), 25);
    const step = Math.max(1, Math.ceil(end / 35));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [numericValue, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function DentistDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('consultations');
  const [consultationFilter, setConsultationFilter] = useState('all');
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    caseDiagnosisSelect: '',
    customCaseDiagnosis: '',
    medicines: [{ medicineName: '', dosage: '', duration: '', quantity: 1, instructions: '', notes: '' }],
    notes: '',
    prescriptionFee: 500,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsRes, consultRes, profileRes, paymentsRes] = await Promise.all([
        dentistDashboardAPI.getPatients(),
        dentistDashboardAPI.getConsultations(),
        dentistDashboardAPI.getProfile(),
        dentistDashboardAPI.getPayments(),
      ]);
      const rawAvail = profileRes.data.data.availability || [];
      const normalizedAvail = rawAvail.map((a) => {
        const titleDay = a.day ? a.day.charAt(0).toUpperCase() + a.day.slice(1).toLowerCase() : a.day;
        return {
          day: titleDay,
          startTime: a.startTime || '09:00',
          endTime: a.endTime || '13:00',
          slots: a.slots || [],
        };
      });
      setPatients(patientsRes.data.data || []);
      setConsultations(consultRes.data.data || []);
      setAvailability(normalizedAvail);
      setPayments(paymentsRes.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const viewPatientHistory = async (patientId) => {
    setSelectedPatient(patientId);
    setHistoryLoading(true);
    setHistoryError(null);
    setPatientHistory(null);
    try {
      const { data } = await dentistDashboardAPI.getPatientHistory(patientId);
      setPatientHistory(data.data);
    } catch (err) {
      setHistoryError(err.response?.data?.message || 'Unable to load patient history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setHistoryError(null);
  };

  const handleAppointmentUpdate = async (id, status) => {
    await appointmentAPI.update(id, { status });
    loadData();
  };

  const addMedicineRow = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { medicineName: '', dosage: '', duration: '', quantity: 1, instructions: '', notes: '' }],
    });
  };

  const removeMedicineRow = (index) => {
    const meds = prescriptionForm.medicines.filter((_, idx) => idx !== index);
    setPrescriptionForm({ ...prescriptionForm, medicines: meds });
  };

  const updateMedicine = (index, field, value) => {
    const meds = [...prescriptionForm.medicines];
    meds[index] = { ...meds[index], [field]: value };
    setPrescriptionForm({ ...prescriptionForm, medicines: meds });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();

    let finalDiagnosis = prescriptionForm.caseDiagnosisSelect;
    if (prescriptionForm.caseDiagnosisSelect === 'Other') {
      if (!prescriptionForm.customCaseDiagnosis || !prescriptionForm.customCaseDiagnosis.trim()) {
        alert('Please enter the custom case or diagnosis.');
        return;
      }
      finalDiagnosis = prescriptionForm.customCaseDiagnosis.trim();
    }

    await prescriptionAPI.create({
      patientId: prescriptionForm.patientId,
      caseDiagnosis: finalDiagnosis,
      medicines: prescriptionForm.medicines.map((m) => ({
        ...m,
        quantity: parseInt(m.quantity, 10),
      })),
      notes: prescriptionForm.notes,
      prescriptionFee: parseFloat(prescriptionForm.prescriptionFee),
    });

    setPrescriptionForm({
      patientId: '',
      caseDiagnosisSelect: '',
      customCaseDiagnosis: '',
      medicines: [{ medicineName: '', dosage: '', duration: '', quantity: 1, instructions: '', notes: '' }],
      notes: '',
      prescriptionFee: 500,
    });
    alert('Prescription created successfully!');
    loadData();
  };

  const updateDayTimes = (day, field, value) => {
    setAvailabilityMessage('');
    setAvailability((prev) => {
      const exists = prev.find((a) => a.day && a.day.toLowerCase() === day.toLowerCase());
      if (exists) {
        return prev.map((a) =>
          a.day && a.day.toLowerCase() === day.toLowerCase() ? { ...a, [field]: value, day } : a
        );
      }
      return [...prev, { day, startTime: '09:00', endTime: '13:00', [field]: value }];
    });
  };

  const toggleDay = (day) => {
    setAvailabilityMessage('');
    const exists = availability.find((a) => a.day && a.day.toLowerCase() === day.toLowerCase());
    if (exists) {
      setAvailability(availability.filter((a) => a.day && a.day.toLowerCase() !== day.toLowerCase()));
    } else {
      setAvailability([...availability, { day, startTime: '09:00', endTime: '13:00' }]);
    }
  };

  const saveAvailability = async () => {
    const payload = availability.map((item) => {
      const titleDay = item.day ? item.day.charAt(0).toUpperCase() + item.day.slice(1).toLowerCase() : item.day;
      return {
        day: titleDay,
        startTime: item.startTime || '09:00',
        endTime: item.endTime || '13:00',
        slots: item.slots || [],
      };
    });

    for (const item of payload) {
      const [startH, startM] = item.startTime.split(':').map(Number);
      const [endH, endM] = item.endTime.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      if (endMins <= startMins) {
        alert(`End time must be later than start time for ${item.day}.`);
        return;
      }
    }

    try {
      const res = await dentistDashboardAPI.updateAvailability(payload);
      const savedAvail = (res.data.data.availability || []).map((a) => ({
        day: a.day ? a.day.charAt(0).toUpperCase() + a.day.slice(1).toLowerCase() : a.day,
        startTime: a.startTime || '09:00',
        endTime: a.endTime || '13:00',
        slots: a.slots || [],
      }));
      setAvailability(savedAvail);
      setAvailabilityMessage('Availability updated successfully.');
      setTimeout(() => setAvailabilityMessage(''), 6000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability.');
    }
  };

  // Clinical KPIs calculated from real loaded data
  const totalPatientsCount = patients.length;
  const pendingConsultationsCount = useMemo(() => consultations.filter((c) => c.status === 'pending').length, [consultations]);
  const confirmedConsultationsCount = useMemo(() => consultations.filter((c) => c.status === 'confirmed').length, [consultations]);
  const completedConsultationsCount = useMemo(() => consultations.filter((c) => c.status === 'completed').length, [consultations]);
  const totalEarnings = useMemo(() => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payments]);

  // Filtered consultations
  const filteredConsultations = useMemo(() => {
    if (consultationFilter === 'all') return consultations;
    return consultations.filter((c) => c.status === consultationFilter);
  }, [consultations, consultationFilter]);

  const tabs = [
    { id: 'consultations', label: 'Consultations', badge: pendingConsultationsCount > 0 ? pendingConsultationsCount : null },
    { id: 'patients', label: 'Patients Directory', badge: totalPatientsCount > 0 ? totalPatientsCount : null },
    { id: 'prescriptions', label: 'Create Prescription' },
    { id: 'payments', label: 'Payment History', badge: payments.length > 0 ? payments.length : null },
    { id: 'availability', label: 'Availability Schedule' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const doctorDisplayName = user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Doctor';

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* ========================================================= */}
        {/* TOP WELCOME BANNER (Ultra-Premium Dark Navy x Champagne Gold) */}
        {/* ========================================================= */}
        {/* ── Ultra-Premium Dentist Welcome Banner with Golden Waves & Holographic 3D Tooth ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="luxury-hero-banner relative overflow-hidden rounded-3xl mb-8 p-6 sm:p-8"
        >
          {/* Flowing Golden Wave Silk Background Overlay */}
          <div
            className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-40 sm:opacity-50' : 'opacity-25'}`}
            style={{
              backgroundImage: "url('/assets/golden-wave-ribbon.jpg')",
              backgroundPosition: 'center right',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              mixBlendMode: isDark ? 'screen' : 'multiply',
            }}
          />

          {/* Ambient Volumetric Lighting Flares */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#D9AD56]/15 rounded-full blur-3xl pointer-events-none" />
          <div className={`absolute inset-0 pointer-events-none ${
            isDark
              ? 'bg-gradient-to-r from-[#050B16] via-[#050B16]/75 to-transparent'
              : 'bg-gradient-to-r from-white via-white/80 to-transparent'
          }`} />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl min-w-0 flex-1">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase font-mono ${
                isDark
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(0,201,232,0.2)]'
                : 'bg-[#087F9C]/10 border border-[#087F9C]/30 text-[#087F9C]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-cyan-400 animate-pulse' : 'bg-[#087F9C]'}`} />
                <span>CLINICAL DENTIST WORKSPACE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
                Welcome Back,<br />
                <span className={
                  isDark
                    ? 'bg-gradient-to-r from-[#F4D58D] via-[#D9AD56] to-cyan-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-[#8C6D23] via-[#C69C48] to-[#087F9C] bg-clip-text text-transparent'
                }>
                  {doctorDisplayName}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">
                Review scheduled patient appointments, inspect AI disease predictions with confidence metrics, issue electronic prescriptions, and manage clinic availability.
              </p>
            </div>

            {/* Realistic 3D Holographic Tooth Visualization + Floating Quote Card */}
            <DentalHeroVisual
              quoteLine1="Better Oral Health"
              quoteLine2="Brighter Smiles"
            />
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* CLINICAL KPI METRIC CARDS (100% Real Live Historical Data) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* KPI 1: Total Patients */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="luxury-card relative overflow-hidden rounded-2xl border border-oral-border/80 bg-theme-surface/70 p-5 shadow-sm hover:border-oral-gold/50 transition duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Total Patients</p>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-heading text-theme-heading">
                  <AnimatedCounter value={totalPatientsCount} />
                </div>
                <p className="mt-1 text-xs text-theme-muted">Registered clinical records</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-oral-gold/15 border border-oral-gold/30 flex items-center justify-center text-xl text-oral-gold shadow-gold-glow">
                👥
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-theme-border/20">
              <SparklineWave color="#F4D58D" />
            </div>
          </motion.div>

          {/* KPI 2: Active / Pending Consultations */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="luxury-card relative overflow-hidden rounded-2xl border border-oral-border/80 bg-theme-surface/70 p-5 shadow-sm hover:border-oral-cyan/50 transition duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Consultation Requests</p>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-heading text-theme-heading">
                  <AnimatedCounter value={consultations.length} />
                </div>
                <p className="mt-1 text-xs text-theme-muted">
                  <span className="font-semibold text-oral-cyan">{pendingConsultationsCount} pending</span> review
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-oral-cyan/15 border border-oral-cyan/30 flex items-center justify-center text-xl text-oral-cyan shadow-cyan-glow">
                📅
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-theme-border/20">
              <SparklineWave color="#00C9E8" />
            </div>
          </motion.div>

          {/* KPI 3: Completed Cases */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="luxury-card relative overflow-hidden rounded-2xl border border-oral-border/80 bg-theme-surface/70 p-5 shadow-sm hover:border-emerald-500/50 transition duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Completed Cases</p>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-heading text-theme-heading">
                  <AnimatedCounter value={completedConsultationsCount} />
                </div>
                <p className="mt-1 text-xs text-theme-muted">
                  <span className="font-semibold text-emerald-400">{confirmedConsultationsCount} confirmed</span> upcoming
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400">
                ✅
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-theme-border/20">
              <SparklineWave color="#10B981" />
            </div>
          </motion.div>

          {/* KPI 4: Total Consultation Earnings */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="luxury-card relative overflow-hidden rounded-2xl border border-oral-border/80 bg-theme-surface/70 p-5 shadow-sm hover:border-oral-gold/50 transition duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Total Revenue</p>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-heading text-theme-heading">
                  <AnimatedCounter value={totalEarnings} prefix="Rs. " />
                </div>
                <p className="mt-1 text-xs text-theme-muted">
                  {payments.length} verified transactions
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-oral-gold/15 border border-oral-gold/30 flex items-center justify-center text-xl text-oral-gold shadow-gold-glow">
                💳
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-theme-border/20">
              <SparklineWave color="#D9AD56" />
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* LUXURY TAB NAVIGATION PILLS */}
        {/* ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme-border/30 pb-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'text-oral-bg font-extrabold shadow-gold-glow z-10'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/50 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="dentist-active-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-oral-gold via-oral-gold-light to-oral-gold shadow-md"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-20">{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span
                      className={`relative z-20 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-oral-bg/25 text-oral-bg font-extrabold'
                          : 'bg-oral-gold/15 text-oral-gold border border-oral-gold/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-oral-gold hover:border-oral-gold/40 border border-theme-border/40 bg-theme-surface/40 transition flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CONSULTATIONS */}
        {/* ========================================================= */}
        <AnimatePresence mode="wait">
          {activeTab === 'consultations' && (
            <motion.div
              key="consultations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {/* Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-theme-surface/50 border border-theme-border/40 text-xs">
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => {
                    const count = f === 'all' ? consultations.length : consultations.filter((c) => c.status === f).length;
                    const isSelected = consultationFilter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setConsultationFilter(f)}
                        className={`capitalize px-3 py-1.5 rounded-lg font-semibold transition ${
                          isSelected
                            ? 'bg-oral-gold/20 text-oral-gold border border-oral-gold/30 shadow-sm'
                            : 'text-theme-muted hover:text-theme-text'
                        }`}
                      >
                        {f} ({count})
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-theme-muted">
                  Showing {filteredConsultations.length} of {consultations.length} appointments
                </div>
              </div>

              {/* Consultations List */}
              <div className="space-y-3.5">
                {filteredConsultations.map((appt, i) => {
                  const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const statusColors = {
                    pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                    confirmed: 'bg-oral-cyan/15 text-oral-cyan border border-oral-cyan/30',
                    completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                    cancelled: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
                  };
                  const initials = appt.patientId?.name
                    ? appt.patientId.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'P';

                  return (
                    <motion.div
                      key={appt._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="luxury-card rounded-2xl border border-oral-border/80 bg-theme-surface/60 p-5 hover:border-oral-gold/40 hover:shadow-gold-card transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-oral-gold/15 text-oral-gold font-bold text-lg border border-oral-gold/30 shadow-gold-glow">
                          {initials}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-theme-heading text-lg">
                              {appt.patientId?.name || 'Unknown Patient'}
                            </h3>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[appt.status] || 'bg-theme-surface border border-theme-border/40 text-theme-text'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {appt.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs text-theme-muted">
                            <span className="flex items-center gap-1 font-medium">
                              📅 {dateStr}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono font-semibold text-oral-gold">
                              ⏰ {appt.appointmentTime}
                            </span>
                            {appt.patientId?.email && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[200px]">✉️ {appt.patientId.email}</span>
                              </>
                            )}
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-theme-text/80 bg-theme-surface/50 border border-theme-border/30 rounded-xl p-2.5 mt-2">
                              <span className="text-oral-gold font-semibold">Patient Note:</span> {appt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                        {appt.meetingLink && (
                          <a
                            href={appt.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="luxury-gold-pill text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-gold-glow"
                          >
                            <span>📹</span>
                            <span>Join Video Call</span>
                          </a>
                        )}
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleAppointmentUpdate(appt._id, 'confirmed')}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-oral-cyan/15 text-oral-cyan border border-oral-cyan/30 hover:bg-oral-cyan/25 transition shadow-cyan-glow"
                          >
                            ✓ Confirm Booking
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => handleAppointmentUpdate(appt._id, 'completed')}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition shadow-sm"
                          >
                            ✓ Mark Complete
                          </button>
                        )}
                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            onClick={() => handleAppointmentUpdate(appt._id, 'cancelled')}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {filteredConsultations.length === 0 && (
                  <div className="luxury-card text-center py-16 rounded-2xl border border-theme-border/40 bg-theme-surface/30">
                    <p className="text-4xl mb-2">📅</p>
                    <p className="font-bold text-theme-heading text-lg">No {consultationFilter !== 'all' ? consultationFilter : ''} consultations found</p>
                    <p className="text-xs text-theme-muted mt-1">
                      {consultationFilter === 'all'
                        ? 'Pending and confirmed patient bookings will appear here.'
                        : `No appointments currently marked as ${consultationFilter}.`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PATIENTS DIRECTORY & CLINICAL HISTORY */}
          {/* ========================================================= */}
          {activeTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Patient List (When no patient selected) */}
              {!selectedPatient && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-theme-heading font-heading">
                        Patients Directory ({patients.length})
                      </h2>
                      <p className="text-xs text-theme-muted mt-0.5">
                        Click on any patient to examine full diagnostic history, AI scan results, and electronic prescriptions.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {patients.map((patient) => {
                      const initials = patient.name
                        ? patient.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : 'P';

                      return (
                        <button
                          key={patient._id}
                          onClick={() => viewPatientHistory(patient._id)}
                          className="luxury-card group w-full text-left rounded-2xl border border-oral-border/80 bg-theme-surface/50 p-5 hover:border-oral-gold/50 hover:shadow-gold-card transition duration-200 flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-oral-gold/15 text-oral-gold font-bold text-lg border border-oral-gold/30 shadow-gold-glow group-hover:scale-105 transition">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-theme-heading text-base truncate group-hover:text-oral-gold transition">
                                {patient.name}
                              </h3>
                              <p className="text-xs text-theme-muted truncate mt-0.5">{patient.email}</p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-theme-muted font-medium">
                                <span>📞 {patient.phone || 'No phone'}</span>
                                {(patient.age || patient.gender) && (
                                  <>
                                    <span>•</span>
                                    <span>{patient.age ? `${patient.age}y` : ''} {patient.gender || ''}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-theme-border/20 flex items-center justify-between text-xs text-oral-gold font-bold">
                            <span>Inspect Patient History</span>
                            <span className="transform group-hover:translate-x-1 transition duration-200">→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {patients.length === 0 && (
                    <div className="luxury-card text-center py-16 rounded-2xl border border-theme-border/40 bg-theme-surface/30">
                      <p className="text-4xl mb-2">👥</p>
                      <p className="font-bold text-theme-heading text-lg">No patient records yet</p>
                      <p className="text-xs text-theme-muted mt-1">Patients with scheduled consultations or prescriptions will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Patient Clinical History View */}
              {selectedPatient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Top Bar with Back Button */}
                  <div className="luxury-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-oral-border/80 bg-theme-surface/60 p-4">
                    <button
                      onClick={clearSelectedPatient}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-oral-gold bg-oral-gold/15 border border-oral-gold/30 hover:bg-oral-gold/25 transition flex items-center gap-2 shadow-sm"
                    >
                      <span>←</span>
                      <span>Back to Patients Directory</span>
                    </button>
                    <div className="text-xs text-theme-muted font-medium">
                      Patient Clinical File · Confidential Medical Record
                    </div>
                  </div>

                  {historyLoading && (
                    <div className="luxury-card text-center py-16 rounded-2xl border border-theme-border/40 bg-theme-surface/30">
                      <LoadingSpinner />
                      <p className="mt-4 font-bold text-theme-heading text-base">Loading clinical history...</p>
                      <p className="text-xs text-theme-muted mt-1">Fetching AI scan logs, consultations, and prescriptions...</p>
                    </div>
                  )}

                  {historyError && (
                    <div className="luxury-card text-center py-12 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 space-y-3">
                      <p className="text-4xl">⚠️</p>
                      <p className="font-bold text-lg">{historyError}</p>
                      <div className="pt-2 flex justify-center gap-3">
                        <button
                          onClick={() => viewPatientHistory(selectedPatient)}
                          className="luxury-gold-pill text-xs py-2 px-4 font-bold"
                        >
                          Retry
                        </button>
                        <button
                          onClick={clearSelectedPatient}
                          className="px-4 py-2 rounded-xl text-xs font-semibold border border-theme-border/40 text-theme-text"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {patientHistory && !historyLoading && (
                    <div className="space-y-6">
                      {/* Patient Demographic Card */}
                      <div className="luxury-card rounded-2xl border border-oral-gold/30 bg-theme-surface/60 p-6 shadow-gold-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-oral-gold/20 text-oral-gold font-extrabold text-2xl border border-oral-gold/40 shadow-gold-glow">
                              {patientHistory.patient?.name
                                ? patientHistory.patient.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)
                                : 'P'}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-extrabold text-2xl text-theme-heading font-heading">
                                  {patientHistory.patient?.name || 'Patient'}
                                </h2>
                                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-oral-gold/15 border border-oral-gold/30 text-oral-gold">
                                  ID: #{patientHistory.patient?._id?.slice(-8) || 'PATIENT'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-theme-muted mt-1.5 font-medium">
                                <span>📧 {patientHistory.patient?.email || 'N/A'}</span>
                                <span>•</span>
                                <span>📞 {patientHistory.patient?.phone || 'No phone'}</span>
                                {patientHistory.patient?.age && (
                                  <>
                                    <span>•</span>
                                    <span>🎂 {patientHistory.patient.age} years</span>
                                  </>
                                )}
                                {patientHistory.patient?.gender && (
                                  <>
                                    <span>•</span>
                                    <span>👤 {patientHistory.patient.gender}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 1: AI Disease Predictions */}
                      <div className="luxury-card rounded-2xl border border-oral-border/80 bg-theme-surface/50 p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-theme-border/20 pb-4 mb-4">
                          <h3 className="text-lg font-bold text-theme-heading font-heading flex items-center gap-2">
                            <span>🧠</span>
                            <span>AI Diagnostic Predictions</span>
                          </h3>
                          <span className="text-xs px-3 py-1 rounded-full bg-oral-cyan/15 text-oral-cyan font-bold border border-oral-cyan/30">
                            {(patientHistory.aiPredictions || patientHistory.predictions)?.length || 0} Records
                          </span>
                        </div>

                        <div className="space-y-3">
                          {(patientHistory.aiPredictions || patientHistory.predictions)?.map((p) => {
                            const dateStr = new Date(p.createdAt || p.date || Date.now()).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                            const conf = p.confidencePercentage ?? (p.confidence != null ? Math.round(p.confidence) : 0);
                            const riskColors = {
                              LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                              MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                              HIGH: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                            };

                            return (
                              <div
                                key={p._id}
                                className="rounded-xl p-4 bg-theme-surface/60 border border-theme-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-oral-gold/30 transition"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-bold text-theme-heading text-base">
                                      {p.displayName || p.diseaseName}
                                    </p>
                                    <span
                                      className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                                        riskColors[p.riskLevel] || 'bg-theme-surface border-theme-border text-theme-muted'
                                      }`}
                                    >
                                      Risk: {p.riskLevel || 'LOW'}
                                    </span>
                                    {p.severity && (
                                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border/40 text-theme-muted">
                                        Severity: {p.severity}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-theme-muted">
                                    Scan Date: <strong className="text-theme-heading">{dateStr}</strong>
                                  </p>
                                </div>
                                <div className="shrink-0 self-start sm:self-center">
                                  <span className="text-sm font-extrabold text-oral-gold bg-oral-gold/15 border border-oral-gold/30 px-3 py-1.5 rounded-xl inline-block shadow-gold-glow">
                                    Confidence: {conf}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {!(patientHistory.aiPredictions || patientHistory.predictions)?.length && (
                            <div className="p-6 rounded-xl bg-theme-surface/30 border border-theme-border/20 text-center text-theme-muted text-xs italic">
                              No AI prediction history available for this patient.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Consultations History */}
                      <div className="luxury-card rounded-2xl border border-oral-border/80 bg-theme-surface/50 p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-theme-border/20 pb-4 mb-4">
                          <h3 className="text-lg font-bold text-theme-heading font-heading flex items-center gap-2">
                            <span>📅</span>
                            <span>Consultation History</span>
                          </h3>
                          <span className="text-xs px-3 py-1 rounded-full bg-oral-gold/15 text-oral-gold font-bold border border-oral-gold/30">
                            {(patientHistory.consultations || patientHistory.appointments)?.length || 0} Records
                          </span>
                        </div>

                        <div className="space-y-3">
                          {(patientHistory.consultations || patientHistory.appointments)?.map((appt) => {
                            const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                            const statusColors = {
                              pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                              confirmed: 'bg-oral-cyan/15 text-oral-cyan border-oral-cyan/30',
                              completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                              cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                            };

                            return (
                              <div
                                key={appt._id}
                                className="rounded-xl p-4 bg-theme-surface/60 border border-theme-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-oral-gold/30 transition"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-theme-heading text-sm">📅 Date: {dateStr}</p>
                                    <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border capitalize ${statusColors[appt.status] || 'bg-theme-surface border-theme-border text-theme-muted'}`}>
                                      {appt.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-theme-muted">⏰ Time: {appt.appointmentTime}</p>
                                  {appt.notes && (
                                    <p className="text-xs text-theme-text mt-2 bg-theme-surface/70 p-2.5 rounded-xl border border-theme-border/30">
                                      <strong className="text-oral-gold">Clinical Notes:</strong> {appt.notes}
                                    </p>
                                  )}
                                </div>
                                {appt.meetingLink && (
                                  <a
                                    href={appt.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="luxury-gold-pill text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-center font-bold shadow-gold-glow"
                                  >
                                    <span>📹</span>
                                    <span>Join Call</span>
                                  </a>
                                )}
                              </div>
                            );
                          })}

                          {!(patientHistory.consultations || patientHistory.appointments)?.length && (
                            <div className="p-6 rounded-xl bg-theme-surface/30 border border-theme-border/20 text-center text-theme-muted text-xs italic">
                              No consultation records logged.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Prescriptions */}
                      <div className="luxury-card rounded-2xl border border-oral-border/80 bg-theme-surface/50 p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-theme-border/20 pb-4 mb-4">
                          <h3 className="text-lg font-bold text-theme-heading font-heading flex items-center gap-2">
                            <span>💊</span>
                            <span>Prescription Records</span>
                          </h3>
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                            {patientHistory.prescriptions?.length || 0} Records
                          </span>
                        </div>

                        <div className="space-y-4">
                          {patientHistory.prescriptions?.map((rx) => {
                            const rxDate = new Date(rx.createdAt || rx.date || Date.now()).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });

                            return (
                              <div
                                key={rx._id}
                                className="rounded-xl p-4 bg-theme-surface/60 border border-theme-border/40 space-y-3 hover:border-oral-gold/30 transition"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-border/20 pb-3">
                                  <div>
                                    <p className="text-xs text-theme-muted">
                                      Date: <strong className="text-theme-heading">{rxDate}</strong>
                                    </p>
                                    <p className="text-sm font-semibold text-theme-heading mt-0.5">
                                      Diagnosis: <span className="text-oral-gold font-bold">{rx.caseDiagnosis || 'Not specified'}</span>
                                    </p>
                                  </div>
                                  <div>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                        rx.paymentStatus === 'paid'
                                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                      }`}
                                    >
                                      {rx.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-bold text-oral-gold uppercase tracking-wider mb-2">
                                    Prescribed Medications ({rx.medicines?.length || 0})
                                  </p>
                                  <div className="space-y-2">
                                    {rx.medicines?.map((m, idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-lg p-3 bg-theme-surface/70 border border-theme-border/25 text-xs flex flex-wrap justify-between items-center gap-2"
                                      >
                                        <div>
                                          <span className="font-bold text-theme-heading text-sm">{m.medicineName}</span>
                                          <span className="text-theme-muted ml-2">
                                            (Dosage: {m.dosage} • Duration: {m.duration} • Qty: {m.quantity})
                                          </span>
                                        </div>
                                        {m.instructions && (
                                          <span className="text-theme-text italic bg-theme-surface-2/60 px-2.5 py-1 rounded-lg border border-theme-border/20">
                                            Instructions: {m.instructions}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {rx.notes && (
                                  <p className="text-xs text-theme-text italic bg-theme-surface/50 p-2.5 rounded-xl border border-theme-border/25">
                                    <strong className="text-oral-gold">Instructions / Notes:</strong> {rx.notes}
                                  </p>
                                )}

                                <div className="flex justify-between items-center text-xs text-theme-muted pt-2 border-t border-theme-border/15">
                                  <span>Fee: <strong className="text-oral-gold">Rs. {rx.prescriptionFee || 500}</strong></span>
                                  <span>Prescribed By: <strong className="text-theme-heading">{rx.dentistId?.name || 'Dr. Specialist'}</strong></span>
                                </div>
                              </div>
                            );
                          })}

                          {!patientHistory.prescriptions?.length && (
                            <div className="p-6 rounded-xl bg-theme-surface/30 border border-theme-border/20 text-center text-theme-muted text-xs italic">
                              No prescription history logged for this patient.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CREATE PRESCRIPTION */}
          {/* ========================================================= */}
          {activeTab === 'prescriptions' && (
            <motion.form
              key="prescriptions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleCreatePrescription}
              className="luxury-card rounded-2xl border border-oral-border/80 bg-theme-surface/60 p-6 sm:p-8 space-y-6 shadow-gold-card"
            >
              <div className="border-b border-theme-border/20 pb-4">
                <h2 className="text-xl font-bold text-theme-heading font-heading flex items-center gap-2">
                  <span>💊</span>
                  <span>New Electronic Prescription</span>
                </h2>
                <p className="text-xs text-theme-muted mt-1">
                  Diagnose, select medications, provide dosages, and issue electronic prescription for active patients.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold text-oral-gold uppercase tracking-wider">
                    Select Patient <span className="text-rose-400">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-sm text-theme-text transition focus:border-oral-gold focus:outline-none focus:ring-2 focus:ring-oral-gold/25"
                    value={prescriptionForm.patientId}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientId: e.target.value })}
                    required
                    style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                  >
                    <option value="" className="bg-theme-surface text-theme-muted">
                      Choose an enrolled patient...
                    </option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id} className="bg-theme-surface text-theme-text">
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-oral-gold uppercase tracking-wider">
                    Clinical Case / Diagnosis <span className="text-rose-400">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-sm text-theme-text transition focus:border-oral-gold focus:outline-none focus:ring-2 focus:ring-oral-gold/25"
                    value={prescriptionForm.caseDiagnosisSelect}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        caseDiagnosisSelect: e.target.value,
                        customCaseDiagnosis: e.target.value === 'Other' ? prescriptionForm.customCaseDiagnosis : '',
                      })
                    }
                    required
                    style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                  >
                    <option value="" className="bg-theme-surface text-theme-muted">
                      Select diagnosis category...
                    </option>
                    {['Calculus', 'Caries', 'Gingivitis', 'Healthy Teeth', 'Mouth Ulcer', 'Tooth Discoloration', 'Other'].map((opt) => (
                      <option key={opt} value={opt} className="bg-theme-surface text-theme-text">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {prescriptionForm.caseDiagnosisSelect === 'Other' && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-oral-gold uppercase tracking-wider">
                    Specify Custom Diagnosis <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                    placeholder="Enter custom clinical diagnosis"
                    value={prescriptionForm.customCaseDiagnosis}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, customCaseDiagnosis: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Dynamic Medicine Rows */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-oral-gold uppercase tracking-wider">
                    Prescribed Medicines ({prescriptionForm.medicines.length})
                  </label>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-xs font-bold text-oral-gold hover:text-oral-gold-light border border-dashed border-oral-gold/50 bg-oral-gold/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    <span>+</span>
                    <span>Add Another Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {prescriptionForm.medicines.map((med, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3 rounded-2xl border border-oral-border/80 p-4 md:grid-cols-3 bg-theme-surface/60 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center md:col-span-3 border-b border-theme-border/20 pb-2 mb-1">
                          <span className="text-xs font-bold text-oral-gold uppercase tracking-wider">
                            Medicine #{idx + 1}
                          </span>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => removeMedicineRow(idx)}
                              className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 font-semibold transition"
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                        <div>
                          <input
                            className="w-full rounded-xl border border-theme-border bg-theme-surface/70 px-3.5 py-2.5 text-xs text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                            placeholder="Medicine Name (e.g. Amoxicillin)"
                            value={med.medicineName}
                            onChange={(e) => updateMedicine(idx, 'medicineName', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            className="w-full rounded-xl border border-theme-border bg-theme-surface/70 px-3.5 py-2.5 text-xs text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                            placeholder="Dosage (e.g. 500mg 1-0-1)"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            className="w-full rounded-xl border border-theme-border bg-theme-surface/70 px-3.5 py-2.5 text-xs text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                            placeholder="Duration (e.g. 5 days)"
                            value={med.duration}
                            onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            className="w-full rounded-xl border border-theme-border bg-theme-surface/70 px-3.5 py-2.5 text-xs text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                            placeholder="Quantity"
                            value={med.quantity}
                            onChange={(e) => updateMedicine(idx, 'quantity', e.target.value)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <input
                            className="w-full rounded-xl border border-theme-border bg-theme-surface/70 px-3.5 py-2.5 text-xs text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                            placeholder="Patient Instructions (e.g. Take with warm water after food)"
                            value={med.instructions}
                            onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Consultation Fee & Recommendations */}
              <div className="grid gap-5 md:grid-cols-2 pt-2 border-t border-theme-border/20">
                <div>
                  <label className="mb-2 block text-xs font-bold text-oral-gold uppercase tracking-wider">
                    Consultation Fee (Rs.) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                    value={prescriptionForm.prescriptionFee}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescriptionFee: e.target.value })}
                    required
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-oral-gold uppercase tracking-wider">
                    Special Advice / Recommendations
                  </label>
                  <input
                    className="w-full rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-oral-gold focus:outline-none"
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                    placeholder="e.g. Maintain soft diet, avoid cold beverages"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-theme-border/20 flex items-center justify-between">
                <p className="text-xs text-theme-muted">
                  Prescription will be automatically routed to patient and linked pharmacies.
                </p>
                <button
                  type="submit"
                  className="luxury-gold-pill py-3 px-8 text-sm font-extrabold shadow-gold-glow"
                >
                  Create & Issue Prescription
                </button>
              </div>
            </motion.form>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PAYMENT HISTORY */}
          {/* ========================================================= */}
          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto rounded-2xl border border-oral-border/80 bg-theme-surface/50 shadow-gold-card">
                <table className="w-full border-collapse text-left text-xs sm:text-sm text-theme-text">
                  <thead>
                    <tr className="border-b border-theme-border/30 bg-theme-surface/80 text-[11px] font-bold uppercase tracking-wider text-oral-gold">
                      <th className="px-6 py-4">Patient Name</th>
                      <th className="px-6 py-4">Prescription ID</th>
                      <th className="px-6 py-4">Fee Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20">
                    {payments.map((pay) => (
                      <tr key={pay._id} className="hover:bg-theme-surface/40 transition duration-150">
                        <td className="px-6 py-4 font-bold text-theme-heading">
                          {pay.userId?.name || 'Unknown Patient'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-theme-muted">
                          #{pay.orderId?.slice(-8) || pay._id?.slice(-8)}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-oral-gold">
                          Rs. {pay.amount}
                        </td>
                        <td className="px-6 py-4 capitalize font-medium">
                          {pay.method === 'card' ? '💳 Card' : pay.method}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ✓ {pay.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-theme-muted">
                          {pay.transactionId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-theme-muted text-xs">
                          {new Date(pay.paidAt || pay.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payments.length === 0 && (
                <div className="luxury-card text-center py-16 rounded-2xl border border-theme-border/40 bg-theme-surface/30">
                  <p className="text-4xl mb-2">💳</p>
                  <p className="font-bold text-theme-heading text-lg">No payment records received yet</p>
                  <p className="text-xs text-theme-muted mt-1">Receipts will log here once patients complete checkout.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AVAILABILITY SCHEDULE */}
          {/* ========================================================= */}
          {activeTab === 'availability' && (
            <motion.div
              key="availability"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="luxury-card rounded-2xl border border-oral-border/80 bg-theme-surface/60 p-6 sm:p-8 space-y-6 shadow-gold-card"
            >
              <div>
                <h2 className="font-extrabold text-xl text-theme-heading font-heading flex items-center gap-2">
                  <span>⏰</span>
                  <span>Weekly Availability Schedule</span>
                </h2>
                <p className="text-xs text-theme-muted mt-1">
                  Configure your working days and consult hours. Patients can automatically book 30-minute consultation slots within these timeframes.
                </p>
              </div>

              {availabilityMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3.5 text-xs font-bold border flex items-center justify-between shadow-sm bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">✓</span>
                    <span>{availabilityMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvailabilityMessage('')}
                    className="text-xs opacity-75 hover:opacity-100 font-bold px-1.5 py-0.5 rounded hover:bg-black/10 transition"
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              <div className="space-y-4">
                {DAYS.map((day) => {
                  const dayItem = availability.find((a) => a.day && a.day.toLowerCase() === day.toLowerCase());
                  const isAvailable = Boolean(dayItem);
                  const startTime = dayItem?.startTime || '09:00';
                  const endTime = dayItem?.endTime || '13:00';
                  const isInvalidTime =
                    isAvailable &&
                    startTime &&
                    endTime &&
                    (() => {
                      const [startH, startM] = startTime.split(':').map(Number);
                      const [endH, endM] = endTime.split(':').map(Number);
                      return endH * 60 + endM <= startH * 60 + startM;
                    })();
                  const generatedSlotsList = isAvailable && !isInvalidTime ? generateSlots(startTime, endTime) : [];

                  return (
                    <div
                      key={day}
                      className={`rounded-2xl border p-4 sm:p-5 transition duration-200 ${
                        isAvailable
                          ? 'border-oral-gold/40 bg-theme-surface/70 shadow-sm'
                          : 'border-theme-border/30 bg-theme-surface/20 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                              isAvailable
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                                : 'bg-theme-surface text-theme-muted border-theme-border/40 hover:text-theme-text'
                            }`}
                          >
                            {isAvailable ? '✓ Available' : '✕ Day Off'}
                          </button>
                          <span className="font-bold text-theme-heading text-base sm:text-lg">{day}</span>
                        </div>

                        {isAvailable && (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-theme-muted">Start Time:</label>
                              <input
                                type="time"
                                value={startTime}
                                onChange={(e) => updateDayTimes(day, 'startTime', e.target.value)}
                                className="rounded-xl border border-theme-border bg-theme-surface px-3 py-1.5 text-xs text-theme-text font-mono focus:border-oral-gold focus:outline-none"
                                style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-theme-muted">End Time:</label>
                              <input
                                type="time"
                                value={endTime}
                                onChange={(e) => updateDayTimes(day, 'endTime', e.target.value)}
                                className="rounded-xl border border-theme-border bg-theme-surface px-3 py-1.5 text-xs text-theme-text font-mono focus:border-oral-gold focus:outline-none"
                                style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {isInvalidTime && (
                        <p className="mt-2 text-xs text-rose-400 font-semibold flex items-center gap-1">
                          <span>⚠️</span>
                          <span>End time must be later than start time.</span>
                        </p>
                      )}

                      {isAvailable && !isInvalidTime && generatedSlotsList.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-theme-border/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-theme-heading flex items-center gap-1.5">
                              <span>⏰</span>
                              <span>Auto-Generated Booking Slots ({generatedSlotsList.length} slots):</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {generatedSlotsList.map((slot) => (
                              <span
                                key={slot}
                                className="rounded-lg px-2.5 py-1 text-xs font-mono font-bold bg-oral-gold/15 text-oral-gold border border-oral-gold/30 shadow-sm"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-theme-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-theme-muted">
                  Configuring these hours immediately updates online booking availability for patients.
                </p>
                <button
                  onClick={saveAvailability}
                  className="luxury-gold-pill py-3 px-8 text-sm font-extrabold shadow-gold-glow"
                >
                  Save Availability Schedule
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
