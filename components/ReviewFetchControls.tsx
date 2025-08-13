'use client';

import { useState } from 'react';
import { Calendar, Hash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FetchOptions {
  timePeriod: 'all' | '7days' | '30days' | '3months' | '6months';
  reviewCount: 10 | 25 | 50 | 100 | 200;
}

interface ReviewFetchControlsProps {
  onFetch: (options: FetchOptions) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

const TIME_PERIOD_OPTIONS = [
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: 'all', label: 'All time' },
] as const;

const REVIEW_COUNT_OPTIONS = [
  { value: 10, label: '10 reviews' },
  { value: 25, label: '25 reviews' },
  { value: 50, label: '50 reviews' },
  { value: 100, label: '100 reviews' },
  { value: 200, label: '200 reviews' },
] as const;

export default function ReviewFetchControls({ 
  onFetch, 
  isLoading, 
  disabled = false 
}: ReviewFetchControlsProps) {
  const [timePeriod, setTimePeriod] = useState<FetchOptions['timePeriod']>('30days');
  const [reviewCount, setReviewCount] = useState<FetchOptions['reviewCount']>(50);

  const handleFetch = async () => {
    await onFetch({ timePeriod, reviewCount });
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select
          value={timePeriod}
          onValueChange={(value) => setTimePeriod(value as FetchOptions['timePeriod'])}
          disabled={isLoading || disabled}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <Select
          value={reviewCount.toString()}
          onValueChange={(value) => setReviewCount(Number(value) as FetchOptions['reviewCount'])}
          disabled={isLoading || disabled}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_COUNT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleFetch}
        disabled={isLoading || disabled}
        className="flex items-center gap-2"
        variant="default"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Fetching...' : 'Fetch Reviews'}
      </Button>

      {isLoading && (
        <div className="text-sm text-muted-foreground">
          Fetching reviews from Google Business Profile...
        </div>
      )}
    </div>
  );
}
