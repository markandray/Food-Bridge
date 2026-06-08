import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { ROUTES } from '../utils/constants';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
    <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
    <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
    <p className="text-slate-500 mb-8 max-w-sm">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link
      to={ROUTES.HOME}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
    >
      <Home className="h-4 w-4" />
      Back to Home
    </Link>
  </div>
);

export default NotFound;