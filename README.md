# 🌉 FoodBridge

> A real-time, two-sided platform that connects restaurants with surplus food to NGOs who distribute it to people in need.

FoodBridge is a production-grade full-stack React web application that tackles food waste at the last mile — where restaurants discard edible cooked food daily while NGOs nearby have no visibility into what's available. The platform creates a live, city-scoped bridge between both parties with role-based accounts, real-time listings, and full pickup lifecycle management.

---

## 🎯 The Problem We're Solving

India wastes approximately **68.8 million tonnes** of food every year — while **189 million people** face hunger. The paradox is sharpest at restaurants: a kitchen prepares food that goes unsold, has no practical donation channel, and ends up in landfill within hours. Meanwhile, NGOs in the same city are making calls, sending messages, and guessing at what might be available.

FoodBridge eliminates that coordination gap with a live, mobile-friendly platform that takes a food donation from kitchen to community in a few taps.

---

## ✨ Features

### 🍽 For Restaurants
- Sign up with a role-specific account and city selection
- Post surplus food listings with food name, quantity, unit type, expiry time, and a pickup window
- Upload a photo per listing (stored in Firebase Storage) to attract NGOs faster
- See in real time when an NGO claims a listing — the NGO's name appears on the card
- Mark a claimed listing as "Completed" once food is collected
- Manage all listings with live status filters (Available / Claimed / Completed / Expired)
- Dashboard with animated impact counters, live status breakdown, and activity feed
- Full donation history table with per-unit breakdown (kg, packets, boxes)

### 🤝 For NGOs
- Sign up with city selection — browse is automatically scoped to that city
- Browse all available listings in real time with search, city, and unit filters
- Claim a listing in one click — confirmation modal before committing
- View active claimed pickups with a **live countdown timer** ticking to the pickup window close
- Mark a pickup as "Collected" directly from the Claimed Pickups page
- Cancel a claim if needed — listing immediately returns to the available pool
- Tabbed pickup history: Completed and Cancelled with aggregate stats per tab
- Dashboard showing available food count in your city, impact counters, and activity feed

### 🔄 Platform-Level
- **Role-based routing** — NGOs cannot access restaurant routes and vice versa; enforced at both the React Router level (`ProtectedRoute`) and Firestore security rules level
- **Real-time data** — all listing and pickup states update live via Firestore `onSnapshot` listeners without page refresh
- **Toast notifications** — every create, claim, complete, cancel, delete, and error action shows a self-dismissing, colour-coded toast
- **Skeleton loaders** — listing grids and stat cards show shimmer placeholders while data loads, eliminating layout shift
- **Scroll restoration** — navigating between routes always starts at the top of the page
- **Global error boundary** — uncaught runtime errors show a friendly recovery screen instead of a blank page
- **Code splitting** — every page is lazy-loaded; only the JS for the current page is downloaded on first visit
- **Fully responsive** — single column on mobile, two columns on tablet, three-column grid on desktop

---

## 🛠 Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| UI Framework | React | 19.x | Component model, hooks, concurrent features |
| Build Tool | Vite | 8.x | Instant HMR, native ESM, fast production builds |
| Routing | React Router DOM | 7.x | `createBrowserRouter`, nested routes, `useSearchParams` |
| Styling | Tailwind CSS | 4.x | Utility-first, purged in production, zero runtime CSS-in-JS |
| Database | Firebase Firestore | 12.x | Real-time `onSnapshot`, serverless, no separate backend |
| Auth | Firebase Auth | 12.x | Email/password sign-in, session persistence, UID-keyed profiles |
| File Storage | Firebase Storage | 12.x | Listing photo uploads with `uploadBytesResumable` progress |
| Icons | Lucide React | 1.x | Tree-shakeable, consistent 24px stroke-width icon set |
| Linting | ESLint + react-hooks plugin | 9.x | Flat config, enforces hooks rules, catches stale closures |

---

## ⚛️ React Concepts — Complete Map

