import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, PICKUP_STATUS, LISTING_STATUS } from '../utils/constants';
import { createNotification, NOTIFICATION_TYPES } from './notifications.service';
import { createSystemMessage } from './chat.service';

export const createPickup = async (listing, ngoUser) => {
  try {
    const pickupsRef = collection(db, COLLECTIONS.PICKUPS);
    const docRef = await addDoc(pickupsRef, {
      listingId:      listing.id,
      restaurantId:   listing.restaurantId,
      restaurantName: listing.restaurantName,
      ngoId:          ngoUser.uid,
      ngoName:        ngoUser.name,
      foodName:       listing.foodName,
      quantity:       listing.quantity,
      unit:           listing.unit,
      city:           listing.city,
      tags:           Array.isArray(listing.tags) ? listing.tags : [],

      pickupAddress:     listing.pickupAddress || '',
      pickupWindowStart: listing.pickupWindowStart || null,
      pickupWindowEnd:   listing.pickupWindowEnd || null,

      claimedAt:   serverTimestamp(),
      completedAt: null,
      status:      PICKUP_STATUS.CLAIMED,
    });

    await updateDoc(docRef, { pickupId: docRef.id });

    // System message — written after pickupId is known so we can
    // address the correct subcollection. Fire-and-forget.
    createSystemMessage(
      docRef.id,
      `Pickup claimed by ${ngoUser.name}.`
    );

    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const subscribeToNgoPickups = (ngoId, callback, onError) => {
  const pickupsRef = collection(db, COLLECTIONS.PICKUPS);
  const q = query(
    pickupsRef,
    where('ngoId', '==', ngoId),
    orderBy('claimedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const pickups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(pickups);
    },
    (error) => {
      console.error('NGO pickups listener error:', error);
      if (onError) onError(error);
    }
  );
};

export const subscribeToRestaurantPickups = (restaurantId, callback, onError) => {
  const pickupsRef = collection(db, COLLECTIONS.PICKUPS);
  const q = query(
    pickupsRef,
    where('restaurantId', '==', restaurantId),
    orderBy('claimedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const pickups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(pickups);
    },
    (error) => {
      console.error('Restaurant pickups listener error:', error);
      if (onError) onError(error);
    }
  );
};

export const cancelPickup = async (pickupId, listingId) => {
  try {
    const pickupRef = doc(db, COLLECTIONS.PICKUPS, pickupId);
    await updateDoc(pickupRef, {
      status:      PICKUP_STATUS.CANCELLED,
      cancelledAt: serverTimestamp(),
    });

    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      status:        LISTING_STATUS.AVAILABLE,
      claimedBy:     null,
      claimedByName: null,
      claimedAt:     null,
    });

    // Fire-and-forget — cancel is complete regardless of chat write outcome.
    createSystemMessage(pickupId, 'Pickup cancelled.');
  } catch (error) {
    throw error;
  }
};

export const completePickup = async (pickupId, listingId, pickupData) => {
  try {
    const pickupRef = doc(db, COLLECTIONS.PICKUPS, pickupId);
    await updateDoc(pickupRef, {
      status:      PICKUP_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      completedBy: 'restaurant',
    });

    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      status:      LISTING_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
    });

    if (pickupData) {
      createNotification(
        pickupData.ngoId,
        NOTIFICATION_TYPES.PICKUP_COMPLETE,
        `${pickupData.restaurantName} confirmed your pickup of "${pickupData.foodName}" is complete.`,
        listingId,
        pickupId
      );
      createNotification(
        pickupData.restaurantId,
        NOTIFICATION_TYPES.PICKUP_COMPLETE,
        `Pickup of "${pickupData.foodName}" by ${pickupData.ngoName} has been marked complete.`,
        listingId,
        pickupId
      );
      createSystemMessage(pickupId, 'Pickup marked as completed.');
    }
  } catch (error) {
    throw error;
  }
};

export const getPickupByListingId = async (listingId) => {
  try {
    const pickupsRef = collection(db, COLLECTIONS.PICKUPS);
    const q = query(
      pickupsRef,
      where('listingId', '==', listingId),
      where('status', '==', PICKUP_STATUS.CLAIMED)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    throw error;
  }
};

export const completePickupByNgo = async (pickupId, listingId, pickupData) => {
  try {
    const pickupRef = doc(db, COLLECTIONS.PICKUPS, pickupId);
    await updateDoc(pickupRef, {
      status:      PICKUP_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      completedBy: 'ngo',
    });

    const listingRef = doc(db, COLLECTIONS.LISTINGS, listingId);
    await updateDoc(listingRef, {
      status:      LISTING_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
    });

    if (pickupData) {
      createNotification(
        pickupData.restaurantId,
        NOTIFICATION_TYPES.PICKUP_COMPLETE,
        `${pickupData.ngoName} confirmed they collected "${pickupData.foodName}".`,
        listingId,
        pickupId
      );
      createNotification(
        pickupData.ngoId,
        NOTIFICATION_TYPES.PICKUP_COMPLETE,
        `Your pickup of "${pickupData.foodName}" from ${pickupData.restaurantName} is complete.`,
        listingId,
        pickupId
      );
      createSystemMessage(pickupId, 'Pickup marked as completed.');
    }
  } catch (error) {
    throw error;
  }
};