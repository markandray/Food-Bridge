import { Star } from 'lucide-react';

const StarRating = ({ value = 0, onChange, interactive = false, size = 20 }) => {
  return (
    <div
      className={`flex items-center gap-0.5 ${interactive ? 'cursor-pointer' : ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={[
              'transition-colors focus:outline-none',
              interactive ? 'hover:scale-110 transition-transform' : 'cursor-default',
              !interactive ? 'pointer-events-none' : '',
            ].join(' ')}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              // Full class strings — no dynamic interpolation (Tailwind purge rule)
              // Empty star: slate-300 light / slate-600 dark (more visible on dark bg)
              className={filled ? 'text-amber-400 dark:text-amber-300' : 'text-slate-300 dark:text-slate-600'}
              fill={filled ? 'currentColor' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;