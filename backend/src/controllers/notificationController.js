import Notification from '../models/Notification.js';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user.
 */
export const getMyNotifications = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 30;

  const notifications = await Notification.find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    recipientId: req.user._id,
    isRead: false,
  });

  res.json({ success: true, unreadCount, count: notifications.length, data: notifications });
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }

  res.json({ success: true, data: notification });
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the user as read.
 */
export const markAllRead = async (req, res) => {
  await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, message: 'All notifications marked as read.' });
};

export default { getMyNotifications, markAsRead, markAllRead };
