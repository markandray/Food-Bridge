import { memo } from 'react';
import { Clock } from 'lucide-react';
import Badge from '../common/Badge';
import { getRelativeTime } from '../../utils/dateHelpers';
import { LISTING_STATUS, PICKUP_STATUS, STATUS_COLORS } from '../../utils/constants';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const ActivitySkeleton = () => (
  <div className="flex items-start gap-3 py-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 mt-0.5" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
    </div>
  </div>
);

const getActivityIcon = (status) => {
  const icons = {
    [LISTING_STATUS.AVAILABLE]: '📢',
    [LISTING_STATUS.CLAIMED]:   '🤝',
    [LISTING_STATUS.COMPLETED]: '✅',
    [LISTING_STATUS.EXPIRED]:   '⏰',
    [PICKUP_STATUS.CANCELLED]:  '❌',
  };
  return icons[status] || '📋';
};

const getActivityText = (item, role) => {
  if (item.type === 'listing') {
    switch (item.status) {
      case LISTING_STATUS.AVAILABLE:  return `Posted "${item.foodName}" — ${item.quantity} ${item.unit}`;
      case LISTING_STATUS.CLAIMED:    return `"${item.foodName}" claimed by ${item.claimedByName || 'an NGO'}`;
      case LISTING_STATUS.COMPLETED:  return `Donation of "${item.foodName}" completed`;
      case LISTING_STATUS.EXPIRED:    return `"${item.foodName}" listing expired`;
      default:                        return `Listing update: "${item.foodName}"`;
    }
  }
  switch (item.status) {
    case PICKUP_STATUS.CLAIMED:    return `Claimed "${item.foodName}" from ${item.restaurantName}`;
    case PICKUP_STATUS.COMPLETED:  return `Pickup of "${item.foodName}" completed`;
    case PICKUP_STATUS.CANCELLED:  return `Cancelled pickup of "${item.foodName}"`;
    default:                       return `Pickup update: "${item.foodName}"`;
  }
};

const ActivityFeed = ({
  items = [], loading = false, role, maxItems = 8, title = 'Recent Activity',
}) => {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>

      {loading && (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {Array.from({ length: 4 }).map((_, i) => <ActivitySkeleton key={i} />)}
        </div>
      )}

      {!loading && displayItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No activity yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            {role === 'restaurant'
              ? 'Post your first food listing to see activity here.'
              : 'Claim your first pickup to see activity here.'}
          </p>
        </div>
      )}

      {!loading && displayItems.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {displayItems.map((item) => {
            const statusColor = STATUS_COLORS[item.status] || 'slate';
            const timestamp   = item.claimedAt || item.createdAt || item.completedAt;
            return (
              <div key={item.id} className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                  {getActivityIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    {getActivityText(item, role)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {getRelativeTime(timestamp)}
                    </span>
                    <Badge color={statusColor} size="xs">{item.status}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;