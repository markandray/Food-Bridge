import { memo, useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getRelativeTime } from '../../utils/dateHelpers';
import { NOTIFICATION_TYPES } from '../../services/notifications.service';

// Full class strings for notification type accent colors.
// Tailwind v4 requires complete class names — no dynamic interpolation like
// `bg-${color}-100` because the purger can't detect those at build time.
const TYPE_STYLES = {
  [NOTIFICATION_TYPES.LISTING_CLAIMED]: {
    dot: 'bg-amber-400',
    bg:  'hover:bg-amber-50',
  },
  [NOTIFICATION_TYPES.PICKUP_COMPLETE]: {
    dot: 'bg-blue-400',
    bg:  'hover:bg-emerald-50',
  },
};

const DEFAULT_STYLE = {
  dot: 'bg-slate-400',
  bg:  'hover:bg-slate-50',
};

/**
 * NotificationBell — bell icon with unread count badge and dropdown.
 *
 * Props are all stable (from useCallback / primitive values) so React.memo
 * prevents re-renders when Navbar re-renders for unrelated reasons
 * (e.g. mobile menu toggle changes mobileMenuOpen state).
 */
const NotificationBell = memo(({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  loading,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef    = useRef(null);

  // REACT CONCEPT: useEffect cleanup — outside-click handler.
  // Same pattern as Modal.jsx's Escape key listener:
  // attach on mount, detach on unmount to prevent memory leaks.
  // We use 'mousedown' (not 'click') so the handler fires before React's
  // synthetic onClick, allowing the toggle button to close the dropdown
  // correctly on the same click that opened it.
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleBellClick = () => setOpen((prev) => !prev);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    // Future: could navigate to the related listing/pickup here
    // using ROUTES.RESTAURANT_MANAGE_LISTINGS or ROUTES.NGO_CLAIMED_PICKUPS
  };

  return (
    // position: relative on the container so the dropdown can be
    // position: absolute relative to the bell, not the viewport
    <div className="relative" ref={containerRef}>

      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" />

        {/* Unread count badge — only renders when there are unread notifications.
            Cap display at 9+ to avoid the badge growing too wide. */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — conditionally rendered, not hidden with CSS.
          We unmount it entirely when closed so the notification list
          doesn't accumulate stale scroll position between openings. */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-lg z-50 overflow-hidden">

          {/* Dropdown header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              // Skeleton rows while first snapshot loads
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = TYPE_STYLES[notification.type] || DEFAULT_STYLE;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 flex gap-3 transition-colors ${style.bg} ${
                      !notification.isRead ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    {/* Colored dot — unread = colored, read = transparent */}
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors ${
                      notification.isRead ? 'bg-transparent' : style.dot
                    }`} />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${
                        notification.isRead ? 'text-slate-500' : 'text-slate-800 font-medium'
                      }`}>
                        {notification.message}
                      </p>
                      {/* getRelativeTime is already in dateHelpers — shows "2 min ago", "3 hrs ago" etc. */}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {notification.createdAt
                          ? getRelativeTime(notification.createdAt)
                          : 'Just now'}
                      </p>
                      {/* "Just now" fallback: serverTimestamp() is null on the client
                          until Firestore confirms the write. The optimistic local snapshot
                          has createdAt = null for a brief moment after createNotification. */}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer — only when there are notifications */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400 text-center">
                Showing {notifications.length} most recent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;