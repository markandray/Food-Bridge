import useToast from '../../hooks/useToast';
import { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useListings from '../../hooks/useListings';
import useDebounce from '../../hooks/useDebounce';
import ListingGrid from '../../components/listings/ListingGrid';
import ListingFilters from '../../components/listings/ListingFilters';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { ROLES, DEBOUNCE_DELAY } from '../../utils/constants';
import Sidebar from '../../components/layout/Sidebar';

const BrowseListings = () => {
  const { showSuccess, showError } = useToast();
  const { userProfile } = useAuth();

  // Feature J: determine if this NGO has multiple cities
  // userProfile.cities is the array written by auth.service.js
  // Fall back to [userProfile.city] for existing accounts without cities field
  const userCities = userProfile?.cities?.length
    ? userProfile.cities
    : userProfile?.city ? [userProfile.city] : [];

  const isMultiCity = userCities.length > 1;

  const [rawSearch, setRawSearch]         = useState('');
  // Feature J: activeCities tracks which of the NGO's cities are currently shown.
  // Default: all cities active (show everything across all their cities).
  const [activeCities, setActiveCities]   = useState(userCities);
  // Single-city filter for the existing ListingFilters dropdown (non-NGO or single-city)
  const [filters, setFilters]             = useState({
    city: isMultiCity ? '' : (userProfile?.city || ''),
    unit: '',
  });

  const debouncedSearch                   = useDebounce(rawSearch, DEBOUNCE_DELAY);
  const [actionLoading, setActionLoading] = useState(null);
  const [claimModal, setClaimModal]       = useState({ open: false, listing: null });

  // Build the filters object passed to useListings.
  // When multi-city: pass cities array, omit city string.
  // When single-city: pass city string as before.
  const listingFilters = useMemo(() => {
    if (isMultiCity) {
      return {
        cities:     activeCities,   // handled by 'in' query in service
        unit:       filters.unit,
        searchTerm: debouncedSearch,
      };
    }
    return {
      city:       filters.city,
      unit:       filters.unit,
      searchTerm: debouncedSearch,
    };
  }, [isMultiCity, activeCities, filters.city, filters.unit, debouncedSearch]);

  const { listings, loading, error, claimListing } = useListings(listingFilters, 'browse');

  const handleFilterChange = useCallback((name, value) => {
    if (name === 'searchTerm') setRawSearch(value);
    else setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Feature J: toggle a city in/out of the active set
  // "All" button resets to all user cities
  const handleCityToggle = useCallback((city) => {
    setActiveCities((prev) => {
      if (prev.includes(city)) {
        // Don't allow deselecting the last city — always show at least one
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== city);
      }
      return [...prev, city];
    });
  }, []);

  const handleSelectAllCities = useCallback(() => {
    setActiveCities(userCities);
  }, [userCities]);

  const resultLabel = useMemo(() => {
    if (loading) return '';
    if (listings.length === 0) return 'No listings found';
    return `${listings.length} listing${listings.length === 1 ? '' : 's'} found`;
  }, [listings.length, loading]);

  const handleClaimClick = useCallback((listing) => {
    setClaimModal({ open: true, listing });
  }, []);

  const confirmClaim = async () => {
    const { listing } = claimModal;
    setClaimModal({ open: false, listing: null });
    setActionLoading(listing.id);
    try {
      await claimListing(listing, userProfile);
      showSuccess(`You've claimed ${listing.foodName}! Head to My Pickups to track it.`);
    } catch (err) {
      showError(err.message || 'Failed to claim listing. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-200  flex items-center justify-center">
              <Search className="h-6 w-6 text-emerald-500 " />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 ">Browse Listings</h1>
              <p className="text-slate-600  text-base mt-2">Find surplus food from restaurants near you</p>
            </div>
          </div>

          {/* Feature J: city toggle bar — only shown for multi-city NGOs.
              Each button toggles that city in/out of activeCities.
              "All" resets to showing every city the NGO operates in.
              Single-city NGOs see the normal ListingFilters city dropdown. */}
          {isMultiCity && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                  Cities:
                </span>
                {/* "All" shortcut */}
                <button
                  onClick={handleSelectAllCities}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    activeCities.length === userCities.length
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  All
                </button>
                {userCities.map((city) => {
                  const isActive = activeCities.includes(city);
                  return (
                    <button
                      key={city}
                      onClick={() => handleCityToggle(city)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard filters — city dropdown hidden for multi-city NGOs
              since city toggling is handled by the pill bar above */}
          <div className="mb-6">
            <ListingFilters
              filters={{ ...filters, searchTerm: rawSearch }}
              onChange={handleFilterChange}
              showSearch
              showCity={!isMultiCity}
              showUnit
            />
          </div>

          {!loading && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{resultLabel}</p>
          )}

          <ListingGrid
            listings={listings} loading={loading} error={error}
            role={ROLES.NGO} onClaim={handleClaimClick} actionLoading={actionLoading}
            emptyTitle="No available listings"
            emptyDescription={
              isMultiCity
                ? `No food available in ${activeCities.join(', ')} right now. Check back soon!`
                : filters.city
                  ? `No food available in ${filters.city} right now. Check back soon!`
                  : 'No food listings available. Try changing your filters.'
            }
          />

          {/* Claim confirmation modal */}
          <Modal
            isOpen={claimModal.open}
            onClose={() => setClaimModal({ open: false, listing: null })}
            title="Confirm Claim"
            footer={
              <>
                <Button variant="secondary" onClick={() => setClaimModal({ open: false, listing: null })}>Cancel</Button>
                <Button variant="primary" onClick={confirmClaim}>Yes, claim this pickup</Button>
              </>
            }
          >
            {claimModal.listing && (
              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300">You are about to claim:</p>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{claimModal.listing.foodName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {claimModal.listing.quantity} {claimModal.listing.unit} from{' '}
                    <span className="font-medium">{claimModal.listing.restaurantName}</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">📍 {claimModal.listing.city}</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Once claimed, you commit to collecting this food during the pickup window. You can cancel if needed.
                </p>
              </div>
            )}
          </Modal>
        </div>
      </main>
    </div>
  );
};

export default BrowseListings;