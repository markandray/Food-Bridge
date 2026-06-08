import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, ClipboardList, Leaf, Utensils,
  CheckCircle, Clock, TrendingUp, Package, Archive
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useListings from '../../hooks/useListings';
import usePickups from '../../hooks/usePickups';
import StatsCard from '../../components/dashboard/StatsCard';
import ImpactCounter from '../../components/dashboard/ImpactCounter';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import Sidebar from '../../components/layout/Sidebar';
import { ROUTES, ROLES, LISTING_STATUS } from '../../utils/constants';

const RestaurantDashboard = () => {
  const { userProfile } = useAuth();

  const { listings, loading: listingsLoading } = useListings(
    { restaurantId: userProfile?.uid }, 'manage'
  );
  const { pickups, loading: pickupsLoading } = usePickups(userProfile?.uid, ROLES.RESTAURANT);

  const derivedStats = useMemo(() => {
    const completed     = listings.filter(l => l.status === LISTING_STATUS.COMPLETED);
    const totalKg       = completed.reduce((sum, item) => item.unit?.toLowerCase() === 'kg'      ? sum + Number(item.quantity || 0) : sum, 0);
    const totalPackets  = completed.reduce((sum, item) => item.unit?.toLowerCase() === 'packets' ? sum + Number(item.quantity || 0) : sum, 0);
    const totalBoxes    = completed.reduce((sum, item) => item.unit?.toLowerCase() === 'boxes'   ? sum + Number(item.quantity || 0) : sum, 0);
    const completionRate = listings.length > 0 ? Math.round((completed.length / listings.length) * 100) : 0;
    return { totalListings: listings.length, completedCount: completed.length, completionRate, totalKg: totalKg.toFixed(1), totalPackets, totalBoxes };
  }, [listings]);

  const activityItems = useMemo(() => {
    return [
      ...listings.slice(0, 10).map((l) => ({ ...l, type: 'listing' })),
      ...pickups.slice(0, 10).map((p) => ({ ...p, type: 'pickup' })),
    ]
      .sort((a, b) => {
        const aTime = a.completedAt?.toDate?.() || a.createdAt?.toDate?.() || 0;
        const bTime = b.completedAt?.toDate?.() || b.createdAt?.toDate?.() || 0;
        return bTime - aTime;
      })
      .slice(0, 8);
  }, [listings, pickups]);

  const activeClaims   = listings.filter(l => l.status === LISTING_STATUS.CLAIMED).length;
  const availableCount = listings.filter(l => l.status === LISTING_STATUS.AVAILABLE).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-600">
            {getGreeting()}, {userProfile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-600 text-base mt-2">
            Here's what's happening with your food donations today.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            to={ROUTES.RESTAURANT_POST_FOOD}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Post Surplus Food
          </Link>
          <Link
            to={ROUTES.RESTAURANT_MANAGE_LISTINGS}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Manage Listings
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Listings"      value={derivedStats.totalListings}  icon={Utensils}   color="emerald" loading={listingsLoading} subtitle="All time" />
          <StatsCard title="Completed Donations" value={derivedStats.completedCount} icon={CheckCircle}color="blue"    loading={listingsLoading} subtitle="Pickups confirmed" />
          <StatsCard title="Active Claims"       value={activeClaims}                icon={Clock}      color="amber"   loading={listingsLoading} subtitle="Awaiting pickup" />
          <StatsCard title="Completion Rate"     value={`${derivedStats.completionRate}%`} icon={TrendingUp} color="purple" loading={listingsLoading} subtitle="Of all listings" />
        </div>

        {/* Impact */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Impact 🌱</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ImpactCounter value={derivedStats.totalKg}      label="Kilograms Donated"  suffix=" kg" color="emerald" icon={Leaf}         loading={listingsLoading} />
            <ImpactCounter value={derivedStats.totalPackets} label="Packets Donated"               color="orange"  icon={Package}      loading={listingsLoading} />
            <ImpactCounter value={derivedStats.totalBoxes}   label="Boxes Donated"                 color="purple"  icon={Archive}      loading={listingsLoading} />
            <ImpactCounter value={derivedStats.completedCount} label="Successful Pickups"          color="teal"    icon={CheckCircle}  loading={listingsLoading} />
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeClaims > 0 && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-1" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      {activeClaims} listing(s) awaiting pickup
                    </p>
                    <Link to={ROUTES.RESTAURANT_MANAGE_LISTINGS} className="text-sm font-semibold text-amber-800 dark:text-amber-300 underline">
                      View claimed listings →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <ActivityFeed items={activityItems} loading={listingsLoading || pickupsLoading} role={ROLES.RESTAURANT} />
          </div>

          {/* Live status panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-fit">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Live Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Available', count: availableCount,               color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                { label: 'Claimed',   count: activeClaims,                 color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'         },
                { label: 'Completed', count: derivedStats.completedCount,  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'             },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${color}`}>{count}</span>
                </div>
              ))}
            </div>
            <Link
              to={ROUTES.RESTAURANT_MANAGE_LISTINGS}
              className="mt-5 block w-full text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 py-2 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              View all listings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantDashboard;