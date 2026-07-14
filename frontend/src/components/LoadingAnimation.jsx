import { motion } from 'framer-motion';

export default function LoadingAnimation({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Concentric SVG rings + center icon */}
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* Outer ring - slow spin */}
        <motion.svg
          className="absolute inset-0"
          width="80" height="80" viewBox="0 0 80 80"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeOpacity="0.25"
            strokeDasharray="226"
          />
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="56 170"
            strokeDashoffset="0"
          />
        </motion.svg>

        {/* Middle ring - counter-spin */}
        <motion.svg
          className="absolute"
          style={{ inset: 10 }}
          width="60" height="60" viewBox="0 0 60 60"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="30" cy="30" r="26"
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="1.5"
            strokeOpacity="0.18"
            strokeDasharray="163"
          />
          <circle
            cx="30" cy="30" r="26"
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="40 123"
          />
        </motion.svg>

        {/* Center pulsing dot */}
        <motion.div
          className="absolute flex items-center justify-center rounded-full text-xl"
          style={{ width: 36, height: 36, background: 'var(--accent-dim)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          🦷
        </motion.div>
      </div>

      {/* Message with dot-pulse */}
      <div className="flex items-center gap-2">
        <motion.p
          className="text-sm font-medium"
          style={{ color: 'var(--muted)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {message}
        </motion.p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="page-gradient flex min-h-screen items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-16">{content}</div>;
}
