import { memo } from 'react';
import {
  MapPin, Clock, Package, Calendar,
  CheckCircle, Trash2, Tag, User, Pencil, Navigation, RotateCcw, MessageCircle
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { LISTING_STATUS, STATUS_COLORS, ROLES } from '../../utils/constants';
import { formatDateTime, formatPickupWindow, getExpiryLabel } from '../../utils/dateHelpers';

const ListingCard = memo(({
  listing, role, onClaim, onComplete, onDelete, onEdit, onRepost, onChat, loading,
}) => {
  const isThisLoading = loading === listing.id;
  const statusColor   = STATUS_COLORS[listing.status] || 'slate';
  const isAvailable   = listing.status === LISTING_STATUS.AVAILABLE;
  const isClaimed     = listing.status === LISTING_STATUS.CLAIMED;
  const isCompleted   = listing.status === LISTING_STATUS.COMPLETED;
  const isExpired     = listing.status === LISTING_STATUS.EXPIRED;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">

      {/* Photo or placeholder */}
      <div className="h-40 bg-gradient-to-br from-emerald-50 to-orange-50 dark:from-emerald-900/20 dark:to-orange-900/20 relative flex-shrink-0">
        {listing.photoURL ? (
          <img src={listing.photoURL} alt={listing.foodName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">🍱</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge color={statusColor} dot>{listing.status}</Badge>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">

        <div className="mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight mb-1">
            {listing.foodName}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Package className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {listing.quantity} {listing.unit}
            </span>
          </div>
          {/* Feature L: tags — only rendered when present.
              Old listings without a tags field show nothing here. */}
          {Array.isArray(listing.tags) && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4 flex-1">
          {role === ROLES.NGO && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{listing.restaurantName}</span>
            </div>
          )}

          {role === ROLES.RESTAURANT && isClaimed && listing.claimedByName && (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate text-xs font-medium">Claimed by {listing.claimedByName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
            <span>{listing.city}</span>
          </div>

          {role === ROLES.NGO && listing.pickupAddress && (
            <div className="flex items-start gap-2 text-sm">
              <Navigation className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
              <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                {listing.pickupAddress}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
            <span className={`text-xs font-medium ${
              isAvailable
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {getExpiryLabel(listing.expiryTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="text-xs">
              Pickup: {formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}
            </span>
          </div>

          {listing.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
              {listing.description}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Posted {formatDateTime(listing.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">

          {role === ROLES.NGO && isAvailable && onClaim && (
            <Button variant="primary" size="sm" fullWidth loading={isThisLoading} onClick={() => onClaim(listing)} icon={Tag}>
              Claim Pickup
            </Button>
          )}

          {role === ROLES.NGO && isClaimed && (
            <div className="flex items-center gap-2 w-full justify-center py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
              <CheckCircle className="h-4 w-4" />
              Claimed by you
            </div>
          )}

          {role === ROLES.RESTAURANT && isClaimed && onComplete && (
            <div className="flex flex-col gap-2 w-full">
              <Button variant="primary" size="sm" fullWidth loading={isThisLoading} onClick={() => onComplete(listing.id)} icon={CheckCircle}>
                Mark Complete
              </Button>
              {onChat && (
                <Button variant="ghost" size="sm" fullWidth onClick={() => onChat(listing)} icon={MessageCircle}>
                  Coordinate Pickup
                </Button>
              )}
            </div>
          )}

          {role === ROLES.RESTAURANT && isAvailable && (
            <div className="flex gap-2 w-full">
              {onEdit && (
                <button onClick={() => onEdit(listing)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors flex-shrink-0"
                  title="Edit listing" aria-label="Edit listing">
                  <Pencil size={16} />
                </button>
              )}
              {onDelete && (
                <Button variant="danger" size="sm" fullWidth loading={isThisLoading} onClick={() => onDelete(listing.id)} icon={Trash2}>
                  Delete
                </Button>
              )}
            </div>
          )}

          {role === ROLES.RESTAURANT && isClaimed && onEdit && (
            <button disabled
              className="p-2 text-slate-300 dark:text-slate-600 cursor-not-allowed rounded-lg flex-shrink-0"
              title="Cannot edit — this listing has already been claimed by an NGO"
              aria-label="Edit not available">
              <Pencil size={16} />
            </button>
          )}

          {/* Feature I: Post Again — completed and expired listings only.
              Ghost variant keeps it visually secondary to other actions.
              Only renders when ManageListings passes onRepost — other consumers
              (BrowseListings) don't pass it so the button stays hidden there. */}
          {role === ROLES.RESTAURANT && (isCompleted || isExpired) && onRepost && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => onRepost(listing)}
              icon={RotateCcw}
            >
              Post Again
            </Button>
          )}

          {isCompleted && !onRepost && (
            <div className="flex items-center gap-2 w-full justify-center py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
              <CheckCircle className="h-4 w-4" />
              Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ListingCard.displayName = 'ListingCard';
export default ListingCard;