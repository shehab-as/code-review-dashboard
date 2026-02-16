'use client';

import useSWR from 'swr';
import { PRWithMetrics, Repository } from '@/lib/types';

interface UsePRsOptions {
  token?: string;
  repositories?: Repository[];
  refreshInterval?: number;
}

async function fetcher([token, repositories]: [string, Repository[]]) {
  const response = await fetch('/api/github/prs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, repositories }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch PRs');
  }

  const data = await response.json();
  return data.prs as PRWithMetrics[];
}

export function usePRs({ token, repositories, refreshInterval = 60000 }: UsePRsOptions) {
  const shouldFetch = token && repositories && repositories.length > 0;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? ['prs', token, repositories] : null,
    ([, t, r]) => fetcher([t, r]),
    {
      refreshInterval,
      revalidateOnFocus: false,
    }
  );

  return {
    prs: data || [],
    isLoading,
    error,
    mutate,
  };
}
