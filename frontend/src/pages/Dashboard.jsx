import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { predictionAPI, appointmentAPI } from '../services/api';

/* ── Animated Count Up ──────────────────────────────────────────────── */
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const isPercent = typeof value === 'string' && value.includes('%');
  const targetStr = isPercent ? value.replace('%', '') : value;
  const target = parseInt(targetStr, 10);

  useEffect(() => {
    if (isNaN(target)) {
      setCount(value);
      return;
    }
    let start = 0;
    const duration = 800; // 0.8s
    const stepTime = 16; // ~60fps
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

  if (isNaN(target)) return <span>{value}</span>;
  return <span>{count}{isPercent ? '%' : ''}</span>;
}

const statCards = [
  {
    key: 'patients',
    label: 'Total Patients',
    iconBg: 'var(--stat-1)',
    accentColor: '#06B6D4',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
        <circle cx="7" cy="6" r="3" fill="#06B6D4" opacity="0.9" />
        <circle cx="14" cy="7" r="2" fill="#06B6D4" opacity="0.6" />
        <path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6H1Z" fill="#06B6D4" opacity="0.9" />
        <path d="M14 12c1.7.6 3 2.3 3 4.4V17h-3v-.6c0-1.7-.7-3.2-1.7-4.4Z" fill="#06B6D4" opacity="0.6" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Detection Reports',
    iconBg: 'var(--stat-2)',
    accentColor: '#10B981',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
        <rect x="3" y="2" width="14" height="16" rx="2" fill="#10B981" opacity="0.6" />
        <path d="M6 7h8M6 10h8M6 13h5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'appointments',
    label: 'Appointments',
    iconBg: 'var(--stat-3)',
    accentColor: '#818CF8',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
        <rect x="2" y="4" width="16" height="14" rx="2" fill="#818CF8" opacity="0.6" />
        <path d="M6 2v4M14 2v4M2 9h16" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="6" y="12" width="2" height="2" rx="0.5" fill="white" />
        <rect x="10" y="12" width="2" height="2" rx="0.5" fill="white" />
      </svg>
    ),
  },
  {
    key: 'health',
    label: 'Health Score',
    iconBg: 'var(--stat-4)',
    accentColor: '#14B8A6',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
        <path d="M10 17s-7-5.5-7-10a5 5 0 0 1 7-4.58A5 5 0 0 1 17 7c0 4.5-7 10-7 10Z" fill="#14B8A6" opacity="0.7" />
        <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const quickActions = [
  {
    to: '/detect',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-cyan-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M12 9v6m-3-3h6" />
      </svg>
    ),
    title: 'Detect Disease',
    desc: 'Upload an oral image for AI analysis',
    color: 'rgba(6,182,212,0.12)'
  },
  {
    to: '/chat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Chat Assistant',
    desc: 'Ask oral health questions',
    color: 'rgba(16,185,129,0.12)'
  },
  {
    to: '/education',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-purple-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    title: 'Patient Education',
    desc: 'Clinical hygiene guides & oral health resources',
    color: 'rgba(167,139,250,0.12)'
  },
  {
    to: '/consultation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-teal-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Consultation',
    desc: 'Book a dentist appointment',
    color: 'rgba(20,184,166,0.12)'
  },
  {
    to: '/prescriptions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-indigo-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12h6m-3-3v6" />
      </svg>
    ),
    title: 'Prescriptions',
    desc: 'View dentist prescriptions',
    color: 'rgba(99,102,241,0.12)'
  },
  {
    to: '/orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-amber-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Track Orders',
    desc: 'Track medicine deliveries',
    color: 'rgba(245,158,11,0.12)'
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [predictions, setPredictions] = useState([]);
  const [appointmentCount, setAppointmentCount] = useState(0);

  const showDebug = new URLSearchParams(location.search).get('debug') === '1';

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      predictionAPI.getAll().catch(() => ({ data: { data: [] } })),
      appointmentAPI.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([predRes, apptRes]) => {
      if (cancelled) return;
      const list = Array.isArray(predRes?.data?.data) ? predRes.data.data : [];
      setPredictions(list.slice(0, 3));
      const appts = Array.isArray(apptRes?.data?.data) ? apptRes.data.data : [];
      setAppointmentCount(appts.length);
    });
    return () => { cancelled = true; };
  }, []);

  const stats = {
    patients: 1,
    reports: predictions.length,
    appointments: appointmentCount,
    health: predictions.length > 0 ? '85%' : '—',
  };

  return (
    <Layout>
      {showDebug && (
        <div className="mb-4 rounded-xl p-3 text-xs" style={{ background: 'var(--success-bg)' }}>
          <div className="font-medium text-theme-heading">Debug: user state</div>
          <pre className="whitespace-pre-wrap text-theme-muted">{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
          Welcome back,{' '}
          <span style={{ color: 'var(--accent)' }}>{user?.name ?? 'User'}</span> 👋
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>
          Here's your oral health overview for today
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <motion.div
              className="rounded-2xl p-5 shadow-theme"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                overflow: 'hidden',
                position: 'relative',
              }}
              whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              {/* Gradient top strip */}
              <div
                className="absolute left-0 right-0 top-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${stat.accentColor}, transparent)` }}
              />
              <div className="flex items-center justify-between">
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: stat.iconBg }}
                >
                  {stat.icon}
                </div>
                {stat.key === 'health' && stats.health !== '—' && (
                  <div className="relative flex items-center justify-center h-12 w-12 mb-3">
                    <svg className="w-12 h-12 -rotate-90">
                      <circle
                        className="text-theme-border/20"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="transparent"
                        r="18"
                        cx="24"
                        cy="24"
                        style={{ color: 'var(--border-soft)' }}
                      />
                      <motion.circle
                        className="text-theme-accent"
                        strokeWidth="3.5"
                        strokeDasharray={2 * Math.PI * 18}
                        initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - parseInt(stats.health) / 100) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="18"
                        cx="24"
                        cy="24"
                        style={{ color: 'var(--accent)' }}
                      />
                    </svg>
                    <div className="absolute text-[11px] font-bold text-theme-heading">
                      <AnimatedCounter value={stats.health} />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</p>
              {stat.key !== 'health' ? (
                <p
                  className="mt-1 text-3xl font-bold"
                  style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
                >
                  <AnimatedCounter value={stats[stat.key]} />
                </p>
              ) : (
                <p
                  className="mt-1 text-3xl font-bold"
                  style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
                >
                  {stats.health === '—' ? '—' : <AnimatedCounter value={stats.health} />}
                </p>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
        Quick Actions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
          >
            <Link to={action.to} className="block h-full">
              <motion.div
                className="group h-full rounded-2xl p-5 shadow-theme transition-all"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-soft)',
                }}
                whileHover={{ y: -4, borderColor: 'var(--accent)', boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ background: action.color }}
                  >
                    {action.icon}
                  </div>
                  <motion.span
                    className="text-xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: 'var(--accent)' }}
                  >
                    →
                  </motion.span>
                </div>
                <h3
                  className="mt-3 font-semibold"
                  style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
                >
                  {action.title}
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{action.desc}</p>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent detections */}
      {predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div
            className="rounded-2xl p-6 shadow-theme"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
                Recent Detections
              </h2>
              <Link
                to="/history"
                className="text-sm font-medium transition hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {predictions.map((p, i) => {
                const pct = typeof p.confidence === 'number' ? p.confidence : 0;
                return (
                  <motion.div
                    key={p._id}
                    className="flex items-center justify-between rounded-xl p-4"
                    style={{ background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)', border: '1px solid var(--border-soft)' }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: 'var(--heading)' }}>{p.diseaseName ?? 'Unknown'}</p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {/* Mini confidence bar */}
                      <div className="hidden w-20 sm:block">
                        <div
                          className="h-1.5 overflow-hidden rounded-full"
                          style={{ background: 'var(--border-soft)' }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'var(--gradient-accent)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + i * 0.06 }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