This project was built as a teaching vehicle. Every major React concept appears at least once and is documented with comments at the point of use in the source code.

### Core Concepts

| Concept | Where It Appears |
|---|---|
| `useState` | Every form (`Login`, `Signup`, `ListingForm`), modal open/close, tab toggle in `PickupHistory`, filter state in `ManageListings` and `BrowseListings`, countdown string in `CountdownTimer` |
| `useEffect` | Firestore `onSnapshot` listeners with cleanup in `useListings` and `usePickups`; redirect-on-auth in `Login` and `Signup`; body scroll lock in `Modal`; countdown interval in `ClaimedPickups`; scroll restoration in `useScrollRestoration`; auto-dismiss timer in `Toast` |
| `useEffect` cleanup | `return () => unsubscribe()` in every Firestore hook; `return () => clearInterval()` in countdown; `return () => clearTimeout()` in toast; `return () => document.removeEventListener()` in `Modal` keyboard handler |
| Props & composition | `ListingCard` receives `listing`, `role`, `onClaim`, `onComplete`, `onDelete`; `StatsCard` receives `title`, `value`, `icon`, `color`; `Badge` receives `color`, `dot`, `children` |
| Conditional rendering | Role-based action buttons in `ListingCard`; loading/error/empty three-state pattern in `ListingGrid`, `DonationHistory`, `PickupHistory`; `ProtectedRoute` three-case redirect logic |
| Lists and keys | `ListingGrid` maps `listings` with `listing.id` as key; `ActivityFeed` maps activity items; history tables map `completedPickups` and `cancelledPickups` using Firestore document IDs as keys |

### Intermediate Concepts

| Concept | Where It Appears |
|---|---|
| Lifting state up | Filter state (`searchTerm`, `city`, `unit`, `status`) lives in `BrowseListings` and `ManageListings`, passed down to `ListingFilters` as props. `ListingFilters` never owns its own state. |
| Controlled components | Every `<input>`, `<select>`, and `<textarea>` across `Login`, `Signup`, `ListingForm`, and `ListingFilters` uses `value={state}` + `onChange={handler}` — no uncontrolled inputs anywhere |
| React Router v6 | `createBrowserRouter` in `App.jsx`; `<Outlet />` in `AppLayout`; `useNavigate` for post-login redirect; `useLocation` to read `state.from` for redirect-after-login; `useSearchParams` in `Signup` for `?role=` URL pre-selection |
| Context API | `AuthContext` provides `currentUser`, `userProfile`, `role`, `loading`, `refreshProfile` to the entire tree; `ToastContext` provides `showSuccess`, `showError`, `showWarning`, `dismissToast` |
| Custom hooks | `useAuth` wraps `useContext(AuthContext)` with a null safety guard; `useToast` wraps `useContext(ToastContext)`; all other hooks encapsulate data-fetching and service logic away from pages |

### Advanced Concepts

| Concept | Where It Appears | Why This Tool |
|---|---|---|
| `useReducer` | `useListings.js` — `listingsReducer` handles `SET_LOADING`, `SET_LISTINGS`, `SET_ERROR`, `RESET` as atomic state transitions | Prevents impossible states like `{ loading: true, error: 'some error' }` simultaneously |
| `useMemo` | `filteredListings` in `useListings`; `resultLabel` in `BrowseListings`; `derivedStats` and `activityItems` in both Dashboards; `summaryStats` in `DonationHistory` and `PickupHistory` | Avoids re-running expensive array reduce/filter/sort operations on every render |
| `useCallback` | All action handlers passed to `React.memo`-wrapped children: `handleFilterChange`, `handleDelete`, `handleComplete`, `handleClaimClick`, `handleCancelClick`, `handleCompleteClick` | Without `useCallback`, `React.memo` on children is useless — a new function reference on every render forces a re-render regardless |
| `useRef` | `emailRef` / `nameRef` for auto-focus on mount in `Login` and `Signup`; `topRef` in `PostFood` for scroll-to-top after submit; `prevPathnameRef` in `useScrollRestoration` to detect actual route changes | Holds a mutable value that persists across renders without triggering re-renders |
| `React.lazy + Suspense` | Every page component in `App.jsx` wrapped in `lazy(() => import(...))` with a `<Suspense fallback={<PageLoadingFallback />}>` in `AppLayout` | Each page is a separate JS chunk — only downloaded when the user first visits that route |
| `React.memo` | `ListingCard`, `StatsCard`, `ListingGrid`, `ImpactCounter` | Prevents re-rendering all cards in the grid when parent state changes for unrelated reasons (e.g., modal open/close) |
| `forwardRef` | `Input.jsx` — wraps the component so parent components can attach a `ref` that reaches the underlying `<input>` DOM node | Required for `emailRef.current.focus()` to work from `Login` and `Signup` |
| Class component | `ErrorBoundary.jsx` — uses `getDerivedStateFromError` and `componentDidCatch` | The only React pattern with no hook equivalent; justified exactly once in the entire codebase |

