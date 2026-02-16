'use client';

import useSWR from 'swr';
import { ReviewStats, Repository } from '@/lib/types';

interface UseAnalyticsOptions {
  token?: string;
  repositories?: Repository[];
  refreshInterval?: number;
}

async function fetcher([token, repositories]: [string, Repository[]]) {
  const response = await fetch('/api/github/stats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, repositories }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch stats');
  }

  const data = await response.json();
  return data.stats as ReviewStats;
}

export function useAnalytics({ token, repositories, refreshInterval = 120000 }: UseAnalyticsOptions) {
  const shouldFetch = token && repositories && repositories.length > 0;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? ['stats', token, repositories] : null,
    ([, t, r]) => fetcher([t, r]),
    {
      refreshInterval,
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    mutate,
  };
}
