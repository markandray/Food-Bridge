import {
  doc,
  getDoc,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, KG_TO_MEALS_RATIO } from '../utils/constants';

const defaultImpactStats = {
  totalListings: 0,
  totalDonationsKg: 0,
  totalPickups: 0,
  mealsServed: 0,
  completedCount: 0,
};

export const getImpactStats = async (userId) => {
  const impactRef = doc(db, COLLECTIONS.IMPACT, userId);
  const impactSnap = await getDoc(impactRef);

  if (!impactSnap.exists()) {
    return defaultImpactStats;
  }

  return {
    ...defaultImpactStats,
    ...impactSnap.data(),
  };
};

export const initImpactDoc = async (userId) => {
  const impactRef = doc(db, COLLECTIONS.IMPACT, userId);

  await setDoc(impactRef, defaultImpactStats, { merge: true });
};

export const incrementListingCount = async (restaurantId) => {
  try {
    const impactRef = doc(db, COLLECTIONS.IMPACT, restaurantId);

    await setDoc(
      impactRef,
      {
        ...defaultImpactStats,
        totalListings: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to update impact stats:', error);
  }
};

export const recordCompletedDonation = async ({
  restaurantId,
  ngoId,
  quantity,
  unit,
}) => {
  const kgDonated = unit === 'kg' ? Number(quantity) : 0;
  const mealsFromThisPickup = Math.floor(kgDonated * KG_TO_MEALS_RATIO);

  try {
    const restaurantImpactRef = doc(db, COLLECTIONS.IMPACT, restaurantId);

    await setDoc(
      restaurantImpactRef,
      {
        ...defaultImpactStats,
        totalDonationsKg: increment(kgDonated),
        completedCount: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to update restaurant impact:', error);
  }

  try {
    const ngoImpactRef = doc(db, COLLECTIONS.IMPACT, ngoId);

    await setDoc(
      ngoImpactRef,
      {
        ...defaultImpactStats,
        totalPickups: increment(1),
        completedCount: increment(1),
        mealsServed: increment(mealsFromThisPickup),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to update NGO impact:', error);
  }
};