---

## 📁 Project Structure

```
foodbridge/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.jsx            # Coloured status pill (available/claimed/completed/expired)
│   │   │   ├── Button.jsx           # Variants: primary, secondary, danger, ghost, orange
│   │   │   ├── EmptyState.jsx       # Icon + title + description for empty list states
│   │   │   ├── ErrorBoundary.jsx    # Class component — catches uncaught render errors
│   │   │   ├── Input.jsx            # Controlled input with forwardRef, error, icon, hint
│   │   │   ├── Modal.jsx            # Accessible dialog: backdrop, Escape key, scroll lock
│   │   │   ├── SkeletonCard.jsx     # ListingCardSkeleton, StatsCardSkeleton, ListingGridSkeleton
│   │   │   ├── Spinner.jsx          # Animated loading indicator, multiple sizes and colours
│   │   │   └── Toast.jsx            # Self-dismissing notification + ToastContainer
│   │   ├── dashboard/
│   │   │   ├── ActivityFeed.jsx     # Merged listing+pickup activity list with relative timestamps
│   │   │   ├── ImpactCounter.jsx    # Animated count-up number (React.memo + requestAnimationFrame)
│   │   │   └── StatsCard.jsx        # Stat tile with icon, value, optional trend badge (React.memo)
│   │   ├── layout/
│   │   │   ├── Footer.jsx           # Site-wide footer
│   │   │   ├── Navbar.jsx           # Sticky nav with role badge, mobile hamburger
│   │   │   ├── ProtectedRoute.jsx   # Three-case guard: unauthed → /login, wrong role → own dashboard
│   │   │   └── Sidebar.jsx          # Desktop sidebar with role-specific nav links
│   │   └── listings/
│   │       ├── ListingCard.jsx      # Food card with role-conditional actions (React.memo)
│   │       ├── ListingFilters.jsx   # Search + city + unit + status filter bar (lifting state up)
│   │       ├── ListingForm.jsx      # Controlled form for creating listings + photo upload
│   │       └── ListingGrid.jsx      # Responsive 1/2/3-col grid with skeleton loading (React.memo)
│   ├── context/
│   │   ├── AuthContext.jsx          # Firebase auth listener, profile fetch, loading gate
│   │   └── ToastContext.jsx         # Toast list state, showSuccess / showError / showWarning
│   ├── hooks/
│   │   ├── useAuth.js               # Consumes AuthContext with null safety guard
│   │   ├── useDebounce.js           # Generic debounce — delays a value update by N milliseconds
│   │   ├── useImpact.js             # Fetches impact doc, derives completionRate and mealsServed
│   │   ├── useListings.js           # useReducer state machine + onSnapshot + useMemo filter pipeline
│   │   ├── usePickups.js            # onSnapshot listener, derived slices (active/completed/cancelled)
│   │   ├── useScrollRestoration.js  # Scrolls to top on pathname change using useRef + useEffect
│   │   └── useToast.js              # Consumes ToastContext with null safety guard
│   ├── pages/
│   │   ├── Landing.jsx              # Public marketing page with role toggle + problem stats
│   │   ├── Login.jsx                # Controlled form, direct Firestore role fetch, immediate navigate
│   │   ├── NotFound.jsx             # 404 page
│   │   ├── Signup.jsx               # Role card selection, ?role= URL param support, direct navigate
│   │   ├── ngo/
│   │   │   ├── BrowseListings.jsx   # Real-time grid with debounced search and claim flow
│   │   │   ├── ClaimedPickups.jsx   # Active pickup cards with live countdown timers
│   │   │   ├── Dashboard.jsx        # Stats, city snapshot, impact counters, activity feed
│   │   │   └── PickupHistory.jsx    # Tabbed completed/cancelled history with aggregate stats
│   │   └── restaurant/
│   │       ├── Dashboard.jsx        # Derived stats, impact counters, live status, activity feed
│   │       ├── DonationHistory.jsx  # Completed donations table with per-unit breakdown
│   │       ├── ManageListings.jsx   # All listings with status filter, delete and complete actions
│   │       └── PostFood.jsx         # Listing creation form + Firebase Storage photo upload
│   ├── services/
│   │   ├── auth.service.js          # signupUser (atomic cleanup), loginUser, logoutUser, getFriendlyAuthError
│   │   ├── firebase.js              # initializeApp singleton — exports auth, db, storage
│   │   ├── impact.service.js        # getImpactStats, initImpactDoc, incrementListingCount, recordCompletedDonation
│   │   ├── listings.service.js      # subscribeToListings, createListing, claimListing, completeListing, deleteListing
│   │   └── pickups.service.js       # createPickup, subscribeToNgoPickups, cancelPickup, completePickup, completePickupByNgo
│   ├── utils/
│   │   ├── constants.js             # COLLECTIONS, ROLES, LISTING_STATUS, PICKUP_STATUS, FOOD_UNITS, CITIES, ROUTES, STATUS_COLORS
│   │   ├── dateHelpers.js           # toDate, formatDateTime, getExpiryLabel, formatPickupWindow, getRelativeTime, toDatetimeLocalString
│   │   └── validators.js            # validateSignupForm, validateLoginForm, validateListingForm, isFormValid
│   ├── App.jsx                      # Router config, lazy imports, AppLayout shell, ScrollRestorer
│   ├── index.css                    # Tailwind v4 @import, Inter font, custom keyframes
│   └── main.jsx                     # React root, StrictMode, top-level ErrorBoundary
├── .env                             # Firebase secrets — NEVER commit (in .gitignore)
├── .env.example                     # Template with all required variable names, no values
├── .gitignore
├── eslint.config.js                 # ESLint v9 flat config + react-hooks + react-refresh
├── index.html                       # Entry HTML — viewport, OG tags, theme-color, font preconnect
├── package.json                     # React 19, React Router 7, Firebase 12, Tailwind 4, Vite 8
├── postcss.config.cjs
├── tailwind.config.js                      
└── README.md
```

