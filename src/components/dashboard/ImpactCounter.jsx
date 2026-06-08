import { useState, useEffect, memo } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const ImpactCounter = memo(({
  value = 0,
  label,
  suffix = '',
  prefix = '',
  duration = 1500,
  color = 'emerald',
  icon: Icon,
  loading = false,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!value || value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(value * eased);

      setDisplayValue(current);

      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(value);
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);

  const colorMap = {
    emerald: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      icon: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    orange: {
      iconBg: 'bg-orange-100 dark:bg-orange-500/15',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-600 dark:text-orange-400',
    },
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-500/15',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      iconBg: 'bg-purple-100 dark:bg-purple-500/15',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400',
    },
  };

  const selected = colorMap[color] || colorMap.emerald;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center animate-pulse">
        <div className="h-10 w-24 rounded-lg mx-auto mb-3 bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-24 rounded mx-auto bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
      {Icon && (
        <div className="flex justify-center mb-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', selected.iconBg)}>
            <Icon className={cn('h-6 w-6', selected.icon)} />
          </div>
        </div>
      )}

      <p className={cn('text-3xl font-extrabold tabular-nums', selected.text)}>
        {prefix}
        {displayValue.toLocaleString('en-IN')}
        {suffix}
      </p>

      <p className="text-sm font-medium mt-1 text-slate-600 dark:text-slate-300">
        {label}
      </p>
    </div>
  );
});

ImpactCounter.displayName = 'ImpactCounter';

export default ImpactCounter;