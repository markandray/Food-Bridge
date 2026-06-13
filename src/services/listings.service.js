import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, LISTING_STATUS } from '../utils/constants';
import { createNotification, NOTIFICATION_TYPES } from './notifications.service';

export const subscribeToListings = (filters = {}, callback, onError) => {
  const listingsRef = collection(db, COLLECTIONS.LISTINGS);

  const constraints = [];

  // Feature J: multi-city query
  // Firestore supports up to 30 values in an "in" array
  if (filters?.cities && filters.cities.length > 1) {
    constraints.push(where('city', 'in', filters.cities));
  } else if (filters?.city) {
    constraints.push(where('city', '==', filters.city));
  }

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  if (filters?.restaurantId) {
    constraints.push(where('restaurantId', '==', filters.restaurantId));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(listingsRef, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const listings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(listings);
    },
    (error) => {
      console.error('Listings listener error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

export const subscribeToRestaurantListings = (restaurantId, callback, onError) => {
  const listingsRef = collection(db, COLLECTIONS.LISTINGS);
  const q = query(
    listingsRef,
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const listings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(listings);
    },
    (error) => {
      console.error('Restaurant listings listener error:', error);
      if (onError) onError(error);
    }
  );
};

export const createListing = async (listingData) => {
  try {
    const listingsRef = collection(db, COLLECTIONS.LISTINGS);

    const docRef = await addDoc(listingsRef, {
      ...listingData,
      // Ensure tags is always a clean array — guards against undefined if
      // an older call site doesn't pass tags, and strips any non-allowed values.
      tags: Array.isArray(listingData.tags) ? listingData.tags : [],
      status: LISTING_STATUS.AVAILABLE,
      claimedBy: null,
      claimedByName: null,
      createdAt: serverTimestamp(),
      expiryTime: Timestamp.fromDate(new Date(listingData.expiryTime)),
      pickupWindowStart: Timestamp.fromDate(new Date(listingData.pickupWindowStart)),
      pickupWindowEnd: Timestamp.fromDate(new Date(listingData.pickupWindowEnd)),
    });

    await updateDoc(docRef, { listingId: docRef.id });

    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateListing = async (listingId, updates) => {
  try {
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);

    const sanitized = { ...updates };

    const timeFields = ['expiryTime', 'pickupWindowStart', 'pickupWindowEnd'];
    timeFields.forEach((field) => {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = Timestamp.fromDate(new Date(sanitized[field]));
      }
    });

    await updateDoc(listingRef, {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

export const deleteListing = async (listingId) => {
  try {
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await deleteDoc(listingRef);
  } catch (error) {
    throw error;
  }
};

export const claimListing = async (listingId, ngoUser) => {
  try {
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      throw new Error('Listing no longer exists.');
    }

    const listing = listingSnap.data();

    if (listing.status !== LISTING_STATUS.AVAILABLE) {
      throw new Error(
        `This listing is no longer available — it has been ${listing.status}.`
      );
    }

    await updateDoc(listingRef, {
      status: LISTING_STATUS.CLAIMED,
      claimedBy: ngoUser.uid,
      claimedByName: ngoUser.name,
      claimedAt: serverTimestamp(),
    });

    createNotification(
      listing.restaurantId,
      NOTIFICATION_TYPES.LISTING_CLAIMED,
      `${ngoUser.name} claimed your listing for "${listing.foodName}".`,
      listingId,
      null
    );

    return listingId;
  } catch (error) {
    throw error;
  }
};

export const completeListing = async (listingId) => {
  try {
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      status: LISTING_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

export const expireListing = async (listingId) => {
  try {
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      status: LISTING_STATUS.EXPIRED,
    });
  } catch (error) {
    throw error;
  }
};

export const getListingById = async (listingId) => {
  try {
    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    const listingSnap = await getDoc(listingRef);
    if (!listingSnap.exists()) return null;
    return { id: listingSnap.id, ...listingSnap.data() };
  } catch (error) {
    throw error;
  }
};