---

## 🗄 Firestore Data Model

All collection names are defined as constants in `src/utils/constants.js`. No raw strings like `'listings'` or `'users'` appear anywhere in components or services.

### `users/{userId}`
Created at signup. The document ID equals the Firebase Auth UID so profile lookups are always `doc(db, 'users', uid)` — no query needed.

```js
{
  uid:       string,               // Firebase Auth UID
  name:      string,               // Restaurant or NGO display name
  email:     string,
  role:      "restaurant" | "ngo",
  city:      string,               // One of the CITIES constant list
  phone:     string,
  photoURL:  string | null,
  createdAt: Timestamp
}
```

### `listings/{listingId}`
Created by restaurants. The `listingId` field is written back after `addDoc` so the document is self-referential.

```js
{
  listingId:         string,
  restaurantId:      string,        // uid of the creating restaurant
  restaurantName:    string,
  foodName:          string,
  quantity:          number,
  unit:              "kg" | "portions" | "packets" | "boxes",
  description:       string,
  expiryTime:        Timestamp,
  pickupWindowStart: Timestamp,
  pickupWindowEnd:   Timestamp,
  city:              string,
  status:            "available" | "claimed" | "completed" | "expired",
  claimedBy:         string | null,  // NGO uid
  claimedByName:     string | null,
  claimedAt:         Timestamp | null,
  completedAt:       Timestamp | null,
  createdAt:         Timestamp,
  photoURL:          string | null
}
```

