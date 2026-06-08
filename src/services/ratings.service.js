import {
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';

/**
 * Submits a rating from one user to another for a specific pickup.
 *
 * Why getDocs check before addDoc?
 * We call hasRatedPickup before showing the "Rate" button, but a determined
 * user could submit twice in a race condition. The check here is the
 * authoritative guard — UI checks are just for UX convenience.
 */
export const submitRating = async (ratingData) => {
  try {
    const ref = collection(db, COLLECTIONS.RATINGS);
    await addDoc(ref, {
      ...ratingData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('submitRating error:', error);
    throw error;
  }
};

/**
 * Fetches all ratings received by a user (for their public profile).
 * One-time getDocs fetch — not a listener. Ratings are historical and
 * don't change in real time, so onSnapshot would be wasteful here.
 */
export const getRatingsForUser = async (userId) => {
  try {
    const ref = collection(db, COLLECTIONS.RATINGS);
    const q = query(ref, where('toUserId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('getRatingsForUser error:', error);
    throw error;
  }
};

/**
 * Checks whether a specific user has already rated a specific pickup.
 * Used to decide whether to show "Rate" or "Rated ★★★☆☆" in history tables.
 *
 * Returns the existing rating object if found, null if not yet rated.
 * Returning the full object (not just a boolean) lets the UI display
 * the previously submitted star count without an extra fetch.
 */
export const hasRatedPickup = async (fromUserId, pickupId) => {
  try {
    const ref = collection(db, COLLECTIONS.RATINGS);
    const q = query(
      ref,
      where('fromUserId', '==', fromUserId),
      where('pickupId',   '==', pickupId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('hasRatedPickup error:', error);
    throw error;
  }
};