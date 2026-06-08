import { memo } from 'react';
import Spinner from '../common/Spinner';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const StatsCard = memo(({
  title,
  value,
  icon: Icon,
  color = 'emerald',
  loading = false,
  trend,
  subtitle,
  className = '',
}) => {
  const colorMap = {
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    iconBg: 'bg-orange-100 dark:bg-orange-500/15',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-500/15',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-500/15',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    iconBg: 'bg-red-100 dark:bg-red-500/15',
    icon: 'text-red-600 dark:text-red-400',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-500/15',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  teal: {
    iconBg: 'bg-teal-100 dark:bg-teal-500/15',
    icon: 'text-teal-600 dark:text-teal-400',
  },
  indigo: {
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/15',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
};

  const selected = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', selected.iconBg)}>
          {Icon && <Icon className={cn('h-5 w-5', selected.icon)} />}
        </div>

        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              trend.direction === 'up'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            )}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value ?? '—'}</p>
        )}

        {title && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
        )}

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;