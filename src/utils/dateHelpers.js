
export const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// --- Format: "15 Jan 2025" (date only) ---
export const formatDate = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// --- Format: "3:30 PM" (time only) ---
export const formatTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return 'N/A';
  return date.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// --- Time Remaining Until Expiry ---
export const getExpiryLabel = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return 'Unknown expiry';

  const now = new Date();
  const diffMs = date - now; // positive = future, negative = past

  if (diffMs <= 0) return 'Expired';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `Expires in ${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `Expires in ${diffHours}h ${diffMins % 60}m`;
  return `Expires in ${diffMins}m`;
};

// --- Is Expired? ---
export const isExpired = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return false;
  return date <= new Date();
};

// --- Pickup Window Label ---
export const formatPickupWindow = (start, end) => {
  return `${formatTime(start)} – ${formatTime(end)}`;
};

// --- Relative Time ---
export const getRelativeTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return '';

  const now = new Date();
  const diffMs = now - date; // Note: reversed — past relative to now
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

// --- Format for datetime-local input ---
export const toDatetimeLocalString = (date) => {
  const d = toDate(date);

  if (!d || Number.isNaN(d.getTime())) {
    return '';
  }

  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};