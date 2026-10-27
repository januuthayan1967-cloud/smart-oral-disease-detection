import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getApiErrorMessage, getDashboardPath } from '../services/api';
import LoadingAnimation from '../components/LoadingAnimation';

const LOGIN_NAV_LINKS = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
      </svg>
    ),
  },
  {
    to: '/detect',
    label: 'AI Detection',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth="2" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <path strokeLinecap="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </svg>
    ),
  },
  {
    to: '/consultation',
    label: 'Consultation',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/medicines',
    label: 'Pharmacy',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function LoginNavbar({ isDark, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-30 mx-auto w-full max-w-[1440px] px-3 sm:px-6 lg:px-8 xl:px-10 pt-3 sm:pt-4">
      <nav
        aria-label="Primary Navigation"
        className="flex items-center justify-between gap-2 rounded-2xl border px-3.5 sm:px-5 py-2.5 backdrop-blur-xl transition-all duration-300"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(6, 18, 36, 0.88) 0%, rgba(9, 25, 48, 0.88) 100%)'
            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.94) 0%, rgba(252, 249, 242, 0.94) 100%)',
          borderColor: isDark ? 'rgba(244, 213, 141, 0.25)' : 'rgba(217, 173, 86, 0.35)',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 8px 24px rgba(20, 36, 58, 0.06), inset 0 1px 0 #FFFFFF',
        }}
      >
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #F4D58D 0%, #B8892D 100%)'
                : 'linear-gradient(135deg, #F4D58D 0%, #C69C48 100%)',
              borderColor: isDark ? 'rgba(255, 243, 209, 0.65)' : 'rgba(184, 137, 45, 0.5)',
              boxShadow: isDark
                ? '0 0 18px rgba(244, 213, 141, 0.35)'
                : '0 4px 12px rgba(184, 137, 45, 0.25)',
            }}
          >
            <svg className="w-5 h-5 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.5 3C5 3 3 5.2 3 8.2c0 2.1.8 4.2 1.3 6.2.4 1.8.8 3.5 1.9 5.6.4.9 1.1 1.2 1.8.9.7-.3 1.1-1.3 1.1-2.6 0-1.1.4-2.1 1.2-2.1h3.4c.8 0 1.2 1 1.2 2.1 0 1.3.4 2.3 1.1 2.6.7.3 1.4 0 1.8-.9 1.1-2.1 1.5-3.8 1.9-5.6.5-2 1.3-4.1 1.3-6.2C21 5.2 19 3 16.5 3c-1.8 0-3.4.9-4.5 2.4C10.9 3.9 9.3 3 7.5 3z" />
            </svg>
          </span>
          <div className="leading-tight">
            <span
              className="block text-base sm:text-lg font-extrabold tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif', color: isDark ? '#FFFFFF' : '#14243A' }}
            >
              Oral<span style={{ color: isDark ? '#F4D58D' : '#0284C7' }}>AI</span>
            </span>
            <span
              className="block text-[10px] sm:text-[11px] font-medium"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Smart Dental Health
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links (>= 1280px) */}
        <div
          className="hidden xl:flex items-center gap-1 rounded-full border px-3 py-1.5"
          style={{
            background: isDark ? 'rgba(4, 12, 24, 0.55)' : 'rgba(248, 250, 252, 0.85)',
            borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(203, 213, 225, 0.7)',
          }}
        >
          {LOGIN_NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={({ isActive }) => ({
                color: isActive
                  ? isDark
                    ? '#F4D58D'
                    : '#9A7322'
                  : isDark
                  ? '#CBD5E1'
                  : '#475569',
              })}
            >
              <span style={{ color: isDark ? '#F4D58D' : '#B8892D' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right Controls: Pill Theme Switch + Get Started + Mobile/Tablet Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Pill Theme Switch matching reference image */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="relative flex h-8 w-14 sm:h-9 sm:w-16 items-center justify-between rounded-full border p-1 cursor-pointer transition-all duration-300"
            style={{
              background: isDark ? 'rgba(9, 22, 42, 0.9)' : 'rgba(254, 249, 235, 0.95)',
              borderColor: isDark ? 'rgba(244, 213, 141, 0.55)' : 'rgba(217, 173, 86, 0.65)',
              boxShadow: isDark
                ? '0 0 14px rgba(244, 213, 141, 0.2)'
                : '0 2px 8px rgba(184, 137, 45, 0.15)',
            }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-xs"
              style={{ color: isDark ? '#F4D58D' : '#B8892D' }}
            >
              ☀
            </span>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #FFFDF7 0%, #F4D58D 100%)'
                  : 'linear-gradient(135deg, #E5BC64 0%, #B8892D 100%)',
              }}
            />
          </button>

          {/* Desktop Get Started CTA (>= 1024px) */}
          <Link
            to="/register"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition-transform duration-200 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(90deg, #00C9E8 0%, #0284C7 100%)',
              boxShadow: isDark
                ? '0 0 20px rgba(0, 201, 232, 0.45)'
                : '0 6px 16px rgba(2, 132, 199, 0.28)',
            }}
          >
            <span>Get Started</span>
            <span aria-hidden="true">→</span>
          </Link>

          {/* Hamburger Button (< 1280px) */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            className="xl:hidden flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-colors"
            style={{
              borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(203, 213, 225, 0.8)',
              color: isDark ? '#E2E8F0' : '#1E293B',
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
            }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Collapsible Dropdown Menu for < 1280px */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="xl:hidden mt-2 rounded-2xl border p-3 backdrop-blur-xl shadow-xl"
            style={{
              background: isDark ? 'rgba(8, 20, 38, 0.96)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(244, 213, 141, 0.3)' : 'rgba(217, 173, 86, 0.4)',
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {LOGIN_NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}
                >
                  <span style={{ color: isDark ? '#F4D58D' : '#B8892D' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t lg:hidden" style={{ borderColor: isDark ? 'rgba(148,163,184,0.15)' : '#E2E8F0' }}>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(90deg, #00C9E8 0%, #0284C7 100%)' }}
              >
                <span>Get Started</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const getWelcomeMessage = (user) => {
  if (!user) return 'Welcome User! Login successful.';
  const role = user.role || 'user';

  let displayName = '';
  if (role === 'pharmacy') {
    displayName = user.pharmacyName || user.name || 'Pharmacy';
  } else if (role === 'dentist') {
    if (user.name) {
      displayName =
        user.name.trim().startsWith('Dr.') || user.name.trim().startsWith('Dr ')
          ? user.name.trim()
          : `Dr. ${user.name.trim()}`;
    } else {
      displayName = 'Dentist';
    }
  } else if (role === 'admin') {
    displayName = user.name || 'Admin';
  } else {
    displayName = user.name || 'User';
  }

  return `Welcome ${displayName}! Login successful.`;
};

/* ── Verified Platform Feature Highlights (Circular Gold Medallions) ── */
const HERO_HIGHLIGHTS = [
  {
    line1: 'AI-Powered',
    line2: 'Detection',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
      </svg>
    ),
  },
  {
    line1: 'Connected',
    line2: 'Dental Care',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    line1: '6 Supported',
    line2: 'Categories',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <path d="M16.5 7.5 20 4" />
      </svg>
    ),
  },
];

/* ── Holographic 3D Tooth Stage Component ── */
function CinematicToothStage({ isDark, shouldReduceMotion, compact = false }) {
  return (
    <div
      className={`login-tooth-stage relative flex items-center justify-center select-none pointer-events-none mx-auto w-full ${
        compact
          ? 'h-[135px] sm:h-[205px] max-w-[260px] sm:max-w-[330px]'
          : 'h-[380px] xl:h-[450px] max-w-[400px] xl:max-w-[460px]'
      }`}
      aria-hidden="true"
    >
      {/* Ambient Cyan Medical Core Glow */}
      <div
        className={`absolute inset-0 m-auto rounded-full blur-3xl ${
          compact ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-72 h-72 xl:w-[352px] xl:h-[352px]'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 212, 255, 0.34) 0%, rgba(6, 182, 212, 0.14) 48%, transparent 75%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(217, 173, 86, 0.12) 52%, transparent 76%)',
        }}
      />

      {/* Secondary Warm Champagne-Gold Rim Glow */}
      <div
        className={`absolute inset-0 m-auto rounded-full blur-3xl ${
          compact ? 'w-44 h-28 sm:w-52 sm:h-36 translate-y-4 sm:translate-y-5' : 'w-80 h-56 translate-y-12'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(ellipse, rgba(217, 173, 86, 0.22) 0%, transparent 72%)'
            : 'radial-gradient(ellipse, rgba(198, 156, 72, 0.2) 0%, transparent 72%)',
        }}
      />

      {/* ── Decorative Holographic Medical HUD Screens (Desktop Stage Only) ── */}
      {!compact && (
        <>
          {/* Top-Left HUD: Tooth Diagnostic Scan */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [-4, 4, -4] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            className="login-hud-card absolute top-5 left-2 xl:left-3 z-20 flex h-16 w-16 xl:h-[74px] xl:w-[74px] items-center justify-center rounded-2xl border backdrop-blur-md"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(8, 45, 74, 0.72) 0%, rgba(4, 22, 42, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 248, 255, 0.92) 100%)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(6, 182, 212, 0.45)',
              boxShadow: isDark
                ? '0 0 22px rgba(0, 201, 232, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 8px 24px rgba(14, 116, 144, 0.14)',
              transform: 'perspective(500px) rotateY(16deg) rotateZ(-4deg)',
            }}
          >
            <svg className={`w-8 h-8 xl:w-9 xl:h-9 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 4C7 4 4 7 4 11c0 2.5 1 5 1.5 7.5C6 21 6.5 23 8 26c.5 1.5 1.5 2 2.5 1.5S12 26 12 24c0-1.5.5-3 1.5-3H18c1 0 1.5 1.5 1.5 3 0 2 .5 3.5 1.5 3.5s2-.5 2.5-1.5c1.5-3 2-5 2.5-7.5C26.5 16 27.5 13.5 27.5 11c0-4-3-7-6-7a5.5 5.5 0 0 0-5.5 4A5.5 5.5 0 0 0 10 4Z" />
              <path d="M3 14h26" strokeDasharray="2 2" opacity="0.65" />
            </svg>
          </motion.div>

          {/* Upper-Inner Shield Badge */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [3, -4, 3] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="login-hud-card absolute top-10 left-[86px] xl:left-[100px] z-20 flex h-12 w-12 xl:h-14 xl:w-14 items-center justify-center rounded-xl border backdrop-blur-md"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(12, 58, 92, 0.68) 0%, rgba(6, 28, 52, 0.82) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(240, 250, 255, 0.92) 100%)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(6, 182, 212, 0.4)',
              boxShadow: isDark
                ? '0 0 18px rgba(0, 201, 232, 0.3)'
                : '0 6px 18px rgba(14, 116, 144, 0.12)',
              transform: 'perspective(500px) rotateY(12deg)',
            }}
          >
            <svg className={`w-6 h-6 xl:w-7 xl:h-7 ${isDark ? 'text-cyan-200' : 'text-cyan-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Bottom-Left HUD: Diagnostic Telemetry Graph */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [-3, 5, -3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="login-hud-card absolute bottom-24 left-1 xl:left-2 z-20 flex flex-col justify-between h-16 w-24 xl:h-[72px] xl:w-[104px] rounded-xl border p-2.5 backdrop-blur-md"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(8, 42, 70, 0.72) 0%, rgba(4, 20, 38, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(236, 248, 255, 0.94) 100%)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(6, 182, 212, 0.42)',
              boxShadow: isDark
                ? '0 0 20px rgba(0, 201, 232, 0.28)'
                : '0 8px 20px rgba(14, 116, 144, 0.12)',
              transform: 'perspective(500px) rotateY(15deg) rotateX(6deg)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                AI Scan
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="flex items-end gap-1 h-8 pt-1">
              {[0.45, 0.75, 0.55, 0.9, 0.65, 1, 0.8].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h * 100}%`,
                    background: isDark
                      ? 'linear-gradient(180deg, #67E8F9 0%, #0891B2 100%)'
                      : 'linear-gradient(180deg, #06B6D4 0%, #0E7490 100%)',
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Bottom-Right HUD: Dental Arch Hologram */}
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [4, -4, 4] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="login-hud-card absolute bottom-[100px] right-2 xl:right-3 z-20 flex flex-col items-center justify-center h-16 w-16 xl:h-[74px] xl:w-[74px] rounded-2xl border p-2 backdrop-blur-md"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(8, 42, 70, 0.72) 0%, rgba(4, 20, 38, 0.85) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(236, 248, 255, 0.94) 100%)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(6, 182, 212, 0.42)',
              boxShadow: isDark
                ? '0 0 20px rgba(0, 201, 232, 0.28)'
                : '0 8px 20px rgba(14, 116, 144, 0.12)',
              transform: 'perspective(500px) rotateY(-16deg) rotateZ(3deg)',
            }}
          >
            <svg className={`w-9 h-9 xl:w-10 xl:h-10 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M7 15C7 8 12 4 18 4s11 4 11 11" strokeDasharray="2 1.5" />
              <path d="M7 21c0 7 5 11 11 11s11-4 11-11" />
              <rect x="11" y="15" width="4" height="5" rx="1" />
              <rect x="16" y="15" width="4" height="5" rx="1" />
              <rect x="21" y="15" width="4" height="5" rx="1" />
            </svg>
          </motion.div>
        </>
      )}

      {/* ── Orbiting Holographic Rings ── */}
      <div
        className="absolute inset-0 m-auto flex items-center justify-center z-10"
        style={{ transform: 'rotateX(70deg) rotateY(-14deg) translateY(-10px)' }}
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className={`rounded-full border border-dashed ${
            compact
              ? 'w-[155px] h-[155px] sm:w-[235px] sm:h-[235px]'
              : 'w-[300px] h-[300px] xl:w-[350px] xl:h-[350px]'
          } ${isDark ? 'border-cyan-300/65 shadow-[0_0_25px_rgba(0,201,232,0.45)]' : 'border-cyan-500/45 shadow-[0_0_18px_rgba(6,182,212,0.2)]'}`}
        >
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_#22D3EE]" />
          <span className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#F4D58D] shadow-[0_0_12px_#F4D58D]" />
        </motion.div>
      </div>

      <div
        className="absolute inset-0 m-auto flex items-center justify-center z-10"
        style={{ transform: 'rotateX(68deg) rotateY(16deg) translateY(-6px)' }}
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className={`rounded-full border ${
            compact
              ? 'w-[175px] h-[175px] sm:w-[260px] sm:h-[260px]'
              : 'w-[330px] h-[330px] xl:w-[390px] xl:h-[390px]'
          } ${isDark ? 'border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'border-[#D9AD56]/45'}`}
        >
          <span className="absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_#FFFFFF]" />
          <span className="absolute left-4 top-1/3 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE]" />
        </motion.div>
      </div>

      {/* ── Multi-Tiered Metallic & Cyan/Gold Pedestal Platform ── */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10 ${
          compact ? 'bottom-0.5' : 'bottom-3 xl:bottom-5'
        }`}
      >
        {/* Outer Floor Golden/Cyan Reflection Ellipse */}
        <div
          className={`rounded-[50%] border ${
            compact
              ? 'w-[155px] h-6 sm:w-[215px] sm:h-9'
              : 'w-[290px] h-14 xl:w-[340px] xl:h-16'
          }`}
          style={{
            borderColor: isDark ? 'rgba(244, 213, 141, 0.45)' : 'rgba(198, 156, 72, 0.45)',
            background: isDark
              ? 'radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.25) 0%, rgba(217, 173, 86, 0.15) 55%, transparent 80%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.18) 0%, rgba(217, 173, 86, 0.22) 55%, transparent 80%)',
            boxShadow: isDark
              ? '0 10px 35px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.35), inset 0 0 20px rgba(244, 213, 141, 0.25)'
              : '0 12px 28px rgba(20, 36, 58, 0.12), 0 0 24px rgba(198, 156, 72, 0.25)',
          }}
        />

        {/* Metallic Middle Bevel Ring */}
        <div
          className={`absolute rounded-[50%] border-t-2 ${
            compact
              ? 'bottom-1 w-[125px] h-5 sm:bottom-1.5 sm:w-[175px] sm:h-7'
              : 'bottom-3 w-[235px] h-10 xl:w-[275px] xl:h-12'
          }`}
          style={{
            borderColor: isDark ? '#67E8F9' : '#38BDF8',
            background: isDark
              ? 'linear-gradient(180deg, #164E63 0%, #082F49 55%, #041322 100%)'
              : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 55%, #94A3B8 100%)',
            boxShadow: isDark
              ? '0 5px 0 #020C18, 0 7px 20px rgba(0, 201, 232, 0.55)'
              : '0 4px 0 #94A3B8, 0 8px 20px rgba(20, 36, 58, 0.16)',
          }}
        />

        {/* Core Illuminated Emitter Disc */}
        <div
          className={`absolute rounded-[50%] border ${
            compact
              ? 'bottom-2.5 w-[90px] h-3 sm:bottom-3 sm:w-[130px] sm:h-4'
              : 'bottom-6 w-[175px] h-7 xl:w-[205px] xl:h-8'
          }`}
          style={{
            borderColor: '#CFFAFE',
            background:
              'radial-gradient(ellipse at 50% 50%, #FFFFFF 0%, #67E8F9 42%, rgba(6, 182, 212, 0.5) 78%, transparent 100%)',
            boxShadow: isDark
              ? '0 0 40px rgba(34, 211, 238, 0.95)'
              : '0 0 28px rgba(6, 182, 212, 0.65)',
          }}
        />
      </div>

      {/* ── 3D Holographic Tooth Centerpiece ── */}
      <motion.div
        animate={shouldReduceMotion ? {} : { y: [-5, 5, -5] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative z-20 flex items-center justify-center ${
          compact ? 'mb-3 sm:mb-5' : 'mb-10 xl:mb-12'
        }`}
      >
        <img
          src="/assets/3d-tooth.png"
          alt="OralAI 3D Holographic Tooth Visualization"
          className={`object-contain pointer-events-none ${
            compact
              ? 'w-[105px] h-[105px] sm:w-[160px] sm:h-[160px]'
              : 'w-[235px] h-[235px] xl:w-[285px] xl:h-[285px]'
          }`}
          style={{
            filter: isDark
              ? 'brightness(1.08) contrast(1.08) drop-shadow(0 18px 36px rgba(0, 212, 255, 0.6))'
              : 'brightness(1.02) contrast(1.06) drop-shadow(0 16px 28px rgba(14, 116, 144, 0.25))',
          }}
        />
      </motion.div>
    </div>
  );
}

export default function Login() {
  const { login, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [toastMessage, setToastMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (!loading && user) {
      const welcomeMsg = getWelcomeMessage(user);
      navigate(getDashboardPath(user.role), {
        replace: true,
        state: { toastMessage: welcomeMsg, message: welcomeMsg },
      });
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      const loggedUser = await login(data);
      const welcomeMsg = getWelcomeMessage(loggedUser);
      setSuccess(welcomeMsg);
      setToastMessage(welcomeMsg);
      setTimeout(() => {
        navigate(getDashboardPath(loggedUser?.role), {
          replace: true,
          state: { toastMessage: welcomeMsg, message: welcomeMsg },
        });
      }, 400);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
    }
  };

  if (loading) {
    return <LoadingAnimation fullScreen message="Checking session..." />;
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between transition-colors duration-300"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 52% 45%, #0B2542 0%, #061529 48%, #030A14 100%)'
          : 'linear-gradient(135deg, #FAF8F4 0%, #F2F6FA 50%, #FFFDF9 100%)',
      }}
    >
      {/* ── Cinematic Background Golden Waves & Ambient Lighting ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        {/* Golden Wave Ribbon Asset */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
            isDark ? 'opacity-40' : 'opacity-20'
          }`}
          style={{
            backgroundImage: "url('/assets/golden-wave-ribbon.jpg')",
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />

        {/* Flowing Champagne-Gold SVG Light Ribbons */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="loginGoldWave1" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#F4D58D" stopOpacity={isDark ? '0.45' : '0.35'} />
              <stop offset="50%" stopColor="#D9AD56" stopOpacity={isDark ? '0.25' : '0.2'} />
              <stop offset="100%" stopColor="#F4D58D" stopOpacity={isDark ? '0.4' : '0.3'} />
            </linearGradient>
            <linearGradient id="loginCyanWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C9E8" stopOpacity="0" />
              <stop offset="50%" stopColor="#00C9E8" stopOpacity={isDark ? '0.3' : '0.18'} />
              <stop offset="100%" stopColor="#F4D58D" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-120 680 C 240 520, 520 790, 880 580 C 1140 430, 1320 260, 1560 180"
            stroke="url(#loginGoldWave1)"
            strokeWidth="2.5"
          />
          <path
            d="M-80 730 C 280 570, 560 830, 920 620 C 1180 470, 1350 310, 1580 230"
            stroke="url(#loginGoldWave1)"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />
          <path
            d="M-100 220 C 260 390, 580 210, 920 440 C 1180 610, 1340 520, 1560 640"
            stroke="url(#loginCyanWave)"
            strokeWidth="2"
          />
        </svg>

        {/* Left & Right Golden Ambient Bokeh Glows */}
        <div
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(217, 173, 86, 0.18) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(217, 173, 86, 0.14) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/4 -right-24 h-96 w-96 rounded-full blur-3xl"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(244, 213, 141, 0.16) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(198, 156, 72, 0.12) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Top Public Navigation Bar ── */}
      <LoginNavbar isDark={isDark} toggleTheme={toggleTheme} />

      {/* ── Floating Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-theme-surface/95 px-4 py-3 text-sm font-semibold text-emerald-400 shadow-glow backdrop-blur-md"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">
              ✓
            </span>
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="ml-2 rounded-lg p-1 text-theme-muted hover:text-theme-text transition"
              aria-label="Close notification"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Responsive Content Container ── */}
      <main className="relative z-10 mx-auto flex-1 flex items-center w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-1.5 sm:py-5 lg:py-6">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-5 lg:gap-8 xl:gap-6 items-center">
          {/* ════════════════════════════════════════════════════════════════
              MOBILE & TABLET (< 1024px): Compact 3D Tooth Header Above Form
             ════════════════════════════════════════════════════════════════ */}
          <div className="lg:hidden w-full flex flex-col items-center">
            <CinematicToothStage isDark={isDark} shouldReduceMotion={shouldReduceMotion} compact={true} />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              DESKTOP HERO:
              - 1024px–1279px (lg): Responsive Two-Column Layout (Left Hero + Tooth in 6 cols, Right Card in 6 cols)
              - >= 1280px (xl): Full Three-Zone Layout (Left Copy 4 cols + Center 3D Stage 4 cols + Right Card 4 cols)
             ════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:grid lg:col-span-6 xl:col-span-8 grid-cols-1 xl:grid-cols-12 items-center gap-4 xl:gap-6 min-w-0">
            {/* Zone 1: Editorial Dental AI Copy & Gold Medallion Highlights */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="login-hero-copy xl:col-span-6 space-y-3 xl:space-y-5 min-w-0 xl:pr-2"
            >
              <p
                className="text-xs xl:text-[13px] font-bold uppercase tracking-[0.22em]"
                style={{ color: isDark ? '#E5C170' : '#9A7322' }}
              >
                AI POWERED DENTAL CARE
              </p>

              <h1
                className="text-3xl xl:text-[50px] 2xl:text-[54px] font-bold leading-[1.08] tracking-tight"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', 'Outfit', serif",
                  color: isDark ? '#F8FAFC' : '#14243A',
                }}
              >
                <span className="block">Smarter</span>
                <span
                  className="block bg-clip-text text-transparent py-0.5"
                  style={{
                    backgroundImage: isDark
                      ? 'linear-gradient(95deg, #FFF3D1 0%, #F4D58D 45%, #D9AD56 100%)'
                      : 'linear-gradient(95deg, #8C6518 0%, #B8892D 55%, #9A7322 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  Dental Care
                </span>
                <span className="block">for a Healthier</span>
                <span className="block">You</span>
              </h1>

              <p
                className="text-xs xl:text-[15px] leading-relaxed max-w-md"
                style={{ color: isDark ? '#CBD5E1' : '#475569' }}
              >
                Advanced AI technology for early detection, personalized care, and better oral health for everyone.
              </p>

              {/* Compact 3D Tooth Stage inside Left Column for Two-Column Desktop (1024px–1279px) */}
              <div className="xl:hidden">
                <CinematicToothStage isDark={isDark} shouldReduceMotion={shouldReduceMotion} compact={true} />
              </div>

              {/* 3 Circular Gold Medallion Feature Badges */}
              <div className="pt-1 xl:pt-3 flex items-start gap-5 xl:gap-8">
                {HERO_HIGHLIGHTS.map((item) => (
                  <div key={item.line1} className="flex flex-col items-center text-center group">
                    <div
                      className="flex h-11 w-11 xl:h-14 xl:w-14 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: isDark
                          ? 'radial-gradient(circle at 35% 30%, rgba(244, 213, 141, 0.2) 0%, rgba(11, 27, 45, 0.9) 75%)'
                          : 'radial-gradient(circle at 35% 30%, #FFFDF7 0%, #F5EFE0 100%)',
                        borderColor: isDark ? 'rgba(244, 213, 141, 0.6)' : 'rgba(198, 156, 72, 0.65)',
                        color: isDark ? '#F4D58D' : '#9A7322',
                        boxShadow: isDark
                          ? '0 0 20px rgba(217, 173, 86, 0.25), inset 0 0 12px rgba(244, 213, 141, 0.15)'
                          : '0 6px 16px rgba(154, 115, 34, 0.12), inset 0 1px 0 #FFFFFF',
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      className="mt-2 text-[11px] xl:text-xs font-semibold leading-tight"
                      style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}
                    >
                      {item.line1}
                      <br />
                      {item.line2}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Zone 2: Center 3D Holographic Tooth Visualization Stage (>= 1280px Three-Zone Desktop) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden xl:flex xl:col-span-6 min-w-0 items-center justify-center"
            >
              <CinematicToothStage isDark={isDark} shouldReduceMotion={shouldReduceMotion} compact={false} />
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              ZONE 3: RIGHT GOLD-BORDERED GLASSMORPHISM LOGIN CARD
             ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="w-full max-w-[440px] mx-auto lg:mx-0 lg:ml-auto lg:col-span-6 xl:col-span-4 min-w-0"
          >
            <div
              className="login-glass-card relative rounded-[24px] sm:rounded-[26px] p-4 sm:p-8 transition-all duration-300"
              style={{
                background: isDark
                  ? 'linear-gradient(155deg, rgba(10, 25, 46, 0.88) 0%, rgba(5, 14, 28, 0.94) 100%)'
                  : 'linear-gradient(155deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 252, 245, 0.98) 100%)',
                border: isDark
                  ? '1.5px solid rgba(244, 213, 141, 0.55)'
                  : '1.5px solid rgba(217, 173, 86, 0.5)',
                boxShadow: isDark
                  ? '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 36px rgba(217, 173, 86, 0.2), inset 0 1px 0 rgba(255, 243, 209, 0.25)'
                  : '0 20px 50px rgba(20, 36, 58, 0.09), 0 0 28px rgba(217, 173, 86, 0.15), inset 0 1px 0 #FFFFFF',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Luminous Champagne-Gold Corner Highlights */}
              <div
                className="pointer-events-none absolute -top-px left-8 right-8 h-[2px] rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 243, 209, 0.9) 50%, transparent 100%)',
                }}
              />
              <div
                className="pointer-events-none absolute -bottom-px left-10 right-10 h-[2px] rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(244, 213, 141, 0.75) 50%, transparent 100%)',
                }}
              />

              {/* Card Heading */}
              <div className="text-center">
                <h2
                  className="text-xl sm:text-[28px] font-bold tracking-tight"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    color: isDark ? '#FFFFFF' : '#14243A',
                  }}
                >
                  Welcome Back
                </h2>
                <p
                  className="mt-0.5 sm:mt-1 text-xs sm:text-sm"
                  style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                >
                  Sign in to your OralAI account
                </p>
              </div>

              {/* Status Alerts */}
              {success && (
                <motion.div
                  className="mt-3 sm:mt-4 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-medium"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {success}
                </motion.div>
              )}

              {error && (
                <motion.div
                  className="mt-3 sm:mt-4 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm font-medium"
                  style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="mt-3.5 sm:mt-6 space-y-2.5 sm:space-y-4" noValidate>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="sr-only"
                  >
                    Email address
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                      errors.email
                        ? 'border-red-400 ring-2 ring-red-400/20'
                        : isDark
                        ? 'border-slate-700/80 bg-[#0B192E]/85 focus-within:border-[#D9AD56] focus-within:ring-2 focus-within:ring-[#D9AD56]/25'
                        : 'border-slate-200 bg-[#F4F7FA] focus-within:border-[#C69C48] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C69C48]/20'
                    }`}
                  >
                    <span
                      className="pl-3 sm:pl-3.5 pr-2 sm:pr-2.5 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="3" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 pr-3 sm:pr-3.5 min-w-0">
                      <span
                        className="block text-[10px] font-medium leading-none mb-0.5 sm:mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Email address
                      </span>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={{
                          color: isDark ? '#F8FAFC' : '#14243A',
                          caretColor: '#D9AD56',
                          WebkitTextFillColor: isDark ? '#F8FAFC' : '#14243A',
                        }}
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Please enter a valid email address',
                          },
                        })}
                      />
                    </div>
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field with Visibility Toggle */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="sr-only"
                  >
                    Password
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                      errors.password
                        ? 'border-red-400 ring-2 ring-red-400/20'
                        : isDark
                        ? 'border-slate-700/80 bg-[#0B192E]/85 focus-within:border-[#D9AD56] focus-within:ring-2 focus-within:ring-[#D9AD56]/25'
                        : 'border-slate-200 bg-[#F4F7FA] focus-within:border-[#C69C48] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C69C48]/20'
                    }`}
                  >
                    <span
                      className="pl-3 sm:pl-3.5 pr-2 sm:pr-2.5 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 min-w-0">
                      <span
                        className="block text-[10px] font-medium leading-none mb-0.5 sm:mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Password
                      </span>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••••"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={{
                          color: isDark ? '#F8FAFC' : '#14243A',
                          caretColor: '#D9AD56',
                          WebkitTextFillColor: isDark ? '#F8FAFC' : '#14243A',
                        }}
                        {...register('password', {
                          required: 'Password is required',
                        })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-slate-400 hover:text-slate-200 focus:outline-none transition"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Right-Aligned Forgot Password Link */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium transition hover:underline"
                    style={{ color: isDark ? '#38BDF8' : '#0284C7' }}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Premium Champagne-Gold Gradient Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                  className="w-full rounded-xl py-2.5 sm:py-3.5 px-6 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isDark
                      ? 'linear-gradient(90deg, #F6DC99 0%, #D9AD56 50%, #C49238 100%)'
                      : 'linear-gradient(90deg, #E5BC64 0%, #C89636 50%, #B38024 100%)',
                    color: isDark ? '#081526' : '#FFFFFF',
                    boxShadow: isDark
                      ? '0 8px 25px rgba(217, 173, 86, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.45)'
                      : '0 8px 22px rgba(184, 137, 45, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <span>{isSubmitting ? 'Signing in...' : 'Login'}</span>
                  {!isSubmitting && <span aria-hidden="true">→</span>}
                </motion.button>
              </form>

              {/* Role Registration Section */}
              <div className="mt-3.5 sm:mt-6">
                <div className="relative flex items-center justify-center">
                  <div
                    className="flex-1 border-t"
                    style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.35)' }}
                  />
                  <span
                    className="px-3 text-[11px] sm:text-xs font-medium"
                    style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                  >
                    Create an account as
                  </span>
                  <div
                    className="flex-1 border-t"
                    style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.35)' }}
                  />
                </div>

                <div className="mt-2.5 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    {
                      to: '/register',
                      title: 'User',
                      subtitle: '(Patient)',
                      icon: <span className="text-base sm:text-lg leading-none">👤</span>,
                    },
                    {
                      to: '/register-dentist',
                      title: 'Dentist',
                      subtitle: null,
                      icon: <span className="text-base sm:text-lg leading-none">🦷</span>,
                    },
                    {
                      to: '/register-pharmacy',
                      title: 'Pharmacy',
                      subtitle: null,
                      icon: <span className="text-base sm:text-lg leading-none">💊</span>,
                    },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="group flex flex-col items-center justify-center rounded-xl border px-2 py-2 sm:py-3 text-center transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: isDark ? 'rgba(11, 25, 46, 0.65)' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(148, 163, 184, 0.22)' : '#E2E8F0',
                      }}
                    >
                      <div className="mb-1 sm:mb-1.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full transition-transform group-hover:scale-110">
                        {item.icon}
                      </div>
                      <span
                        className="text-[11px] sm:text-xs font-semibold leading-tight"
                        style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}
                      >
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span
                          className="text-[9px] sm:text-[10px] leading-tight mt-0.5"
                          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Create Account Prompt */}
              <p
                className="mt-3 sm:mt-5 text-center text-xs"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
              >
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold underline underline-offset-4 transition hover:opacity-85"
                  style={{ color: isDark ? '#F4D58D' : '#9A7322' }}
                >
                  Create Account
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
