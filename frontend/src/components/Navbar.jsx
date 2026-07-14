import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import DateTime from './DateTime';
import Button from './Button';
import NotificationBell from './NotificationBell';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/detect', label: 'Detection' },
  { to: '/medicines', label: 'Medicines' },
  { to: '/consultation', label: 'Appointments' },
  { to: '/profile', label: 'Profile' },
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
      className="sticky top-0 z-30 px-4 py-3 md:px-6"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl glass px-4 py-2.5 shadow-theme md:px-6"
        aria-label="Main navigation"
        style={{ borderColor: 'var(--glass-border)' }}
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
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <ToothIcon className="h-7 w-7" />
            </motion.div>
            <span
              className="text-lg font-bold tracking-tight transition group-hover:opacity-80"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
            >
              Oral{' '}
              <span style={{ color: 'var(--accent)' }}>AI</span>
            </span>
          </Link>
        </div>

        {/* Center: desktop nav links */}
        {variant === 'public' && (
          <div className="hidden items-center gap-0.5 md:flex">
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
                    'relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-theme-accent'
                      : 'text-theme-muted hover:text-theme-text',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-xl"
                        style={{ background: 'var(--accent-dim)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden sm:inline-flex">
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </>
          )}

          {variant === 'public' && (
            <button
              type="button"
              className="rounded-xl p-2 text-theme-text transition hover:bg-theme-accent/10 hover:text-theme-accent md:hidden"
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
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl glass p-3 shadow-theme md:hidden"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex flex-col gap-0.5">
              {publicLinks.map((link, i) => (
                <motion.button
                  key={link.to}
                  type="button"
                  onClick={() => handleNavClick(link.to)}
                  className="rounded-xl px-4 py-3 text-left text-sm font-medium text-theme-text transition hover:bg-theme-accent/10 hover:text-theme-accent"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {link.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
