import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { predictionAPI, appointmentAPI } from '../services/api';
import SparklineWave from '../components/dashboard/SparklineWave';
import DentalHeroVisual from '../components/dashboard/DentalHeroVisual';

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

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    let start = 0;
    const duration = 650;
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

  if (isNaN(target)) return <span aria-label={String(value)}>{value}</span>;
  return (
    <span aria-label={`${count}${isPercent ? '%' : ''}`}>
      {count}{isPercent ? '%' : ''}
    </span>
  );
}

const statCards = [
  {
    key: 'patients',
    label: 'Profile Status',
    accentColor: '#00C9E8',
    colorName: 'Active',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cyan-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Detection Reports',
    accentColor: '#18D99B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12h6m-3-3v6" />
      </svg>
    ),
  },
  {
    key: 'appointments',
    label: 'Appointments',
    accentColor: '#D9AD56',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#D9AD56]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'health',
    label: 'Oral Health Score',
    accentColor: '#00C9E8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cyan-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
    title: 'AI Disease Detection',
    desc: 'Upload oral image for instant MobileNetV3 diagnostic screening',
    accent: '#00C9E8',
  },
  {
    to: '/chat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[#D9AD56]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Gemini AI Assistant',
    desc: 'Consult your intelligent oral health assistant anytime',
    accent: '#D9AD56',
  },
  {
    to: '/consultation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Dentist Consultations',
    desc: 'Book verified dental appointments & clinical care',
    accent: '#18D99B',
  },
  {
    to: '/prescriptions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-purple-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12h6m-3-3v6" />
      </svg>
    ),
    title: 'My Prescriptions',
    desc: 'View & download verified prescriptions from dentists',
    accent: '#A855F7',
  },
  {
    to: '/education',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-pink-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    title: 'Patient Education',
    desc: 'Explore clinical dental guides, videos & hygiene advice',
    accent: '#EC4899',
  },
  {
    to: '/orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-orange-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Orders & Tracking',
    desc: 'Track pharmacy medicine orders and dispatch status',
    accent: '#F97316',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
      setPredictions(list.slice(0, 4));
      const appts = Array.isArray(apptRes?.data?.data) ? apptRes.data.data : [];
      setAppointmentCount(appts.length);
    });
    return () => { cancelled = true; };
  }, []);

  const stats = {
    patients: 'Active',
    reports: predictions.length,
    appointments: appointmentCount,
    health: predictions.length > 0 ? '88%' : '—',
  };

  return (
    <Layout>
      {showDebug && (
        <div className="mb-4 rounded-xl p-3 text-xs" style={{ background: 'var(--success-bg)' }}>
          <div className="font-medium text-theme-heading">Debug: user state</div>
          <pre className="whitespace-pre-wrap text-theme-muted">{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      {/* ── Ultra-Premium Patient Welcome Banner with Golden Waves & Holographic 3D Tooth ── */}
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
              <span>PATIENT DENTAL HEALTH</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
              Welcome Back,<br />
              <span className={
                isDark
                  ? 'bg-gradient-to-r from-[#F4D58D] via-[#D9AD56] to-cyan-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-[#8C6D23] via-[#C69C48] to-[#087F9C] bg-clip-text text-transparent'
              }>
                {user?.name ?? 'Patient'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">
              Here is your personal oral health overview, recent diagnostic scans and clinical care options.
            </p>
          </div>

          {/* Realistic 3D Holographic Tooth Visualization + Floating Quote Card */}
          <DentalHeroVisual
            quoteLine1="Better Oral Health"
            quoteLine2="Brighter Smiles"
          />
        </div>
      </motion.div>

      {/* ── 4 Patient Stat Cards ─────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200"
            style={{
              background: isDark ? 'rgba(11, 27, 45, 0.85)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(217, 173, 86, 0.28)' : '1px solid rgba(198, 156, 72, 0.28)',
              boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.45)' : '0 8px 24px rgba(20, 36, 58, 0.06)',
            }}
            whileHover={{
              y: -3,
              borderColor: isDark ? 'rgba(217, 173, 86, 0.65)' : 'rgba(198, 156, 72, 0.65)',
              boxShadow: isDark
                ? '0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(217, 173, 86, 0.2)'
                : '0 12px 30px rgba(20, 36, 58, 0.12)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${stat.accentColor} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stat.accentColor} 35%, transparent)`,
                  boxShadow: `0 0 14px color-mix(in srgb, ${stat.accentColor} 20%, transparent)`,
                }}
              >
                {stat.icon}
              </div>

              {stat.key === 'health' && stats.health !== '—' ? (
                <div className="relative flex items-center justify-center h-12 w-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      strokeWidth="3.5"
                      stroke={isDark ? 'rgba(217, 173, 86, 0.2)' : 'rgba(198, 156, 72, 0.25)'}
                      fill="transparent"
                      r="18"
                      cx="24"
                      cy="24"
                    />
                    <motion.circle
                      strokeWidth="3.5"
                      strokeDasharray={2 * Math.PI * 18}
                      initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - parseInt(stats.health) / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                      stroke={isDark ? '#00C9E8' : '#087F9C'}
                      fill="transparent"
                      r="18"
                      cx="24"
                      cy="24"
                    />
                  </svg>
                  <div className={`absolute text-[11px] font-black font-mono ${isDark ? 'text-white' : 'text-[#14243A]'}`}>
                    <AnimatedCounter value={stats.health} />
                  </div>
                </div>
              ) : (
                <SparklineWave color={stat.accentColor} id={stat.key} />
              )}
            </div>

            <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-black text-theme-heading font-heading">
              {stat.key === 'patients' ? (
                <span className={isDark ? 'text-emerald-400 text-lg' : 'text-[#16835D] text-lg'}>Active Verified</span>
              ) : stat.key === 'health' ? (
                stats.health === '—' ? '—' : <AnimatedCounter value={stats.health} />
              ) : (
                <AnimatedCounter value={stats[stat.key]} />
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Action Modules ─────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="mb-4 text-base font-bold text-theme-heading font-heading uppercase tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#D9AD56]" />
          Quick Actions & Clinical Care
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
            >
              <Link to={action.to} className="block h-full group">
                <div
                  className="h-full rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between"
                  style={{
                    background: isDark ? 'rgba(11, 27, 45, 0.85)' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(217, 173, 86, 0.28)' : '1px solid rgba(198, 156, 72, 0.28)',
                    boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.45)' : '0 8px 24px rgba(20, 36, 58, 0.06)',
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          background: `color-mix(in srgb, ${action.accent} 15%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${action.accent} 35%, transparent)`,
                          boxShadow: `0 0 16px color-mix(in srgb, ${action.accent} 25%, transparent)`,
                        }}
                      >
                        {action.icon}
                      </div>
                      <span className="text-lg text-theme-muted group-hover:text-[#F4D58D] group-hover:translate-x-1 transition-all">
                        →
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-theme-heading font-heading group-hover:text-[#F4D58D] transition-colors">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs text-theme-muted leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Recent AI Detections ─────────────────────────────────────── */}
      {predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-6 transition-colors"
          style={{
            background: isDark ? 'rgba(11, 27, 45, 0.85)' : '#FFFFFF',
            border: isDark ? '1px solid rgba(217, 173, 86, 0.28)' : '1px solid rgba(198, 156, 72, 0.28)',
            boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 8px 24px rgba(20, 36, 58, 0.06)',
          }}
        >
          <div className="mb-5 flex items-center justify-between border-b border-theme-border/30 pb-3">
            <div>
              <h2 className="text-base font-bold text-theme-heading font-heading">
                Recent AI Detections
              </h2>
              <p className="text-xs text-theme-muted mt-0.5">
                Oral condition evaluations analyzed via MobileNetV3 AI model
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs font-bold text-[#F4D58D] hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <span>→</span>
            </Link>
          </div>

          <div className="space-y-3">
            {predictions.map((p, i) => {
              const pct = typeof p.confidence === 'number' ? p.confidence : 0;
              return (
                <div
                  key={p._id || i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 transition border border-theme-border/20 bg-theme-surface/50 hover:border-[#D9AD56]/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt="Scan thumbnail"
                        className="h-12 w-12 rounded-xl object-cover border border-theme-border/40 shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-theme-heading truncate">
                        {p.displayName || p.diseaseName || 'Oral Condition'}
                      </p>
                      <p className="text-xs text-theme-muted mt-0.5">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}
                        {p.riskLevel && (
                          <span className="ml-2 font-semibold text-[#D9AD56]">
                            · Risk: {p.riskLevel}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 sm:w-32">
                      <div className="h-2 overflow-hidden rounded-full bg-theme-surface border border-theme-border/30">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, #00C9E8 0%, #18D99B 100%)',
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#00C9E8] w-12 text-right">
                      {pct.toFixed(1)}%
                    </span>
                    <Link
                      to="/consultation"
                      className="hidden sm:inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold border border-[#D9AD56]/40 text-[#F4D58D] hover:bg-[#D9AD56]/10 transition"
                    >
                      Consult Doctor
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
