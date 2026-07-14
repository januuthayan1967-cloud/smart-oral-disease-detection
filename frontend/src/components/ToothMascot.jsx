import { motion } from 'framer-motion';

export default function ToothMascot({ className = '', size = 'lg' }) {
  const sizes = {
    sm: 'w-32 h-40',
    md: 'w-48 h-56',
    lg: 'w-64 h-72',
    xl: 'w-80 h-96',
  };

  return (
    <div className={`relative flex items-end justify-center ${sizes[size]} ${className}`}>
      
      {/* 3D Water Base/Shadow */}
      <motion.div
        className="absolute bottom-4 left-1/2 h-6 w-32 -translate-x-1/2 rounded-[50%] bg-[#021F24]/50 blur-md"
        animate={{ scaleX: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Water Surface Layers (Back) */}
      <motion.div
        className="absolute -bottom-2 left-1/2 h-16 w-[130%] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-[#22D3EE]/30 to-[#0B5F5F]/80 backdrop-blur-[2px] border-t border-[#22D3EE]/40"
        animate={{ scaleX: [1, 1.04, 1], y: [0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-4 left-1/2 h-14 w-[110%] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-[#22D3EE]/50 to-[#063B3B]/90"
        animate={{ scaleX: [1.03, 1, 1.03], y: [-1, 0, -1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Splash particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-6 h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `${25 + i * 20}%` }}
          animate={{ y: [-2, -15, -2], opacity: [0, 0.8, 0], scale: [0.8, 1.2, 0.8], x: [0, i % 2 === 0 ? -5 : 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}

      {/* Floating tooth character */}
      <motion.div
        className="relative z-10 w-full h-full"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 200 240" className="h-full w-full drop-shadow-2xl overflow-visible" aria-hidden="true">
          <defs>
            {/* 3D Body Gradient */}
            <radialGradient id="bodyGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f8fafc" />
              <stop offset="85%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>
            
            {/* Darker Inner Shadow Gradient for Bottom Roots */}
            <radialGradient id="rootShadow" cx="50%" cy="100%" r="50%">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
            </radialGradient>

            {/* Toothbrush Handle Gradient */}
            <linearGradient id="brushGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="30%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            {/* Arm Gradient */}
            <linearGradient id="armGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Inner Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Tooth body - Realistic Molar Shape */}
          <path
            d="M 45 80 
               C 45 30, 90 30, 100 50 
               C 110 30, 155 30, 155 80 
               C 155 125, 140 160, 125 205 
               C 120 220, 105 220, 105 200 
               C 105 170, 95 170, 95 200 
               C 95 220, 80 220, 75 205 
               C 60 160, 45 125, 45 80 Z"
            fill="url(#bodyGrad)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          {/* Root shadows for depth */}
          <path
            d="M 45 80 C 45 125, 60 160, 75 205 C 80 220, 95 220, 95 200 C 95 170, 105 170, 105 200 C 105 220, 120 220, 125 205 C 140 160, 155 125, 155 80 C 155 110, 140 160, 125 205 C 120 220, 105 220, 105 200 C 105 170, 95 170, 95 200 C 95 220, 80 220, 75 205 C 60 160, 45 110, 45 80 Z"
            fill="url(#rootShadow)"
          />

          {/* Highlight/Shine */}
          <path d="M 60 55 Q 75 40 90 55" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6" filter="url(#glow)" />
          <path d="M 110 55 Q 125 40 140 55" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6" filter="url(#glow)" />

          {/* Left arm on waist */}
          <path
            d="M 46 125 Q 15 140 25 170 Q 35 180 50 155"
            stroke="url(#armGradLeft)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            style={{ filter: 'drop-shadow(2px 4px 3px rgba(0,0,0,0.15))' }}
          />

          {/* Eyebrows */}
          <path d="M 62 80 Q 75 70 88 80" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 112 80 Q 125 70 138 80" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Eyes - Left */}
          <ellipse cx="75" cy="100" rx="14" ry="18" fill="#e2e8f0" opacity="0.9" />
          <ellipse cx="73" cy="98" rx="14" ry="18" fill="#ffffff" />
          <ellipse cx="76" cy="98" rx="8" ry="12" fill="#0f172a" />
          {/* Catchlights */}
          <circle cx="72" cy="93" r="3.5" fill="#ffffff" />
          <circle cx="78" cy="102" r="1.5" fill="#ffffff" />

          {/* Eyes - Right */}
          <ellipse cx="125" cy="100" rx="14" ry="18" fill="#e2e8f0" opacity="0.9" />
          <ellipse cx="123" cy="98" rx="14" ry="18" fill="#ffffff" />
          <ellipse cx="121" cy="98" rx="8" ry="12" fill="#0f172a" />
          {/* Catchlights */}
          <circle cx="117" cy="93" r="3.5" fill="#ffffff" />
          <circle cx="123" cy="102" r="1.5" fill="#ffffff" />

          {/* Cheeks */}
          <ellipse cx="55" cy="115" rx="8" ry="5" fill="#fca5a5" opacity="0.6" filter="url(#glow)" />
          <ellipse cx="145" cy="115" rx="8" ry="5" fill="#fca5a5" opacity="0.6" filter="url(#glow)" />

          {/* Wide Smile */}
          {/* Mouth Base (Dark Interior) */}
          <path d="M 65 125 C 65 170, 135 170, 135 125 C 120 135, 80 135, 65 125 Z" fill="#450a0a" />
          {/* Tongue */}
          <path d="M 75 140 C 90 160, 110 160, 125 140 C 115 145, 85 145, 75 140 Z" fill="#ef4444" />
          {/* Top Teeth */}
          <path d="M 65 125 C 80 135, 120 135, 135 125 C 120 130, 80 130, 65 125 Z" fill="#ffffff" />
          {/* Smile lines */}
          <path d="M 60 120 Q 65 125 65 130" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M 140 120 Q 135 125 135 130" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />

          {/* Right arm holding toothbrush with brushing animation */}
          <motion.g
            animate={{ rotate: [-6, 12, -6], x: [-3, 6, -3] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '150px 150px' }}
          >
            {/* Arm (Back of toothbrush) */}
            <path
              d="M 152 125 Q 185 135 175 170 Q 165 180 152 155"
              stroke="url(#armGradLeft)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              style={{ filter: 'drop-shadow(2px 4px 3px rgba(0,0,0,0.15))' }}
            />
            
            {/* Toothbrush group, rotated slightly */}
            <g transform="translate(170, 140) rotate(-18) translate(-170, -140)">
              {/* Toothbrush Handle */}
              <rect x="164" y="20" width="12" height="135" rx="6" fill="url(#brushGrad)" style={{ filter: 'drop-shadow(3px 3px 2px rgba(0,0,0,0.2))' }} />
              {/* Toothbrush Neck groove */}
              <rect x="166" y="60" width="8" height="2" fill="#7f1d1d" opacity="0.5" />
              {/* Brush Head */}
              <rect x="164" y="20" width="12" height="35" rx="6" fill="#f8fafc" />
              {/* Bristles */}
              <rect x="150" y="25" width="16" height="25" rx="3" fill="#ffffff" />
              <rect x="150" y="27" width="16" height="21" rx="2" fill="#e2e8f0" />
              {/* Toothpaste */}
              <path d="M 146 30 C 140 20, 150 15, 146 45 C 146 45, 150 45, 148 30 Z" fill="#22d3ee" filter="url(#glow)" />
              <path d="M 145 35 C 140 25, 148 20, 145 42 Z" fill="#ffffff" opacity="0.8" />
            </g>
            
            {/* Hand overlapping toothbrush */}
            <circle cx="171" cy="143" r="9" fill="#f8fafc" style={{ filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.1))' }} />
            <circle cx="174" cy="151" r="7" fill="#f8fafc" style={{ filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.1))' }} />

            {/* Brush motion lines */}
            <motion.path
              d="M 135 25 Q 120 30 135 45"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0, 0.8, 0], x: [0, -8, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.path
              d="M 140 20 Q 125 25 140 40"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [0, 0.8, 0], x: [0, -6, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, delay: 0.1, ease: 'easeOut' }}
            />
          </motion.g>

        </svg>
      </motion.div>

      {/* Water Surface Front Layer (overlap base) */}
      <motion.div
        className="absolute -bottom-1 left-1/2 h-8 w-[140%] -translate-x-1/2 rounded-[50%] border-t-[3px] border-[#22D3EE]/60 bg-transparent"
        animate={{ scaleX: [1, 1.06, 1], y: [0, -2, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
