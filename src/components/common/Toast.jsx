import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { TOAST_DURATION } from '../../utils/constants';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Toast = ({ id, message, type = 'info', duration = TOAST_DURATION, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  // Full class strings — no dynamic interpolation
  const config = {
    success: {
      icon: CheckCircle,
      classes: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200',
      iconClass: 'text-emerald-500 dark:text-emerald-400',
    },
    error: {
      icon: XCircle,
      classes: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200',
      iconClass: 'text-red-500 dark:text-red-400',
    },
    warning: {
      icon: AlertCircle,
      classes: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200',
      iconClass: 'text-amber-500 dark:text-amber-400',
    },
    info: {
      icon: Info,
      classes: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200',
      iconClass: 'text-blue-500 dark:text-blue-400',
    },
  };

  const { icon: Icon, classes, iconClass } = config[type] || config.info;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-md',
        'max-w-sm w-full transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        classes
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconClass)} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(id), 300); }}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;