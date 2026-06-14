import { useState, useEffect, useCallback } from 'react';
import { Package, Clock, MapPin, CheckCircle, X, Navigation, MessageCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import usePickups from '../../hooks/usePickups';
import useToast from '../../hooks/useToast';
import Sidebar from '../../components/layout/Sidebar';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import ChatWindow from '../../components/chat/ChatWindow';
import { ROLES } from '../../utils/constants';
import { formatDateTime, formatPickupWindow, toDate } from '../../utils/dateHelpers';

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calculate = () => {
      const end   = toDate(endTime);
      if (!end) { setTimeLeft('Unknown'); return; }
      const diffMs = end - new Date();
      if (diffMs <= 0) { setTimeLeft('Window closed'); return; }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins  = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diffMs % (1000 * 60)) / 1000);
      if (hours > 0)     setTimeLeft(`${hours}h ${mins}m remaining`);
      else if (mins > 0) setTimeLeft(`${mins}m ${secs}s remaining`);
      else               setTimeLeft(`${secs}s remaining`);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const isUrgent = timeLeft.includes('m ') && !timeLeft.includes('h');
  const isClosed = timeLeft === 'Window closed';

  return (
    <span className={`text-xs font-semibold ${
      isClosed   ? 'text-red-600 dark:text-red-400'
      : isUrgent ? 'text-orange-600 dark:text-orange-400'
      : 'text-emerald-600 dark:text-emerald-400'
    }`}>
      ⏱ {timeLeft}
    </span>
  );
};

const PickupCard = ({ pickup, onComplete, onCancel, onChat, actionLoading }) => {
  const isLoading = actionLoading === pickup.id;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">{pickup.foodName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            from <span className="font-medium text-slate-700 dark:text-slate-300">{pickup.restaurantName}</span>
          </p>
        </div>
        <Badge color="amber" dot>claimed</Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Package className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span className="font-medium text-emerald-700 dark:text-emerald-400">{pickup.quantity} {pickup.unit}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span>{pickup.city}</span>
        </div>

        {pickup.pickupAddress && (
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              {pickup.pickupAddress}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span>Claimed {formatDateTime(pickup.claimedAt)}</span>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Pickup window</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatPickupWindow(pickup.pickupWindowStart, pickup.pickupWindowEnd)}
          </p>
        </div>
        <CountdownTimer endTime={pickup.pickupWindowEnd} />
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <Button variant="primary" size="sm" fullWidth loading={isLoading} onClick={() => onComplete(pickup)} icon={CheckCircle}>
          Mark as Collected
        </Button>
        <Button variant="ghost" size="sm" fullWidth onClick={() => onChat(pickup)} icon={MessageCircle}>
          Coordinate Pickup
        </Button>
        <Button variant="danger" size="sm" fullWidth loading={isLoading} onClick={() => onCancel(pickup)} icon={X}>
          Cancel Claim
        </Button>
      </div>
    </div>
  );
};

const ClaimedPickups = () => {
  const { userProfile } = useAuth();
  const { activePickups, loading, error, cancelPickup, completePickupByNgo } = usePickups(userProfile?.uid, ROLES.NGO);
  const { showSuccess, showError } = useToast();

  const [cancelModal, setCancelModal]     = useState({ open: false, pickup: null });
  const [completeModal, setCompleteModal] = useState({ open: false, pickup: null });
  const [chatModal, setChatModal]         = useState({ open: false, pickup: null });
  const [actionLoading, setActionLoading] = useState(null);

  const handleCompleteClick = useCallback((pickup) => { setCompleteModal({ open: true, pickup }); }, []);
  const handleCancelClick   = useCallback((pickup) => { setCancelModal({ open: true, pickup }); }, []);
  const handleChatClick     = useCallback((pickup) => { setChatModal({ open: true, pickup }); }, []);

  const confirmComplete = async () => {
    const { pickup } = completeModal;
    setCompleteModal({ open: false, pickup: null });
    setActionLoading(pickup.id);
    try {
      await completePickupByNgo(pickup);
      showSuccess(`"${pickup.foodName}" marked as collected! Great work 🎉`);
    } catch (err) {
      showError(err.message || 'Failed to complete pickup. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmCancel = async () => {
    const { pickup } = cancelModal;
    setCancelModal({ open: false, pickup: null });
    setActionLoading(pickup.id);
    try {
      await cancelPickup(pickup.id, pickup.listingId);
      showSuccess(`Cancelled pickup of "${pickup.foodName}". The listing is now available again.`);
    } catch (err) {
      showError(err.message || 'Failed to cancel pickup. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-200 dark:bg-amber-900/30 flex items-center justify-center">
            <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Claimed Pickups</h1>
            <p className="text-slate-600 text-base mt-2">Food you've claimed and need to collect</p>
          </div>
        </div>

        {activePickups.length > 0 && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
            <strong>Once you've collected the food</strong>, tap <strong>"Mark as Collected"</strong> to confirm the pickup and update your impact stats.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 dark:text-red-400 font-medium">Failed to load pickups</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{error}</p>
          </div>
        ) : activePickups.length === 0 ? (
          <EmptyState icon={CheckCircle} title="No active pickups" description="You don't have any claimed pickups right now. Browse listings to find food to collect." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePickups.map((pickup) => (
              <PickupCard
                key={pickup.id}
                pickup={pickup}
                onComplete={handleCompleteClick}
                onCancel={handleCancelClick}
                onChat={handleChatClick}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* Confirm collection modal */}
        <Modal isOpen={completeModal.open} onClose={() => setCompleteModal({ open: false, pickup: null })} title="Confirm Collection"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCompleteModal({ open: false, pickup: null })}>Not yet</Button>
              <Button variant="primary" onClick={confirmComplete}>Yes, I've collected it</Button>
            </>
          }
        >
          {completeModal.pickup && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300">Confirm that you have physically collected:</p>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{completeModal.pickup.foodName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {completeModal.pickup.quantity} {completeModal.pickup.unit} from{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">{completeModal.pickup.restaurantName}</span>
                </p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">This will update your impact stats and notify the restaurant.</p>
            </div>
          )}
        </Modal>

        {/* Cancel pickup modal */}
        <Modal isOpen={cancelModal.open} onClose={() => setCancelModal({ open: false, pickup: null })} title="Cancel Pickup"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCancelModal({ open: false, pickup: null })}>Keep it</Button>
              <Button variant="danger" onClick={confirmCancel}>Yes, cancel</Button>
            </>
          }
        >
          {cancelModal.pickup && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300">Are you sure you want to cancel your claim on:</p>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{cancelModal.pickup.foodName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">from {cancelModal.pickup.restaurantName}</p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">The listing will become available for other NGOs to claim.</p>
            </div>
          )}
        </Modal>

        {/* Chat modal */}
        <Modal
          isOpen={chatModal.open}
          onClose={() => setChatModal({ open: false, pickup: null })}
          title="Coordinate Pickup"
          size="lg"
        >
          {chatModal.pickup && (
            <ChatWindow
              pickupId={chatModal.pickup.id}
              sender={{
                senderId:   userProfile.uid,
                senderName: userProfile.name,
                senderRole: ROLES.NGO,
              }}
              pickupLabel={`${chatModal.pickup.foodName} · ${chatModal.pickup.restaurantName}`}
            />
          )}
        </Modal>

      </main>
    </div>
  );
};

export default ClaimedPickups;