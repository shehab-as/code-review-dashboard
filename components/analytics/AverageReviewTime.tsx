'use client';

import { ReviewStats } from '@/lib/types';

interface AverageReviewTimeProps {
  stats: ReviewStats;
}

export default function AverageReviewTime({ stats }: AverageReviewTimeProps) {
  const formatHours = (hours: number | undefined | null) => {
    if (hours == null || isNaN(hours)) {
      return 'N/A';
    }
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Review Time</h3>

      <div className="mb-6">
        <div className="text-3xl font-bold text-blue-600">
          {formatHours(stats.averageReviewTimeHours)}
        </div>
        <p className="text-sm text-gray-600 mt-1">Overall average</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">By Repository</h4>
        {stats.averageReviewTimeByRepo && Object.entries(stats.averageReviewTimeByRepo).map(([repo, hours]) => (
          <div key={repo} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{repo}</span>
            <span className="text-sm font-medium text-gray-900">
              {formatHours(hours)}
            </span>
          </div>
        ))}
        {(!stats.averageReviewTimeByRepo || Object.keys(stats.averageReviewTimeByRepo).length === 0) && (
          <p className="text-sm text-gray-400">No review data available</p>
        )}
      </div>
    </div>
  );
}
