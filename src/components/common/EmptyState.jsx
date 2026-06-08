const cn = (...classes) => classes.filter(Boolean).join(' ');

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-24 px-6', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-emerald-500" />
        </div>
      )}

      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-slate-600 text-sm max-w-sm mb-6">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;