import { motion, useReducedMotion } from 'framer-motion';

const variants = {
  primary: null,   // handled via inline style + gradient
  secondary: null, // handled via inline style
  ghost: 'text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 focus-visible:ring-2 focus-visible:ring-theme-accent',
  outline: 'border border-theme-border text-theme-text hover:border-theme-accent hover:text-theme-accent focus-visible:ring-2 focus-visible:ring-theme-accent',
  danger: 'text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-red-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-xl',
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4Z" />
    </svg>
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  as,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-theme-background',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
    sizes[size],
    className,
  ];

  /* variant-specific styles applied inline for gradient support */
  let inlineStyle = {};

  if (variant === 'primary') {
    baseClasses.push('text-white relative overflow-hidden shadow-glow');
    inlineStyle = { background: 'var(--gradient-accent)', boxShadow: '0 0 20px var(--shadow-accent)' };
  } else if (variant === 'secondary') {
    baseClasses.push('border text-theme-text');
    inlineStyle = {
      background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
      borderColor: 'var(--border)',
    };
  } else if (variant === 'danger') {
    baseClasses.push('text-white');
    inlineStyle = { background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' };
  } else {
    baseClasses.push(variants[variant] || '');
  }

  const classes = baseClasses.filter(Boolean).join(' ');

  const motionProps = {
    whileHover: isDisabled || shouldReduceMotion ? {} : { y: variant === 'ghost' ? 0 : -2, scale: variant === 'ghost' ? 1.01 : 1 },
    whileTap: isDisabled || shouldReduceMotion ? {} : { scale: 0.98 },
    transition: { type: 'spring', stiffness: 420, damping: 24 },
  };

  const hoverStyle = variant === 'secondary' ? {
    '--hover-border': 'var(--accent)',
    '--hover-color': 'var(--accent)',
  } : {};

  const content = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  if (as === 'a') {
    return (
      <motion.a className={classes} style={inlineStyle} {...motionProps} {...props}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={isDisabled}
      style={inlineStyle}
      onMouseEnter={(e) => {
        if (variant === 'secondary' && !isDisabled) {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
          e.currentTarget.style.background = 'var(--accent-dim)';
        }
        if (variant === 'primary' && !isDisabled) {
          e.currentTarget.style.boxShadow = '0 0 32px var(--shadow-accent)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'secondary') {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text)';
          e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 60%, transparent)';
        }
        if (variant === 'primary') {
          e.currentTarget.style.boxShadow = '0 0 20px var(--shadow-accent)';
        }
      }}
      {...motionProps}
      {...props}
    >
      {content}
    </motion.button>
  );
}
