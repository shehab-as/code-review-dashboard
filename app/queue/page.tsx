'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGithubAuth } from '@/hooks/useGithubAuth';
import { usePRs } from '@/hooks/usePRs';
import PRTable from '@/components/PRTable';
import RepositoryFilter from '@/components/filters/RepositoryFilter';
import AuthorFilter from '@/components/filters/AuthorFilter';
import ReviewerFilter from '@/components/filters/ReviewerFilter';
import { PRWithMetrics } from '@/lib/types';

export default function QueuePage() {
  const router = useRouter();
  const { config, isAuthenticated, isLoading: authLoading } = useGithubAuth();
  const { prs, isLoading, error, mutate } = usePRs({
    token: config?.token,
    repositories: config?.repositories,
  });

  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/settings');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Extract unique values for filters
  const repositories = Array.from(new Set(prs.map(pr => pr.repository))).sort();
  const authors = Array.from(new Set(prs.map(pr => pr.user.login))).sort();
  const reviewers = Array.from(
    new Set(
      prs.flatMap(pr => pr.requested_reviewers.map(r => r.login))
    )
  ).sort();

  // Apply filters
  const filteredPRs = prs.filter((pr: PRWithMetrics) => {
    if (selectedRepo && pr.repository !== selectedRepo) return false;
    if (selectedAuthor && pr.user.login !== selectedAuthor) return false;
    if (selectedReviewer && !pr.requested_reviewers.some(r => r.login === selectedReviewer)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PR Queue</h1>
        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-800">{error.message}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RepositoryFilter
            repositories={repositories}
            selected={selectedRepo}
            onChange={setSelectedRepo}
          />
          <AuthorFilter
            authors={authors}
            selected={selectedAuthor}
            onChange={setSelectedAuthor}
          />
          <ReviewerFilter
            reviewers={reviewers}
            selected={selectedReviewer}
            onChange={setSelectedReviewer}
          />
        </div>
        {(selectedRepo || selectedAuthor || selectedReviewer) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedRepo('');
                setSelectedAuthor('');
                setSelectedReviewer('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredPRs.length} of {prs.length} pull requests
        </p>
      </div>

      {/* PR Table */}
      {isLoading && prs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500">Loading pull requests...</div>
        </div>
      ) : (
        <PRTable prs={filteredPRs} />
      )}
    </div>
  );
}
