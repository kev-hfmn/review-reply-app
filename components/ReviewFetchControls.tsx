'use client';

import { useState } from 'react';
import { Calendar, Hash, RefreshCw, Download, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export interface SyncStatus {
  syncType: 'initial_backfill' | 'incremental' | null;
  isBackfillComplete: boolean;
  lastSyncTime: string | null;
  totalReviews: number;
  isFirstTime: boolean;
}

interface ReviewFetchControlsProps {
  onFetch: (options: FetchOptions) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  syncStatus?: SyncStatus;
  isSubscriber?: boolean;
  onUpgradeRequired?: () => void;
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
  disabled = false,
  syncStatus,
  isSubscriber = true,
  onUpgradeRequired
}: ReviewFetchControlsProps) {
  const [timePeriod, setTimePeriod] = useState<FetchOptions['timePeriod']>('30days');
  const [reviewCount, setReviewCount] = useState<FetchOptions['reviewCount']>(50);

  const isInitialBackfill = syncStatus?.syncType === 'initial_backfill' || syncStatus?.isFirstTime;
  const isBackfillComplete = syncStatus?.isBackfillComplete ?? false;
  const hasReviews = (syncStatus?.totalReviews ?? 0) > 0;

  const handleFetch = async () => {
    // Check subscription for sync feature
    if (!isSubscriber) {
      onUpgradeRequired?.();
      return;
    }
    
    // For initial backfill, ignore user selections and fetch everything
    if (isInitialBackfill) {
      await onFetch({ timePeriod: 'all', reviewCount: 200 });
    } else {
      // For incremental sync, use minimal settings to fetch only new reviews
      await onFetch({ timePeriod: '30days', reviewCount: 50 });
    }
  };

  // Render different UI based on sync status
  if (isInitialBackfill && !isBackfillComplete) {
    return (
      <div className="space-y-4">
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription>
            {isLoading ? (
              <>
                <strong>Initial Import in Progress</strong>
                <br />
                Fetching your complete review history from Google Business Profile (last 2 years).
                This may take a few minutes...
              </>
            ) : (
              <>
                <strong>Ready for Initial Import</strong>
                <br />
                We&apos;ll fetch all your reviews from the last 2 years to build your complete review database.
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Initial Review Import</p>
              <p className="text-sm text-muted-foreground">
                Import complete review history (2 years)
              </p>
            </div>
          </div>

          <Button
            onClick={handleFetch}
            disabled={isLoading || disabled}
            className="flex items-center gap-2"
            size="lg"
            variant={isSubscriber ? "default" : "outline"}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Importing Reviews...
              </>
            ) : !isSubscriber ? (
              <>
                <Lock className="h-4 w-4" />
                Upgrade to Import
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Start Initial Import
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Standard incremental sync UI (after backfill is complete)
  return (
    <div className="space-y-4">
      {hasReviews && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Review Database Ready</strong>
            <br />
            {syncStatus?.totalReviews} reviews imported.
            {syncStatus?.lastSyncTime && (
              <> Last sync: {new Date(syncStatus.lastSyncTime).toLocaleDateString()}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Fetch New Reviews</p>
            <p className="text-sm text-muted-foreground">
              Check for new reviews since last sync
            </p>
          </div>
        </div>

        <Button
          onClick={handleFetch}
          disabled={isLoading || disabled}
          className="flex items-center gap-2"
          variant={isSubscriber ? "primary" : "outline"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : !isSubscriber ? (
            <>
              <Lock className="h-4 w-4" />
              Upgrade to Sync
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Fetch New Reviews
            </>
          )}
        </Button>
      </div>

      {/* Legacy controls for manual fetch (collapsed by default) */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Advanced: Manual Review Fetch
        </summary>
        <div className="mt-3 flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
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
            onClick={() => {
              if (!isSubscriber) {
                onUpgradeRequired?.();
                return;
              }
              onFetch({ timePeriod, reviewCount });
            }}
            disabled={isLoading || disabled}
            className="flex items-center gap-2"
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : !isSubscriber ? (
              <Lock className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {!isSubscriber ? 'Upgrade' : 'Manual Fetch'}
          </Button>
        </div>
      </details>
    </div>
  );
}
