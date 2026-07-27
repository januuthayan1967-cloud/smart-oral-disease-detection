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
      setPatients(patientsRes.data.data);
      setConsultations(consultRes.data.data);
      setAvailability(profileRes.data.data.availability || []);
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
    const { data } = await dentistDashboardAPI.getPatientHistory(patientId);
    setPatientHistory(data.data);
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

  const toggleDay = (day) => {
    const exists = availability.find((a) => a.day === day);
    if (exists) {
      setAvailability(availability.filter((a) => a.day !== day));
    } else {
      setAvailability([...availability, { day, slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] }]);
    }
  };

  const saveAvailability = async () => {
    await dentistDashboardAPI.updateAvailability(availability);
    alert('Availability updated!');
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
            className="mt-6 grid gap-6 lg:grid-cols-2"
          >
            <div className="space-y-3">
              {patients.map((patient) => {
                const initials = patient.name ? patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'P';
                const isSelected = selectedPatient === patient._id;
                return (
                  <button
                    key={patient._id}
                    onClick={() => viewPatientHistory(patient._id)}
                    className={`card w-full text-left transition duration-200 border flex items-center gap-4 ${
                      isSelected
                        ? 'border-theme-accent bg-theme-accent-dim shadow-glow-sm'
                        : 'border-theme-border/50 hover:border-theme-accent/30 hover:bg-theme-surface/40'
                    }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-theme-surface-2 text-theme-accent font-bold border border-theme-border/40">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-theme-heading truncate">{patient.name}</p>
                      <p className="text-xs text-theme-muted truncate mt-0.5">{patient.email} · {patient.phone}</p>
                    </div>
                  </button>
                );
              })}
              {patients.length === 0 && (
                <div className="card text-center py-12 text-theme-muted border border-theme-border/30 bg-theme-surface/30">
                  <p className="text-4xl mb-2">👥</p>
                  <p className="font-semibold text-theme-heading text-lg">No patient records yet</p>
                </div>
              )}
            </div>
            {patientHistory && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card border border-theme-border/50"
              >
                <div className="flex items-center gap-3 border-b border-theme-border/20 pb-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-theme-accent/10 border border-theme-accent/30 flex items-center justify-center text-theme-accent font-bold">
                    {patientHistory.patient?.name ? patientHistory.patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'P'}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-theme-heading">{patientHistory.patient?.name}</h2>
                    <p className="text-xs text-theme-muted">Patient History & Diagnostic Records</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-theme-accent uppercase tracking-wider mb-2.5">Predictions ({patientHistory.predictions?.length || 0})</h3>
                    <div className="space-y-2">
                      {patientHistory.predictions?.slice(0, 3).map((p) => {
                        const score = p.confidence || 0;
                        return (
                          <div key={p._id} className="flex justify-between items-center rounded-xl p-3 bg-theme-surface-2/40 border border-theme-border/30">
                            <div>
                              <p className="text-sm font-semibold text-theme-heading">{p.diseaseName}</p>
                              <p className="text-[10px] text-theme-muted mt-0.5">Diagnosed: {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold text-theme-accent">{score.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                      {!patientHistory.predictions?.length && <p className="text-sm text-theme-muted italic">No AI prediction scans found.</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-theme-accent uppercase tracking-wider mb-2.5">Prescriptions ({patientHistory.prescriptions?.length || 0})</h3>
                    <div className="space-y-2">
                      {patientHistory.prescriptions?.map((rx) => (
                        <div key={rx._id} className="flex items-center justify-between p-3 rounded-xl bg-theme-surface-2/40 border border-theme-border/30">
                          <div>
                            <p className="text-sm font-semibold text-theme-heading">{new Date(rx.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-theme-muted mt-0.5">
                              Case / Diagnosis: <strong className="text-theme-heading">{rx.caseDiagnosis || 'Not specified'}</strong>
                            </p>
                            <p className="text-xs text-theme-muted mt-0.5">{rx.medicines?.length || 0} medicines prescribed</p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                              rx.paymentStatus === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                            }`}
                          >
                            {rx.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </div>
                      ))}
                      {!patientHistory.prescriptions?.length && <p className="text-sm text-theme-muted italic">No prescription sheets found.</p>}
                    </div>
                  </div>
                </div>
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
          className="card mt-6 border border-theme-border/50 bg-theme-surface/40"
        >
          <h2 className="mb-2 font-bold text-xl text-theme-heading font-heading">Manage Availability</h2>
          <p className="text-sm text-theme-muted mb-5">Select working days to allow video consultations with patients.</p>

          <div className="flex flex-wrap gap-2.5">
            {DAYS.map((day) => {
              const isSelected = availability.find((a) => a.day === day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 border ${
                    isSelected
                      ? 'bg-theme-accent/15 text-theme-accent border-theme-accent/50 shadow-glow-sm'
                      : 'bg-theme-surface/50 text-theme-muted border-theme-border/30 hover:border-theme-accent/20 hover:text-theme-text'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-theme-border/10">
            <button onClick={saveAvailability} className="btn-primary py-3 px-6 shadow-glow font-bold text-sm">
              Save Availability Slots
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </Layout>
  );
}
