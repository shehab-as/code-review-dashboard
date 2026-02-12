'use client';

import { PRWithMetrics } from '@/lib/types';
import PRCard from './PRCard';

interface PRListProps {
  prs: PRWithMetrics[];
  limit?: number;
}

export default function PRList({ prs, limit }: PRListProps) {
  const displayPRs = limit ? prs.slice(0, limit) : prs;

  if (prs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pull requests found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayPRs.map(pr => (
        <PRCard key={pr.id} pr={pr} />
      ))}
      {limit && prs.length > limit && (
        <p className="text-center text-sm text-gray-500">
          Showing {limit} of {prs.length} PRs
        </p>
      )}
    </div>
  );
}
