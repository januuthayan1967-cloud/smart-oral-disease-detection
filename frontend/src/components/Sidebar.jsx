import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ── Refined SVG Icon Set ─────────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Admin: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Patients: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Appointments: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Detect: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 12h6m-3-3v6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Education: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Medicine: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isDentist, isPharmacy } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();

  // Primary active dashboard route
  const dashboardPath = isAdmin ? '/admin' : isDentist ? '/dentist' : isPharmacy ? '/pharmacy' : '/dashboard';

  // Role-specific main module links
  const adminMainModules = [
    { to: '/admin', label: 'Admin', Icon: Icons.Admin },
    { to: '/admin?tab=users', label: 'Patients', Icon: Icons.Patients },
    { to: '/admin?tab=appointments', label: 'Appointments', Icon: Icons.Appointments },
    { to: '/detect', label: 'AI Detection', Icon: Icons.Detect },
    { to: '/education', label: 'Patient Education', Icon: Icons.Education },
    { to: '/medicines', label: 'Medicines', Icon: Icons.Medicine },
    { to: '/admin?tab=overview', label: 'Reports', Icon: Icons.Reports },
  ];

  const userMainModules = [
    { to: '/detect', label: 'AI Detection', Icon: Icons.Detect },
    { to: '/chat', label: 'Gemini Assistant', Icon: Icons.Chat },
    { to: '/history', label: 'Detection History', Icon: Icons.Reports },
    { to: '/consultation', label: 'Appointments', Icon: Icons.Appointments },
    { to: '/prescriptions', label: 'Prescriptions', Icon: Icons.Education },
    { to: '/medicines', label: 'Medicines Market', Icon: Icons.Medicine },
    { to: '/orders', label: 'Track Orders', Icon: Icons.Reports },
  ];

  const dentistMainModules = [
    { to: '/dentist', label: 'Consultations', Icon: Icons.Appointments },
    { to: '/dentist', label: 'Patients', Icon: Icons.Patients },
    { to: '/dentist', label: 'Prescriptions', Icon: Icons.Education },
    { to: '/medicines', label: 'Medicines', Icon: Icons.Medicine },
    { to: '/education', label: 'Education Hub', Icon: Icons.Education },
  ];

  const pharmacyMainModules = [
    { to: '/pharmacy?tab=direct-orders', label: 'Orders & Inventory', Icon: Icons.Medicine },
    { to: '/medicines', label: 'Marketplace', Icon: Icons.Education },
    { to: '/pharmacy?tab=orders', label: 'Prescription Orders', Icon: Icons.Appointments },
    { to: '/pharmacy?tab=history', label: 'Order History', Icon: Icons.Reports },
    { to: '/pharmacy?tab=profile', label: 'Profile', Icon: Icons.Patients },
  ];

  const mainModules = isAdmin
    ? adminMainModules
    : isDentist
    ? dentistMainModules
    : isPharmacy
    ? pharmacyMainModules
    : userMainModules;

  const displayName = user?.name || user?.pharmacyName || 'System Admin';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleTitle = isAdmin
    ? 'Administrator'
    : isDentist
    ? 'Dentist'
    : isPharmacy
    ? 'Pharmacy'
    : 'Patient';

  const isDashboardActive =
    location.pathname === dashboardPath &&
    (!location.search || location.search === '' || location.search === '?tab=overview');

  const sidebarContent = (
    <aside
      className="flex h-full flex-col select-none overflow-y-auto overflow-x-hidden scrollbar-thin"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #071322 0%, #050B16 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRight: isDark
          ? '1px solid rgba(217, 173, 86, 0.25)'
          : '1px solid rgba(198, 156, 72, 0.28)',
      }}
    >
      {/* ── Brand Header ──────────────────────────────────────────────── */}
      <div className="p-5 pb-4 border-b border-theme-border/30">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(217,173,86,0.35)]"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 213, 141, 0.25) 0%, rgba(217, 173, 86, 0.1) 100%)',
              border: isDark ? '1px solid rgba(217, 173, 86, 0.55)' : '1px solid rgba(198, 156, 72, 0.5)',
            }}
          >
            {/* Golden Tooth Logo SVG */}
            <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="goldToothGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F4D58D" />
                  <stop offset="100%" stopColor="#D9AD56" />
                </linearGradient>
              </defs>
              <path
                d="M10 4C7 4 4 7 4 11c0 2.5 1 5 1.5 7.5C6 21 6.5 23 8 26c.5 1.5 1.5 2 2.5 1.5S12 26 12 24c0-1.5.5-3 1.5-3H18c1 0 1.5 1.5 1.5 3 0 2 .5 3.5 1.5 3.5s2-.5 2.5-1.5c1.5-3 2-5 2.5-7.5C26.5 16 27.5 13.5 27.5 11c0-4-3-7-6-7a5.5 5.5 0 0 0-5.5 4A5.5 5.5 0 0 0 10 4Z"
                fill="url(#goldToothGrad)"
                stroke="rgba(244,213,141,0.6)"
                strokeWidth="0.75"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl font-bold tracking-tight leading-tight bg-clip-text text-transparent"
              style={{
                fontFamily: 'Outfit, sans-serif',
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #FFFFFF 30%, #F4D58D 100%)'
                  : 'linear-gradient(135deg, #14243A 40%, #C69C48 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              OralAI
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-theme-muted">
              Smart Dental Health
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Items ─────────────────────────────────────────── */}
      <div className="flex-1 px-3 py-4 space-y-5">
        {/* Top Primary Dashboard Pill */}
        <div>
          <NavLink
            to={dashboardPath}
            onClick={onClose}
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
              isDashboardActive
                ? isDark
                  ? 'shadow-[0_0_24px_rgba(217,173,86,0.35)] text-white'
                  : 'shadow-[0_4px_16px_rgba(198,156,72,0.25)] text-[#14243A] font-extrabold'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/50'
            }`}
            style={{
              background: isDashboardActive
                ? isDark
                  ? 'linear-gradient(135deg, rgba(217, 173, 86, 0.3) 0%, rgba(244, 213, 141, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(198, 156, 72, 0.22) 0%, rgba(244, 213, 141, 0.35) 100%)'
                : 'transparent',
              border: isDashboardActive
                ? isDark
                  ? '1px solid rgba(244, 213, 141, 0.65)'
                  : '1px solid rgba(198, 156, 72, 0.55)'
                : '1px solid transparent',
            }}
          >
            <span
              className="shrink-0 transition-colors"
              style={{
                color: isDashboardActive
                  ? isDark
                    ? '#F4D58D'
                    : '#C69C48'
                  : 'var(--muted)',
              }}
            >
              <Icons.Dashboard />
            </span>
            <span className="font-bold tracking-wide">Dashboard</span>
            {isDashboardActive && (
              <span
                className="ml-auto h-2 w-2 rounded-full"
                style={{
                  background: isDark ? '#F4D58D' : '#C69C48',
                  boxShadow: `0 0 8px ${isDark ? '#F4D58D' : '#C69C48'}`,
                }}
              />
            )}
          </NavLink>
        </div>

        {/* Section: MAIN MODULES */}
        <div>
          <p
            className="px-3 text-[10px] font-bold tracking-widest uppercase mb-2"
            style={{ color: isDark ? 'rgba(217, 173, 86, 0.85)' : '#C69C48' }}
          >
            Main Modules
          </p>
          <nav className="space-y-1" aria-label="Main modules">
            {mainModules.map((item, idx) => {
              const isMatch =
                location.pathname === item.to.split('?')[0] &&
                (!item.to.includes('?tab=') ||
                  location.search === `?${item.to.split('?')[1]}`);
              const isActive = isMatch && !isDashboardActive;

              return (
                <NavLink
                  key={`${item.label}-${idx}`}
                  to={item.to}
                  onClick={onClose}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? 'text-[#F4D58D] bg-theme-surface border border-[#D9AD56]/40 shadow-[0_0_15px_rgba(217,173,86,0.18)]'
                        : 'text-[#087F9C] bg-[#FFFFFF] border border-[#087F9C]/30 shadow-[0_4px_16px_rgba(8,127,156,0.1)] font-bold'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 transition-colors"
                      style={{
                        color: isActive
                          ? isDark
                            ? '#F4D58D'
                            : '#087F9C'
                          : 'var(--muted)',
                      }}
                    >
                      <item.Icon />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <Icons.ChevronRight />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Section: SETTINGS */}
        <div>
          <p
            className="px-3 text-[10px] font-bold tracking-widest uppercase mb-2"
            style={{ color: isDark ? 'rgba(217, 173, 86, 0.85)' : '#C69C48' }}
          >
            Settings
          </p>
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'text-[#F4D58D] bg-theme-surface border border-[#D9AD56]/40 shadow-[0_0_15px_rgba(217,173,86,0.18)]'
                    : 'text-[#087F9C] bg-[#FFFFFF] border border-[#087F9C]/30 shadow-[0_4px_16px_rgba(8,127,156,0.1)] font-bold'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/50'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-theme-muted group-hover:text-theme-text transition-colors">
                <Icons.Settings />
              </span>
              <span>Settings</span>
            </div>
            <Icons.ChevronRight />
          </NavLink>
        </div>
      </div>

      {/* ── Bottom 3D Realistic Holographic Tooth Artwork ───────────── */}
      <div className="px-4 pb-2">
        <div
          className="relative overflow-hidden rounded-2xl p-3.5 flex flex-col items-center justify-center text-center"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at center, rgba(0, 201, 232, 0.08) 0%, rgba(5, 11, 22, 0.85) 100%)'
              : 'radial-gradient(ellipse at center, rgba(8, 127, 156, 0.08) 0%, rgba(248, 250, 252, 0.95) 100%)',
            border: isDark
              ? '1px solid rgba(217, 173, 86, 0.28)'
              : '1px solid rgba(198, 156, 72, 0.28)',
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(0, 201, 232, 0.08)'
              : '0 6px 18px rgba(20, 36, 58, 0.05), inset 0 0 16px rgba(8, 127, 156, 0.04)',
          }}
        >
          {/* Subtle ambient core */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              isDark
                ? 'bg-gradient-to-t from-[#050B16] via-transparent to-transparent'
                : 'bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent'
            }`}
          />

          <div className="relative w-24 h-24 flex items-center justify-center">
            <img
              src={isPharmacy ? '/assets/pharmacy-hero-composition.jpg' : '/assets/3d-tooth-realistic.jpg'}
              alt={isPharmacy ? 'Pharmacy Decorative Medicine Artwork' : 'OralAI Anatomically Realistic 3D Dental Hologram'}
              className={`w-full h-full object-contain ${isPharmacy ? 'rounded-xl' : 'rounded-full animate-float'} drop-shadow-[0_0_16px_rgba(217,173,86,0.35)]`}
              style={{
                filter: 'contrast(1.08) brightness(1.04)',
                ...(!isPharmacy ? {
                  mixBlendMode: isDark ? 'screen' : 'normal',
                  maskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)',
                } : {}),
              }}
              onError={(e) => {
                e.currentTarget.src = '/assets/3d-tooth.png';
              }}
            />
          </div>
          <span
            className="text-[10px] font-semibold tracking-wide mt-0.5"
            style={{ color: isDark ? '#F4D58D' : '#14243A' }}
          >
            {isPharmacy ? 'Pharmacy Care Hub' : 'AI Oral Diagnostic Engine'}
          </span>
        </div>
      </div>

      {/* ── User Profile Footer Card with Flowing Golden Wave Backdrop ── */}
      <div className="relative p-3 border-t border-theme-border/30 overflow-hidden">
        {/* Golden Silk Light Wave Ribbon Accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/assets/golden-wave-ribbon.jpg')",
            backgroundPosition: 'bottom center',
            backgroundSize: 'cover',
            mixBlendMode: isDark ? 'screen' : 'multiply',
            opacity: isDark ? 0.4 : 0.18,
          }}
        />

        <div
          className="relative z-10 flex items-center gap-3 rounded-xl p-2.5 backdrop-blur-sm"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.88) 0%, rgba(11, 27, 45, 0.94) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 253, 248, 0.98) 100%)',
            border: isDark
              ? '1px solid rgba(217, 173, 86, 0.3)'
              : '1px solid rgba(198, 156, 72, 0.28)',
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(217, 173, 86, 0.1)'
              : '0 6px 20px rgba(20, 36, 58, 0.05), 0 0 12px rgba(198, 156, 72, 0.06)',
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #F4D58D 0%, #D9AD56 100%)',
              color: '#050B16',
            }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-theme-heading leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-theme-muted truncate leading-tight">
              {roleTitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="hidden w-64 shrink-0 overflow-hidden rounded-2xl md:block shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
        style={{
          border: isDark
            ? '1px solid rgba(217, 173, 86, 0.35)'
            : '1px solid rgba(198, 156, 72, 0.28)',
          boxShadow: isDark
            ? '0 0 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(217, 173, 86, 0.1)'
            : '0 10px 30px rgba(20, 36, 58, 0.06), 0 0 15px rgba(198, 156, 72, 0.06)',
        }}
      >
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-hidden md:hidden shadow-2xl"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

