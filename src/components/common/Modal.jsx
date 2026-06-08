import { useEffect } from 'react';
import { X } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={cn(
          'relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full animate-slide-up',
          'max-h-[90vh] overflow-y-auto',
          sizes[size] || sizes.md
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;