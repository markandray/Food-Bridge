import { forwardRef } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  icon: Icon,
  ...rest
}, ref) => {
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          {...rest}
          className={cn(
            'w-full rounded-lg border text-sm transition-colors duration-150',
            'bg-white dark:bg-slate-800',
            'text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            Icon ? 'pl-10 pr-3 py-2.5' : 'px-3 py-2.5',
            hasError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            disabled && 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
            inputClassName
          )}
        />
      </div>
      {hasError && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <span>⚠</span> {error}
        </p>
      )}
      {!hasError && hint && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;