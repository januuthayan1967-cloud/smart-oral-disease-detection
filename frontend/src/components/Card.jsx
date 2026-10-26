import { motion, useReducedMotion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = true,
  glass = true,
  padding = true,
  variant = 'default', // 'default' | 'stat' | 'elevated' | 'result'
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const baseClass = (() => {
    if (variant === 'stat') {
      return 'rounded-2xl overflow-hidden relative border border-theme-border/50 bg-theme-surface shadow-theme';
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

  const hoverEffect = !hover || shouldReduceMotion ? {} : {
    y: -4,
    boxShadow: '0 16px 40px var(--shadow-accent), 0 6px 20px var(--shadow)',
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <motion.div
      className={combinedClass}
      style={variantStyle}
      whileHover={hoverEffect}
      transition={{ type: 'spring', stiffness: 320, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
