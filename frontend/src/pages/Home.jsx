import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Card from '../components/Card';
import ToothMascot from '../components/ToothMascot';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, height: 28 }}>
        <circle cx="11" cy="11" r="8" stroke="#06B6D4" strokeWidth="1.8" />
        <circle cx="11" cy="11" r="4" fill="#06B6D4" opacity="0.8" />
        <path d="M16.5 16.5L20 20" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'rgba(6,182,212,0.12)',
    title: 'AI Detection',
    desc: 'Upload oral images for instant disease classification powered by deep learning.',
    step: '01',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, height: 28 }}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#10B981" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 10h8M8 14h5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'rgba(16,185,129,0.12)',
    title: 'Chat Assistant',
    desc: 'Get answers about oral hygiene, prevention, and dental care tips.',
    step: '02',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, height: 28 }}>
        <circle cx="12" cy="8" r="4" stroke="#A78BFA" strokeWidth="1.8" />
        <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 3l1 1M17 7h1M20 5l-1 1" stroke="#A78BFA" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    iconBg: 'rgba(167,139,250,0.12)',
    title: 'Online Consultation',
    desc: 'Book appointments and join video consultations with trusted dentists.',
    step: '03',
  },
];

const statChips = [
  { label: '99.2% Accuracy', icon: '🎯' },
  { label: '50k+ Scans', icon: '📊' },
  { label: 'HIPAA Compliant', icon: '🔒' },
];

export default function Home() {
  const { isAuthenticated, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleStartDetection = () => {
    if (isAuthenticated) {
      navigate('/detect');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="page-gradient min-h-screen overflow-hidden">
      <Navbar variant="public" />

      {/* ── HERO ── */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(64px)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)', filter: 'blur(48px)' }}
        />

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left column */}
          <motion.div {...fadeUp(0)}>
            {/* Badge */}
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
              style={{
                background: 'var(--accent-dim)',
                borderColor: 'rgba(6,182,212,0.25)',
                color: 'var(--accent)',
              }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              AI-Powered Dental Healthcare
            </motion.span>

            {/* Headline */}
            <h1
              className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-theme-heading md:text-5xl lg:text-6xl"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Smart Dental Health
              <span
                className="mt-1 block"
                style={{
                  background: 'var(--gradient-accent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Powered by AI
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: 'var(--muted)' }}>
              Detect oral conditions early, get personalized care guidance, and connect with
              trusted dentists — all in one premium platform.
            </p>

            {/* Stat chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              {statChips.map((chip, i) => (
                <motion.span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium"
                  style={{
                    background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                    borderColor: 'var(--border-soft)',
                    color: 'var(--text)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  {chip.icon} {chip.label}
                </motion.span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={handleStartDetection}>
                🔬 Start Detection
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(isAuthenticated ? getDashboardPath() : '/register')}
              >
                Learn More →
              </Button>
            </div>
          </motion.div>

          {/* Right column — mascot */}
          <motion.div
            className="relative flex justify-center"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
          >
            {/* Glow ring behind mascot */}
            <div
              className="absolute inset-0 mx-auto my-auto rounded-full"
              style={{
                width: 280,
                height: 280,
                background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <ToothMascot size="xl" />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-3xl font-bold md:text-4xl"
            style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
          >
            Everything you need for oral health
          </h2>
          <p className="mt-3 text-base" style={{ color: 'var(--muted)' }}>
            A complete AI-powered ecosystem — from detection to treatment
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <Card className="h-full">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: feature.iconBg }}
                  >
                    {feature.icon}
                  </div>
                  <span
                    className="ml-auto text-3xl font-extrabold opacity-10"
                    style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}
                  >
                    {feature.step}
                  </span>
                </div>
                <h3
                  className="mt-4 text-lg font-semibold"
                  style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {feature.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          className="relative overflow-hidden rounded-3xl p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(13,148,136,0.14) 50%, rgba(6,182,212,0.1) 100%)',
            border: '1px solid rgba(6,182,212,0.2)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Background accents */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)', filter: 'blur(32px)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%)', filter: 'blur(32px)' }}
          />

          <div className="relative">
            <span className="text-4xl">🦷</span>
            <h2
              className="mt-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
            >
              Ready to protect your smile?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base" style={{ color: 'var(--muted)' }}>
              Join thousands using AI to stay ahead of dental health issues.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
