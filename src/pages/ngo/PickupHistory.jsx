import { useState, useMemo, useEffect, useCallback } from 'react';
import { History, CheckCircle, X, Package, Archive, Users, Download } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import usePickups from '../../hooks/usePickups';
import useRatings from '../../hooks/useRatings';
import useToast from '../../hooks/useToast';
import Sidebar from '../../components/layout/Sidebar';
import StatsCard from '../../components/dashboard/StatsCard';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StarRating from '../../components/common/StarRating';
import { ROLES, RATING_LIMITS } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateHelpers';
import { exportToCSV } from '../../utils/csvExport';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const PickupHistory = () => {
  const { userProfile }                                            = useAuth();
  const [activeTab, setActiveTab]                                  = useState('completed');
  const { completedPickups, cancelledPickups, loading, error }     = usePickups(userProfile?.uid, ROLES.NGO);
  const { submitRating, hasRatedPickup, loading: ratingLoading }   = useRatings();
  const { showSuccess, showError }                                 = useToast();

  const [ratingMap, setRatingMap]     = useState({});
  const [ratingModal, setRatingModal] = useState({ open: false, pickup: null });
  const [stars, setStars]             = useState(0);
  const [comment, setComment]         = useState('');

  useEffect(() => {
    if (!userProfile?.uid || completedPickups.length === 0) return;
    const checkRatings = async () => {
      const entries = await Promise.all(
        completedPickups.map(async (pickup) => {
          const existing = await hasRatedPickup(userProfile.uid, pickup.id);
          return [pickup.id, existing];
        })
      );
      setRatingMap(Object.fromEntries(entries));
    };
    checkRatings();
  }, [userProfile?.uid, completedPickups, hasRatedPickup]);

  const stats = useMemo(() => {
    const totalKgCollected  = completedPickups.reduce((sum, p) => p.unit?.toLowerCase() === 'kg'      ? sum + Number(p.quantity) : sum, 0);
    const totalPackets      = completedPickups.reduce((sum, p) => p.unit?.toLowerCase() === 'packets' ? sum + Number(p.quantity) : sum, 0);
    const totalBoxes        = completedPickups.reduce((sum, p) => p.unit?.toLowerCase() === 'boxes'   ? sum + Number(p.quantity) : sum, 0);
    const uniqueRestaurants = new Set(completedPickups.map((p) => p.restaurantId)).size;
    return { totalCompleted: completedPickups.length, totalCancelled: cancelledPickups.length, totalKgCollected: totalKgCollected.toFixed(1), totalPackets, totalBoxes, uniqueRestaurants };
  }, [completedPickups, cancelledPickups]);

  const displayedPickups = activeTab === 'completed' ? completedPickups : cancelledPickups;

  const handleExport = () => {
    const isCompleted = activeTab === 'completed';
    const rows = displayedPickups.map((p) => ({
      foodName: p.foodName, quantity: p.quantity, unit: p.unit,
      restaurantName: p.restaurantName, city: p.city,
      date: isCompleted ? formatDateTime(p.completedAt) : formatDateTime(p.cancelledAt || p.claimedAt),
    }));
    exportToCSV(rows, isCompleted ? 'pickup-history-completed.csv' : 'pickup-history-cancelled.csv', [
      { key: 'foodName', label: 'Food' },       { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },            { key: 'restaurantName', label: 'Restaurant' },
      { key: 'city', label: 'City' },            { key: 'date', label: isCompleted ? 'Completed On' : 'Cancelled On' },
    ]);
  };

  const handleRateClick = useCallback((pickup) => {
    setStars(0); setComment('');
    setRatingModal({ open: true, pickup });
  }, []);

  const handleRatingSubmit = async () => {
    const { pickup } = ratingModal;
    if (stars === 0) { showError('Please select a star rating before submitting.'); return; }
    try {
      await submitRating({
        pickupId: pickup.id, fromUserId: userProfile.uid,
        fromRole: ROLES.NGO, toUserId: pickup.restaurantId,
        toRole: ROLES.RESTAURANT, stars, comment: comment.trim(),
      });
      setRatingMap((prev) => ({ ...prev, [pickup.id]: { stars, comment: comment.trim() } }));
      showSuccess(`Rated ${pickup.restaurantName} — thank you for your feedback!`);
      setRatingModal({ open: false, pickup: null });
    } catch {
      showError('Failed to submit rating. Please try again.');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigi-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pickup History</h1>
            <p className="text-slate-600 text-base mt-2">Your complete pickup record</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard title="Completed"    value={stats.totalCompleted}                icon={CheckCircle} color="blue"    loading={loading} />
          <StatsCard title="kg Collected" value={`${stats.totalKgCollected} kg`}      icon={Package}     color="emerald" loading={loading} />
          <StatsCard title="Packets"      value={stats.totalPackets}                   icon={Package}     color="orange"  loading={loading} />
          <StatsCard title="Boxes"        value={stats.totalBoxes}                     icon={Archive}     color="purple"  loading={loading} />
          <StatsCard title="Restaurants"  value={stats.uniqueRestaurants}              icon={Users}       color="emerald" loading={loading} />
        </div>

        {/* Table card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-1">
              {[
                { key: 'completed', label: 'Completed', count: stats.totalCompleted, icon: CheckCircle },
                { key: 'cancelled', label: 'Cancelled', count: stats.totalCancelled, icon: X          },
              ].map(({ key, label, count, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeTab === key
                      ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    activeTab === key
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
            <div className="px-4">
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExport} disabled={loading || displayedPickups.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 dark:text-red-400 font-medium">Failed to load history</p>
            </div>
          ) : displayedPickups.length === 0 ? (
            <EmptyState
              icon={activeTab === 'completed' ? CheckCircle : X}
              title={activeTab === 'completed' ? 'No completed pickups yet' : 'No cancelled pickups'}
              description={activeTab === 'completed' ? 'Completed pickups will appear here once restaurants confirm your collections.' : 'Pickups you cancel will appear here.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    {[
                      'Food', 'Quantity', 'Restaurant', 'City',
                      activeTab === 'completed' ? 'Completed On' : 'Cancelled On',
                      'Status',
                      ...(activeTab === 'completed' ? ['Rating'] : []),
                    ].map((col) => (
                      <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {displayedPickups.map((pickup) => {
                    const existing = ratingMap[pickup.id];
                    return (
                      <tr key={pickup.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{pickup.foodName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{pickup.quantity} {pickup.unit}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{pickup.restaurantName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{pickup.city}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {activeTab === 'completed' ? formatDateTime(pickup.completedAt) : formatDateTime(pickup.cancelledAt || pickup.claimedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge color={activeTab === 'completed' ? 'blue' : 'red'} dot>{pickup.status}</Badge>
                        </td>
                        {activeTab === 'completed' && (
                          <td className="px-6 py-4">
                            {pickup.id in ratingMap ? (
                              existing
                                ? <StarRating value={existing.stars} interactive={false} size={14} />
                                : <Button variant="ghost" size="sm" onClick={() => handleRateClick(pickup)}>Rate Restaurant</Button>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rating modal */}
        {ratingModal.pickup && (
          <Modal
            isOpen={ratingModal.open}
            onClose={() => setRatingModal({ open: false, pickup: null })}
            title="Rate this Restaurant"
            footer={
              <>
                <Button variant="secondary" onClick={() => setRatingModal({ open: false, pickup: null })}>Cancel</Button>
                <Button variant="primary" onClick={handleRatingSubmit} loading={ratingLoading} disabled={stars === 0}>Submit Rating</Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ratingModal.pickup.restaurantName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {ratingModal.pickup.foodName} · {formatDateTime(ratingModal.pickup.completedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your rating</p>
                <StarRating value={stars} onChange={setStars} interactive size={28} />
                {stars === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click a star to rate</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Comment <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={RATING_LIMITS.COMMENT_MAX}
                  rows={3}
                  placeholder="How was the food and packaging?"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{comment.length}/{RATING_LIMITS.COMMENT_MAX}</p>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
};

export default PickupHistory;