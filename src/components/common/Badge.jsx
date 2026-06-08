const cn = (...classes) => classes.filter(Boolean).join(' ');

// Full class strings only — no dynamic interpolation (Tailwind purge rule)
const colorMap = {
  emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  amber:   'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  blue:    'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
  red:     'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  slate:   'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  orange:  'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
};

const Badge = ({
  children,
  color = 'slate',
  size = 'sm',
  className = '',
  dot = false,
}) => {
  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
    blue:    'bg-blue-500',
    red:     'bg-red-500',
    slate:   'bg-slate-500',
    orange:  'bg-orange-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colorMap[color] || colorMap.slate,
        sizes[size] || sizes.sm,
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[color] || dotColors.slate)} />
      )}
      {children}
    </span>
  );
};

export default Badge;