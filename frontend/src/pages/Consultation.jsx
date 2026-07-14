import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingAnimation from '../components/LoadingAnimation';
import { dentistAPI, appointmentAPI } from '../services/api';

export default function Consultation() {
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const onBook = (dentistId) => async (data) => {
    try {
      await appointmentAPI.create({ ...data, dentistId });
      setMessage('Appointment booked successfully!');
      reset();
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking failed');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dentistRes, apptRes] = await Promise.all([
        dentistAPI.getAll({ search }),
        appointmentAPI.getAll(),
      ]);
      setDentists(dentistRes.data.data);
      setAppointments(apptRes.data.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const statusColors = {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay() + i);
    return d;
  });

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-theme-heading">Appointments</h1>
        <p className="mt-1 text-theme-muted">Find dentists and book video consultations</p>
      </motion.div>

      {message && (
        <motion.div
          className="mt-4 rounded-xl p-3 text-sm"
          style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {message}
        </motion.div>
      )}

      {/* Calendar strip */}
      <Card className="mt-6" hover={false}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-theme-muted">This Week</h2>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={[
                  'flex flex-col items-center rounded-xl p-3 transition',
                  isToday
                    ? 'bg-theme-accent/15 text-theme-accent border border-theme-accent/30'
                    : 'bg-theme-surface/40 text-theme-muted hover:bg-theme-accent/10',
                ].join(' ')}
              >
                <span className="text-xs uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className="mt-1 text-lg font-bold">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-4">
        <Input
          placeholder="Search dentists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <LoadingAnimation message="Loading dentists..." />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-theme-heading">Available Dentists</h2>
            <div className="mt-4 space-y-4">
              {dentists.map((dentist, i) => (
                <motion.div
                  key={dentist._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-theme-accent/15 text-2xl">
                        🦷
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-theme-heading">{dentist.name}</h3>
                        <p className="text-sm text-theme-accent">{dentist.specialization}</p>
                        <p className="mt-1 text-sm text-theme-muted">
                          {dentist.qualification} · {dentist.experience} years experience
                        </p>
                      </div>
                    </div>
                    <form onSubmit={handleSubmit(onBook(dentist._id))} className="mt-4 space-y-3 border-t border-theme-border/30 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Date" type="date" {...register('appointmentDate', { required: true })} />
                        <Input label="Time" type="time" {...register('appointmentTime', { required: true })} />
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        Book Appointment
                      </Button>
                    </form>
                  </Card>
                </motion.div>
              ))}
              {dentists.length === 0 && (
                <p className="text-sm text-theme-muted">No dentists found.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-theme-heading">Your Appointments</h2>
            <div className="mt-4 space-y-4">
              {appointments.map((appt, i) => (
                <motion.div
                  key={appt._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-theme-heading">{appt.dentistId?.name}</h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[appt.status]}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-theme-muted">
                      📅 {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                    </p>
                    {appt.meetingLink && appt.status !== 'cancelled' && (
                      <Button
                        as="a"
                        href={appt.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3"
                        size="sm"
                      >
                        Join Video Session
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))}
              {appointments.length === 0 && (
                <Card hover={false}>
                  <p className="text-center text-sm text-theme-muted">No appointments yet. Book one above!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
