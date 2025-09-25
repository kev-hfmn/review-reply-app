import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Calendar as CalendarIcon,
  X,
  RotateCcw
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReviewFiltersProps, SelectionState } from '@/types/reviews';
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

interface ExtendedReviewFiltersProps extends ReviewFiltersProps {
  selection: SelectionState;
  onSelectAll: () => void;
}

export default function ReviewFilters({
  filters,
  onFiltersChange,
  onReset,
  isLoading = false,
  resultCount,
  selection,
  onSelectAll
}: ExtendedReviewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const hasActiveFilters = filters.search ||
    filters.rating !== null ||
    filters.status !== 'all' ||
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
    <div className="bg-card rounded-2xl p-4 border border-border">
      {/* Search and Filter Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-grow max-w-xs">
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

          {/* Select All Checkbox */}
          <div className="flex items-center border-l border-border pl-4">
            <Checkbox
              checked={selection.isAllSelected}
              onCheckedChange={onSelectAll}
              className="h-4 w-4"
            />
            <span className="ml-3 text-sm font-medium text-muted-foreground whitespace-nowrap">
              {selection.selectedIds.size > 0
                ? `${selection.selectedIds.size} selected`
                : 'Select all'}
            </span>
          </div>
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
            variant={hasActiveFilters ? "pillActive" : "pill"}
            className="flex items-center gap-2"
            disabled={isLoading}
            size="sm"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-foreground/10 text-foreground px-1 py-0.5 rounded text-xs font-semibold">
                {[
                  filters.rating !== null,
                  filters.status !== 'all',
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
          className="mt-4 pt-4 border-t border-border overflow-visible"
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


            {/* Date Range */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outlineDefault"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input border border-border rounded-lg",
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
                      variant="outlineDefault"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input border border-border rounded-lg",
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
