import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, className = '', id, as: Component = 'input', children, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-theme-text">
          {label}
        </label>
      )}
      <Component
        ref={ref}
        id={inputId}
        className={[
          'w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3',
          'text-theme-text placeholder:text-theme-muted',
          'transition duration-200',
          'focus:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent/25',
          error ? 'border-red-400 focus:ring-red-400/25' : '',
          className,
        ].join(' ')}
        style={{
          /* Counters browser UA-stylesheet `color: ButtonText` override in dark mode */
          color: 'var(--text)',
          caretColor: 'var(--accent)',
          WebkitTextFillColor: 'var(--text)',
          ...props.style,
        }}
        {...props}
      >
        {children}
      </Component>
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
