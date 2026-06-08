import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useListings from '../../hooks/useListings';
import ListingForm from '../../components/listings/ListingForm';
import { ROUTES } from '../../utils/constants';
import { updateListing } from '../../services/listings.service';
import Sidebar from '../../components/layout/Sidebar';

const PostFood = () => {
  const { userProfile }    = useAuth();
  const { createListing }  = useListings({}, 'browse');
  const navigate           = useNavigate();
  const location           = useLocation();
  const topRef             = useRef(null);

  // Feature I: read the template passed from ManageListings via navigate state.
  // location.state is null when navigating normally (no template).
  const template = location.state?.template ?? null;

  // Build initialValues from the template when one exists.
  // Time fields (expiryTime, pickupWindowStart, pickupWindowEnd) are cleared
  // because yesterday's pickup window is meaningless for a new listing —
  // the restaurant must set fresh times.
  // photoURL is also cleared: the old photo blob URL is tied to the old
  // Firebase Storage path — reusing it would silently point to the wrong file.
  // pickupAddress, city, foodName, quantity, unit, description all carry over
  // because those are the stable, reusable parts of a recurring donation.
  const initialValues = template
    ? {
        foodName:          template.foodName          || '',
        quantity:          template.quantity          || '',
        unit:              template.unit              || '',
        description:       template.description       || '',
        city:              template.city              || '',
        pickupAddress:     template.pickupAddress     || '',
        // Time fields intentionally blank — restaurant must fill fresh times
        expiryTime:        '',
        pickupWindowStart: '',
        pickupWindowEnd:   '',
        // Photo cleared — old Storage URL is not reusable for a new doc
        photoURL:          null,
      }
    : null;

  const [successId, setSuccessId] = useState(null);

  const handleSubmit = useCallback(async (formData, photoFile, uploadPhoto) => {
  const listingId = await createListing(
    { ...formData, photoURL: null },
    userProfile
  );

  if (photoFile && uploadPhoto) {
    try {
      const photoURL = await Promise.race([
        uploadPhoto(photoFile, listingId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timed out')), 30000)
        ),
      ]);

      await updateListing(listingId, { photoURL });
    } catch (photoError) {
      console.error('Photo upload failed:', photoError);
    }
  }

  setSuccessId(listingId);
  topRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [createListing, userProfile]);

  return (
    <div className="flex" ref={topRef}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-200 dark:bg-emerald-800/40 flex items-center justify-center">
                <PlusCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 ">Post Surplus Food</h1>
            </div>
            <p className="text-slate-600 text-base mt-2">
              Let NGOs in your city know about food available for pickup.
            </p>
          </div>

          {/* Feature I: template banner — only shown when reposting.
              Tells the restaurant which listing they're basing this on,
              and reminds them to update the time fields (which were cleared). */}
          {template && !successId && (
            <div className="mb-6 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 transition-all duration-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                    Reposting "{template.foodName}"
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-slate-300 mt-1">
                    Food details and address have been pre-filled. Set new expiry and pickup times before posting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success state */}
          {successId && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Listing posted successfully!</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    NGOs in your city can now see and claim this food.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setSuccessId(null)}
                      className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                    >
                      Post another listing
                    </button>
                    <button
                      onClick={() => navigate(ROUTES.RESTAURANT_MANAGE_LISTINGS)}
                      className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                    >
                      View my listings <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {!successId && (
            <ListingForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              defaultCity={userProfile?.city || ''}
              submitLabel={template ? 'Post Again' : 'Post Listing'}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default PostFood;