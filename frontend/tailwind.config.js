/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        theme: {
          primary: 'var(--primary)',
          secondary: 'var(--secondary)',
          accent: 'var(--accent)',
          background: 'var(--background)',
          surface: 'var(--surface)',
          border: 'var(--border)',
          heading: 'var(--heading)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          button: 'var(--button)',
          'button-hover': 'var(--button-hover)',
          success: 'var(--success)',
          error: 'var(--error)',
        },
      },
      boxShadow: {
        theme: '0 8px 32px var(--shadow)',
        'theme-lg': '0 16px 48px var(--shadow)',
        glow: '0 0 24px rgba(34, 211, 238, 0.25)',
        'glow-strong': '0 0 40px rgba(6, 182, 212, 0.4)',
        'glow-sm': '0 0 12px rgba(34, 211, 238, 0.15)',
        'card-hover': '0 20px 60px rgba(0,0,0,0.35)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        wave: 'wave 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'border-spin': 'borderSpin 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0) scaleY(1)' },
          '50%': { transform: 'translateX(-4px) scaleY(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(6,182,212,0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(6,182,212,0.6)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        borderSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.18), transparent), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(20,184,166,0.12), transparent)',
      },
    },
  },
  plugins: [],
};
