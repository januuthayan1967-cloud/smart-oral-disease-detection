import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function PharmacyHeroBanner({ pharmacyName = 'Pharmacy' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="pharmacy-hero-card relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:py-6 lg:px-8 mb-6 min-h-[190px] sm:min-h-[210px] lg:min-h-[225px] flex items-center"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(8, 21, 37, 0.98) 0%, rgba(5, 11, 22, 0.99) 55%, rgba(11, 27, 45, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 55%, rgba(255, 253, 248, 0.98) 100%)',
        border: isDark
          ? '1px solid rgba(217, 173, 86, 0.32)'
          : '1px solid rgba(198, 156, 72, 0.35)',
        boxShadow: isDark
          ? '0 16px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(217, 173, 86, 0.1), inset 0 1px 0 rgba(244, 213, 141, 0.2)'
          : '0 16px 45px rgba(20, 36, 58, 0.06), 0 0 25px rgba(198, 156, 72, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      }}
    >
      {/* ── Background Layer 1: Ambient Color Nodes ───────────────────────── */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full blur-3xl"
        style={{
          background: isDark
            ? 'radial-gradient(circle, #00C9E8 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(8, 127, 156, 0.12) 0%, transparent 70%)',
          opacity: isDark ? 0.25 : 0.6,
        }}
      />
      <div
        className="pointer-events-none absolute left-1/3 -bottom-16 h-64 w-64 rounded-full blur-3xl"
        style={{
          background: isDark
            ? 'radial-gradient(circle, #D9AD56 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(198, 156, 72, 0.12) 0%, transparent 70%)',
          opacity: isDark ? 0.2 : 0.5,
        }}
      />

      {/* ── Background Layer 2: Flowing Golden Silk Light Wave ───────────── */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-3/4 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/golden-wave-ribbon.jpg')",
          backgroundPosition: 'left center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          mixBlendMode: isDark ? 'screen' : 'multiply',
          opacity: isDark ? 0.4 : 0.18,
          maskImage: 'linear-gradient(to right, black 30%, rgba(0,0,0,0.6) 65%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to right, black 30%, rgba(0,0,0,0.6) 65%, transparent 95%)',
        }}
      />

      {/* ── Background Layer 3: Seamless 3D Pharmacy Visual Composition ─── */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 overflow-hidden flex items-center justify-end">
        <img
          src="/assets/pharmacy-hero-composition.jpg"
          alt="Pharmacy 3D Healthcare Artwork"
          className="h-full w-full object-cover object-right"
          style={{
            maskImage: 'linear-gradient(to left, black 50%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.25) 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, black 50%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.25) 88%, transparent 100%)',
            filter: 'contrast(1.08) brightness(1.04)',
          }}
        />

        {/* Ambient bottom fade into banner floor */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDark
              ? 'bg-gradient-to-t from-[#050B16]/80 via-transparent to-transparent'
              : 'bg-gradient-to-t from-[#F8FAFC]/80 via-transparent to-transparent'
          }`}
        />
      </div>

      {/* ── Foreground Layer: Text & Floating Quote ───────────────────────── */}
      <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Greeting & Text */}
        <div className="max-w-xl space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="text-xs sm:text-sm font-semibold tracking-wider uppercase block"
              style={{
                letterSpacing: '0.08em',
                color: isDark ? '#94A9BF' : '#52657A',
              }}
            >
              Welcome Back,
            </span>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 leading-tight bg-clip-text text-transparent"
              style={{
                fontFamily: 'Outfit, sans-serif',
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #FFFFFF 25%, #F4D58D 65%, #D9AD56 100%)'
                  : 'linear-gradient(135deg, #14243A 40%, #C69C48 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              {pharmacyName}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xs sm:text-sm max-w-lg leading-relaxed"
            style={{ color: isDark ? '#94A9BF' : '#52657A' }}
          >
            Manage your medicines, orders, and prescriptions efficiently.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-xs font-medium flex items-center gap-1.5 pt-0.5"
            style={{ color: isDark ? '#00C9E8' : '#087F9C' }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: isDark ? '#00C9E8' : '#087F9C',
                boxShadow: `0 0 8px ${isDark ? '#00C9E8' : '#087F9C'}`,
              }}
            />
            Supporting better oral health, one smile at a time.
          </motion.p>
        </div>

        {/* Right Section: Seamless Floating Glass Quote Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="self-end md:self-start lg:mr-2 shrink-0 pointer-events-none"
        >
          <div
            className="backdrop-blur-md rounded-xl px-4 py-2 max-w-[200px] text-right"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.82) 0%, rgba(11, 27, 45, 0.88) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 253, 248, 0.98) 100%)',
              border: isDark
                ? '1px solid rgba(217, 173, 86, 0.38)'
                : '1px solid rgba(198, 156, 72, 0.38)',
              boxShadow: isDark
                ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(217, 173, 86, 0.12)'
                : '0 8px 20px rgba(20, 36, 58, 0.06), 0 0 12px rgba(198, 156, 72, 0.08)',
            }}
          >
            <p
              className="text-xs font-bold tracking-wide italic leading-snug bg-clip-text text-transparent"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #FFFFFF 40%, #F4D58D 100%)'
                  : 'linear-gradient(135deg, #14243A 40%, #C69C48 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              &ldquo;Quality Medicines, Healthier Smiles&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