**Status machine:**
```
available  ──claim──▶   claimed  ──complete──▶  completed
available  ──(expiry passes)──▶  expired
claimed    ──cancel──▶   available
```

### `pickups/{pickupId}`
Created when an NGO claims a listing. Tracks the full pickup lifecycle independently of the listing document.

```js
{
  pickupId:      string,
  listingId:     string,
  restaurantId:  string,
  restaurantName:string,
  ngoId:         string,
  ngoName:       string,
  foodName:      string,
  quantity:      number,
  unit:          string,
  city:          string,
  claimedAt:     Timestamp,
  completedAt:   Timestamp | null,
  cancelledAt:   Timestamp | null,
  completedBy:   "ngo" | "restaurant" | null,
  status:        "claimed" | "completed" | "cancelled"
}
```

### `impact/{userId}`
One document per user. All numeric fields are updated with Firestore `increment()` to avoid read-modify-write race conditions on concurrent completions.

```js
{
  totalListings:    number,  // Restaurant: all listings ever posted
  totalDonationsKg: number,  // Restaurant: total kg successfully donated
  totalPickups:     number,  // NGO: all pickups ever claimed
  mealsServed:      number,  // Both: derived at (kg × 2.5 meals/kg ratio)
  completedCount:   number   // Both: successfully completed pickups
}
```

---

## 🔐 Firestore Security Rules

Security is enforced at two layers: `ProtectedRoute` (client-side UX) and Firestore rules (server-side enforcement). Client checks are for user experience; Firestore rules are the real security boundary — they apply even if the React app is bypassed entirely.

