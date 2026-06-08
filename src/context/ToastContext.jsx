import { createContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/common/Toast';
import { TOAST_DURATION } from '../utils/constants';

export const ToastContext = createContext(null);
let toastCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id; 
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message) => showToast(message, 'success'),
    [showToast]
  );
  const showError = useCallback(
    (message) => showToast(message, 'error'),
    [showToast]
  );
  const showWarning = useCallback(
    (message) => showToast(message, 'warning'),
    [showToast]
  );

  const value = { showToast, showSuccess, showError, showWarning, dismissToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* ToastContainer lives here — outside the page content,
          rendered at the Provider level so it's always visible
          regardless of which page is currently showing */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};