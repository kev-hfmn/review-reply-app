import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Calendar as CalendarIcon,
  Building2,
  X,
  RotateCcw
} from 'lucide-react';
import type { ReviewFiltersProps } from '@/types/reviews';
import { REVIEW_STATUSES, RATING_FILTERS } from '@/types/reviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ReviewFilters({
  filters,
  businesses,
  onFiltersChange,
  onReset,
  isLoading = false,
  resultCount
}: ReviewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

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
    onFiltersChange({ ...filters, status: value as 'all' | 'pending' | 'approved' | 'posted' | 'needs_edit' | 'skipped' });
  }, [filters, onFiltersChange]);

  const handleBusinessChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, businessId: value });
  }, [filters, onFiltersChange]);

  const handleDateFromChange = useCallback((date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, from: date || null }
    });
    setDateFromOpen(false);
  }, [filters, onFiltersChange]);

  const handleDateToChange = useCallback((date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, to: date || null }
    });
    setDateToOpen(false);
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <div className="bg-background rounded-xl p-4 shadow-sm border border-border">
      {/* Search and Filter Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reviews, customers, or replies..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4"
            disabled={isLoading}
          />
          {filters.search && (
            <Button
              onClick={() => handleSearchChange('')}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
            {hasActiveFilters && (
              <>
                <span>•</span>
                <Button
                  onClick={handleReset}
                  variant="link"
                  size="sm"
                  className="flex items-center gap-1 text-primary hover:text-primary-dark font-medium p-0 h-auto"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear filters
                </Button>
              </>
            )}
          </div>

          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant={hasActiveFilters ? "default" : "outline"}
            className="flex items-center gap-2"
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
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-4 border-t border-border overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Star className="inline h-4 w-4 mr-1" />
                Rating
              </label>
              <Select
                value={filters.rating === null ? 'all' : filters.rating.toString()}
                onValueChange={handleRatingChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATING_FILTERS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={handleStatusChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Filter */}
            {businesses.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Business
                </label>
                <Select
                  value={filters.businessId}
                  onValueChange={handleBusinessChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Businesses</SelectItem>
                    {businesses.map(business => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className={businesses.length > 1 ? 'sm:col-span-2 lg:col-span-1' : 'sm:col-span-2'}>
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "dd.MM.yyyy")
                      ) : (
                        <span>From date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from || undefined}
                      onSelect={handleDateFromChange}
                      disabled={(date) =>
                        date > new Date() || (filters.dateRange.to ? date > filters.dateRange.to : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "dd.MM.yyyy")
                      ) : (
                        <span>To date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to || undefined}
                      onSelect={handleDateToChange}
                      disabled={(date) =>
                        date > new Date() || (filters.dateRange.from ? date < filters.dateRange.from : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
