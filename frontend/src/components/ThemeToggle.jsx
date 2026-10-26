import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border/50 bg-theme-surface/60 text-theme-text transition hover:border-cyan-400/50 hover:text-cyan-400 shadow-sm overflow-hidden ${className}`}
      whileHover={shouldReduceMotion ? {} : { scale: 1.06, boxShadow: '0 0 16px rgba(6,182,212,0.25)' }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={theme}
        initial={shouldReduceMotion ? false : { rotate: -180, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={shouldReduceMotion ? false : { rotate: 180, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          /* Sun Icon for switching to light */
          <svg className="h-5 w-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          /* Moon Icon for switching to dark */
          <svg className="h-5 w-5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
}
