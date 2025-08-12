import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Building2,
  X,
  RotateCcw
} from 'lucide-react';
import type { ReviewFiltersProps } from '@/types/reviews';
import { REVIEW_STATUSES, RATING_FILTERS } from '@/types/reviews';

export default function ReviewFilters({ 
  filters, 
  businesses, 
  onFiltersChange, 
  onReset, 
  isLoading = false,
  resultCount 
}: ReviewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localDateFrom, setLocalDateFrom] = useState(
    filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : ''
  );
  const [localDateTo, setLocalDateTo] = useState(
    filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : ''
  );

  const hasActiveFilters = filters.search || 
    filters.rating !== null || 
    filters.status !== 'all' || 
    filters.businessId !== 'all' || 
    filters.dateRange.from || 
    filters.dateRange.to;

  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, search: value });
  }, [filters, onFiltersChange]);

  const handleRatingChange = useCallback((value: string) => {
    const rating = value === 'all' ? null : parseInt(value);
    onFiltersChange({ ...filters, rating });
  }, [filters, onFiltersChange]);

  const handleStatusChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, status: value as any });
  }, [filters, onFiltersChange]);

  const handleBusinessChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, businessId: value });
  }, [filters, onFiltersChange]);

  const handleDateFromChange = useCallback((value: string) => {
    setLocalDateFrom(value);
    const date = value ? new Date(value) : null;
    onFiltersChange({ 
      ...filters, 
      dateRange: { ...filters.dateRange, from: date }
    });
  }, [filters, onFiltersChange]);

  const handleDateToChange = useCallback((value: string) => {
    setLocalDateTo(value);
    const date = value ? new Date(value) : null;
    onFiltersChange({ 
      ...filters, 
      dateRange: { ...filters.dateRange, to: date }
    });
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    setLocalDateFrom('');
    setLocalDateTo('');
    onReset();
  }, [onReset]);

  return (
    <div className="bg-white dark:bg-neutral-dark rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Search and Filter Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews, customers, or replies..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            disabled={isLoading}
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
            {hasActiveFilters && (
              <>
                <span>•</span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-primary hover:text-primary-dark font-medium"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear filters
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
              hasActiveFilters
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            disabled={isLoading}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                {[
                  filters.rating !== null,
                  filters.status !== 'all',
                  filters.businessId !== 'all',
                  filters.dateRange.from,
                  filters.dateRange.to
                ].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Star className="inline h-4 w-4 mr-1" />
                Rating
              </label>
              <select
                value={filters.rating === null ? 'all' : filters.rating.toString()}
                onChange={(e) => handleRatingChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                disabled={isLoading}
              >
                {RATING_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                disabled={isLoading}
              >
                {REVIEW_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Filter */}
            {businesses.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Business
                </label>
                <select
                  value={filters.businessId}
                  onChange={(e) => handleBusinessChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  disabled={isLoading}
                >
                  <option value="all">All Businesses</option>
                  {businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className={businesses.length > 1 ? 'sm:col-span-2 lg:col-span-1' : 'sm:col-span-2'}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={localDateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="From"
                  disabled={isLoading}
                />
                <input
                  type="date"
                  value={localDateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  min={localDateFrom}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="To"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}