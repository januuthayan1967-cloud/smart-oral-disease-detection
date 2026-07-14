import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ── SVG Icon Set ─────────────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  Patients: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="6" r="3" fill="currentColor" opacity="0.9" />
      <circle cx="14" cy="7" r="2" fill="currentColor" opacity="0.6" />
      <path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6H1Z" fill="currentColor" opacity="0.9" />
      <path d="M14 12c1.7.6 3 2.3 3 4.4V17h-3v-.6c0-1.7-.7-3.2-1.7-4.4Z" fill="currentColor" opacity="0.6" />
    </svg>
  ),
  Detect: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="9" cy="9" r="3" fill="currentColor" opacity="0.9" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Medicine: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="14" height="9" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="7" y="4" width="6" height="5" rx="1" fill="currentColor" opacity="0.9" />
      <path d="M8 11.5h4M10 9.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Appointments: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="14" rx="2" fill="currentColor" opacity="0.6" />
      <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="6" y="12" width="2" height="2" rx="0.5" fill="white" opacity="0.9" />
      <rect x="10" y="12" width="2" height="2" rx="0.5" fill="white" opacity="0.9" />
      <rect x="14" y="12" width="2" height="2" rx="0.5" fill="white" opacity="0.9" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.9" />
      <path
        d="M10 2c-.4 0-.8 0-1.2.1L8 4.2C7.4 4.4 6.9 4.7 6.4 5L4.3 4.3C3.6 5 3 5.6 2.3 6.3l.7 2.1c-.3.5-.6 1-.8 1.6L0 10.8c0 .4.1.8.1 1.2s0 .8-.1 1.2l2.2.8c.2.6.5 1.1.8 1.6l-.7 2.1c.7.7 1.3 1.3 2 1.9l2.1-.7c.5.3 1 .6 1.6.8l.8 2.2c.4.1.8.1 1.2.1s.8 0 1.2-.1l.8-2.2c.6-.2 1.1-.5 1.6-.8l2.1.7c.7-.6 1.3-1.2 1.9-2l-.7-2.1c.3-.5.6-1 .8-1.6l2.2-.8c.1-.4.1-.8.1-1.2s0-.8-.1-1.2l-2.2-.8c-.2-.6-.5-1.1-.8-1.6l.7-2.1c-.6-.7-1.2-1.3-2-1.9l-2.1.7c-.5-.3-1-.6-1.6-.8L11.2 2C10.8 2 10.4 2 10 2Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  ),
  Admin: () => (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 5v5c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V5l-7-3Z" fill="currentColor" opacity="0.7" />
      <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', Icon: Icons.Dashboard },
  { to: '/history', label: 'Patients', Icon: Icons.Patients },
  { to: '/detect', label: 'AI Detection', Icon: Icons.Detect },
  { to: '/medicines', label: 'Medicines', Icon: Icons.Medicine },
  { to: '/consultation', label: 'Appointments', Icon: Icons.Appointments },
  { to: '/profile', label: 'Settings', Icon: Icons.Settings },
];

const dentistLinks = [
  { to: '/dentist', label: 'Dashboard', Icon: Icons.Dashboard },
  { to: '/medicines', label: 'Medicines', Icon: Icons.Medicine },
  { to: '/consultation', label: 'Appointments', Icon: Icons.Appointments },
  { to: '/profile', label: 'Settings', Icon: Icons.Settings },
];

const pharmacyLinks = [
  { to: '/pharmacy', label: 'Dashboard', Icon: Icons.Dashboard },
  { to: '/profile', label: 'Settings', Icon: Icons.Settings },
];

const adminLinks = [
  { to: '/admin', label: 'Admin', Icon: Icons.Admin },
  ...userLinks,
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isDentist, isPharmacy } = useAuth();

  let links = userLinks;
  if (isAdmin) links = adminLinks;
  else if (isDentist) links = dentistLinks;
  else if (isPharmacy) links = pharmacyLinks;

  const displayName = user?.name || user?.pharmacyName || 'User';
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.role || 'user';

  const sidebarContent = (
    <aside
      className="flex h-full flex-col"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-soft)',
      }}
    >
      {/* Brand header */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-glow-sm"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <svg viewBox="0 0 32 32" fill="none" style={{ width: 20, height: 20 }}>
              <path
                d="M10 4C7 4 4 7 4 11c0 2.5 1 5 1.5 7.5C6 21 6.5 23 8 26c.5 1.5 1.5 2 2.5 1.5S12 26 12 24c0-1.5.5-3 1.5-3H18c1 0 1.5 1.5 1.5 3 0 2 .5 3.5 1.5 3.5s2-.5 2.5-1.5c1.5-3 2-5 2.5-7.5C26.5 16 27.5 13.5 27.5 11c0-4-3-7-6-7a5.5 5.5 0 0 0-5.5 4A5.5 5.5 0 0 0 10 4Z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)', lineHeight: 1.2 }}>
              Oral AI
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Dental Platform</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Sidebar navigation">
        {links.map((link, i) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-theme-accent shadow-glow-sm'
                  : 'text-theme-muted hover:text-theme-text',
              ].join(' ')
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              boxShadow: isActive ? 'inset 3px 0 0 var(--accent)' : 'none',
              paddingLeft: isActive ? '1rem' : undefined,
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className="shrink-0"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
                >
                  <link.Icon />
                </span>
                <span>{link.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
        <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'var(--accent-dim)' }}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-glow-sm"
            style={{ background: 'var(--gradient-accent)' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--heading)' }}>{displayName}</p>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent)' }}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 overflow-hidden rounded-2xl md:block shadow-theme" style={{ border: '1px solid var(--border-soft)' }}>
        {sidebarContent}
      </div>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-hidden md:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
