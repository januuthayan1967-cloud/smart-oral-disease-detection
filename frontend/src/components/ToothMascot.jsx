import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ── Professional SVG Feature Icons ── */
const FeatureIcons = {
  Detection: () => (
    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3C2 3 2 8 4 12c1 3 1 8 3 9s2-7 5-7 3 8 5 7 2-6 3-9c2-4 2-9-3-9-2 0-3 2-5 2S9 3 7 3Z" fill="currentColor" fillOpacity=".15" />
      <path d="M7 6c-2 0-2 2-1 4" strokeLinecap="round" />
    </svg>
  ),
  Assistant: () => (
    <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  Consultation: () => (
    <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Pharmacy: () => (
    <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" />
      <path d="M16 3h-8v4h8V3zM8 13h8M12 9v8" strokeLinecap="round" />
    </svg>
  ),
};

export default function ToothMascot({
  className = '',
  size = 'lg',
  showDecorations = true,
}) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch(window.matchMedia('(hover: none)').matches);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || isTouch || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Subtle 2-3 degrees tilt max
    const rotateY = (x / (rect.width / 2)) * 3;
    const rotateX = -(y / (rect.height / 2)) * 3;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const handleCardNavigate = (to) => {
    if (!isAuthenticated && to !== '/') {
      navigate('/login');
    } else {
      navigate(to);
    }
  };

  return (
    <div className="oral-tooth-composition relative flex flex-col items-center w-full">
      {/* ── 3D HERO VIEWPORT CONTAINER ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`oral-tooth-viewport relative flex items-center justify-center select-none w-full max-w-[880px] h-[660px] md:h-[720px] lg:h-[760px] ${className}`}
        style={{ perspective: 1200 }}
        aria-label="Decorative holographic dental visualization"
      >
        {/* ── AMBIENT HOLOGRAPHIC GLOW BEHIND TOOTH ── */}
        <div
          className="pointer-events-none absolute inset-0 m-auto h-[480px] w-[480px] rounded-full -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.42) 0%, rgba(6, 182, 212, 0.22) 40%, rgba(8, 47, 73, 0.1) 65%, transparent 80%)',
            filter: 'blur(56px)',
          }}
        />

        {/* ── 3D TILTING SCENE WRAPPER ── */}
        <motion.div
          className="oral-tooth-scene relative flex h-full w-full items-center justify-center"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  rotateX: tilt.rotateX,
                  rotateY: tilt.rotateY,
                }
          }
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ── FULLY VISIBLE CYBERNETIC PEDESTAL PLATFORM ── */}
          <div className="oral-pedestal absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
            {/* Vertical Cyan Light Projection Column shooting upward into tooth */}
            <div
              className="absolute -top-52 h-64 w-80 opacity-75 blur-xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 100%, rgba(34, 211, 238, 0.9) 0%, rgba(6, 182, 212, 0.4) 45%, transparent 75%)',
              }}
            />

            {/* Floor Concentric Perspective Light Rings (Fully contained) */}
            <div
              className="absolute bottom-0 h-24 w-[480px] md:w-[560px] rounded-[50%] border border-cyan-400/35 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 35px rgba(6, 182, 212, 0.35), 0 0 45px rgba(6, 182, 212, 0.3)',
              }}
            />
            <div
              className="absolute bottom-3 h-18 w-[400px] md:w-[470px] rounded-[50%] border border-cyan-300/45 pointer-events-none"
              style={{
                boxShadow: '0 0 25px rgba(34, 211, 238, 0.45)',
              }}
            />

            {/* Outer platform glow wave */}
            <motion.div
              className="absolute bottom-4 h-16 w-[420px] rounded-[50%] blur-md"
              style={{
                background: 'radial-gradient(ellipse, rgba(6, 182, 212, 0.75) 0%, rgba(13, 148, 136, 0.4) 45%, transparent 75%)',
              }}
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: [1, 1.05, 1],
                      opacity: [0.65, 0.9, 0.65],
                    }
              }
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Tier 1: Metallic Lower Bevel Base Disc */}
            <div
              className="h-16 w-[380px] md:w-[430px] rounded-[50%] border-2 border-cyan-400/50 shadow-[0_0_38px_rgba(6,182,212,0.55)] relative flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.95) 0%, rgba(2, 13, 24, 0.98) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Control Bevel with 4 Illuminated Telemetry Glyphs */}
              <div className="absolute bottom-2 flex items-center justify-center gap-4 z-20">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950/90 border border-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.7)] text-[10px]" title="Oral health illustration">
                  🦷
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950/90 border border-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.7)] text-[10px]" title="Dental care illustration">
                  🛡️
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950/90 border border-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.7)] text-[10px]" title="Doctor Telehealth Interface">
                  🩺
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950/90 border border-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.7)] text-[10px]" title="Prescription Pharmacy System">
                  💊
                </div>
              </div>
            </div>

            {/* Tier 2: Inner Stepped Metallic Ring with Cyan LED Track */}
            <div
              className="absolute bottom-6 h-10 w-[300px] md:w-[350px] rounded-[50%] border-t-2 border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.95)]"
              style={{
                background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.85) 0%, rgba(8, 47, 73, 0.95) 100%)',
              }}
            />

            {/* Tier 3: Core Holographic Disc with Concentric Cyan Radiance */}
            <div
              className="absolute bottom-9 h-7 w-[230px] md:w-[270px] rounded-[50%] border border-cyan-100 shadow-[0_0_50px_rgba(34,211,238,1)]"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(34, 211, 238, 0.9) 35%, rgba(6, 182, 212, 0.45) 70%, transparent 95%)',
              }}
            />
          </div>

          {/* ── AI SCANNING RINGS ── */}
          <div
            className="pointer-events-none absolute inset-0 m-auto flex items-center justify-center z-15"
            style={{ transform: 'rotateX(70deg) rotateY(-20deg) translateY(-25px)' }}
          >
            <motion.div
              className="h-[430px] w-[430px] rounded-full border-2 border-dashed border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
              animate={shouldReduceMotion ? {} : { rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_14px_#38BDF8]" />
              <span className="absolute bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-teal-300 shadow-[0_0_12px_#2DD4BF]" />
            </motion.div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 m-auto flex items-center justify-center z-15"
            style={{ transform: 'rotateX(68deg) rotateY(16deg) translateY(-15px)' }}
          >
            <motion.div
              className="h-[460px] w-[460px] rounded-full border border-cyan-300/40 shadow-[0_0_35px_rgba(13,148,136,0.35)]"
              animate={shouldReduceMotion ? {} : { rotate: -360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_#ffffff]" />
              <span className="absolute left-6 top-1/3 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE]" />
            </motion.div>
          </div>

          {/* ── 3D TOOTH CENTERPIECE (ELEVATED TO SIT GRACEFULLY ABOVE PLATFORM) ── */}
          <motion.div
            className="oral-enamel relative z-20 flex items-center justify-center mb-20 md:mb-24 lg:mb-28"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [-8, 8, -8],
                    rotateZ: [-0.3, 0.3, -0.3],
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 m-auto h-[320px] w-[320px] rounded-full blur-2xl opacity-80 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 211, 238, 0.85) 0%, rgba(6, 182, 212, 0.5) 50%, transparent 80%)',
                }}
              />

              <img
                src="/assets/3d-tooth.png"
                alt="Illuminated tooth illustration"
                className="relative z-20 h-[320px] w-[320px] md:h-[390px] md:w-[390px] object-contain drop-shadow-[0_25px_50px_rgba(6,182,212,0.75)] pointer-events-none"
                style={{
                  filter: 'brightness(1.12) contrast(1.1)',
                }}
              />

              {/* Curved Holographic HUD Arc Displays */}
              <div
                className="pointer-events-none absolute -bottom-2 -left-6 z-25 hidden md:flex h-16 w-28 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-950/40 backdrop-blur-md p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                style={{ transform: 'perspective(400px) rotateY(20deg) rotateX(10deg)' }}
              >
                <div className="flex flex-col w-full h-full justify-between">
                  <div className="flex items-center justify-between text-[8px] text-cyan-300 font-mono">
                    <span>DENTAL ARCH</span>
                    <span className="text-emerald-400">DECORATIVE</span>
                  </div>
                  <div className="flex items-end gap-0.5 h-6">
                    {[0.5, 0.9, 0.7, 1.0, 0.6, 0.8, 0.4].map((v, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-cyan-400/80 rounded-t-sm"
                        style={{ height: `${v * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="pointer-events-none absolute -bottom-2 -right-6 z-25 hidden md:flex h-16 w-28 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-950/40 backdrop-blur-md p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                style={{ transform: 'perspective(400px) rotateY(-20deg) rotateX(10deg)' }}
              >
                <div className="flex flex-col w-full h-full justify-between">
                  <div className="flex items-center justify-between text-[8px] text-teal-300 font-mono">
                    <span>TELEMETRY</span>
                    <span className="text-cyan-300">DECORATIVE</span>
                  </div>
                  <div className="flex items-center justify-center text-cyan-300 text-xs font-mono">
                    6 CATEGORIES
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── FOUR BALANCED FLOATING FEATURE PANELS (DESKTOP VIEWPORTS >= 1024px) ── */}
          {showDecorations && (
            <>
              {/* ── CARD 01: TOP-LEFT — AI Oral Disease Detection ── */}
              <motion.div
                onClick={() => handleCardNavigate('/detect')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardNavigate('/detect')}
                className="oral-floating oral-floating-01 group absolute top-4 -left-4 md:-left-8 lg:-left-12 xl:-left-20 z-30 hidden lg:flex items-center gap-3.5 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 dark:bg-theme-surface/90 p-4 shadow-[0_12px_32px_rgba(6,182,212,0.25)] backdrop-blur-xl w-[320px] xl:w-[360px] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-cyan-300 hover:shadow-[0_16px_40px_rgba(6,182,212,0.5)]"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: [-6, 6, -6],
                        x: [-2, 2, -2],
                      }
                }
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Numbered Holographic Badge 01 */}
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 border-2 border-white dark:border-cyan-200 text-white font-extrabold text-xs shadow-[0_0_14px_rgba(6,182,212,0.8)]">
                  01
                </span>

                {/* Professional Icon Container */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/40 shadow-sm">
                  <FeatureIcons.Detection />
                </div>

                {/* Title & Complete Description */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-sm font-bold text-theme-heading group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors leading-snug">
                    AI Oral Disease Detection
                  </h4>
                  <p className="mt-1 text-xs text-theme-muted leading-relaxed font-normal">
                    AI-assisted identification of six supported categories from oral images.
                  </p>
                </div>

                {/* High-tech Scanning Reticle Thumbnail */}
                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-cyan-400/50 bg-cyan-950/60 flex items-center justify-center shadow-inner">
                  <span className="text-base">🔬</span>
                  <div className="absolute inset-1 border border-dashed border-cyan-300/80 rounded-sm" />
                </div>

                {/* Action Arrow */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-400/40 text-xs font-bold group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-sm">
                  →
                </span>
              </motion.div>

              {/* ── CARD 02: TOP-RIGHT — Gemini AI Assistant ── */}
              <motion.div
                onClick={() => handleCardNavigate('/chat')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardNavigate('/chat')}
                className="oral-floating oral-floating-02 group absolute top-4 -right-4 md:-right-8 lg:-right-12 xl:-right-20 z-30 hidden lg:flex items-center gap-3.5 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 dark:bg-theme-surface/90 p-4 shadow-[0_12px_32px_rgba(6,182,212,0.25)] backdrop-blur-xl w-[320px] xl:w-[360px] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-cyan-300 hover:shadow-[0_16px_40px_rgba(6,182,212,0.5)]"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: [-5, 5, -5],
                      }
                }
                transition={{
                  duration: 5.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.3,
                }}
              >
                {/* Numbered Holographic Badge 02 */}
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 border-2 border-white dark:border-cyan-200 text-white font-extrabold text-xs shadow-[0_0_14px_rgba(6,182,212,0.8)]">
                  02
                </span>

                {/* Professional Icon Container */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-400/40 shadow-sm">
                  <FeatureIcons.Assistant />
                </div>

                {/* Title & Complete Description */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-sm font-bold text-theme-heading group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors leading-snug">
                    Gemini AI Assistant
                  </h4>
                  <p className="mt-1 text-xs text-theme-muted leading-relaxed font-normal">
                    Explore oral health information with Gemini-powered AI assistance.
                  </p>
                </div>

                {/* Celestial 4-Point Spark AI Visual */}
                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-purple-400/50 bg-purple-950/60 flex items-center justify-center shadow-inner">
                  <span className="text-lg text-cyan-300 animate-pulse">✦</span>
                </div>

                {/* Action Arrow */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-400/40 text-xs font-bold group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-sm">
                  →
                </span>
              </motion.div>

              {/* ── CARD 03: BOTTOM-LEFT — Doctor Video Consultation ── */}
              <motion.div
                onClick={() => handleCardNavigate('/consultation')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardNavigate('/consultation')}
                className="oral-floating oral-floating-03 group absolute bottom-28 -left-4 md:-left-8 lg:-left-12 xl:-left-20 z-30 hidden lg:flex items-center gap-3.5 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 dark:bg-theme-surface/90 p-4 shadow-[0_12px_32px_rgba(6,182,212,0.25)] backdrop-blur-xl w-[320px] xl:w-[360px] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-cyan-300 hover:shadow-[0_16px_40px_rgba(6,182,212,0.5)]"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: [5, -5, 5],
                        x: [2, -2, 2],
                      }
                }
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.6,
                }}
              >
                {/* Numbered Holographic Badge 03 */}
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 border-2 border-white dark:border-cyan-200 text-white font-extrabold text-xs shadow-[0_0_14px_rgba(6,182,212,0.8)]">
                  03
                </span>

                {/* Professional Icon Container */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-400/40 shadow-sm">
                  <FeatureIcons.Consultation />
                </div>

                {/* Title & Complete Description */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-sm font-bold text-theme-heading group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors leading-snug">
                    Doctor Video Consultation
                  </h4>
                  <p className="mt-1 text-xs text-theme-muted leading-relaxed font-normal">
                    Connect with dental professionals through the existing video consultation service.
                  </p>
                </div>

                {/* Doctor Telehealth Telemetry Thumbnail */}
                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-teal-400/50 bg-teal-950/60 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-base">👩‍⚕️</span>
                  <div className="absolute bottom-0.5 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                </div>

                {/* Action Arrow */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-400/40 text-xs font-bold group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-sm">
                  →
                </span>
              </motion.div>

              {/* ── CARD 04: BOTTOM-RIGHT — Prescription & Pharmacy ── */}
              <motion.div
                onClick={() => handleCardNavigate('/medicines')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardNavigate('/medicines')}
                className="oral-floating oral-floating-04 group absolute bottom-28 -right-4 md:-right-8 lg:-right-12 xl:-right-20 z-30 hidden lg:flex items-center gap-3.5 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 dark:bg-theme-surface/90 p-4 shadow-[0_12px_32px_rgba(6,182,212,0.25)] backdrop-blur-xl w-[320px] xl:w-[360px] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-cyan-300 hover:shadow-[0_16px_40px_rgba(6,182,212,0.5)]"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: [6, -6, 6],
                        x: [-2, 2, -2],
                      }
                }
                transition={{
                  duration: 5.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.8,
                }}
              >
                {/* Numbered Holographic Badge 04 */}
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 border-2 border-white dark:border-cyan-200 text-white font-extrabold text-xs shadow-[0_0_14px_rgba(6,182,212,0.8)]">
                  04
                </span>

                {/* Professional Icon Container */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-500/15 border border-pink-400/40 shadow-sm">
                  <FeatureIcons.Pharmacy />
                </div>

                {/* Title & Complete Description */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-sm font-bold text-theme-heading group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors leading-snug">
                    Prescription & Pharmacy
                  </h4>
                  <p className="mt-1 text-xs text-theme-muted leading-relaxed font-normal">
                    Order medicines through the existing prescription-based pharmacy workflow.
                  </p>
                </div>

                {/* Prescription Cart Thumbnail */}
                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-pink-400/50 bg-pink-950/60 flex items-center justify-center shadow-inner">
                  <span className="text-base">🛒</span>
                </div>

                {/* Action Arrow */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-400/40 text-xs font-bold group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-sm">
                  →
                </span>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── RESPONSIVE FEATURE GRID FOR TABLET & MOBILE (< 1024px) ── */}
      {showDecorations && (
        <div className="oral-mobile-features w-full max-w-2xl px-4 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:hidden">
          {/* Card 01 */}
          <div
            onClick={() => handleCardNavigate('/detect')}
            className="flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 p-3.5 shadow-sm cursor-pointer hover:border-cyan-400"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white font-bold text-xs">
              01
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-theme-heading">AI Oral Disease Detection</h4>
              <p className="text-[11px] text-theme-muted">AI-assisted screening across six supported oral image categories.</p>
            </div>
            <span className="text-cyan-500 text-sm font-bold">→</span>
          </div>

          {/* Card 02 */}
          <div
            onClick={() => handleCardNavigate('/chat')}
            className="flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 p-3.5 shadow-sm cursor-pointer hover:border-cyan-400"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white font-bold text-xs">
              02
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-theme-heading">Gemini AI Assistant</h4>
              <p className="text-[11px] text-theme-muted">Explore oral health information with Gemini-powered AI assistance.</p>
            </div>
            <span className="text-cyan-500 text-sm font-bold">→</span>
          </div>

          {/* Card 03 */}
          <div
            onClick={() => handleCardNavigate('/consultation')}
            className="flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 p-3.5 shadow-sm cursor-pointer hover:border-cyan-400"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white font-bold text-xs">
              03
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-theme-heading">Doctor Video Consultation</h4>
              <p className="text-[11px] text-theme-muted">Connect with dental professionals through video consultations.</p>
            </div>
            <span className="text-cyan-500 text-sm font-bold">→</span>
          </div>

          {/* Card 04 */}
          <div
            onClick={() => handleCardNavigate('/medicines')}
            className="flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-theme-surface/95 p-3.5 shadow-sm cursor-pointer hover:border-cyan-400"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white font-bold text-xs">
              04
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-theme-heading">Prescription & Pharmacy</h4>
              <p className="text-[11px] text-theme-muted">Order medicines through the prescription-based pharmacy workflow.</p>
            </div>
            <span className="text-cyan-500 text-sm font-bold">→</span>
          </div>
        </div>
      )}
    </div>
  );
}
