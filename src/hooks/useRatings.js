import { useState, useCallback } from 'react';
import {
  submitRating as submitRatingService,
  hasRatedPickup as hasRatedPickupService,
} from '../services/ratings.service';

/**
 * Thin hook wrapping rating service calls.
 * Follows the same pattern as other hooks in this project:
 * service logic stays in services/, hooks expose stable useCallback references.
 *
 * Returns:
 *   submitRating    — submits a rating doc; throws on failure so callers can toast
 *   hasRatedPickup  — checks if fromUserId has already rated a pickupId
 *   loading         — true while submitRating is in flight
 *   error           — last error message, or null
 */
const useRatings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const submitRating = useCallback(async (ratingData) => {
    setLoading(true);
    setError(null);
    try {
      await submitRatingService(ratingData);
    } catch (err) {
      setError(err.message);
      throw err; // re-throw so the calling component can show a toast
    } finally {
      setLoading(false);
    }
  }, []);

  // hasRatedPickup is a read — no loading state needed.
  // It's called on mount per row to check existing ratings,
  // so keeping it lightweight matters.
  const hasRatedPickup = useCallback(async (fromUserId, pickupId) => {
    try {
      return await hasRatedPickupService(fromUserId, pickupId);
    } catch (err) {
      console.error('hasRatedPickup hook error:', err);
      return null;
    }
  }, []);

  return { submitRating, hasRatedPickup, loading, error };
};

export default useRatings;