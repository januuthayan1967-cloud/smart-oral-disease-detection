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
      className={`hidden items-center gap-2 rounded-xl border border-theme-border/40 bg-theme-surface/40 px-3 py-1.5 text-xs lg:flex ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-live="polite"
    >
      <span className="text-theme-muted">{date}</span>
      <span className="h-3 w-px bg-theme-border" aria-hidden="true" />
      <span className="font-mono font-medium text-theme-accent">{time}</span>
    </motion.div>
  );
}
