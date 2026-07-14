import { useState, useEffect } from 'react';
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
    await prescriptionAPI.create({
      ...prescriptionForm,
      medicines: prescriptionForm.medicines.map((m) => ({
        ...m,
        quantity: parseInt(m.quantity, 10),
      })),
      prescriptionFee: parseFloat(prescriptionForm.prescriptionFee),
    });
    setPrescriptionForm({
      patientId: '',
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
      <h1 className="text-3xl font-bold text-theme-heading">Dentist Dashboard</h1>
      <p className="mt-1 text-theme-muted">Manage patients, consultations, and prescriptions</p>

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
          </button>
        ))}
      </div>

      {activeTab === 'consultations' && (
        <div className="mt-6 space-y-4">
          {consultations.map((appt) => (
            <div key={appt._id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-theme-heading">{appt.patientId?.name}</p>
                  <p className="text-sm text-theme-muted">
                    {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-theme-border/50 bg-theme-surface/60 px-3 py-1 text-xs capitalize text-theme-text">{appt.status}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appt.meetingLink && (
                    <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                      Join Video
                    </a>
                  )}
                  {appt.status === 'pending' && (
                    <button onClick={() => handleAppointmentUpdate(appt._id, 'confirmed')} className="btn-secondary text-sm">Confirm</button>
                  )}
                  {appt.status === 'confirmed' && (
                    <button onClick={() => handleAppointmentUpdate(appt._id, 'completed')} className="btn-secondary text-sm">Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {consultations.length === 0 && <p className="text-theme-muted">No consultations yet.</p>}
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {patients.map((patient) => (
              <button
                key={patient._id}
                onClick={() => viewPatientHistory(patient._id)}
                className={`card w-full text-left transition hover:shadow-md ${selectedPatient === patient._id ? 'ring-2 ring-theme-accent' : ''}`}
              >
                <p className="font-semibold text-theme-heading">{patient.name}</p>
                <p className="text-sm text-theme-muted">{patient.email} · {patient.phone}</p>
              </button>
            ))}
            {patients.length === 0 && <p className="text-theme-muted">No patients yet.</p>}
          </div>
          {patientHistory && (
            <div className="card">
              <h2 className="font-semibold text-theme-heading">{patientHistory.patient?.name} — History</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-theme-muted">Predictions ({patientHistory.predictions?.length || 0})</h3>
                  {patientHistory.predictions?.slice(0, 3).map((p) => (
                    <p key={p._id} className="text-sm text-theme-text">{p.diseaseName} — {p.confidence?.toFixed(1)}%</p>
                  ))}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-theme-muted">Prescriptions ({patientHistory.prescriptions?.length || 0})</h3>
                  {patientHistory.prescriptions?.map((rx) => (
                    <div key={rx._id} className="flex items-center justify-between mt-1">
                      <p className="text-sm text-theme-text">{new Date(rx.createdAt).toLocaleDateString()} — {rx.medicines?.length} medicines</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          rx.paymentStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                        }`}
                      >
                        {rx.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <form onSubmit={handleCreatePrescription} className="card mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-theme-text">Patient</label>
            <select
              className="input-field"
              value={prescriptionForm.patientId}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientId: e.target.value })}
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          {prescriptionForm.medicines.map((med, idx) => (
            <div key={idx} className="grid gap-3 rounded-lg border border-theme-border/50 p-4 md:grid-cols-3">
              <div className="flex justify-between items-center md:col-span-3 border-b border-theme-border/10 pb-2 mb-1">
                <span className="text-xs font-semibold text-theme-muted">Medicine #{idx + 1}</span>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => removeMedicineRow(idx)}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 font-medium transition"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
              <input className="input-field" placeholder="Medicine Name" value={med.medicineName} onChange={(e) => updateMedicine(idx, 'medicineName', e.target.value)} required />
              <input className="input-field" placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} required />
              <input className="input-field" placeholder="Duration" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} required />
              <input type="number" className="input-field" placeholder="Quantity" value={med.quantity} onChange={(e) => updateMedicine(idx, 'quantity', e.target.value)} required />
              <input className="input-field md:col-span-2" placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addMedicineRow} className="btn-secondary text-sm">+ Add Medicine</button>
          <div>
            <label className="mb-1 block text-sm font-medium text-theme-text">Consultation Fee (Rs.)</label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={prescriptionForm.prescriptionFee}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescriptionFee: e.target.value })}
              required
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-theme-text">Notes</label>
            <textarea className="input-field" rows={3} value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Create Prescription</button>
        </form>
      )}

      {activeTab === 'payments' && (
        <div className="mt-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-theme-border/40 bg-theme-surface/30">
            <table className="w-full border-collapse text-left text-sm text-theme-text">
              <thead>
                <tr className="border-b border-theme-border/40 bg-theme-surface/50 text-xs font-semibold uppercase text-theme-muted">
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
                  <tr key={pay._id} className="hover:bg-theme-surface/20 transition">
                    <td className="px-6 py-4 font-medium text-theme-heading">
                      {pay.userId?.name || 'Unknown Patient'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-theme-muted">
                      {pay.orderId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-theme-accent">
                      Rs. {pay.amount}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {pay.method === 'card' ? '💳 Card' : pay.method}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400">
                        ✓ {pay.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-theme-muted">
                      {pay.transactionId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-theme-muted">
                      {new Date(pay.paidAt || pay.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <p className="text-center py-8 text-theme-muted bg-theme-surface/10 rounded-xl border border-theme-border/20">
              No payments received yet.
            </p>
          )}
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="card mt-6">
          <h2 className="mb-4 font-semibold text-theme-heading">Manage Availability</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  availability.find((a) => a.day === day) ? 'bg-theme-accent text-theme-primary' : 'bg-theme-surface/50 text-theme-muted hover:bg-theme-surface hover:text-theme-text'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <button onClick={saveAvailability} className="btn-primary mt-4">Save Availability</button>
        </div>
      )}
    </Layout>
  );
}
