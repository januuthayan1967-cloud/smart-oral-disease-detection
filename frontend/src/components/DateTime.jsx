import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DateTime({ className = '' }) {
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
      className={`hidden items-center gap-2.5 rounded-xl border px-3.5 py-1.5 text-xs shadow-sm backdrop-blur-md xl:flex ${className}`}
      style={{
        background: 'rgba(11, 27, 45, 0.75)',
        borderColor: 'rgba(217, 173, 86, 0.35)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-live="polite"
    >
      <svg className="h-4 w-4 shrink-0" style={{ color: '#D9AD56' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span className="font-semibold text-theme-heading">{date}</span>
      <span className="text-theme-border/60">|</span>
      <span className="font-mono font-bold" style={{ color: '#00C9E8' }}>{time}</span>
    </motion.div>
  );
}
