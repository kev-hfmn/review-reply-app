'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Mail,
  FileText,
  BarChart3,
  MessageSquare,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Using custom toast system instead of shadcn toast
import { useAuth } from '@/contexts/AuthContext';

interface WeeklyDigest {
  id: string;
  week_start: string;
  week_end: string;
  total_reviews: number;
  rating_breakdown: Record<string, number>;
  positive_themes: string[];
  improvement_themes: string[];
  highlights: Array<{
    id: string;
    customer_name: string;
    rating: number;
    review_text: string;
    type: 'best' | 'worst' | 'notable';
  }>;
}

interface DigestStats {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  weekOverWeekChange: number;
}

export default function DigestPage() {
  const { user } = useAuth();
  // TODO: Integrate with existing toast system from ToastNotifications component
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [stats, setStats] = useState<DigestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadDigestData = async () => {
      setIsLoading(true);
      try {
        // Mock data for demonstration
        const mockDigest: WeeklyDigest = {
          id: '1',
          week_start: '2025-08-05',
          week_end: '2025-08-11',
          total_reviews: 23,
          rating_breakdown: {
            '5': 12,
            '4': 6,
            '3': 3,
            '2': 1,
            '1': 1
          },
          positive_themes: [
            'Excellent customer service',
            'Fast delivery',
            'High quality products',
            'Friendly staff',
            'Great value for money'
          ],
          improvement_themes: [
            'Waiting time',
            'Product availability',
            'Communication'
          ],
          highlights: [
            {
              id: '1',
              customer_name: 'Sarah Johnson',
              rating: 5,
              review_text: 'Absolutely amazing service! The team went above and beyond to help me find exactly what I needed. Will definitely be back!',
              type: 'best'
            },
            {
              id: '2',
              customer_name: 'Mike Chen',
              rating: 5,
              review_text: 'Outstanding quality and fast delivery. This is exactly what I was looking for. Highly recommend to anyone!',
              type: 'best'
            },
            {
              id: '3',
              customer_name: 'Emma Davis',
              rating: 2,
              review_text: 'Had to wait quite a while for service. The product was good but the wait time was disappointing.',
              type: 'worst'
            }
          ]
        };

        const mockStats: DigestStats = {
          totalReviews: 23,
          averageRating: 4.2,
          responseRate: 87,
          weekOverWeekChange: 15
        };

        // In a real implementation, this would fetch from Supabase
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setDigest(mockDigest);
        setStats(mockStats);

      } catch (error) {
        console.error('Error loading digest:', error);
        // TODO: Integrate with existing toast system
        console.error('Failed to load weekly digest data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDigestData();
    }
  }, [user]);

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      // TODO: Integrate with existing toast system
      console.log("Email Sent! Weekly digest has been sent to your email address.");
    } catch {
      // TODO: Integrate with existing toast system
      console.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      // TODO: Integrate with existing toast system
      console.log("Download Ready! Your weekly digest PDF has been generated.");
    } catch {
      // TODO: Integrate with existing toast system
      console.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      // Simulate CSV generation
      const csvContent = `Week,Rating,Count\n${Object.entries(digest?.rating_breakdown || {}).map(([rating, count]) => `${digest?.week_start},${rating},${count}`).join('\n')}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-digest-${digest?.week_start}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // TODO: Integrate with existing toast system
      console.log("CSV Downloaded! Your weekly digest data has been exported.");
    } catch {
      // TODO: Integrate with existing toast system
      console.error("Failed to download CSV. Please try again.");
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 dark:text-green-400';
    if (rating >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Weekly Digest
          </h1>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading weekly digest...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!digest || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Weekly Digest
          </h1>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No digest data available
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Weekly digests will appear here once you have review data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Weekly Digest
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {new Date(digest.week_start).toLocaleDateString()} - {new Date(digest.week_end).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={isSending}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Reviews
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalReviews}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.weekOverWeekChange)}
                  <span className={`text-sm font-medium ${
                    stats.weekOverWeekChange > 0 ? 'text-green-600' :
                    stats.weekOverWeekChange < 0 ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {stats.weekOverWeekChange > 0 ? '+' : ''}{stats.weekOverWeekChange}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Average Rating
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Response Rate
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.responseRate}%
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Unique Customers
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {Math.floor(stats.totalReviews * 0.8)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rating Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(digest.rating_breakdown)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([rating, count]) => {
                  const percentage = (count / stats.totalReviews) * 100;
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Positive Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {digest.positive_themes.map((theme, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <TrendingDown className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {digest.improvement_themes.map((theme, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Review Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {digest.highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    highlight.type === 'best'
                      ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600'
                      : highlight.type === 'worst'
                      ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600'
                      : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {highlight.customer_name}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: highlight.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <Badge
                      variant={highlight.type === 'best' ? 'default' : 'destructive'}
                      className={highlight.type === 'best' ? 'bg-green-600' : ''}
                    >
                      {highlight.type === 'best' ? 'Top Review' :
                       highlight.type === 'worst' ? 'Needs Attention' : 'Notable'}
                    </Badge>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    &ldquo;{highlight.review_text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
