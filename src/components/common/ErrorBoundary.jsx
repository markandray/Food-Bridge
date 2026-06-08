import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

// ErrorBoundary is the only class component in the codebase.
// getDerivedStateFromError has no hook equivalent — this exception is intentional.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-2">
              An unexpected error occurred. The error has been logged.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <summary className="text-sm font-semibold text-red-700 dark:text-red-400 cursor-pointer">
                  Error details (dev only)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <Link
                to={ROUTES.HOME}
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;