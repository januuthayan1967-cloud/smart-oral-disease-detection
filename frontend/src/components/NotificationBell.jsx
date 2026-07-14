import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { isAuthenticated, isPharmacy } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await notificationAPI.get({ limit: 5 });
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_) { /* ignore */ }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 15 seconds to receive near-real-time order updates
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markRead(id);
      fetchNotifications();
    } catch (_) { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      fetchNotifications();
    } catch (_) { /* ignore */ }
  };

  const handleNotificationClick = (item) => {
    setDropdownOpen(false);
    // Mark as read
    if (!item.isRead) {
      notificationAPI.markRead(item._id).then(fetchNotifications).catch(() => {});
    }

    // Route dynamically based on user role and orderId
    if (item.orderId) {
      if (isPharmacy) {
        // Direct orders or prescription orders tabs on pharmacy dashboard
        navigate('/pharmacy');
      } else {
        // Check if message mentions prescription to determine order type
        if (item.message && item.message.toLowerCase().includes('prescription')) {
          navigate(`/orders?orderId=${item.orderId}`);
        } else {
          navigate(`/direct-orders?orderId=${item.orderId}`);
        }
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative rounded-xl p-2.5 text-theme-text hover:bg-theme-accent/10 hover:text-theme-accent transition duration-200"
        aria-label="View notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-glow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-theme-border/60 bg-theme-surface shadow-theme-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme-border/30 px-4 py-3 bg-theme-surface/40">
              <span className="font-bold text-theme-heading">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-theme-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-theme-border/20">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-theme-muted">
                  <p className="text-2xl mb-1">🎉</p>
                  <p>All caught up!</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`flex items-start justify-between gap-2 px-4 py-3 cursor-pointer transition hover:bg-theme-accent/5 ${
                      !item.isRead ? 'bg-theme-accent/8 border-l-2 border-theme-accent' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-theme-heading truncate">{item.title}</p>
                      <p className="mt-0.5 text-xs text-theme-text line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="mt-1 block text-[10px] text-theme-muted">
                        {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(item._id, e)}
                        className="rounded p-1 text-[10px] text-theme-accent hover:bg-theme-accent/15"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-theme-border/20 px-4 py-2.5 text-center bg-theme-surface/40">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/orders');
                }}
                className="text-xs font-medium text-theme-accent hover:underline"
              >
                {isPharmacy ? 'View all Pharmacy Orders' : 'View My Order History'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
