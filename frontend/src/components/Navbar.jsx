import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import DateTime from './DateTime';
import Button from './Button';
import NotificationBell from './NotificationBell';

/* ── Clean SVG Navigation Icons ── */
const NavIcons = {
  Home: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Dashboard: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
    </svg>
  ),
  Detection: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path strokeLinecap="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
  ),
  Assistant: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Consultation: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Pharmacy: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const publicLinks = [
  { to: '/', label: 'Home', Icon: NavIcons.Home },
  { to: '/dashboard', label: 'Dashboard', Icon: NavIcons.Dashboard },
  { to: '/detect', label: 'Detection', Icon: NavIcons.Detection },
  { to: '/chat', label: 'AI Assistant', Icon: NavIcons.Assistant },
  { to: '/consultation', label: 'Consultation', Icon: NavIcons.Consultation },
  { to: '/medicines', label: 'Pharmacy', Icon: NavIcons.Pharmacy },
  { to: '/profile', label: 'Profile', Icon: NavIcons.Profile },
];

/* Tooth SVG icon */
function ToothIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="toothGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <path
        d="M10 4C7 4 4 7 4 11c0 2.5 1 5 1.5 7.5C6 21 6.5 23 8 26c.5 1.5 1.5 2 2.5 1.5S12 26 12 24c0-1.5.5-3 1.5-3H18c1 0 1.5 1.5 1.5 3 0 2 .5 3.5 1.5 3.5s2-.5 2.5-1.5c1.5-3 2-5 2.5-7.5C26.5 16 27.5 13.5 27.5 11c0-4-3-7-6-7a5.5 5.5 0 0 0-5.5 4A5.5 5.5 0 0 0 10 4Z"
        fill="url(#toothGrad)"
        stroke="rgba(6,182,212,0.3)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export default function Navbar({ onMenuToggle, showMenuButton = false, variant = 'public' }) {
  const { user, logout, isAuthenticated, getDashboardPath, isAdmin, isDentist, isPharmacy } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardPath = isAdmin ? '/admin' : isDentist ? '/dentist' : isPharmacy ? '/pharmacy' : '/dashboard';
  const logoPath = isAuthenticated ? dashboardPath : '/';

  const handleNavClick = (to) => {
    if (!isAuthenticated && to !== '/') {
      navigate('/login');
      return;
    }
    navigate(to);
    setMobileOpen(false);
  };

  /* User initials for avatar pill */
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.pharmacyName
    ? user.pharmacyName.slice(0, 2).toUpperCase()
    : '?';

  const displayName = user?.name || user?.pharmacyName || 'User';

  return (
    <motion.header
      className="sticky top-0 z-30 px-4 py-3 md:px-6 transition-all duration-300"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <nav
        className={`mx-auto flex w-full max-w-[1560px] items-center justify-between gap-4 rounded-2xl glass px-4 py-2.5 transition-all duration-300 md:px-6 ${
          scrolled
            ? 'shadow-theme-lg border-cyan-500/25 bg-theme-surface/90 backdrop-blur-xl'
            : 'shadow-theme'
        }`}
        aria-label="Main navigation"
        style={{ borderColor: scrolled ? 'rgba(6,182,212,0.28)' : 'var(--glass-border)' }}
      >
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="rounded-xl p-2 text-theme-text transition hover:bg-theme-accent/10 hover:text-theme-accent md:hidden"
              aria-label="Open sidebar menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <Link to={logoPath} className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              <ToothIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-lg font-bold tracking-tight text-theme-heading leading-tight transition group-hover:text-cyan-400"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Oral<span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-medium text-theme-muted tracking-wide -mt-0.5">
                Smart Dental Health
              </span>
            </div>
          </Link>
        </div>

        {/* Center: desktop nav links */}
        {variant === 'public' && (
          <div className="hidden items-center gap-0.5 xl:gap-1 lg:flex bg-theme-surface/60 p-1.5 rounded-2xl border border-theme-border/40 backdrop-blur-xl shadow-sm">
            {publicLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => {
                  if (!isAuthenticated && link.to !== '/') {
                    e.preventDefault();
                    navigate('/login');
                  }
                }}
                className={({ isActive }) =>
                  [
                    'relative rounded-xl px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-sm font-semibold whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'text-white font-bold shadow-glow'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-accent/5',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10 flex items-center gap-1.5">
                      <link.Icon />
                      <span>{link.label}</span>
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'var(--gradient-accent)',
                          boxShadow: '0 0 16px rgba(6,182,212,0.4)',
                        }}
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <DateTime />
          <ThemeToggle />
          <NotificationBell />

          {isAuthenticated ? (
            <>
              {/* Avatar pill */}
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-xl px-2.5 py-1.5 transition hover:bg-theme-accent/8 sm:flex"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-glow-sm"
                  style={{ background: 'var(--gradient-accent)' }}
                >
                  {initials}
                </div>
                <span className="max-w-[90px] truncate text-sm font-medium text-theme-muted transition group-hover:text-theme-accent">
                  {displayName}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden sm:inline-flex rounded-xl font-medium">
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} className="rounded-xl shadow-glow">
                Get Started →
              </Button>
            </>
          )}

          {variant === 'public' && (
            <button
              type="button"
              className="rounded-xl p-2 text-theme-text transition hover:bg-theme-accent/10 hover:text-theme-accent lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {variant === 'public' && mobileOpen && (
          <motion.div
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl glass p-3 shadow-theme lg:hidden"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex flex-col gap-1">
              {publicLinks.map((link, i) => (
                <motion.button
                  key={link.to}
                  type="button"
                  onClick={() => handleNavClick(link.to)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-theme-text transition hover:bg-theme-accent/10 hover:text-theme-accent"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-400/30">
                    <link.Icon />
                  </div>
                  <span>{link.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
