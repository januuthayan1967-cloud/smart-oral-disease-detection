import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingAnimation from '../components/LoadingAnimation';
import { dentistAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function DentistBookingCard({ dentist, allAppointments, onBookSuccess }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const configuredDays = (dentist.availability || []).filter(
    (a) => a.day && a.startTime && a.endTime
  );
  const hasAvailability = configuredDays.length > 0;

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return days[d.getDay()];
    }
    return days[new Date(dateStr).getDay()];
  };

  const selectedDayName = getDayName(selectedDate);
  const selectedDayAvail = selectedDayName
    ? (dentist.availability || []).find(
        (a) => a.day && a.day.toLowerCase() === selectedDayName.toLowerCase()
      )
    : null;

  const isDayAvailable = Boolean(selectedDayAvail && selectedDayAvail.startTime && selectedDayAvail.endTime);

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

  const availableSlots = isDayAvailable
    ? generateSlots(selectedDayAvail.startTime, selectedDayAvail.endTime)
    : [];

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSlotPast = (slot) => {
    if (!selectedDate) return false;
    const todayStr = getTodayStr();
    if (selectedDate !== todayStr) return false;

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [sh, sm] = slot.split(':').map(Number);
    const slotDateTime = new Date(year, month - 1, day, sh, sm, 0, 0);
    const now = new Date();

    return slotDateTime <= now;
  };

  const isSlotBooked = (slot) => {
    if (!selectedDate) return false;
    return allAppointments.some((appt) => {
      const apptDentistId = appt.dentistId?._id || appt.dentistId;
      if (apptDentistId?.toString() !== dentist._id.toString()) return false;
      if (appt.status === 'cancelled') return false;
      const apptDateStr = new Date(appt.appointmentDate).toISOString().slice(0, 10);
      return apptDateStr === selectedDate && appt.appointmentTime === slot;
    });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!hasAvailability) {
      setBookingError(
        'This dentist has not configured available appointment times. Please select another dentist or wait until the dentist updates their availability.'
      );
      return;
    }
    if (!selectedDate) {
      setBookingError('Please select an appointment date.');
      return;
    }
    if (!isDayAvailable) {
      setBookingError(
        'This dentist is not available at the selected date and time. Please select another available time.'
      );
      return;
    }
    if (!selectedTime) {
      setBookingError('Please select an available time slot.');
      return;
    }
    if (selectedDate === getTodayStr() && isSlotPast(selectedTime)) {
      setBookingError('The selected appointment time has already passed. Please select a future time.');
      return;
    }
    if (isSlotBooked(selectedTime)) {
      setBookingError('This time slot has already been booked. Please select another available time.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentAPI.create({
        dentistId: dentist._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        notes,
      });
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
      onBookSuccess('Appointment booked successfully!');
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-theme-accent/15 text-2xl shadow-glow-sm border border-theme-accent/30">
          🦷
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-theme-heading">{dentist.name}</h3>
          <p className="text-sm font-semibold text-theme-accent">{dentist.specialization}</p>
          <p className="mt-0.5 text-xs text-theme-muted">
            {dentist.qualification} · {dentist.experience} years experience
          </p>
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="mt-4 rounded-xl bg-theme-surface/50 border border-theme-border/30 p-3">
        <p className="text-xs font-bold text-theme-heading uppercase tracking-wider mb-1.5">Available Hours</p>
        {hasAvailability ? (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {configuredDays.map((a) => (
              <span key={a.day} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-theme-surface border border-theme-border/40 font-medium text-theme-text">
                <strong className="text-theme-accent">{a.day}:</strong> {a.startTime} – {a.endTime}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-amber-400 font-semibold italic">
            This dentist has not configured available appointment times. Please select another dentist or wait until the dentist updates their availability.
          </p>
        )}
      </div>

      {hasAvailability && (
        <form onSubmit={handleBook} className="mt-4 space-y-4 border-t border-theme-border/30 pt-4">
          <div>
            <label className="block text-xs font-semibold text-theme-heading mb-1">Select Date</label>
            <input
              type="date"
              min={getTodayStr()}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime('');
                setBookingError('');
              }}
              required
              className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-3.5 py-2.5 text-sm text-theme-text transition focus:border-theme-accent focus:outline-none"
              style={{ color: 'var(--text)', backgroundColor: 'var(--surface)' }}
            />
          </div>

          {selectedDate && !isDayAvailable && (
            <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              ⚠️ This dentist is not available on {selectedDayName}s. Please select another available date ({configuredDays.map((d) => d.day).join(', ')}).
            </div>
          )}

          {selectedDate && isDayAvailable && (
            <div>
              <label className="block text-xs font-semibold text-theme-heading mb-1.5">
                Select Available Time Slot ({availableSlots.length} available)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-theme-border/20 rounded-xl bg-theme-surface/20">
                {availableSlots.map((slot) => {
                  const booked = isSlotBooked(slot);
                  const past = isSlotPast(slot);
                  const isDisabled = booked || past;
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedTime(slot);
                        setBookingError('');
                      }}
                      className={`rounded-lg py-1.5 px-2 text-xs font-bold transition border text-center ${
                        isDisabled
                          ? 'bg-theme-surface-2/40 text-theme-muted border-theme-border/20 cursor-not-allowed line-through opacity-60'
                          : isSelected
                          ? 'bg-theme-accent text-white border-theme-accent shadow-glow-sm'
                          : 'bg-theme-surface text-theme-text border-theme-border/40 hover:border-theme-accent/50'
                      }`}
                    >
                      {slot} {booked ? '(Booked)' : past ? '(Passed)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-theme-heading mb-1">Notes / Symptoms (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Routine checkup or toothache"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-theme-border bg-theme-surface/60 px-3.5 py-2 text-xs text-theme-text transition focus:border-theme-accent focus:outline-none"
            />
          </div>

          {bookingError && (
            <p className="text-xs text-red-400 font-semibold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              ⚠️ {bookingError}
            </p>
          )}

          <Button type="submit" disabled={submitting || !selectedDate || !selectedTime || !isDayAvailable} className="w-full">
            {submitting ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function Consultation() {
  const { user, isAdmin, isDentist } = useAuth();
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [appointmentAPI.getAll()];
      if (!isAdmin) {
        promises.push(dentistAPI.getAll({ search }));
      }
      const [apptRes, dentistRes] = await Promise.all(promises);
      setAppointments(apptRes.data.data);
      if (dentistRes) {
        setDentists(dentistRes.data.data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const statusColors = {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const patientName = appt.patientId?.name?.toLowerCase() || '';
    const patientEmail = appt.patientId?.email?.toLowerCase() || '';
    const dentistName = appt.dentistId?.name?.toLowerCase() || '';
    const status = appt.status?.toLowerCase() || '';
    return patientName.includes(term) || patientEmail.includes(term) || dentistName.includes(term) || status.includes(term);
  });

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-theme-heading font-heading">
          {isAdmin ? 'System Appointments' : isDentist ? 'My Consultations' : 'Appointments'}
        </h1>
        <p className="mt-1 text-theme-muted">
          {isAdmin
            ? 'Overview of system-wide patient and dentist consultation records'
            : isDentist
            ? 'View and manage consultations with your patients'
            : 'Find dentists and book video consultations during available hours'}
        </p>
      </motion.div>

      {message && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm font-semibold border"
          style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {message}
        </motion.div>
      )}

      <div className="mt-6">
        <Input
          placeholder={isAdmin ? 'Search appointments by patient, dentist, or status...' : 'Search dentists by name or specialization...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <LoadingAnimation message="Loading appointments..." />
      ) : isAdmin ? (
        /* ── ADMIN SYSTEM APPOINTMENTS VIEW ──────────────────────────────── */
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border/20 pb-3">
            <h2 className="text-lg font-bold text-theme-heading font-heading">
              System Appointments ({filteredAppointments.length})
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              🔒 Read-Only Record View
            </span>
          </div>

          <div className="grid gap-4">
            {filteredAppointments.map((appt, i) => {
              const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              });
              const patientName = appt.patientId?.name || 'Patient';
              const patientEmail = appt.patientId?.email ? ` (${appt.patientId.email})` : '';
              const dentistName = appt.dentistId?.name ? `Dr. ${appt.dentistId.name}` : 'Dentist';

              return (
                <motion.div
                  key={appt._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="border border-theme-border/40 bg-theme-surface/50 p-5 rounded-2xl">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-theme-accent">Patient Appointment</span>
                        </div>
                        <h3 className="font-bold text-theme-heading text-lg mt-1">
                          Patient: <span className="text-theme-text font-semibold">{patientName}</span>
                          <span className="text-xs text-theme-muted font-normal">{patientEmail}</span>
                        </h3>
                        <p className="text-sm font-semibold text-theme-accent mt-0.5">
                          Dentist: {dentistName} {appt.dentistId?.specialization && `· ${appt.dentistId.specialization}`}
                        </p>
                      </div>

                      <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusColors[appt.status] || ''}`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-theme-muted pt-2.5 border-t border-theme-border/10">
                      <span>📅 Date: <strong className="text-theme-text">{dateStr}</strong></span>
                      <span>⏰ Time: <strong className="text-theme-text">{appt.appointmentTime}</strong></span>
                      {appt.meetingLink && appt.status !== 'cancelled' && (
                        <span className="text-theme-muted flex items-center gap-1 font-medium">
                          <span>🎥</span> Video Room Configured
                        </span>
                      )}
                    </div>

                    {appt.notes && (
                      <p className="mt-2 text-xs text-theme-text italic bg-theme-surface/40 p-2.5 rounded-xl border border-theme-border/20">
                        <strong>Notes:</strong> {appt.notes}
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })}

            {filteredAppointments.length === 0 && (
              <Card hover={false}>
                <div className="text-center py-10 text-theme-muted">
                  <p className="text-4xl mb-2">📅</p>
                  <p className="font-semibold text-theme-heading text-base">No system appointments found.</p>
                  <p className="text-xs mt-1">No appointment records match your search criteria.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* ── PATIENT & DENTIST VIEW ───────────────────────────────────────── */
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {!isDentist && (
            <div>
              <h2 className="text-lg font-bold text-theme-heading font-heading mb-4">Available Dentists</h2>
              <div className="space-y-4">
                {dentists.map((dentist, i) => (
                  <motion.div
                    key={dentist._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <DentistBookingCard
                      dentist={dentist}
                      allAppointments={appointments}
                      onBookSuccess={(msg) => {
                        setMessage(msg);
                        loadData();
                      }}
                    />
                  </motion.div>
                ))}
                {dentists.length === 0 && (
                  <div className="card text-center py-12 text-theme-muted border border-theme-border/30 bg-theme-surface/30">
                    <p className="text-3xl mb-2">👨‍⚕️</p>
                    <p className="font-semibold text-theme-heading">No dentists found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={isDentist ? 'lg:col-span-2' : ''}>
            <h2 className="text-lg font-bold text-theme-heading font-heading mb-4">
              {isDentist ? 'My Consultations' : 'My Appointments'}
            </h2>
            <div className="space-y-4">
              {appointments.map((appt, i) => {
                const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                });
                return (
                  <motion.div
                    key={appt._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-theme-heading text-base">
                          {isDentist
                            ? `Patient: ${appt.patientId?.name || 'Patient'}`
                            : appt.dentistId?.name || 'Dentist'}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusColors[appt.status] || ''}`}>
                          {appt.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-theme-muted font-medium">
                        📅 {dateStr} at <strong className="text-theme-heading">{appt.appointmentTime}</strong>
                      </p>
                      {appt.notes && (
                        <p className="mt-1.5 text-xs text-theme-text italic bg-theme-surface/40 p-2 rounded-lg border border-theme-border/20">
                          Notes: {appt.notes}
                        </p>
                      )}
                      {appt.meetingLink && appt.status !== 'cancelled' && (
                        <Button
                          as="a"
                          href={appt.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 shadow-glow"
                          size="sm"
                        >
                          Join Video Session
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
              {appointments.length === 0 && (
                <Card hover={false}>
                  <div className="text-center py-8 text-theme-muted">
                    <p className="text-3xl mb-2">📅</p>
                    <p className="font-semibold text-theme-heading text-base">No appointments yet.</p>
                    <p className="text-xs mt-1">
                      {isDentist ? 'Patient bookings will appear here.' : 'Book a consultation with an available dentist!'}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

