import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, NOTIFICATION_TYPES } from '../utils/constants';

// Re-export NOTIFICATION_TYPES so callers (listings.service, pickups.service)
// only need to import from one place — the service — instead of reaching into constants.
export { NOTIFICATION_TYPES };

// Maximum notifications fetched per user in the real-time listener.
// The UI shows at most 10; fetching exactly 10 means Firestore never sends
// more data than the UI can display, keeping the listener efficient.
const NOTIFICATIONS_LIMIT = 10;

/**
 * Creates a notification document for a single recipient.
 *
 * Designed to be called fire-and-forget from other service functions.
 * Callers should NOT await this in a way that blocks their main operation —
 * a failed notification must never roll back a successful claim or completion.
 *
 * @param {string}      userId    - Recipient's Firebase Auth UID
 * @param {string}      type      - One of NOTIFICATION_TYPES values
 * @param {string}      message   - Human-readable notification text
 * @param {string|null} listingId - Related listing ID (or null)
 * @param {string|null} pickupId  - Related pickup ID (or null)
 */
export const createNotification = async (userId, type, message, listingId = null, pickupId = null) => {
  try {
    const ref = collection(db, COLLECTIONS.NOTIFICATIONS);
    await addDoc(ref, {
      userId,
      type,
      message,
      listingId,
      pickupId,
      isRead:    false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Log but never throw — notification failure must not surface to the user
    // as an error on an unrelated action (claiming, completing a pickup, etc.)
    console.error('createNotification failed:', error);
  }
};

/**
 * Real-time listener for a user's most recent notifications.
 * Returns the unsubscribe function (same pattern as all other service listeners).
 *
 * Firestore index required: notifications — (userId ASC, createdAt DESC)
 * Without this composite index, Firestore will throw and provide a link
 * in the console to create it with one click.
 */
export const subscribeToNotifications = (userId, callback, onError) => {
  const ref = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    ref,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(NOTIFICATIONS_LIMIT)
    // limit() means Firestore only sends the 10 most recent docs on every change,
    // rather than the entire collection. Critical for keeping listener traffic low.
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(notifications);
    },
    (error) => {
      console.error('Notifications listener error:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Marks a single notification as read.
 * Called when the user clicks an individual notification in the dropdown.
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const ref = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(ref, { isRead: true });
  } catch (error) {
    console.error('markNotificationRead failed:', error);
    throw error;
  }
};

/**
 * Marks all unread notifications as read for a user.
 * Called when the user clicks "Mark all read" in the dropdown.
 *
 * Why Promise.all instead of writeBatch?
 * writeBatch is more efficient at scale (single network round-trip for all writes).
 * But we're operating on at most NOTIFICATIONS_LIMIT (10) docs — at that scale,
 * Promise.all of individual updateDoc calls is perfectly adequate and avoids
 * importing and explaining an additional Firestore API.
 */
export const markAllNotificationsRead = async (userId) => {
  try {
    const ref = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      ref,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);

    // Fire all updates in parallel — don't await them sequentially
    await Promise.all(
      snapshot.docs.map((docSnap) =>
        updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, docSnap.id), { isRead: true })
      )
    );
  } catch (error) {
    console.error('markAllNotificationsRead failed:', error);
    throw error;
  }
};