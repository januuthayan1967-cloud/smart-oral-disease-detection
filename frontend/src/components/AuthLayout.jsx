import { motion } from 'framer-motion';
import Navbar from './Navbar';
import ToothMascot from './ToothMascot';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="page-gradient min-h-screen overflow-hidden">
      <Navbar variant="public" />

      {/* Decorative floating blobs */}
      <div
        className="pointer-events-none fixed left-1/4 top-1/4 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="pointer-events-none fixed bottom-1/4 right-1/4 -z-10 h-56 w-56 translate-x-1/2 translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)',
          filter: 'blur(48px)',
        }}
      />
      <div
        className="pointer-events-none fixed left-3/4 top-3/4 -z-10 h-40 w-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />

      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col items-center gap-8 px-4 py-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        {/* Left: mascot + tagline */}
        <motion.div
          className="flex flex-1 flex-col items-center justify-center"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="relative">
            {/* Glow under mascot */}
            <div
              className="absolute bottom-0 left-1/2 -z-10 h-32 w-48 -translate-x-1/2 translate-y-4"
              style={{
                background: 'radial-gradient(ellipse, rgba(6,182,212,0.2) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <ToothMascot size="xl" />
          </div>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p
              className="max-w-sm text-xl font-semibold leading-snug"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
            >
              Your trusted AI companion for smarter dental health
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['AI-Powered', 'HIPAA Compliant', '99% Accurate'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    background: 'var(--accent-dim)',
                    borderColor: 'rgba(6,182,212,0.2)',
                    color: 'var(--accent)',
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right: form card */}
        <motion.div
          className="w-full max-w-md flex-1"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
        >
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'var(--glass)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            }}
          >
            {/* Card header accent line */}
            <div
              className="mb-6 h-0.5 rounded-full"
              style={{ background: 'var(--gradient-accent)', opacity: 0.6 }}
            />
            {title && (
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>{subtitle}</p>
            )}
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