Copy this into **Firebase Console → Firestore → Rules** and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isLoggedIn()   { return request.auth != null; }
    function isOwner(uid)   { return request.auth.uid == uid; }
    function getRole()      {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isRestaurant() { return getRole() == 'restaurant'; }
    function isNGO()        { return getRole() == 'ngo'; }

    match /users/{userId} {
      allow read:   if isLoggedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
    }

    match /listings/{listingId} {
      allow read:   if isLoggedIn();
      allow create: if isLoggedIn() && isRestaurant();
      allow update: if isLoggedIn() && (
        (isRestaurant() && resource.data.restaurantId == request.auth.uid) ||
        (isNGO()        && resource.data.status == 'available')
      );
      allow delete: if isLoggedIn() && resource.data.restaurantId == request.auth.uid;
    }

    match /pickups/{pickupId} {
      allow read:   if isLoggedIn() && (
        resource.data.ngoId        == request.auth.uid ||
        resource.data.restaurantId == request.auth.uid
      );
      allow create: if isLoggedIn() && isNGO();
      allow update: if isLoggedIn() && (
        resource.data.ngoId        == request.auth.uid ||
        resource.data.restaurantId == request.auth.uid
      );
    }

    match /impact/{userId} {
      allow read:  if isLoggedIn() && isOwner(userId);
      allow write: if isLoggedIn() && isOwner(userId);
    }
  }
}
```

---

## 🔢 Required Firestore Composite Indexes

Firestore requires a composite index for any query that filters on one field and orders by a different field. Create these in **Firebase Console → Firestore → Indexes → Composite**. You can also click the auto-generated link that appears in the browser console error when the query first runs in development.

| Collection | Field 1 | Field 2 | Used By |
|---|---|---|---|
| `listings` | `restaurantId` ASC | `createdAt` DESC | ManageListings, Restaurant Dashboard |
| `listings` | `city` ASC | `createdAt` DESC | BrowseListings, NGO Dashboard |
| `pickups` | `ngoId` ASC | `claimedAt` DESC | ClaimedPickups, PickupHistory |
| `pickups` | `restaurantId` ASC | `claimedAt` DESC | DonationHistory |
| `pickups` | `listingId` ASC | `status` ASC | `getPickupByListingId` in pickups.service |



### 6 — Create Test Accounts

1. `/signup` → choose **Restaurant** → fill in the form → submit → lands on restaurant dashboard
2. Log out → `/signup` → choose **NGO** → fill in the form → **use the same city** → submit → lands on NGO dashboard
3. Log in as Restaurant → Post Food → create a listing
4. Log in as NGO → Browse Listings → the listing should appear

### Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR at `localhost:5173` |
| `npm run build` | Production build — outputs to `dist/` |
| `npm run preview` | Serve the `dist/` build locally to verify before deploying |
| `npm run lint` | Run ESLint across all `.js` and `.jsx` files |

---

## 🧪 Manual Test Checklist

Run through these after any significant change to verify nothing is broken.

### Auth
- [ ] Sign up as Restaurant → redirected to `/restaurant/dashboard`
- [ ] Sign up as NGO → redirected to `/ngo/dashboard`
- [ ] Log out → redirected to `/`
- [ ] Log back in → redirected to correct dashboard for that role
- [ ] Visit `/restaurant/dashboard` while logged out → redirected to `/login`
- [ ] Visit `/restaurant/dashboard` while logged in as NGO → redirected to `/ngo/dashboard`
- [ ] Refresh page while logged in → stays on current page (no auth flash to `/login`)

### Restaurant Flow
- [ ] Post a listing with all required fields → success message appears
- [ ] Post a listing with a photo → photo visible on the card in Manage Listings
- [ ] Manage Listings shows the new listing with "available" badge
- [ ] (Switch to NGO) Claim the listing → (Switch back to Restaurant) Manage Listings shows "Claimed by [NGO name]" in real time
- [ ] Click "Mark Complete" → confirm in modal → listing badge changes to "completed"
- [ ] Donation History table shows the completed entry with correct quantity and NGO name

### NGO Flow
- [ ] Browse Listings shows only available listings in your registered city
- [ ] Search by food name → results filter in real time as you type (debounce delay visible)
- [ ] Filter by unit → only matching listings shown
- [ ] Claim a listing → confirmation modal appears → confirm → success toast → listing disappears from Browse
- [ ] Claimed Pickups shows the pickup card with a live countdown timer ticking every second
- [ ] Click "Mark as Collected" → confirm → card disappears → success toast
- [ ] Pickup History → Completed tab shows the entry with correct timestamp
- [ ] Claim another listing → Cancel Claim → listing reappears in Browse Listings

### Edge Cases
- [ ] Open the app in two browser tabs with the same NGO logged in. Claim a listing in tab 1 — verify it disappears in tab 2 in real time (onSnapshot working)
- [ ] Submit signup form with all fields blank → field-level validation errors appear
- [ ] Submit login with a wrong password → friendly error message (not a raw Firebase error code)
- [ ] Submit signup with an email already in use → "An account with this email already exists" message

---

## 🏗 Architecture Decisions

These are the non-obvious choices made during development and the reasoning behind each one.

### Why `createBrowserRouter` over `<BrowserRouter>`?
React Router v6.4+ introduced data APIs (loaders, actions, error elements per route) that are only available with `createBrowserRouter`. Starting with it now means data APIs can be adopted later without refactoring every route definition.

### Why a service layer (`src/services/`)?
All Firestore and Firebase Auth calls are isolated in service files. Components and hooks never import from `firebase/firestore` directly. This means: if Firebase's API changes, one file changes instead of twenty; services can be mocked in tests without touching component code; and the convention is enforceable in code review — if you see a Firestore import in a component, it's a violation.

### Why `useReducer` in `useListings`?
A listing moves through a defined, finite set of states. `useReducer` with explicit action types makes transitions visible and auditable. With `useState`, any part of the code could set status to any value. With `useReducer`, only the defined action types are valid — a state machine.

### Why direct Firestore fetch in `Login.jsx` instead of waiting for `AuthContext`?
`AuthContext` updates `role` asynchronously: `onAuthStateChanged` fires → Firestore `getDoc` runs → `setUserProfile` is called. When `loginUser()` resolves, the `useEffect` watching `[currentUser, role]` fires immediately with `role = null` (the Firestore fetch hasn't completed yet), causing no redirect. `Login.jsx` instead fetches the Firestore profile directly after login in the same async chain, reads the role immediately, and navigates without waiting for the context to catch up.

### Why dashboards compute stats from live listing/pickup data instead of the `impact/` collection?
The `impact/` collection uses Firestore `increment()` which may lag slightly. Dashboards use `useMemo` to compute all stats directly from the `listings` and `pickups` arrays, which are live via `onSnapshot`. This guarantees the numbers always match what the user just did without a refresh.

### Why `React.memo` and `useCallback` always appear together?
`React.memo` on a child component skips re-renders only when props are shallowly equal. Function props are recreated on every parent render — a new reference means `React.memo` sees changed props and re-renders anyway. `useCallback` stabilises the function reference. Without `useCallback`, `React.memo` on `ListingCard` does nothing because every render passes a new `onClaim` function. They are a matched pair and must always be used together.

## 🔒 Security Model

| Layer | Mechanism | What It Prevents |
|---|---|---|
| Client routing | `ProtectedRoute` component | Wrong-role users seeing the wrong dashboard UI |
| Database | Firestore security rules | Wrong-role users reading or writing wrong data even via direct API calls or the Firebase Console |
| Secrets | `VITE_*` env vars, `.gitignore` | Firebase config keys never committed to the repository |
| HTTP headers | `vercel.json` | Clickjacking (`X-Frame-Options: DENY`), MIME sniffing (`X-Content-Type-Options: nosniff`) |
| Auth atomicity | Cleanup in `signupUser` | Orphaned Firebase Auth accounts when the subsequent Firestore write fails |

---

## 🌱 Environment Variables Reference

| Variable | Where to Find It | Required |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → Your Apps | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → Your Apps | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → Your Apps | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → Your Apps | ✅ |


## 🗺 Roadmap — Planned Features

These features are architecturally planned but not yet implemented.

- [ ] **Cloud Function for expiry** — a Firebase scheduled Cloud Function that marks listings as `expired` when their `expiryTime` passes, replacing the current client-side detection which only triggers on page load
- [ ] **Push notifications** — notify the restaurant when an NGO claims their listing; notify the NGO when a new listing appears in their city
- [ ] **In-app messaging** — a lightweight per-listing chat thread for pickup logistics coordination
- [ ] **Public profile pages** — `/profile/:id` for both restaurants and NGOs showing public impact stats and recent activity
- [ ] **Rating system** — NGOs can rate restaurants after a completed pickup; ratings visible on profile pages
- [ ] **Recurring listings** — a restaurant can mark a listing as recurring (e.g., "every weekday at 9pm") to avoid daily re-posting
- [ ] **Multi-city NGOs** — allow NGO accounts to operate across multiple cities simultaneously
- [ ] **CSV / PDF export** — download donation or pickup history for grant applications and record-keeping
- [ ] **Dark mode** — Tailwind `dark:` variant support across all components
- [ ] **E2E test suite** — Playwright tests covering the core flows: signup, post listing, claim, complete, cancel
- [ ] **Firebase Emulator Suite** — local Firestore and Auth emulators for offline development and CI pipelines

---

## 👨‍💻 Author

Built by **markandray** as a portfolio project demonstrating production-grade React architecture — from `useState` to `useReducer`, `React.memo` to `ErrorBoundary`, real-time Firestore to role-based routing.

---

## 📄 Licence

This project is open source under the [MIT License](./LICENSE).
