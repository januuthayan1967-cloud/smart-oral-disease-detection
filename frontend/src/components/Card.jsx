import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = true,
  glass = true,
  padding = true,
  variant = 'default', // 'default' | 'stat' | 'elevated' | 'result'
  ...props
}) {
  const baseClass = (() => {
    if (variant === 'stat') {
      return 'rounded-2xl overflow-hidden relative';
    }
    if (variant === 'elevated') {
      return 'rounded-2xl shadow-card-hover border';
    }
    if (variant === 'result') {
      return 'rounded-2xl shadow-theme';
    }
    return glass ? 'glass-card' : 'rounded-2xl bg-theme-surface shadow-theme border border-theme-border/50';
  })();

  const paddingClass = padding ? 'p-6' : '';

  const combinedClass = [baseClass, paddingClass, className].filter(Boolean).join(' ');

  const variantStyle = (() => {
    if (variant === 'elevated') return { background: 'var(--surface)', borderColor: 'var(--border-soft)' };
    if (variant === 'result') return { background: 'var(--surface)', border: '1px solid var(--border-soft)', borderLeft: '3px solid var(--accent)' };
    return {};
  })();

  return (
    <motion.div
      className={combinedClass}
      style={variantStyle}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
