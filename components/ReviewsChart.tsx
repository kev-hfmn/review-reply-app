import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { ChartDataPoint } from '@/types/dashboard';

interface ReviewsChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export default function ReviewsChart({ data, isLoading }: ReviewsChartProps) {
  const maxReviews = Math.max(...data.map(d => d.reviews), 1);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Reviews Over Time
          </h3>
          <BarChart3 className="h-5 w-5 text-slate-400" />
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0 || data.every(d => d.reviews === 0)) {
    return (
      <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Reviews Over Time
          </h3>
          <BarChart3 className="h-5 w-5 text-slate-400" />
        </div>
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No reviews yet
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Your review analytics will appear here once you start receiving reviews
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Reviews Over Time
        </h3>
        <BarChart3 className="h-5 w-5 text-slate-400" />
      </div>
      
      <div className="h-64 flex items-end justify-between space-x-1 px-2">
        {data.map((point, index) => {
          const height = maxReviews > 0 ? (point.reviews / maxReviews) * 100 : 0;
          
          return (
            <div key={point.date} className="flex flex-col items-center space-y-2 flex-1">
              <div className="flex flex-col items-center space-y-1 min-h-[200px] justify-end">
                {/* Tooltip with review count and rating */}
                <div className="group relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="w-full bg-primary/80 hover:bg-primary rounded-t-sm min-h-[4px] cursor-pointer transition-colors"
                    style={{ minHeight: point.reviews > 0 ? '4px' : '0px' }}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium">{point.reviews} reviews</div>
                      {point.avgRating > 0 && (
                        <div className="text-slate-300">{point.avgRating}★ avg</div>
                      )}
                      <div className="text-slate-400">{formatDate(point.date)}</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
                
                {/* Review count label */}
                {point.reviews > 0 && (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {point.reviews}
                  </span>
                )}
              </div>
              
              {/* Date label */}
              <span className="text-xs text-slate-500 dark:text-slate-400 transform -rotate-45 origin-center whitespace-nowrap">
                {formatDate(point.date)}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Total: </span>
          <span className="font-medium text-slate-900 dark:text-white">
            {data.reduce((sum, d) => sum + d.reviews, 0)} reviews
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Avg: </span>
          <span className="font-medium text-slate-900 dark:text-white">
            {(data.reduce((sum, d) => sum + d.reviews, 0) / data.length).toFixed(1)}/day
          </span>
        </div>
      </div>
    </div>
  );
}