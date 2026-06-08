import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ROLES, ROUTES } from '../../utils/constants';
import Spinner from '../common/Spinner';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, role, loading, needsProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  if (needsProfile) {
    return <Navigate to={ROUTES.COMPLETE_PROFILE} replace />;
  }
  if (requiredRole && role !== requiredRole) {
    const correctDashboard = role === ROLES.RESTAURANT
      ? ROUTES.RESTAURANT_DASHBOARD
      : ROUTES.NGO_DASHBOARD;
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;

export const CompleteProfileRoute = ({ children }) => {
  const { currentUser, role, loading, needsProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (!needsProfile) {
    const dashboard = role === ROLES.RESTAURANT
      ? ROUTES.RESTAURANT_DASHBOARD
      : ROUTES.NGO_DASHBOARD;
    return <Navigate to={dashboard} replace />;
  }

  return children;
};