import { useReducer, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeToListings,
  subscribeToRestaurantListings,
  createListing as createListingService,
  updateListing as updateListingService,
  deleteListing as deleteListingService,
  claimListing as claimListingService,
  completeListing as completeListingService,
  expireListing as expireListingService,
} from '../services/listings.service';
import { createPickup, getPickupByListingId } from '../services/pickups.service';
import { incrementListingCount, recordCompletedDonation } from '../services/impact.service';
import { LISTING_STATUS } from '../utils/constants';
import { isExpired } from '../utils/dateHelpers';

const initialState = { listings: [], loading: true, error: null };

const ACTIONS = {
  SET_LOADING:  'SET_LOADING',
  SET_LISTINGS: 'SET_LISTINGS',
  SET_ERROR:    'SET_ERROR',
  RESET:        'RESET',
};

const listingsReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:  return { ...state, loading: action.payload, error: null };
    case ACTIONS.SET_LISTINGS: return { ...state, listings: action.payload, loading: false, error: null };
    case ACTIONS.SET_ERROR:    return { ...state, error: action.payload, loading: false };
    case ACTIONS.RESET:        return initialState;
    default: throw new Error(`Unknown action type: ${action.type}`);
  }
};

const autoExpireListings = (listings) => {
  listings
    .filter((l) => l.status === LISTING_STATUS.AVAILABLE && isExpired(l.expiryTime))
    .forEach((l) => {
      expireListingService(l.id).catch((err) =>
        console.warn('Auto-expiry failed for listing', l.id, err)
      );
    });
};

const useListings = (filters = {}, mode = 'browse') => {
  const [state, dispatch] = useReducer(listingsReducer, initialState);

  useEffect(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    let unsubscribe;

    if (mode === 'manage' && filters.restaurantId) {
      unsubscribe = subscribeToRestaurantListings(
        filters.restaurantId,
        (listings) => {
          dispatch({ type: ACTIONS.SET_LISTINGS, payload: listings });
          autoExpireListings(listings);
        },
        (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      );
    } else {
      // Feature J: if the filter includes a cities array (NGO multi-city),
      // pass it through to subscribeToListings which will use 'in' query.
      // Single city (filters.city) and no city both work as before.
      unsubscribe = subscribeToListings(
        filters,
        (listings) => {
          dispatch({ type: ACTIONS.SET_LISTINGS, payload: listings });
          autoExpireListings(listings);
        },
        (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      );
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [JSON.stringify(filters), mode]);

  const filteredListings = useMemo(() => {
    let result = [...state.listings];

    if (mode === 'browse') {
      result = result.filter(
        (l) => l.status === LISTING_STATUS.AVAILABLE && !isExpired(l.expiryTime)
      );
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.foodName?.toLowerCase().includes(term) ||
          l.restaurantName?.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term)
      );
    }

    // Feature J: when cities array is active, city filter is handled server-side
    // by subscribeToListings — skip client-side city filtering in that case.
    // Single-city filter (filters.city) still applies client-side as before.
    if (filters.city && !filters.restaurantId && !filters.cities) {
      result = result.filter((l) => l.city === filters.city);
    }

    if (filters.unit) {
      result = result.filter((l) => l.unit === filters.unit);
    }

    return result;
  }, [state.listings, filters.searchTerm, filters.city, filters.cities, filters.unit, mode]);

  const createListing = useCallback(async (listingData, restaurantUser) => {
    try {
      const listingId = await createListingService({
        ...listingData,
        restaurantId:   restaurantUser.uid,
        restaurantName: restaurantUser.name,
      });
      await incrementListingCount(restaurantUser.uid);
      return listingId;
    } catch (error) { throw error; }
  }, []);

  const updateListing = useCallback(async (listingId, updates) => {
    try { await updateListingService(listingId, updates); }
    catch (error) { throw error; }
  }, []);

  const deleteListing = useCallback(async (listingId) => {
    try { await deleteListingService(listingId); }
    catch (error) { throw error; }
  }, []);

  const claimListing = useCallback(async (listing, ngoUser) => {
    try {
      await claimListingService(listing.id, ngoUser);
      await createPickup(listing, ngoUser);
    } catch (error) { throw error; }
  }, []);

  const completeListing = useCallback(async (listingId) => {
    try {
      const pickup = await getPickupByListingId(listingId);
      await completeListingService(listingId);
      if (pickup) {
        await recordCompletedDonation({
          restaurantId: pickup.restaurantId,
          ngoId:        pickup.ngoId,
          quantity:     pickup.quantity,
          unit:         pickup.unit,
        });
      }
    } catch (error) { throw error; }
  }, []);

  return {
    listings: filteredListings,
    allListings: state.listings,
    loading:  state.loading,
    error:    state.error,
    createListing,
    updateListing,
    deleteListing,
    claimListing,
    completeListing,
  };
};

export default useListings;