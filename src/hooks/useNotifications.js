import { useEffect, useState, useCallback } from 'react';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications.service';

/**
 * Wraps the notifications Firestore listener with the same pattern used by
 * useListings and usePickups: onSnapshot with cleanup, derived values via
 * plain computation (no useMemo needed — these are simple array operations),
 * and stable useCallback handlers.
 *
 * Returns:
 *   notifications  — full array of notification objects (max 10)
 *   unreadCount    — derived from notifications, recomputed on every update
 *   markRead       — marks one notification as read by ID
 *   markAllRead    — marks all unread notifications as read
 *   loading        — true until first snapshot arrives
 */
const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    // Don't subscribe if there's no userId — user is logged out or profile not loaded yet
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // REACT CONCEPT: useEffect cleanup — onSnapshot returns unsubscribe,
    // which we return from the effect so React calls it when the component
    // unmounts or userId changes. Without this, the listener would keep
    // firing after logout, causing a "can't update state on unmounted component" warning.
    const unsubscribe = subscribeToNotifications(
      userId,
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error('useNotifications error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Derived — recomputed synchronously on every render where notifications changes.
  // No useMemo needed: filtering a 10-item array is effectively free.
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // useCallback: these are passed as props to NotificationBell (React.memo'd).
  // Stable references prevent unnecessary re-renders of the bell on every Navbar render.
  const markRead = useCallback(async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      // No local state update needed — onSnapshot fires automatically
      // and updates `notifications` with the new isRead value.
    } catch (error) {
      console.error('markRead error:', error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await markAllNotificationsRead(userId);
      // Again — no local state update, onSnapshot handles it.
    } catch (error) {
      console.error('markAllRead error:', error);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    loading,
  };
};

export default useNotifications;