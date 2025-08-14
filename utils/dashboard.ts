import React from 'react';
import {
  MessageSquare,
  Activity,
  Star,
  Clock,
  Settings,
  PlusCircle,
  CheckCircle
} from 'lucide-react';
import type { DashboardMetric, Activity as ActivityType, DashboardActivity } from '@/types/dashboard';

export function formatMetricChange(value: number): string {
  if (value === 0) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
}

export function getActivityIcon(type: ActivityType['type']): React.ReactElement {
  switch (type) {
    case 'review_received':
      return React.createElement(PlusCircle, { className: "h-4 w-4" });
    case 'reply_posted':
      return React.createElement(MessageSquare, { className: "h-4 w-4" });
    case 'reply_approved':
      return React.createElement(CheckCircle, { className: "h-4 w-4" });
    case 'settings_updated':
      return React.createElement(Settings, { className: "h-4 w-4" });
    default:
      return React.createElement(Activity, { className: "h-4 w-4" });
  }
}

export function convertActivitiesToDashboard(activities: ActivityType[]): DashboardActivity[] {
  return activities.map(activity => ({
    id: activity.id,
    action: activity.description,
    timestamp: formatTimeAgo(activity.created_at),
    icon: getActivityIcon(activity.type),
    type: activity.type
  }));
}

export function createMetrics(
  reviewsThisWeek: number, // Actually monthly data now
  reviewsThisWeekChange: number,
  repliesPosted: number,
  repliesPostedChange: number,
  avgRating: number,
  avgRatingChange: number,
  pendingApprovals: number,
  pendingApprovalsChange: number
): DashboardMetric[] {
  return [
    {
      title: "Reviews this month",
      value: reviewsThisWeek.toString(),
      change: formatMetricChange(reviewsThisWeekChange),
      icon: React.createElement(MessageSquare, { className: "h-6 w-6 text-primary" }),
      trend: reviewsThisWeekChange >= 0 ? 'up' : 'down'
    },
    {
      title: "Replies posted",
      value: repliesPosted.toString(),
      change: formatMetricChange(repliesPostedChange),
      icon: React.createElement(Activity, { className: "h-6 w-6 text-primary" }),
      trend: repliesPostedChange >= 0 ? 'up' : 'down',
      subtitle: "This month"
    },
    {
      title: "Avg rating",
      value: formatRating(avgRating),
      change: formatMetricChange(avgRatingChange),
      icon: React.createElement(Star, { className: "h-6 w-6 text-primary" }),
      trend: avgRatingChange >= 0 ? 'up' : 'down',
      subtitle: "This month"
    },
    {
      title: "Without a reply",
      value: pendingApprovals.toString(),
      change: formatMetricChange(pendingApprovalsChange),
      icon: React.createElement(Clock, { className: "h-6 w-6 text-primary" }),
      trend: pendingApprovalsChange <= 0 ? 'up' : 'down', // Lower pending is better
      subtitle: "All time"
    }
  ];
}

export function getEmptyStateMetrics(): DashboardMetric[] {
  return createMetrics(0, 0, 0, 0, 0, 0, 0, 0);
}
