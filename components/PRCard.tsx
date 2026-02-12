'use client';

import { PRWithMetrics } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import AlertBadge from './alerts/AlertBadge';

interface PRCardProps {
  pr: PRWithMetrics;
}

export default function PRCard({ pr }: PRCardProps) {
  const reviewStatusConfig = {
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    changes_requested: { label: 'Changes Requested', color: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    no_reviews: { label: 'No Reviews', color: 'bg-gray-100 text-gray-800' },
  };

  const { label, color } = reviewStatusConfig[pr.reviewStatus];

  const ciStatus = pr.checks.find(c => c.status === 'completed' && c.conclusion === 'failure')
    ? 'failing'
    : pr.checks.some(c => c.status === 'completed' && c.conclusion === 'success')
    ? 'passing'
    : 'pending';

  return (
    <a
      href={pr.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {pr.title} <span className="text-gray-500 text-sm">#{pr.number}</span>
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <img
              src={pr.user.avatar_url}
              alt={pr.user.login}
              className="w-5 h-5 rounded-full"
            />
            <span>{pr.user.login}</span>
            <span>•</span>
            <span>{pr.repository}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
            {label}
          </span>
          {ciStatus === 'failing' && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              CI Failing
            </span>
          )}
          {ciStatus === 'passing' && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              CI Passing
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>💬 {pr.comments || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            {pr.requested_reviewers.length > 0 ? (
              <div className="flex -space-x-1">
                {pr.requested_reviewers.slice(0, 3).map(reviewer => (
                  <img
                    key={reviewer.login}
                    src={reviewer.avatar_url}
                    alt={reviewer.login}
                    className="w-6 h-6 rounded-full border-2 border-white"
                    title={reviewer.login}
                  />
                ))}
                {pr.requested_reviewers.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                    +{pr.requested_reviewers.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">No reviewers</span>
            )}
          </div>
        </div>

        {pr.alerts.length > 0 && (
          <div className="flex space-x-1">
            {pr.alerts.map((alert, idx) => (
              <AlertBadge key={idx} type={alert} />
            ))}
          </div>
        )}
      </div>

      {pr.ageInDays > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Age: {pr.ageInDays} {pr.ageInDays === 1 ? 'day' : 'days'}
        </div>
      )}
    </a>
  );
}
