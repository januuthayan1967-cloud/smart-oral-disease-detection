import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function DateTime({ className = '' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <motion.div
      className={`hidden shrink-0 whitespace-nowrap items-center gap-2 rounded-xl border px-3 py-1.5 text-xs shadow-sm backdrop-blur-md xl:flex ${className}`}
      style={{
        background: isDark ? 'rgba(11, 27, 45, 0.75)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: isDark ? 'rgba(217, 173, 86, 0.35)' : 'rgba(198, 156, 72, 0.38)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-live="polite"
    >
      <svg className="h-3.5 w-3.5 shrink-0" style={{ color: isDark ? '#D9AD56' : '#C69C48' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span className="font-semibold text-theme-heading whitespace-nowrap">{date}</span>
      <span className="text-theme-border/60">|</span>
      <span className="font-mono font-bold whitespace-nowrap" style={{ color: isDark ? '#00C9E8' : '#087F9C' }}>{time}</span>
    </motion.div>
  );
}
