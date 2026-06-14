import { useState, useCallback, useMemo } from 'react';
import { ClipboardList, RotateCcw , MessageCircle  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useListings from '../../hooks/useListings';
import useToast from '../../hooks/useToast';
import ListingGrid from '../../components/listings/ListingGrid';
import ListingFilters from '../../components/listings/ListingFilters';
import ListingForm from '../../components/listings/ListingForm';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Sidebar from '../../components/layout/Sidebar';
import { LISTING_STATUS, ROLES, ROUTES, PICKUP_STATUS } from '../../utils/constants';
import usePickups from '../../hooks/usePickups';
import ChatWindow from '../../components/chat/ChatWindow';

const STATUS_OPTIONS = [
  { value: LISTING_STATUS.AVAILABLE, label: 'Available' },
  { value: LISTING_STATUS.CLAIMED,   label: 'Claimed'   },
  { value: LISTING_STATUS.COMPLETED, label: 'Completed' },
  { value: LISTING_STATUS.EXPIRED,   label: 'Expired'   },
];

const ManageListings = () => {
  const { userProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [filters, setFilters]             = useState({ searchTerm: '', status: '' });
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteModal, setDeleteModal]     = useState({ open: false, listingId: null });
  const [completeModal, setCompleteModal] = useState({ open: false, listingId: null });
  const [editModal, setEditModal]         = useState({ open: false, listing: null });

  const { listings, loading, error, deleteListing, completeListing, updateListing } =
    useListings({ restaurantId: userProfile?.uid }, 'manage');

  // Chat needs the pickup document (which holds pickupId) for claimed listings.
  // We already subscribe to restaurant pickups here so no extra Firestore
  // reads are needed — activePickups is a derived slice from the same listener.
  const { activePickups } = usePickups(userProfile?.uid, ROLES.RESTAURANT);

  const [chatModal, setChatModal] = useState({ open: false, pickupId: null, label: '' });

  const handleChat = useCallback((listing) => {
    // Find the pickup document that corresponds to this claimed listing.
    // activePickups is already in memory — no Firestore read needed.
    const pickup = activePickups.find((p) => p.listingId === listing.id);
    if (!pickup) return;
    setChatModal({
      open:        true,
      pickupId:    pickup.id,
      recipientId: pickup.ngoId,
      listingId:   pickup.listingId,
      label:       `${listing.foodName} · ${pickup.ngoName}`,
    });
  }, [activePickups]);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (filters.status && l.status !== filters.status) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          l.foodName?.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [listings, filters.status, filters.searchTerm]);

  const stats = useMemo(() => ({
    total:     listings.length,
    available: listings.filter((l) => l.status === LISTING_STATUS.AVAILABLE).length,
    claimed:   listings.filter((l) => l.status === LISTING_STATUS.CLAIMED).length,
    completed: listings.filter((l) => l.status === LISTING_STATUS.COMPLETED).length,
  }), [listings]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDelete   = useCallback((listingId) => { setDeleteModal({ open: true, listingId }); }, []);
  const handleComplete = useCallback((listingId) => { setCompleteModal({ open: true, listingId }); }, []);
  const handleEdit     = useCallback((listing)   => { setEditModal({ open: true, listing }); }, []);

  // Feature I: navigate to PostFood with the listing as a template.
  // useCallback + empty deps: navigate is stable, nothing else needed.
  // Only available on completed/expired listings — available/claimed listings
  // have their own edit/complete actions so "Post Again" would be confusing there.
  const handleRepost = useCallback((listing) => {
    navigate(ROUTES.RESTAURANT_POST_FOOD, { state: { template: listing } });
  }, [navigate]);

  const confirmDelete = async () => {
    const { listingId } = deleteModal;
    setDeleteModal({ open: false, listingId: null });
    setActionLoading(listingId);
    try {
      await deleteListing(listingId);
      showSuccess('Listing deleted successfully.');
    } catch (err) {
      showError(err.message || 'Failed to delete listing.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmComplete = async () => {
    const { listingId } = completeModal;
    setCompleteModal({ open: false, listingId: null });
    setActionLoading(listingId);
    try {
      await completeListing(listingId);
      showSuccess('Pickup marked as complete! Your impact stats have been updated.');
    } catch (err) {
      showError(err.message || 'Failed to mark as complete.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmEdit = async (formData) => {
    const listingId = editModal.listing.listingId ?? editModal.listing.id;
    setEditModal({ open: false, listing: null });
    setActionLoading(listingId);
    try {
      await updateListing(listingId, formData);
      showSuccess('Listing updated successfully.');
    } catch (err) {
      showError(err.message || 'Failed to update listing.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-200 dark:bg-blue-900/30 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 ">Manage Listings</h1>
            <p className="text-slate-600 text-base mt-2">Track and manage all your food donations</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',     value: stats.total,     color: 'text-slate-700 dark:text-white'          },
            { label: 'Available', value: stats.available, color: 'text-emerald-600 dark:text-emerald-400'  },
            { label: 'Claimed',   value: stats.claimed,   color: 'text-amber-600 dark:text-amber-400'      },
            { label: 'Completed', value: stats.completed, color: 'text-blue-600 dark:text-blue-400'        },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <ListingFilters
            filters={filters}
            onChange={handleFilterChange}
            showCity={false}
            showUnit={false}
            showStatus
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <ListingGrid
          listings={filteredListings}
          loading={loading}
          error={error}
          role={ROLES.RESTAURANT}
          onComplete={handleComplete}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onRepost={handleRepost}
          onChat={handleChat}
          actionLoading={actionLoading}
          emptyTitle="No listings yet"
          emptyDescription="Post your first food donation to get started."
        />

        {/* Delete modal */}
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, listingId: null })}
          title="Delete Listing"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteModal({ open: false, listingId: null })}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Yes, delete</Button>
            </>
          }
        >
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this listing? This action cannot be undone.
          </p>
        </Modal>

        {/* Complete modal */}
        <Modal
          isOpen={completeModal.open}
          onClose={() => setCompleteModal({ open: false, listingId: null })}
          title="Mark as Completed"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCompleteModal({ open: false, listingId: null })}>Cancel</Button>
              <Button variant="primary" onClick={confirmComplete}>Confirm pickup completed</Button>
            </>
          }
        >
          <p className="text-slate-600 dark:text-slate-300">
            Confirm that the NGO has collected this food. This will update both parties' impact stats.
          </p>
        </Modal>

        {/* Edit modal */}
        {editModal.listing && (
          <Modal
            isOpen={editModal.open}
            onClose={() => setEditModal({ open: false, listing: null })}
            title="Edit Listing"
          >
            <ListingForm
              initialValues={editModal.listing}
              onSubmit={confirmEdit}
              onCancel={() => setEditModal({ open: false, listing: null })}
              submitLabel="Save Changes"
            />
          </Modal>
        )}

        {/* Chat modal — only available for claimed listings */}
        <Modal
          isOpen={chatModal.open}
          onClose={() => setChatModal({ open: false, pickupId: null, recipientId: null, listingId: null, label: '' })}
          title="Coordinate Pickup"
          size="lg"
        >
          {chatModal.pickupId && (
            <ChatWindow
              pickupId={chatModal.pickupId}
              sender={{
                senderId:    userProfile.uid,
                senderName:  userProfile.name,
                senderRole:  ROLES.RESTAURANT,
                // The NGO is the recipient of the message notification.
                recipientId: chatModal.recipientId,
                listingId:   chatModal.listingId,
                foodName:    chatModal.label.split(' · ')[0],
              }}
              pickupLabel={chatModal.label}
            />
          )}
        </Modal>

      </main>
    </div>
  );
};

export default ManageListings;