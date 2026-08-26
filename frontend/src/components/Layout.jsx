import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState(location.state?.toastMessage || location.state?.message || '');

  useEffect(() => {
    if (location.state?.toastMessage || location.state?.message) {
      const msg = location.state.toastMessage || location.state.message;
      setToastMessage(msg);
      const timer = setTimeout(() => setToastMessage(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <div className="page-gradient min-h-screen">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-theme-surface/95 px-4 py-3 text-sm font-semibold text-emerald-400 shadow-glow backdrop-blur-md"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">
              ✓
            </span>
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="ml-2 rounded-lg p-1 text-theme-muted hover:text-theme-text transition"
              aria-label="Close notification"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar
        variant="app"
        showMenuButton
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}

