import { memo } from 'react';
import { RefreshCw, Utensils } from 'lucide-react';
import ListingCard from './ListingCard';
import EmptyState from '../common/EmptyState';
import { ListingGridSkeleton } from '../common/SkeletonCard';

const ListingGrid = memo(({
  listings, loading, error, role,
  onClaim, onComplete, onDelete, onEdit, onRepost, // onRepost added
  actionLoading,
  emptyTitle = 'No listings found',
  emptyDescription = 'Try adjusting your filters.',
  onRetry,
  skeletonCount = 6,
}) => {
  if (loading) return <ListingGridSkeleton count={skeletonCount} />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load listings</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        {onRetry && (
          <button onClick={onRetry}
            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (listings.length === 0) {
    return <EmptyState icon={Utensils} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          role={role}
          onClaim={onClaim}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
          onRepost={onRepost}
          loading={actionLoading}
        />
      ))}
    </div>
  );
});

ListingGrid.displayName = 'ListingGrid';
export default ListingGrid;