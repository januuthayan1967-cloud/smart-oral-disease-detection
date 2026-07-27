import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { dentistDashboardAPI, prescriptionAPI, appointmentAPI } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DentistDashboard() {
  const [activeTab, setActiveTab] = useState('consultations');
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [payments, setPayments] = useState([]);
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
      setPatients(patientsRes.data.data);
      setConsultations(consultRes.data.data);
      setAvailability(normalizedAvail);
      setPayments(paymentsRes.data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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
      alert('Availability schedule saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability.');
    }
  };

  const tabs = [
    { id: 'consultations', label: 'Consultations' },
    { id: 'patients', label: 'Patients' },
    { id: 'prescriptions', label: 'Create Prescription' },
    { id: 'payments', label: 'Payment History' },
    { id: 'availability', label: 'Availability' },
  ];

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-theme-heading font-heading">Dentist Dashboard</h1>
      <p className="mt-1 text-theme-muted">Manage patients, consultations, and prescriptions</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-theme-border/40 pb-4 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
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
                  layoutId="dentist-active-tab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--gradient-accent)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'consultations' && (
          <motion.div
            key="consultations"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-4"
          >
            {consultations.map((appt, i) => {
              const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              });
              const statusColors = {
                pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
                confirmed: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
                completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                cancelled: 'bg-red-500/15 text-red-400 border border-red-500/30',
              };
              const initials = appt.patientId?.name ? appt.patientId.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'P';
              return (
                <motion.div
                  key={appt._id}
                  className="card-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-theme-accent/30 hover:shadow-glow-sm transition duration-200"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme-accent/15 text-theme-accent font-bold text-lg border border-theme-accent/30 shadow-glow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-theme-heading text-lg">{appt.patientId?.name || 'Unknown Patient'}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-theme-muted">
                        <span>📅 {dateStr}</span>
                        <span>•</span>
                        <span>⏰ {appt.appointmentTime}</span>
                      </div>
                      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[appt.status] || 'bg-theme-surface border border-theme-border/40 text-theme-text'}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:self-center">
                    {appt.meetingLink && (
                      <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 px-4 flex items-center gap-1 shadow-glow">
                        <span>📹</span>
                        <span>Join Video</span>
                      </a>
                    )}
                    {appt.status === 'pending' && (
                      <button onClick={() => handleAppointmentUpdate(appt._id, 'confirmed')} className="btn-secondary text-xs py-2 px-4 font-semibold">
                        Confirm
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <button onClick={() => handleAppointmentUpdate(appt._id, 'completed')} className="btn-secondary text-xs py-2 px-4 font-semibold">
                        Complete
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {consultations.length === 0 && (
              <div className="card text-center py-12 text-theme-muted border border-theme-border/30 bg-theme-surface/30">
                <p className="text-4xl mb-2">📅</p>
                <p className="font-semibold text-theme-heading text-lg">No consultations scheduled</p>
                <p className="text-sm mt-1">Pending and confirmed bookings will show up here.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'patients' && (
          <motion.div
            key="patients"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-6 space-y-6"
          >
            {/* Patient List (shown when no patient is selected) */}
            {!selectedPatient && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-theme-heading font-heading">Patients ({patients.length})</h2>
                  <p className="text-xs text-theme-muted">Select a patient to view full medical and diagnostic history</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {patients.map((patient) => {
                    const initials = patient.name ? patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'P';
                    return (
                      <button
                        key={patient._id}
                        onClick={() => viewPatientHistory(patient._id)}
                        className="card w-full text-left transition duration-200 border border-theme-border/50 hover:border-theme-accent/40 hover:bg-theme-surface/60 flex items-center justify-between gap-4 p-4 shadow-sm hover:shadow-glow-sm"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme-accent/15 text-theme-accent font-bold text-lg border border-theme-accent/30 shadow-glow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-theme-heading text-base truncate">{patient.name}</p>
                            <p className="text-xs text-theme-muted truncate mt-0.5">{patient.email} · {patient.phone || 'No phone'}</p>
                            {(patient.age || patient.gender) && (
                              <p className="text-[11px] text-theme-muted mt-0.5 font-medium">
                                {patient.age ? `${patient.age} yrs` : ''} {patient.age && patient.gender ? '•' : ''} {patient.gender || ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-theme-accent font-bold flex items-center gap-1 shrink-0 bg-theme-accent/10 hover:bg-theme-accent/20 px-3 py-1.5 rounded-lg border border-theme-accent/25 transition">
                          <span>Click to view patient history</span>
                          <span>→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {patients.length === 0 && (
                  <div className="card text-center py-12 text-theme-muted border border-theme-border/30 bg-theme-surface/30">
                    <p className="text-4xl mb-2">👥</p>
                    <p className="font-semibold text-theme-heading text-lg">No patient records yet</p>
                    <p className="text-sm mt-1">Patients with scheduled consultations or prescriptions will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Patient History Detail View */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Header with Back Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-theme-surface/40 p-4 rounded-2xl border border-theme-border/40">
                  <button
                    onClick={clearSelectedPatient}
                    className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2 font-semibold text-theme-accent border-theme-accent/30 hover:bg-theme-accent/10 shadow-sm"
                  >
                    <span>←</span>
                    <span>Back to Patients</span>
                  </button>
                  <div className="text-xs text-theme-muted">
                    Viewing patient history records
                  </div>
                </div>

                {historyLoading && (
                  <div className="card text-center py-16 border border-theme-border/40 bg-theme-surface/30">
                    <LoadingSpinner />
                    <p className="mt-4 font-semibold text-theme-heading text-base">Loading patient history...</p>
                    <p className="text-xs text-theme-muted mt-1">Fetching AI predictions, consultations, and prescriptions...</p>
                  </div>
                )}

                {historyError && (
                  <div className="card text-center py-12 border border-red-500/30 bg-red-500/10 text-red-400 space-y-3">
                    <p className="text-4xl">⚠️</p>
                    <p className="font-bold text-lg">{historyError}</p>
                    <p className="text-sm text-theme-muted">Unable to load patient history.</p>
                    <div className="pt-2 flex justify-center gap-3">
                      <button onClick={() => viewPatientHistory(selectedPatient)} className="btn-primary text-xs py-2 px-4 font-semibold">
                        Retry
                      </button>
                      <button onClick={clearSelectedPatient} className="btn-secondary text-xs py-2 px-4 font-semibold">
                        ← Back to Patients
                      </button>
                    </div>
                  </div>
                )}

                {patientHistory && !historyLoading && (
                  <div className="space-y-6">
                    {/* Patient Header Banner */}
                    <div className="card border border-theme-border/50 bg-theme-surface/40 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-theme-accent/20 text-theme-accent font-extrabold text-2xl border border-theme-accent/40 shadow-glow-sm">
                            {patientHistory.patient?.name ? patientHistory.patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="font-bold text-2xl text-theme-heading font-heading">{patientHistory.patient?.name || 'Patient History'}</h2>
                              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-theme-surface-2 border border-theme-border/40 text-theme-muted">
                                ID: #{patientHistory.patient?._id?.slice(-6) || 'PATIENT'}
                              </span>
                            </div>
                            <p className="text-xs text-theme-muted mt-1 flex flex-wrap items-center gap-2">
                              <span>📧 {patientHistory.patient?.email || 'N/A'}</span>
                              <span>•</span>
                              <span>📞 {patientHistory.patient?.phone || 'No phone'}</span>
                              {patientHistory.patient?.age && (
                                <>
                                  <span>•</span>
                                  <span>🎂 {patientHistory.patient.age} yrs</span>
                                </>
                              )}
                              {patientHistory.patient?.gender && (
                                <>
                                  <span>•</span>
                                  <span>👤 {patientHistory.patient.gender}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: AI Predictions */}
                    <div className="card border border-theme-border/40 p-6 bg-theme-surface/30">
                      <div className="flex items-center justify-between border-b border-theme-border/20 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-theme-heading font-heading flex items-center gap-2">
                          <span>🧠</span>
                          <span>AI Predictions</span>
                        </h3>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-theme-accent/15 text-theme-accent font-bold border border-theme-accent/30">
                          {(patientHistory.aiPredictions || patientHistory.predictions)?.length || 0} Records
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(patientHistory.aiPredictions || patientHistory.predictions)?.map((p) => {
                          const dateStr = new Date(p.createdAt || p.date || Date.now()).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          });
                          const conf = p.confidencePercentage ?? (p.confidence != null ? Math.round(p.confidence) : 0);
                          const riskColors = {
                            LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                            MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                            HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
                          };
                          return (
                            <div key={p._id} className="rounded-xl p-4 bg-theme-surface-2/40 border border-theme-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-theme-accent/30 transition">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-theme-heading text-base">{p.displayName || p.diseaseName}</p>
                                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${riskColors[p.riskLevel] || 'bg-theme-surface border-theme-border text-theme-muted'}`}>
                                    Risk Level: {p.riskLevel || 'LOW'}
                                  </span>
                                  {p.severity && (
                                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border/40 text-theme-muted">
                                      Severity: {p.severity}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-theme-muted">
                                  Prediction Date: <strong className="text-theme-heading font-semibold">{dateStr}</strong>
                                </p>
                              </div>
                              <div className="shrink-0 self-start sm:self-center">
                                <div className="text-right">
                                  <span className="text-sm font-extrabold text-theme-accent bg-theme-accent/10 border border-theme-accent/30 px-3 py-1.5 rounded-xl inline-block shadow-glow-sm">
                                    Confidence: {conf}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {!(patientHistory.aiPredictions || patientHistory.predictions)?.length && (
                          <div className="p-6 rounded-xl bg-theme-surface-2/20 border border-theme-border/20 text-center text-theme-muted text-sm italic">
                            No AI prediction history available.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Consultations */}
                    <div className="card border border-theme-border/40 p-6 bg-theme-surface/30">
                      <div className="flex items-center justify-between border-b border-theme-border/20 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-theme-heading font-heading flex items-center gap-2">
                          <span>📅</span>
                          <span>Consultations</span>
                        </h3>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-theme-accent/15 text-theme-accent font-bold border border-theme-accent/30">
                          {(patientHistory.consultations || patientHistory.appointments)?.length || 0} Records
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(patientHistory.consultations || patientHistory.appointments)?.map((appt) => {
                          const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          });
                          const statusColors = {
                            pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                            confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                            completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                            cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
                          };
                          return (
                            <div key={appt._id} className="rounded-xl p-4 bg-theme-surface-2/40 border border-theme-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-theme-accent/30 transition">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-theme-heading text-sm">📅 Date: {dateStr}</p>
                                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border capitalize ${statusColors[appt.status] || 'bg-theme-surface border-theme-border text-theme-muted'}`}>
                                    {appt.status}
                                  </span>
                                </div>
                                <p className="text-xs text-theme-muted">⏰ Time: {appt.appointmentTime}</p>
                                {appt.notes && (
                                  <p className="text-xs text-theme-text mt-2 bg-theme-surface/60 p-2.5 rounded-xl border border-theme-border/30">
                                    <strong className="text-theme-heading">Consultation Details / Notes:</strong> {appt.notes}
                                  </p>
                                )}
                              </div>
                              {appt.meetingLink && (
                                <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-center shadow-glow">
                                  <span>📹</span>
                                  <span>Join Video</span>
                                </a>
                              )}
                            </div>
                          );
                        })}

                        {!(patientHistory.consultations || patientHistory.appointments)?.length && (
                          <div className="p-6 rounded-xl bg-theme-surface-2/20 border border-theme-border/20 text-center text-theme-muted text-sm italic">
                            No consultation history available.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Prescriptions */}
                    <div className="card border border-theme-border/40 p-6 bg-theme-surface/30">
                      <div className="flex items-center justify-between border-b border-theme-border/20 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-theme-heading font-heading flex items-center gap-2">
                          <span>💊</span>
                          <span>Prescriptions</span>
                        </h3>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-theme-accent/15 text-theme-accent font-bold border border-theme-accent/30">
                          {patientHistory.prescriptions?.length || 0} Records
                        </span>
                      </div>

                      <div className="space-y-4">
                        {patientHistory.prescriptions?.map((rx) => {
                          const rxDate = new Date(rx.createdAt || rx.date || Date.now()).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          });
                          return (
                            <div key={rx._id} className="rounded-xl p-4 bg-theme-surface-2/40 border border-theme-border/30 space-y-3 hover:border-theme-accent/30 transition">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-border/20 pb-3">
                                <div>
                                  <p className="text-xs text-theme-muted">Date: <strong className="text-theme-heading">{rxDate}</strong></p>
                                  <p className="text-sm font-semibold text-theme-heading mt-0.5">
                                    Case / Diagnosis: <span className="text-theme-accent font-bold">{rx.caseDiagnosis || 'Not specified'}</span>
                                  </p>
                                </div>
                                <div>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                    rx.paymentStatus === 'paid'
                                      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                                  }`}>
                                    {rx.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-bold text-theme-accent uppercase tracking-wider mb-2">Prescribed Medicines ({rx.medicines?.length || 0})</p>
                                <div className="space-y-2">
                                  {rx.medicines?.map((m, idx) => (
                                    <div key={idx} className="rounded-lg p-3 bg-theme-surface/50 border border-theme-border/20 text-xs flex flex-wrap justify-between items-center gap-2">
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
                                <p className="text-xs text-theme-text italic bg-theme-surface/40 p-2.5 rounded-xl border border-theme-border/20">
                                  <strong className="text-theme-heading">Instructions / Notes:</strong> {rx.notes}
                                </p>
                              )}

                              <div className="flex justify-between items-center text-xs text-theme-muted pt-2 border-t border-theme-border/10">
                                <span>Fee: <strong className="text-theme-heading">Rs. {rx.prescriptionFee || 500}</strong></span>
                                <span>Prescribed By: <strong className="text-theme-heading">{rx.dentistId?.name || 'Dr. Name'}</strong></span>
                              </div>
                            </div>
                          );
                        })}

                        {!patientHistory.prescriptions?.length && (
                          <div className="p-6 rounded-xl bg-theme-surface-2/20 border border-theme-border/20 text-center text-theme-muted text-sm italic">
                            No prescription history available.
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

      {activeTab === 'prescriptions' && (
        <motion.form
          key="prescriptions"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          onSubmit={handleCreatePrescription}
          className="card mt-6 space-y-6 border border-theme-border/50 bg-theme-surface/40"
        >
          <div className="border-b border-theme-border/10 pb-4 mb-4">
            <h2 className="text-xl font-bold text-theme-heading font-heading">New Prescription</h2>
            <p className="text-sm text-theme-muted mt-0.5">Diagnose and prescribe medications to active patients.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-theme-heading">Select Patient</label>
              <select
                className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text transition focus:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent/25"
                value={prescriptionForm.patientId}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientId: e.target.value })}
                required
                style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
              >
                <option value="" className="bg-theme-surface text-theme-muted">Choose a patient...</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id} className="bg-theme-surface text-theme-text">{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-theme-heading">Case / Diagnosis</label>
              <select
                className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text transition focus:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent/25"
                value={prescriptionForm.caseDiagnosisSelect}
                onChange={(e) =>
                  setPrescriptionForm({
                    ...prescriptionForm,
                    caseDiagnosisSelect: e.target.value,
                    customCaseDiagnosis: e.target.value === 'Other' ? prescriptionForm.customCaseDiagnosis : '',
                  })
                }
                style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
              >
                <option value="" className="bg-theme-surface text-theme-muted">Select case / diagnosis...</option>
                {['Calculus', 'Caries', 'Gingivitis', 'Healthy Teeth', 'Mouth Ulcer', 'Tooth Discoloration', 'Other'].map((opt) => (
                  <option key={opt} value={opt} className="bg-theme-surface text-theme-text">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {prescriptionForm.caseDiagnosisSelect === 'Other' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-theme-heading">
                Specify Other Case / Diagnosis <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                placeholder="Enter custom case or diagnosis"
                value={prescriptionForm.customCaseDiagnosis}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, customCaseDiagnosis: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-theme-heading">Prescribed Medicines</label>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {prescriptionForm.medicines.map((med, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-3 rounded-xl border border-theme-border/40 p-4 md:grid-cols-3 bg-theme-surface-2/20 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center md:col-span-3 border-b border-theme-border/10 pb-2 mb-1">
                      <span className="text-xs font-bold text-theme-accent uppercase tracking-wider">Medicine #{idx + 1}</span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 font-semibold transition"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        className="w-full rounded-xl border border-theme-border bg-theme-surface/50 px-3.5 py-2.5 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                        placeholder="Medicine Name"
                        value={med.medicineName}
                        onChange={(e) => updateMedicine(idx, 'medicineName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        className="w-full rounded-xl border border-theme-border bg-theme-surface/50 px-3.5 py-2.5 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                        placeholder="Dosage (e.g. 1-0-1)"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        className="w-full rounded-xl border border-theme-border bg-theme-surface/50 px-3.5 py-2.5 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
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
                        className="w-full rounded-xl border border-theme-border bg-theme-surface/50 px-3.5 py-2.5 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                        placeholder="Quantity"
                        value={med.quantity}
                        onChange={(e) => updateMedicine(idx, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        className="w-full rounded-xl border border-theme-border bg-theme-surface/50 px-3.5 py-2.5 text-sm text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                        placeholder="Instructions (e.g. Take after meals)"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={addMedicineRow}
              className="btn-secondary text-xs py-2 px-4 font-semibold border border-dashed border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10"
            >
              + Add Another Medicine
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-theme-heading">Consultation Fee (Rs.)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                value={prescriptionForm.prescriptionFee}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescriptionFee: e.target.value })}
                required
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-theme-heading">Special Notes / Recommendations</label>
              <input
                className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text placeholder:text-theme-muted transition focus:border-theme-accent focus:outline-none"
                value={prescriptionForm.notes}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                placeholder="Optional dietary or general instructions"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-theme-border/10">
            <button type="submit" className="btn-primary py-3 px-6 shadow-glow font-bold text-sm">
              Create & Issue Prescription
            </button>
          </div>
        </motion.form>
      )}

      {activeTab === 'payments' && (
        <motion.div
          key="payments"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="mt-6 space-y-4"
        >
          <div className="overflow-x-auto rounded-2xl border border-theme-border/40 bg-theme-surface/30 shadow-theme">
            <table className="w-full border-collapse text-left text-sm text-theme-text">
              <thead>
                <tr className="border-b border-theme-border/40 bg-theme-surface/50 text-xs font-bold uppercase tracking-wider text-theme-muted">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Prescription ID</th>
                  <th className="px-6 py-4">Consultation Fee</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {payments.map((pay) => (
                  <tr key={pay._id} className="hover:bg-theme-surface/20 transition duration-150">
                    <td className="px-6 py-4 font-semibold text-theme-heading">
                      {pay.userId?.name || 'Unknown Patient'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-theme-muted">
                      #{pay.orderId?.slice(-8) || pay._id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 font-bold text-theme-accent">
                      Rs. {pay.amount}
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">
                      {pay.method === 'card' ? '💳 Card' : pay.method}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400">
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
            <div className="text-center py-12 text-theme-muted bg-theme-surface/10 rounded-2xl border border-theme-border/20 shadow-inner">
              <p className="text-4xl mb-2">💳</p>
              <p className="font-semibold text-theme-heading text-lg">No payments received yet</p>
              <p className="text-sm mt-1">Receipts will list here once patients check out.</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'availability' && (
        <motion.div
          key="availability"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="card mt-6 border border-theme-border/50 bg-theme-surface/40 p-6 space-y-6"
        >
          <div>
            <h2 className="font-bold text-xl text-theme-heading font-heading">Manage Availability</h2>
            <p className="text-sm text-theme-muted mt-1">Configure available working days and start/end time hours for patient appointments.</p>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayItem = availability.find((a) => a.day && a.day.toLowerCase() === day.toLowerCase());
              const isAvailable = Boolean(dayItem);
              const startTime = dayItem?.startTime || '09:00';
              const endTime = dayItem?.endTime || '13:00';
              const isInvalidTime = isAvailable && startTime && endTime && (
                (() => {
                  const [startH, startM] = startTime.split(':').map(Number);
                  const [endH, endM] = endTime.split(':').map(Number);
                  return (endH * 60 + endM) <= (startH * 60 + startM);
                })()
              );

              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-4 transition duration-200 ${
                    isAvailable
                      ? 'border-theme-accent/40 bg-theme-surface/60 shadow-sm'
                      : 'border-theme-border/30 bg-theme-surface/20 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                          isAvailable
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                            : 'bg-theme-surface text-theme-muted border-theme-border/40 hover:text-theme-text'
                        }`}
                      >
                        {isAvailable ? '✓ Available' : '✕ Not Available'}
                      </button>
                      <span className="font-bold text-theme-heading text-base">{day}</span>
                    </div>

                    {isAvailable && (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-theme-muted">Start Time:</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => updateDayTimes(day, 'startTime', e.target.value)}
                            className="rounded-xl border border-theme-border bg-theme-surface px-3 py-1.5 text-xs text-theme-text font-mono focus:border-theme-accent focus:outline-none"
                            style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-theme-muted">End Time:</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => updateDayTimes(day, 'endTime', e.target.value)}
                            className="rounded-xl border border-theme-border bg-theme-surface px-3 py-1.5 text-xs text-theme-text font-mono focus:border-theme-accent focus:outline-none"
                            style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isInvalidTime && (
                    <p className="mt-2 text-xs text-red-400 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>End time must be later than start time.</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-theme-border/10 flex items-center justify-between">
            <p className="text-xs text-theme-muted">Configured times generate 30-minute consultation slots automatically.</p>
            <button onClick={saveAvailability} className="btn-primary py-3 px-6 shadow-glow font-bold text-sm">
              Save Availability Schedule
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </Layout>
  );
}
