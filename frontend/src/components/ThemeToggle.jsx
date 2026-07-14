import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border/50 bg-theme-surface/50 text-theme-text transition hover:border-theme-accent/50 hover:text-theme-accent ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="text-lg"
      >
        {isDark ? '☀️' : '🌙'}
      </motion.span>
    </motion.button>
  );
}
