import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToNgoPickups,
  subscribeToRestaurantPickups,
  cancelPickup as cancelPickupService,
  completePickup as completePickupService,
  completePickupByNgo as completePickupByNgoService,
} from '../services/pickups.service';
import { recordCompletedDonation } from '../services/impact.service';
import { ROLES, PICKUP_STATUS } from '../utils/constants';

const usePickups = (userId, role) => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!userId || !role) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const subscribeFn =
      role === ROLES.NGO
        ? subscribeToNgoPickups
        : subscribeToRestaurantPickups;

    // REACT CONCEPT: useEffect cleanup
    // onSnapshot returns an unsubscribe function. We return it from the effect
    // so React calls it when the component unmounts or userId/role changes.
    // Without this, the listener keeps firing after logout.
    const unsubscribe = subscribeFn(
      userId,
      (data) => {
        setPickups(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, role]);

  // Derived slices — plain filter, no useMemo needed (simple array operation)
  const activePickups    = pickups.filter((p) => p.status === PICKUP_STATUS.CLAIMED);
  const completedPickups = pickups.filter((p) => p.status === PICKUP_STATUS.COMPLETED);
  const cancelledPickups = pickups.filter((p) => p.status === PICKUP_STATUS.CANCELLED);

  const cancelPickup = useCallback(async (pickupId, listingId) => {
    try {
      await cancelPickupService(pickupId, listingId);
    } catch (error) {
      throw error;
    }
  }, []);

  // CHANGED: now accepts the full pickup object instead of (pickupId, listingId).
  // Reason: completePickupService now needs pickupData as a third argument to
  // compose notification messages for both parties (restaurant + NGO).
  // The full object is always available at call sites since callers iterate
  // over the pickups array from this hook's own state.
  const completePickup = useCallback(async (pickup) => {
    try {
      await completePickupService(pickup.id, pickup.listingId, pickup);
      // Note: impact stats for the restaurant completion path are handled by
      // useListings.completeListing (via getPickupByListingId + recordCompletedDonation).
      // This function is the direct pickup-level completion — no double-counting.
    } catch (error) {
      throw error;
    }
  }, []);

  // CHANGED: passes pickup as third arg to service for notification messages.
  // Signature stays the same (full pickup object) — only the service call changes.
  const completePickupByNgo = useCallback(async (pickup) => {
    try {
      await completePickupByNgoService(pickup.id, pickup.listingId, pickup);
      await recordCompletedDonation({
        restaurantId: pickup.restaurantId,
        ngoId:        pickup.ngoId,
        quantity:     pickup.quantity,
        unit:         pickup.unit,
      });
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    pickups,
    activePickups,
    completedPickups,
    cancelledPickups,
    loading,
    error,
    cancelPickup,
    completePickup,
    completePickupByNgo,
  };
};

export default usePickups;