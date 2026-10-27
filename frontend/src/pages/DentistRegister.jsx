import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getApiErrorMessage } from '../services/api';

const DENTIST_NAV_LINKS = [
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

/* ── Verified Specialist Feature Highlights (Circular Gold Medallions) ── */
const DENTIST_HIGHLIGHTS = [
  {
    line1: 'AI Diagnostic',
    line2: 'Assistance',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
      </svg>
    ),
  },
  {
    line1: 'Digital',
    line2: 'Consultations',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    line1: 'E-Prescription',
    line2: 'Workflow',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

function DentistNavbar({ isDark, toggleTheme }) {
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
          {DENTIST_NAV_LINKS.map((item) => (
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

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

          <Link
            to="/login"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition-transform duration-200 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(90deg, #00C9E8 0%, #0284C7 100%)',
              boxShadow: isDark
                ? '0 0 20px rgba(0, 201, 232, 0.45)'
                : '0 6px 16px rgba(2, 132, 199, 0.28)',
            }}
          >
            <span>Sign In</span>
            <span aria-hidden="true">→</span>
          </Link>

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
              {DENTIST_NAV_LINKS.map((item) => (
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
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(90deg, #00C9E8 0%, #0284C7 100%)' }}
              >
                <span>Sign In</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Holographic 3D Tooth Stage Component ── */
function CinematicToothStage({ isDark, shouldReduceMotion, compact = false }) {
  return (
    <div
      className={`auth-tooth-stage relative flex items-center justify-center select-none pointer-events-none mx-auto w-full ${
        compact
          ? 'h-[155px] sm:h-[205px] max-w-[280px] sm:max-w-[330px]'
          : 'h-[360px] xl:h-[430px] max-w-[360px] xl:max-w-[420px]'
      }`}
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 m-auto rounded-full blur-3xl ${
          compact ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-64 h-64 xl:w-[320px] xl:h-[320px]'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 212, 255, 0.34) 0%, rgba(6, 182, 212, 0.14) 48%, transparent 75%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(217, 173, 86, 0.12) 52%, transparent 76%)',
        }}
      />

      <div
        className={`absolute inset-0 m-auto rounded-full blur-3xl ${
          compact ? 'w-44 h-28 sm:w-52 sm:h-36 translate-y-4 sm:translate-y-5' : 'w-72 h-52 translate-y-12'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(ellipse, rgba(217, 173, 86, 0.22) 0%, transparent 72%)'
            : 'radial-gradient(ellipse, rgba(198, 156, 72, 0.2) 0%, transparent 72%)',
        }}
      />

      {/* ── Decorative Holographic Dental Specialist HUD Screens (Desktop Stage Only) ── */}
      {!compact && (
        <>
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [-4, 4, -4] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            className="auth-hud-card absolute top-4 left-1 xl:left-2 z-20 flex h-14 w-14 xl:h-16 xl:w-16 items-center justify-center rounded-2xl border backdrop-blur-md"
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
            <svg className={`w-7 h-7 xl:w-8 xl:h-8 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 4C7 4 4 7 4 11c0 2.5 1 5 1.5 7.5C6 21 6.5 23 8 26c.5 1.5 1.5 2 2.5 1.5S12 26 12 24c0-1.5.5-3 1.5-3H18c1 0 1.5 1.5 1.5 3 0 2 .5 3.5 1.5 3.5s2-.5 2.5-1.5c1.5-3 2-5 2.5-7.5C26.5 16 27.5 13.5 27.5 11c0-4-3-7-6-7a5.5 5.5 0 0 0-5.5 4A5.5 5.5 0 0 0 10 4Z" />
              <path d="M3 14h26" strokeDasharray="2 2" opacity="0.65" />
            </svg>
          </motion.div>

          <motion.div
            animate={shouldReduceMotion ? {} : { y: [3, -4, 3] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="auth-hud-card absolute top-9 left-[74px] xl:left-[86px] z-20 flex h-11 w-11 xl:h-12 xl:w-12 items-center justify-center rounded-xl border backdrop-blur-md"
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
            <svg className={`w-5 h-5 xl:w-6 xl:h-6 ${isDark ? 'text-cyan-200' : 'text-cyan-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M8 12h8" strokeLinecap="round" />
            </svg>
          </motion.div>

          <motion.div
            animate={shouldReduceMotion ? {} : { y: [-3, 5, -3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="auth-hud-card absolute bottom-24 left-1 xl:left-2 z-20 flex flex-col justify-between h-14 w-20 xl:h-16 xl:w-24 rounded-xl border p-2 backdrop-blur-md"
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
              <span className={`text-[7px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                DDS Rx
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="flex items-end gap-1 h-7 pt-1">
              {[0.55, 0.8, 0.6, 0.95, 0.7, 1, 0.85].map((h, i) => (
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

          <motion.div
            animate={shouldReduceMotion ? {} : { y: [4, -4, 4] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="auth-hud-card absolute bottom-[96px] right-1 xl:right-2 z-20 flex flex-col items-center justify-center h-14 w-14 xl:h-16 xl:w-16 rounded-2xl border p-2 backdrop-blur-md"
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
            <svg className={`w-8 h-8 xl:w-9 xl:h-9 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4">
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
              ? 'w-[170px] h-[170px] sm:w-[235px] sm:h-[235px]'
              : 'w-[280px] h-[280px] xl:w-[320px] xl:h-[320px]'
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
              ? 'w-[190px] h-[190px] sm:w-[260px] sm:h-[260px]'
              : 'w-[305px] h-[305px] xl:w-[355px] xl:h-[355px]'
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
        <div
          className={`rounded-[50%] border ${
            compact
              ? 'w-[165px] h-7 sm:w-[215px] sm:h-9'
              : 'w-[260px] h-[52px] xl:w-[310px] xl:h-[60px]'
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

        <div
          className={`absolute rounded-[50%] border-t-2 ${
            compact
              ? 'bottom-1.5 w-[135px] h-5 sm:w-[175px] sm:h-7'
              : 'bottom-3 w-[215px] h-9 xl:w-[250px] xl:h-11'
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

        <div
          className={`absolute rounded-[50%] border ${
            compact
              ? 'bottom-3 w-[95px] h-3.5 sm:w-[130px] sm:h-4'
              : 'bottom-5 w-[155px] h-6 xl:w-[185px] xl:h-7'
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
          compact ? 'mb-3.5 sm:mb-5' : 'mb-9 xl:mb-11'
        }`}
      >
        <img
          src="/assets/3d-tooth.png"
          alt="OralAI 3D Holographic Tooth Visualization"
          className={`object-contain pointer-events-none ${
            compact
              ? 'w-[115px] h-[115px] sm:w-[160px] sm:h-[160px]'
              : 'w-[215px] h-[215px] xl:w-[255px] xl:h-[255px]'
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

export default function DentistRegister() {
  const { registerDentist } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      const { confirmPassword, ...dentistData } = data;
      const result = await registerDentist(dentistData);
      const msg = result?.message || 'Registration submitted! Awaiting admin approval.';
      setSuccess(msg);
      setTimeout(() => navigate('/login', { state: { message: msg } }), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  const getFieldWrapperClasses = (hasError) =>
    `relative flex items-center rounded-xl border transition-all duration-200 ${
      hasError
        ? 'border-red-400 ring-2 ring-red-400/20'
        : isDark
        ? 'border-slate-700/80 bg-[#0B192E]/85 focus-within:border-[#D9AD56] focus-within:ring-2 focus-within:ring-[#D9AD56]/25'
        : 'border-slate-200 bg-[#F4F7FA] focus-within:border-[#C69C48] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C69C48]/20'
    }`;

  const inputTextStyle = {
    color: isDark ? '#F8FAFC' : '#14243A',
    caretColor: '#D9AD56',
    WebkitTextFillColor: isDark ? '#F8FAFC' : '#14243A',
  };

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
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
            isDark ? 'opacity-40' : 'opacity-20'
          }`}
          style={{
            backgroundImage: "url('/assets/golden-wave-ribbon.jpg')",
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="dentistGoldWave1" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#F4D58D" stopOpacity={isDark ? '0.45' : '0.35'} />
              <stop offset="50%" stopColor="#D9AD56" stopOpacity={isDark ? '0.25' : '0.2'} />
              <stop offset="100%" stopColor="#F4D58D" stopOpacity={isDark ? '0.4' : '0.3'} />
            </linearGradient>
            <linearGradient id="dentistCyanWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C9E8" stopOpacity="0" />
              <stop offset="50%" stopColor="#00C9E8" stopOpacity={isDark ? '0.3' : '0.18'} />
              <stop offset="100%" stopColor="#F4D58D" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-120 680 C 240 520, 520 790, 880 580 C 1140 430, 1320 260, 1560 180"
            stroke="url(#dentistGoldWave1)"
            strokeWidth="2.5"
          />
          <path
            d="M-80 730 C 280 570, 560 830, 920 620 C 1180 470, 1350 310, 1580 230"
            stroke="url(#dentistGoldWave1)"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />
          <path
            d="M-100 220 C 260 390, 580 210, 920 440 C 1180 610, 1340 520, 1560 640"
            stroke="url(#dentistCyanWave)"
            strokeWidth="2"
          />
        </svg>

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
      <DentistNavbar isDark={isDark} toggleTheme={toggleTheme} />

      {/* ── Main Responsive Content Container ── */}
      <main className="relative z-10 mx-auto flex-1 flex items-center w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 lg:py-6">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-8 xl:gap-6 items-center">
          {/* ════════════════════════════════════════════════════════════════
              MOBILE & TABLET (< 1024px): Compact 3D Tooth Header Above Form
             ════════════════════════════════════════════════════════════════ */}
          <div className="lg:hidden w-full flex flex-col items-center">
            <CinematicToothStage isDark={isDark} shouldReduceMotion={shouldReduceMotion} compact={true} />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              DESKTOP HERO:
              - 1024px–1279px (lg): Two-Column Layout (Left Hero + Tooth in 5 cols, Right Card in 7 cols)
              - >= 1280px (xl): Three-Zone Layout (Left Copy + Center 3D Stage in 7 cols, Right Card in 5 cols)
             ════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:grid lg:col-span-5 xl:col-span-7 grid-cols-1 xl:grid-cols-12 items-center gap-4 xl:gap-4 min-w-0">
            {/* Zone 1: Editorial Dental Specialist Copy & Gold Medallion Highlights */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="auth-hero-copy xl:col-span-6 space-y-3 xl:space-y-5 min-w-0 xl:pr-2"
            >
              <p
                className="text-xs xl:text-[13px] font-bold uppercase tracking-[0.22em]"
                style={{ color: isDark ? '#E5C170' : '#9A7322' }}
              >
                CLINICAL SPECIALIST NETWORK
              </p>

              <h1
                className="text-3xl xl:text-[46px] 2xl:text-[50px] font-bold leading-[1.08] tracking-tight"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', 'Outfit', serif",
                  color: isDark ? '#F8FAFC' : '#14243A',
                }}
              >
                <span className="block">Elevate Your</span>
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
                  Dental Practice
                </span>
                <span className="block">with OralAI</span>
              </h1>

              <p
                className="text-xs xl:text-[15px] leading-relaxed max-w-md"
                style={{ color: isDark ? '#CBD5E1' : '#475569' }}
              >
                Join our verified dental specialist network to review AI-assisted oral screenings, conduct remote consultations, and issue digital prescriptions.
              </p>

              <div className="xl:hidden">
                <CinematicToothStage isDark={isDark} shouldReduceMotion={shouldReduceMotion} compact={true} />
              </div>

              {/* 3 Circular Gold Medallion Feature Badges */}
              <div className="pt-1 xl:pt-3 flex items-start gap-5 xl:gap-7">
                {DENTIST_HIGHLIGHTS.map((item) => (
                  <div key={item.line1} className="flex flex-col items-center text-center group">
                    <div
                      className="flex h-11 w-11 xl:h-[52px] xl:w-[52px] items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105"
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
              ZONE 3: RIGHT GOLD-BORDERED GLASSMORPHISM DENTIST REGISTRATION CARD
             ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="w-full max-w-[520px] mx-auto lg:mx-0 lg:ml-auto lg:col-span-7 xl:col-span-5 min-w-0"
          >
            <div
              className="auth-glass-card relative rounded-[24px] sm:rounded-[26px] p-4 sm:p-7 transition-all duration-300"
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
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(6, 182, 212, 0.45)',
                    background: isDark ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.1)',
                    color: isDark ? '#67E8F9' : '#0E7490',
                  }}
                >
                  <span>🦷</span>
                  <span>Dental Specialist</span>
                </span>
                <h2
                  className="text-xl sm:text-[26px] font-bold tracking-tight"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    color: isDark ? '#FFFFFF' : '#14243A',
                  }}
                >
                  Dentist Registration
                </h2>
                <p
                  className="mt-0.5 text-xs sm:text-sm"
                  style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                >
                  Register your professional account for approval
                </p>
              </div>

              {/* Admin Approval Banner */}
              <motion.div
                className="mt-3 sm:mt-4 rounded-xl border p-2.5 sm:p-3 text-xs sm:text-sm"
                style={{
                  borderColor: isDark ? 'rgba(244, 213, 141, 0.4)' : 'rgba(217, 173, 86, 0.55)',
                  background: isDark ? 'rgba(217, 173, 86, 0.12)' : 'rgba(254, 243, 199, 0.65)',
                  color: isDark ? '#FDE68A' : '#92400E',
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <strong>⏳ Approval Required:</strong> Dentist accounts are reviewed by an admin before you can log in.
              </motion.div>

              {/* Status Alerts */}
              {error && (
                <motion.div
                  className="mt-3 rounded-xl p-3 text-xs sm:text-sm font-medium"
                  style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  className="mt-3 rounded-xl p-3 text-xs sm:text-sm font-medium"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ✅ {success} <br />
                  <span className="text-xs opacity-75">Redirecting to login in a few seconds…</span>
                </motion.div>
              )}

              {/* Dentist Registration Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
                noValidate
              >
                {/* Full Name */}
                <div className="sm:col-span-2 min-w-0">
                  <div className={getFieldWrapperClasses(!!errors.name)}>
                    <span
                      className="pl-3.5 pr-2.5 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 pr-3.5 min-w-0">
                      <label
                        htmlFor="dentist-name"
                        className="block text-[10px] font-medium leading-none mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Full Name *
                      </label>
                      <input
                        id="dentist-name"
                        type="text"
                        placeholder="Dr. John Smith"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={inputTextStyle}
                        {...register('name', { required: 'Full name is required' })}
                      />
                    </div>
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2 min-w-0">
                  <div className={getFieldWrapperClasses(!!errors.email)}>
                    <span
                      className="pl-3.5 pr-2.5 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="3" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 pr-3.5 min-w-0">
                      <label
                        htmlFor="dentist-email"
                        className="block text-[10px] font-medium leading-none mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Email Address *
                      </label>
                      <input
                        id="dentist-email"
                        type="email"
                        placeholder="dentist@example.com"
                        autoComplete="email"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={inputTextStyle}
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

                {/* Password */}
                <div className="min-w-0">
                  <div className={getFieldWrapperClasses(!!errors.password)}>
                    <span
                      className="pl-3 pr-2 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 min-w-0">
                      <label
                        htmlFor="dentist-password"
                        className="block text-[10px] font-medium leading-none mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Password *
                      </label>
                      <input
                        id="dentist-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={inputTextStyle}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters.',
                          },
                        })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="px-2.5 py-1.5 focus:outline-none transition"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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

                {/* Confirm Password */}
                <div className="min-w-0">
                  <div className={getFieldWrapperClasses(!!errors.confirmPassword)}>
                    <span
                      className="pl-3 pr-2 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 min-w-0">
                      <label
                        htmlFor="dentist-confirm-password"
                        className="block text-[10px] font-medium leading-none mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Confirm Password *
                      </label>
                      <input
                        id="dentist-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={inputTextStyle}
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (val) => val === password || 'Passwords do not match',
                        })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="px-2.5 py-1.5 focus:outline-none transition"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="sm:col-span-2 min-w-0">
                  <div className={getFieldWrapperClasses(!!errors.phone)}>
                    <span
                      className="pl-3.5 pr-2.5 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 pr-3.5 min-w-0">
                      <label
                        htmlFor="dentist-phone"
                        className="block text-[10px] font-medium leading-none mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Phone Number
                      </label>
                      <input
                        id="dentist-phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={inputTextStyle}
                        {...register('phone', {
                          validate: (val) =>
                            !val || /^[+]?[\d\s().-]{7,20}$/.test(val) || 'Please enter a valid phone number',
                        })}
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Professional License Number */}
                <div className="sm:col-span-2 min-w-0">
                  <div className={getFieldWrapperClasses(!!errors.professionalLicenseNumber)}>
                    <span
                      className="pl-3.5 pr-2.5 flex items-center pointer-events-none"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                        <line x1="7" y1="16" x2="12" y2="16" />
                      </svg>
                    </span>
                    <div className="flex-1 py-1.5 sm:py-2 pr-3.5 min-w-0">
                      <label
                        htmlFor="dentist-license"
                        className="block text-[10px] font-medium leading-none mb-1"
                        style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                      >
                        Professional License Number *
                      </label>
                      <input
                        id="dentist-license"
                        type="text"
                        placeholder="e.g. DDS-2024-001234"
                        className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
                        style={inputTextStyle}
                        {...register('professionalLicenseNumber', {
                          required: 'Professional license number is required',
                        })}
                      />
                    </div>
                  </div>
                  {errors.professionalLicenseNumber && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {errors.professionalLicenseNumber.message}
                    </p>
                  )}
                  <p
                    className="mt-1 text-[11px]"
                    style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                  >
                    Your official dental council license / registration number.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="sm:col-span-2 pt-1">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                    className="w-full rounded-xl py-3 sm:py-3.5 px-6 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span>{isSubmitting ? 'Submitting application…' : 'Submit Dentist Registration'}</span>
                    {!isSubmitting && <span aria-hidden="true">→</span>}
                  </motion.button>
                </div>
              </form>

              {/* Already approved */}
              <p
                className="mt-4 text-center text-xs"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
              >
                Already approved?{' '}
                <Link
                  to="/login"
                  className="font-semibold underline underline-offset-4 transition hover:opacity-85"
                  style={{ color: isDark ? '#F4D58D' : '#9A7322' }}
                >
                  Login
                </Link>
              </p>

              {/* Register other accounts instead */}
              <div className="mt-4 pt-3.5 border-t" style={{ borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.3)' }}>
                <p
                  className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                >
                  Register other accounts instead
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/register"
                    className="group flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: isDark ? 'rgba(11, 25, 46, 0.65)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(148, 163, 184, 0.22)' : '#E2E8F0',
                      color: isDark ? '#E2E8F0' : '#1E293B',
                    }}
                  >
                    <span className="text-base leading-none transition-transform group-hover:scale-110">👤</span>
                    <span>User</span>
                  </Link>
                  <Link
                    to="/register-pharmacy"
                    className="group flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: isDark ? 'rgba(11, 25, 46, 0.65)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(148, 163, 184, 0.22)' : '#E2E8F0',
                      color: isDark ? '#E2E8F0' : '#1E293B',
                    }}
                  >
                    <span className="text-base leading-none transition-transform group-hover:scale-110">💊</span>
                    <span>Pharmacy</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
