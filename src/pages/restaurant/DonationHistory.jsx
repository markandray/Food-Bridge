import { useState, useMemo, useEffect, useCallback } from 'react';
import { History, CheckCircle, Package, Archive, Users, Download } from 'lucide-react';
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

const DonationHistory = () => {
  const { userProfile }                                          = useAuth();
  const { completedPickups, loading, error }                     = usePickups(userProfile?.uid, ROLES.RESTAURANT);
  const { submitRating, hasRatedPickup, loading: ratingLoading } = useRatings();
  const { showSuccess, showError }                               = useToast();

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

  const summaryStats = useMemo(() => {
    const totalKg      = completedPickups.reduce((sum, p) => p.unit?.toLowerCase() === 'kg'      ? sum + Number(p.quantity || 0) : sum, 0);
    const totalPackets = completedPickups.reduce((sum, p) => p.unit?.toLowerCase() === 'packets' ? sum + Number(p.quantity || 0) : sum, 0);
    const totalBoxes   = completedPickups.reduce((sum, p) => p.unit?.toLowerCase() === 'boxes'   ? sum + Number(p.quantity || 0) : sum, 0);
    const uniqueNgos   = new Set(completedPickups.map((p) => p.ngoId)).size;
    return { totalCompleted: completedPickups.length, totalKg: totalKg.toFixed(1), totalPackets, totalBoxes, uniqueNgos };
  }, [completedPickups]);

  const handleExport = () => {
    const rows = completedPickups.map((p) => ({
      foodName: p.foodName, quantity: p.quantity, unit: p.unit,
      ngoName: p.ngoName, city: p.city,
      completedAt: formatDateTime(p.completedAt || p.claimedAt),
    }));
    exportToCSV(rows, 'donation-history.csv', [
      { key: 'foodName', label: 'Food' }, { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },     { key: 'ngoName', label: 'NGO' },
      { key: 'city', label: 'City' },     { key: 'completedAt', label: 'Completed On' },
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
        fromRole: ROLES.RESTAURANT, toUserId: pickup.ngoId,
        toRole: ROLES.NGO, stars, comment: comment.trim(),
      });
      setRatingMap((prev) => ({ ...prev, [pickup.id]: { stars, comment: comment.trim() } }));
      showSuccess(`Rated ${pickup.ngoName} — thank you for your feedback!`);
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
          <div className="w-12 h-12 rounded-xl bg-teal-200 dark:bg-teal-900/30 flex items-center justify-center">
            <History className="h-6 w-6 text-teal-700 dark:text-teal-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Donation History</h1>
            <p className="text-slate-600 text-base mt-2">Your complete record of completed food donations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard title="Completed"   value={summaryStats.totalCompleted}       icon={CheckCircle} color="blue"    loading={loading} />
          <StatsCard title="Total kg"    value={`${summaryStats.totalKg} kg`}      icon={Package}     color="emerald" loading={loading} />
          <StatsCard title="Packets"     value={summaryStats.totalPackets}          icon={Package}     color="orange"  loading={loading} />
          <StatsCard title="Boxes"       value={summaryStats.totalBoxes}            icon={Archive}     color="purple"  loading={loading} />
          <StatsCard title="NGOs Served" value={summaryStats.uniqueNgos}            icon={Users}       color="teal" loading={loading} subtitle="Unique partners" />
        </div>

        {/* Table card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">All Completed Donations</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">{completedPickups.length} total</span>
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExport} disabled={loading || completedPickups.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="font-medium text-red-600 dark:text-red-400">Failed to load history</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
            </div>
          ) : completedPickups.length === 0 ? (
            <EmptyState icon={History} title="No completed donations yet" description="Once an NGO collects food and you mark it complete, it'll appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Food', 'Quantity', 'NGO', 'City', 'Completed On', 'Status', 'Rating'].map((col) => (
                      <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {completedPickups.map((pickup) => {
                    const existing = ratingMap[pickup.id];
                    return (
                      <tr key={pickup.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{pickup.foodName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{pickup.quantity} {pickup.unit}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{pickup.ngoName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{pickup.city}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{formatDateTime(pickup.completedAt || pickup.claimedAt)}</td>
                        <td className="px-6 py-4"><Badge color="blue" dot>{pickup.status}</Badge></td>
                        <td className="px-6 py-4">
                          {pickup.id in ratingMap ? (
                            existing ? (
                              <div className="flex items-center gap-1.5">
                                <StarRating value={existing.stars} interactive={false} size={14} />
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleRateClick(pickup)}>Rate NGO</Button>
                            )
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
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
            title="Rate this NGO"
            footer={
              <>
                <Button variant="secondary" onClick={() => setRatingModal({ open: false, pickup: null })}>Cancel</Button>
                <Button variant="primary" onClick={handleRatingSubmit} loading={ratingLoading} disabled={stars === 0}>Submit Rating</Button>
              </>
            }
          >
            <div className="space-y-4">
              {/* Summary pill */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ratingModal.pickup.ngoName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Collected {ratingModal.pickup.foodName} · {formatDateTime(ratingModal.pickup.completedAt)}
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
                  placeholder="How was the pickup experience?"
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

export default DonationHistory;