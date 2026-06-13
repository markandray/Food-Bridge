// src/App.jsx
import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from 'react-router-dom';
import { AuthProvider }          from './context/AuthContext';
import { ToastProvider }         from './context/ToastContext';
import ProtectedRoute, { CompleteProfileRoute } from './components/layout/ProtectedRoute';
import Navbar                    from './components/layout/Navbar';
import Footer                    from './components/layout/Footer';
import Spinner                   from './components/common/Spinner';
import ErrorBoundary             from './components/common/ErrorBoundary';
import useScrollRestoration      from './hooks/useScrollRestoration';
import { ROLES, ROUTES }         from './utils/constants';

const Landing             = lazy(() => import('./pages/Landing'));
const Login               = lazy(() => import('./pages/Login'));
const Signup              = lazy(() => import('./pages/Signup'));
const NotFound            = lazy(() => import('./pages/NotFound'));
const CompleteProfile     = lazy(() => import('./pages/CompleteProfile'));
const Profile             = lazy(() => import('./pages/Profile')); // NEW — Feature C

const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard'));
const PostFood            = lazy(() => import('./pages/restaurant/PostFood'));
const ManageListings      = lazy(() => import('./pages/restaurant/ManageListings'));
const DonationHistory     = lazy(() => import('./pages/restaurant/DonationHistory'));
const Analytics           = lazy(() => import('./pages/restaurant/Analytics'));

const NgoDashboard        = lazy(() => import('./pages/ngo/Dashboard'));
const BrowseListings      = lazy(() => import('./pages/ngo/BrowseListings'));
const ClaimedPickups      = lazy(() => import('./pages/ngo/ClaimedPickups'));
const PickupHistory       = lazy(() => import('./pages/ngo/PickupHistory'));

const ScrollRestorer = () => { useScrollRestoration(); return null; };

const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-slate-500 text-sm">Loading page...</p>
    </div>
  </div>
);

const AppLayout = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <ScrollRestorer />
    <Navbar />
    <main className="flex-1">
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </div>
);

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: (
      <AppLayout>
        <ErrorBoundary />
      </AppLayout>
    ),
    children: [
      { path: ROUTES.HOME,   element: <Landing /> },
      { path: ROUTES.LOGIN,  element: <Login />   },
      { path: ROUTES.SIGNUP, element: <Signup />  },

      {
        path: ROUTES.COMPLETE_PROFILE,
        element: (
          <CompleteProfileRoute>
            <CompleteProfile />
          </CompleteProfileRoute>
        ),
      },

      // PUBLIC — no ProtectedRoute wrapper.
      // Any visitor (logged in or not) can view a restaurant or NGO profile.
      // ROUTES.PROFILE = '/profile/:id' — the :id segment is the Firebase Auth UID.
      {
        path: ROUTES.PROFILE,
        element: <Profile />,
      },

      // Restaurant routes
      {
        path: ROUTES.RESTAURANT_DASHBOARD,
        element: (
          <ProtectedRoute requiredRole={ROLES.RESTAURANT}>
            <RestaurantDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RESTAURANT_POST_FOOD,
        element: (
          <ProtectedRoute requiredRole={ROLES.RESTAURANT}>
            <PostFood />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RESTAURANT_MANAGE_LISTINGS,
        element: (
          <ProtectedRoute requiredRole={ROLES.RESTAURANT}>
            <ManageListings />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RESTAURANT_DONATION_HISTORY,
        element: (
          <ProtectedRoute requiredRole={ROLES.RESTAURANT}>
            <DonationHistory />
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.RESTAURANT_ANALYTICS,
        element: (
          <ProtectedRoute requiredRole={ROLES.RESTAURANT}>
            <Analytics />
          </ProtectedRoute>
        ),
      },

      // NGO routes
      {
        path: ROUTES.NGO_DASHBOARD,
        element: (
          <ProtectedRoute requiredRole={ROLES.NGO}>
            <NgoDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NGO_BROWSE_LISTINGS,
        element: (
          <ProtectedRoute requiredRole={ROLES.NGO}>
            <BrowseListings />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NGO_CLAIMED_PICKUPS,
        element: (
          <ProtectedRoute requiredRole={ROLES.NGO}>
            <ClaimedPickups />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.NGO_PICKUP_HISTORY,
        element: (
          <ProtectedRoute requiredRole={ROLES.NGO}>
            <PickupHistory />
          </ProtectedRoute>
        ),
      },

      { path: ROUTES.NOT_FOUND, element: <NotFound /> },
    ],
  },
]);

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </AuthProvider>
);

export default App;