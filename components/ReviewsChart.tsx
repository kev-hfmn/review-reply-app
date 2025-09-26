import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { ChartDataPoint } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ReviewsChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export default function ReviewsChart({ data, isLoading }: ReviewsChartProps) {
  const maxReviews = Math.max(...data.map(d => d.reviews), 1);
  const hasAnyData = data.some(d => d.reviews > 0);

  // Function to get bar color based on star rating
  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 5: return '#059669'; // emerald-600
      case 4: return '#65a30d'; // lime-600
      case 3: return '#ca8a04'; // yellow-600
      case 2: return '#ea580c'; // orange-600
      case 1: return '#dc2626'; // red-600/ red-700
      default: return 'hsl(var(--border))';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Reviews Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-between mb-6">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        </CardContent>
        </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Reviews Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-muted-foreground font-medium">
              No reviews yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your review analytics will appear here once you start receiving reviews
            </p>
          </div>
        </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Reviews Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>


      <div className="h-64 flex items-end justify-between space-x-0 px-1">
        {data.map((point, index) => {
          const totalHeight = hasAnyData
            ? Math.max((point.reviews / maxReviews) * 180, point.reviews > 0 ? 12 : 0)
            : 0;

          // Create stacked segments based on rating breakdown
          const segments = [];
          if (point.ratingBreakdown && point.reviews > 0) {
            let cumulativeHeight = 0;
            // Process ratings in reverse order (5 to 1) so 5-star appears at top
            for (let rating = 5; rating >= 1; rating--) {
              const count = point.ratingBreakdown[rating] || 0;
              if (count > 0) {
                const segmentHeight = (count / point.reviews) * totalHeight;
                segments.push({
                  rating,
                  count,
                  height: segmentHeight,
                  color: getRatingColor(rating),
                  bottom: cumulativeHeight
                });
                cumulativeHeight += segmentHeight;
              }
            }
          }

          return (
            <div key={point.date} className="flex flex-col items-center space-y-2 flex-1">
              <div className="flex flex-col items-center space-y-1 h-[200px] justify-end">
                {/* Tooltip with review count and rating breakdown */}
                <div className="group relative">
                  <div className="relative w-6" style={{ height: `${totalHeight}px`, minHeight: point.reviews > 0 ? '12px' : '2px' }}>
                    {point.reviews > 0 && segments.length > 0 ? (
                      // Stacked segments
                      segments.map((segment, segIndex) => (
                        <motion.div
                          key={`${point.date}-${segment.rating}`}
                          initial={{ height: 0 }}
                          animate={{ height: segment.height }}
                          transition={{ delay: index * 0.05 + segIndex * 0.02, duration: 0.5 }}
                          className="absolute w-full cursor-pointer transition-all duration-200 hover:opacity-80 "
                          style={{
                            height: `${segment.height}px`,
                            backgroundColor: segment.color,
                            bottom: `${segment.bottom}px`,
                            borderTopLeftRadius: segIndex === 0 ? '0px' : '7px',
                            borderTopRightRadius: segIndex === 0 ? '0px' : '7px'
                          }}
                        />
                      ))
                    ) : (
                      // Empty state
                      <div
                        className="w-full h-full rounded-t-sm"
                        style={{
                          backgroundColor: 'hsl(var(--border))',
                          minHeight: '2px'
                        }}
                      />
                    )}
                  </div>

                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium">{point.reviews} review{point.reviews !== 1 ? 's' : ''}</div>
                      {point.ratingBreakdown && point.reviews > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = point.ratingBreakdown[rating] || 0;
                            if (count > 0) {
                              return (
                                <div key={rating} className="flex items-center justify-between gap-2 text-xs">
                                  <span style={{ color: getRatingColor(rating) }}>
                                    {rating}★
                                  </span>
                                  <span>{count}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                          {point.avgRating && point.avgRating > 0 && (
                            <div className="border-t border-slate-700 pt-1 mt-1 text-slate-300">
                              {point.avgRating}★ avg
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-slate-400 mt-1">{formatDate(point.date)}</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>

                {/* Review count label */}
                {point.reviews > 0 && (
                  <span className="text-xs font-medium text-foreground/75">
                    {point.reviews}
                  </span>
                )}
              </div>

              {/* Date label */}
              <span className="pt-2 text-xs text-muted-foreground/80 transform -rotate-45 origin-center whitespace-nowrap">
                {formatDate(point.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary stats and legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex justify-between text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Total: </span>
            <span className="font-medium text-foreground">
              {data.reduce((sum, d) => sum + d.reviews, 0)} reviews
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg: </span>
            <span className="font-medium text-foreground">
              {(data.reduce((sum, d) => sum + d.reviews, 0) / data.length).toFixed(1)}/day
            </span>
          </div>
        </div>

        {/* Color legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRatingColor(1) }}></div>
            <span>1★</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRatingColor(2) }}></div>
            <span>2★</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRatingColor(3) }}></div>
            <span>3★</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRatingColor(4) }}></div>
            <span>4★</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRatingColor(5) }}></div>
            <span>5★</span>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
