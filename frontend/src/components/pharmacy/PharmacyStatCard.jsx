import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function PharmacyStatCard({
  title,
  value,
  iconType = 'pill', // 'pill' | 'box' | 'warning' | 'cart'
  colorTheme = 'cyan', // 'cyan' | 'green' | 'amber' | 'purple'
  delay = 0,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const themes = {
    cyan: {
      iconBg: isDark ? 'rgba(0, 201, 232, 0.12)' : 'rgba(8, 127, 156, 0.1)',
      iconBorder: isDark ? 'rgba(0, 201, 232, 0.35)' : 'rgba(8, 127, 156, 0.3)',
      iconColor: isDark ? '#00C9E8' : '#087F9C',
      strokeColor: isDark ? '#00C9E8' : '#087F9C',
      fillGrad: [isDark ? 'rgba(0, 201, 232, 0.2)' : 'rgba(8, 127, 156, 0.15)', isDark ? 'rgba(0, 201, 232, 0)' : 'rgba(8, 127, 156, 0)'],
      glow: isDark ? 'rgba(0, 201, 232, 0.15)' : 'rgba(8, 127, 156, 0.1)',
    },
    green: {
      iconBg: isDark ? 'rgba(24, 217, 155, 0.12)' : 'rgba(22, 131, 93, 0.1)',
      iconBorder: isDark ? 'rgba(24, 217, 155, 0.35)' : 'rgba(22, 131, 93, 0.3)',
      iconColor: isDark ? '#18D99B' : '#16835D',
      strokeColor: isDark ? '#18D99B' : '#16835D',
      fillGrad: [isDark ? 'rgba(24, 217, 155, 0.2)' : 'rgba(22, 131, 93, 0.15)', isDark ? 'rgba(24, 217, 155, 0)' : 'rgba(22, 131, 93, 0)'],
      glow: isDark ? 'rgba(24, 217, 155, 0.15)' : 'rgba(22, 131, 93, 0.1)',
    },
    amber: {
      iconBg: isDark ? 'rgba(245, 185, 66, 0.12)' : 'rgba(166, 106, 16, 0.1)',
      iconBorder: isDark ? 'rgba(245, 185, 66, 0.35)' : 'rgba(166, 106, 16, 0.3)',
      iconColor: isDark ? '#F5B942' : '#A66A10',
      strokeColor: isDark ? '#F5B942' : '#A66A10',
      fillGrad: [isDark ? 'rgba(245, 185, 66, 0.2)' : 'rgba(166, 106, 16, 0.15)', isDark ? 'rgba(245, 185, 66, 0)' : 'rgba(166, 106, 16, 0)'],
      glow: isDark ? 'rgba(245, 185, 66, 0.15)' : 'rgba(166, 106, 16, 0.1)',
    },
    purple: {
      iconBg: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(139, 92, 246, 0.1)',
      iconBorder: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(139, 92, 246, 0.3)',
      iconColor: isDark ? '#C084FC' : '#7C3AED',
      strokeColor: isDark ? '#A855F7' : '#7C3AED',
      fillGrad: [isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(139, 92, 246, 0.15)', isDark ? 'rgba(168, 85, 247, 0)' : 'rgba(139, 92, 246, 0)'],
      glow: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(139, 92, 246, 0.1)',
    },
  };

  const currentTheme = themes[colorTheme] || themes.cyan;

  // Icon SVG rendering
  const renderIcon = () => {
    switch (iconType) {
      case 'pill':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
          </svg>
        );
      case 'box':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'cart':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="pharmacy-kpi-card relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.78) 0%, rgba(11, 27, 45, 0.88) 100%)'
          : '#FFFFFF',
        border: isDark
          ? '1px solid rgba(217, 173, 86, 0.28)'
          : '1px solid rgba(198, 156, 72, 0.28)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(244, 213, 141, 0.12)'
          : '0 8px 24px rgba(20, 36, 58, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Soft Corner Glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-xl"
        style={{
          background: currentTheme.glow,
          opacity: isDark ? 0.35 : 0.5,
        }}
      />

      {/* Top Row: Icon + Value & Title */}
      <div className="flex items-center gap-3.5 mb-2">
        {/* Round Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300"
          style={{
            background: currentTheme.iconBg,
            border: `1px solid ${currentTheme.iconBorder}`,
            color: currentTheme.iconColor,
            boxShadow: `0 0 12px ${currentTheme.glow}`,
          }}
        >
          {renderIcon()}
        </div>

        {/* Metric Label & Real Value (no fake percentages) */}
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold tracking-wide"
            style={{ color: isDark ? '#94A9BF' : '#52657A' }}
          >
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: 'Outfit, sans-serif',
                color: isDark ? '#F8FAFC' : '#14243A',
              }}
            >
              {value}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Subtle Ambient Decorative Wave (non-data decorative curve) */}
      <div className="relative h-8 w-full mt-1 overflow-hidden pointer-events-none opacity-85">
        <svg
          viewBox="0 0 140 32"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id={`sparkGrad-${colorTheme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentTheme.fillGrad[0]} />
              <stop offset="100%" stopColor={currentTheme.fillGrad[1]} />
            </linearGradient>
          </defs>
          <path
            d="M0,24 C25,28 45,8 70,16 C95,24 115,6 140,12 L140,32 L0,32 Z"
            fill={`url(#sparkGrad-${colorTheme})`}
          />
          <path
            d="M0,24 C25,28 45,8 70,16 C95,24 115,6 140,12"
            fill="none"
            stroke={currentTheme.strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
