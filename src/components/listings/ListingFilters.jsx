import { Search, MapPin, Package, X } from 'lucide-react';
import { CITIES, FOOD_UNITS ,  FOOD_TAGS } from '../../utils/constants';
import Input from '../common/Input';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const ListingFilters = ({
  filters,
  onChange,
  onTagsChange,
  selectedTags = [],
  showSearch = true,
  showCity = true,
  showUnit = true,
  showStatus = false,
  showTags = false,
  statusOptions = [],
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const hasActiveFilters =
    filters.searchTerm || filters.city || filters.unit || filters.status || selectedTags.length > 0;

  const clearAll = () => {
    if (filters.searchTerm)    onChange('searchTerm', '');
    if (filters.city)          onChange('city', '');
    if (filters.unit)          onChange('unit', '');
    if (filters.status)        onChange('status', '');
    if (selectedTags.length > 0 && onTagsChange) onTagsChange([]);
  };

  // Shared select classes for all filter dropdowns
  const selectClasses = `
    w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm
    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
    appearance-none cursor-pointer
    bg-white dark:bg-slate-700
    text-slate-700 dark:text-slate-200
    border-slate-300 dark:border-slate-600
  `;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {showSearch && (
          <div className="flex-1 min-w-0">
            <Input
              name="searchTerm"
              value={filters.searchTerm || ''}
              onChange={handleChange}
              placeholder="Search food or restaurant..."
              icon={Search}
              inputClassName="text-sm"
            />
          </div>
        )}

        {showCity && (
          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <select name="city" value={filters.city || ''} onChange={handleChange} className={selectClasses}>
              <option value="">All cities</option>
              {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
        )}

        {showUnit && (
          <div className="relative min-w-[140px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Package className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <select name="unit" value={filters.unit || ''} onChange={handleChange} className={selectClasses}>
              <option value="">All units</option>
              {FOOD_UNITS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {showStatus && statusOptions.length > 0 && (
          <div className="relative min-w-[150px]">
            {/* No icon for status — matches original */}
            <select
              name="status" value={filters.status || ''} onChange={handleChange}
              className={selectClasses.replace('pl-9', 'px-3')}
            >
              <option value="">All statuses</option>
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {showTags && onTagsChange && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Filter by tag
            </p>
            <div className="flex flex-wrap gap-2">
              {FOOD_TAGS.map(({ value, label }) => {
                const isActive = selectedTags.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onTagsChange(
                        isActive
                          ? selectedTags.filter((t) => t !== value)
                          : [...selectedTags, value]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isActive
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} active
              </p>
            )}
          </div>
        )}
    </div>
  );
};

export default ListingFilters;