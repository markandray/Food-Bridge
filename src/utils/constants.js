

// --- Firestore Collection Names ---
export const COLLECTIONS = {
  USERS: 'users',
  LISTINGS: 'listings',
  PICKUPS: 'pickups',
  MESSAGES: 'messages',
  IMPACT: 'impact',
  NOTIFICATIONS: 'notifications',
  RATINGS: 'ratings',
};

// --- User Roles ---

export const ROLES = {
  RESTAURANT: 'restaurant',
  NGO: 'ngo',
};

// --- Listing Status Enum ---
export const LISTING_STATUS = {
  AVAILABLE: 'available',
  CLAIMED: 'claimed',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
};

// --- Pickup Status Enum ---
export const PICKUP_STATUS = {
  CLAIMED: 'claimed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const NOTIFICATION_TYPES = {
  LISTING_CLAIMED: 'listing_claimed',
  PICKUP_COMPLETE: 'pickup_complete',
  NEW_MESSAGE:     'new_message',
};

export const RATING_LIMITS = {
  COMMENT_MAX: 200,
  STARS_MIN:   1,
  STARS_MAX:   5,
};

// --- Food Unit Options ---

export const FOOD_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  //{ value: 'portions', label: 'Portions' },//
  { value: 'packets', label: 'Packets' },
  { value: 'boxes', label: 'Boxes' },
];

// --- Food Category Tags ---
export const FOOD_TAGS = [
  { value: 'veg',        label: '🥦 Veg'        },
  { value: 'non-veg',    label: '🍗 Non-Veg'    },
  { value: 'jain',       label: '🌿 Jain'        },
  { value: 'dairy-free', label: '🥛 Dairy-Free'  },
  { value: 'cooked',     label: '🍲 Cooked'      },
  { value: 'packed',     label: '📦 Packed'      },
  { value: 'bakery',     label: '🥐 Bakery'      },
  { value: 'fruits',     label: '🍎 Fruits'      },
  { value: 'rice',       label: '🍚 Rice'        },
  { value: 'snacks',     label: '🍿 Snacks'      },
];

// --- Supported Cities ---
export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
];

// --- Route Paths ---

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  NOT_FOUND: '*',
  COMPLETE_PROFILE: '/complete-profile',

  // Restaurant routes
  RESTAURANT_DASHBOARD: '/restaurant/dashboard',
  RESTAURANT_POST_FOOD: '/restaurant/post-food',
  RESTAURANT_MANAGE_LISTINGS: '/restaurant/manage-listings',
  RESTAURANT_DONATION_HISTORY: '/restaurant/donation-history',
  RESTAURANT_ANALYTICS: '/restaurant/analytics',

  // NGO routes
  NGO_DASHBOARD: '/ngo/dashboard',
  NGO_BROWSE_LISTINGS: '/ngo/browse-listings',
  NGO_CLAIMED_PICKUPS: '/ngo/claimed-pickups',
  NGO_PICKUP_HISTORY: '/ngo/pickup-history',

  // Shared
  PROFILE: '/profile/:id',
};

// --- Status Badge Color Map ---
export const STATUS_COLORS = {
  [LISTING_STATUS.AVAILABLE]: 'emerald',
  [LISTING_STATUS.CLAIMED]: 'amber',
  [LISTING_STATUS.COMPLETED]: 'blue',
  [LISTING_STATUS.EXPIRED]: 'red',
  [PICKUP_STATUS.CANCELLED]: 'red',
};

// --- Impact Calculation ---
export const KG_TO_MEALS_RATIO = 2.5;

// --- Debounce Delay (ms) ---
export const DEBOUNCE_DELAY = 400;

// --- Toast Duration (ms) ---
export const TOAST_DURATION = 4000;

// --- Listing Form Limits ---
export const LISTING_LIMITS = {
  FOOD_NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
  QUANTITY_MIN: 0.1,
  QUANTITY_MAX: 10000,
  ADDRESS_MAX:   200,
};

export const CITY_LIMITS = {
  MIN: 1,
  MAX: 30,
};