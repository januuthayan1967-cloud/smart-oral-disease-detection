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
      className={`hidden items-center gap-2 rounded-xl border border-cyan-500/25 bg-theme-surface/60 px-3.5 py-1.5 text-xs text-theme-muted shadow-sm backdrop-blur-md xl:flex ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-live="polite"
    >
      <svg className="h-3.5 w-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span className="font-medium text-theme-text">{date}</span>
      <span className="text-theme-border/80">|</span>
      <span className="font-mono font-medium text-cyan-400">{time}</span>
    </motion.div>
  );
}
