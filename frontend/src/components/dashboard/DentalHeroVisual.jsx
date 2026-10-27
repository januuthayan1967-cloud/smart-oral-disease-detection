import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function DentalHeroVisual({
  quoteLine1 = 'Better Oral Health',
  quoteLine2 = 'Brighter Smiles',
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-4 lg:gap-4 xl:gap-6 shrink-0 select-none">
      {/* ── 3D Holographic Tooth Sphere Container ───────────────────── */}
      <div className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 lg:w-44 lg:h-44 xl:w-56 xl:h-56 2xl:w-64 2xl:h-64">
        {/* Ambient Cyan Volumetric Core Glow */}
        <div
          className={`absolute inset-4 rounded-full blur-2xl pointer-events-none ${
            isDark ? 'bg-cyan-400/20' : 'bg-cyan-500/10'
          }`}
          style={{ transform: 'translateZ(0)' }}
        />
        {/* Ambient Champagne Gold Rim Glow */}
        <div
          className={`absolute -inset-2 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-[#D9AD56]/15' : 'bg-[#C69C48]/10'
          }`}
          style={{ transform: 'translateZ(0)' }}
        />

        {/* Outer Cyan Holographic Orbital Ring 1 (Tilted & Rotating) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-1 rounded-full border border-dashed pointer-events-none ${
            isDark
              ? 'border-cyan-400/35 shadow-[0_0_15px_rgba(0,201,232,0.2)]'
              : 'border-[#087F9C]/30 shadow-[0_0_10px_rgba(8,127,156,0.15)]'
          }`}
          style={{ transform: 'rotateX(65deg)' }}
        />

        {/* Inner Cyan Orbital Ring 2 (Counter-Rotating) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-6 rounded-full border pointer-events-none ${
            isDark
              ? 'border-cyan-300/40 shadow-[0_0_20px_rgba(0,201,232,0.25)]'
              : 'border-[#087F9C]/35 shadow-[0_0_10px_rgba(8,127,156,0.1)]'
          }`}
          style={{ transform: 'rotateY(60deg) rotateX(20deg)' }}
        />

        {/* Thin Gold Coordinate Longitude Ring */}
        <motion.div
          animate={{ rotate: 180 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-3 rounded-full border pointer-events-none ${
            isDark ? 'border-[#F4D58D]/30' : 'border-[#C69C48]/30'
          }`}
          style={{ transform: 'rotateX(75deg) rotateZ(35deg)' }}
        />

        {/* Pulsing Holographic Data Nodes */}
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute top-4 right-8 h-2 w-2 rounded-full ${
            isDark ? 'bg-cyan-300 shadow-[0_0_10px_#00C9E8]' : 'bg-[#087F9C] shadow-[0_0_8px_#087F9C]'
          }`}
        />
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className={`absolute bottom-6 left-8 h-2 w-2 rounded-full ${
            isDark ? 'bg-[#F4D58D] shadow-[0_0_10px_#F4D58D]' : 'bg-[#C69C48] shadow-[0_0_8px_#C69C48]'
          }`}
        />
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
          className={`absolute top-1/2 left-2 h-1.5 w-1.5 rounded-full ${
            isDark ? 'bg-cyan-400 shadow-[0_0_8px_#00C9E8]' : 'bg-[#087F9C] shadow-[0_0_6px_#087F9C]'
          }`}
        />

        {/* ── Realistic 3D Holographic Tooth Model ─────────────────── */}
        <motion.div
          animate={{ y: [-4, 5, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 lg:w-36 lg:h-36 xl:w-48 xl:h-48 2xl:w-56 2xl:h-56 flex items-center justify-center"
        >
          <img
            src="/assets/3d-tooth-realistic.jpg"
            alt="OralAI Anatomically Realistic 3D Dental Hologram"
            className={`w-full h-full object-contain rounded-full ${
              isDark ? 'drop-shadow-[0_0_25px_rgba(0,201,232,0.45)]' : 'drop-shadow-[0_4px_16px_rgba(20,36,58,0.15)]'
            }`}
            style={{
              mixBlendMode: isDark ? 'screen' : 'normal',
              filter: isDark ? 'contrast(1.08) brightness(1.04)' : 'contrast(1.02) brightness(0.98)',
              maskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)',
            }}
            onError={(e) => {
              // Fallback to existing 3d-tooth.png if realistic asset fails to load
              e.currentTarget.src = '/assets/3d-tooth.png';
            }}
          />
        </motion.div>
      </div>

      {/* ── Floating Glassmorphic Quote Card ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`hidden md:flex flex-col items-start justify-center px-4 py-3 xl:px-5 xl:py-4 rounded-2xl backdrop-blur-md min-w-[155px] xl:min-w-[190px] transition-colors ${
          isDark
            ? 'border border-[#D9AD56]/40 shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
            : 'border border-[#C69C48]/35 shadow-[0_8px_24px_rgba(20,36,58,0.08)]'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(8, 21, 37, 0.85) 0%, rgba(11, 27, 45, 0.92) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 253, 248, 0.95) 100%)',
          boxShadow: isDark
            ? '0 0 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(244, 213, 141, 0.2), 0 0 14px rgba(217, 173, 86, 0.15)'
            : '0 8px 24px rgba(20, 36, 58, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <span className={`text-sm font-serif italic leading-snug tracking-wide ${
          isDark ? 'text-[#F4D58D]' : 'text-[#8C6D23]'
        }`}>
          &ldquo;{quoteLine1}
        </span>
        <span className={`text-sm font-serif italic leading-snug tracking-wide ${
          isDark ? 'text-white/95' : 'text-[#14243A]'
        }`}>
          {quoteLine2}&rdquo;
        </span>
        <div className={`mt-2 flex items-center gap-1.5 pt-2 border-t w-full ${
          isDark ? 'border-[#D9AD56]/25' : 'border-[#C69C48]/25'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-cyan-400 animate-pulse' : 'bg-[#087F9C]'}`} />
          <span className={`text-[10px] uppercase font-bold tracking-widest font-mono ${
            isDark ? 'text-[#D9AD56]/90' : 'text-[#8C6D23]'
          }`}>
            OralAI Dental Hub
          </span>
        </div>
      </motion.div>
    </div>
  );
}
