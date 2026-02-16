'use client';

import useSWR from 'swr';
import { HNStory, StoryType } from '@/lib/hn';

async function fetcher([type, limit]: [StoryType, number]): Promise<HNStory[]> {
  const response = await fetch(`/api/hn?type=${type}&limit=${limit}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch stories');
  }
  const data = await response.json();
  return data.stories;
}

export function useHackerNews(type: StoryType = 'top', limit: number = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    ['hn', type, limit],
    ([, t, l]) => fetcher([t, l]),
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    stories: data || [],
    isLoading,
    error,
    mutate,
  };
}
