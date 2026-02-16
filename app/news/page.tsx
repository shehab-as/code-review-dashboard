'use client';

import { useState } from 'react';
import { useHackerNews } from '@/hooks/useHackerNews';
import { HNStory, StoryType } from '@/lib/hn';
import { formatDistanceToNow } from 'date-fns';

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function StoryCard({ story, rank }: { story: HNStory; rank: number }) {
  const timeAgo = formatDistanceToNow(new Date(story.time * 1000), { addSuffix: true });

  return (
    <div className="group flex gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-hn-orange/40 hover:shadow-md transition-all">
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 group-hover:bg-hn-orange group-hover:text-white transition-colors">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <a
            href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-hn-orange transition-colors leading-snug"
          >
            {story.title}
          </a>
        </div>
        {story.url && (
          <span className="text-xs text-gray-400 mt-0.5 block truncate">
            {getHostname(story.url)}
          </span>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="text-hn-orange font-semibold">{story.score}</span> points
          </span>
          <span>by {story.by}</span>
          <span>{timeAgo}</span>
          <a
            href={`https://news.ycombinator.com/item?id=${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-hn-orange transition-colors"
          >
            {story.descendants ?? 0} comments
          </a>
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [storyType, setStoryType] = useState<StoryType>('top');
  const { stories, isLoading, error } = useHackerNews(storyType, 30);

  const tabs: { value: StoryType; label: string; description: string }[] = [
    { value: 'top', label: 'Top', description: 'Trending stories' },
    { value: 'new', label: 'New', description: 'Latest submissions' },
    { value: 'best', label: 'Best', description: 'Highest rated' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hacker News</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with the developer community</p>
        </div>
        <a
          href="https://news.ycombinator.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-hn-orange text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Visit HN
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStoryType(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              storyType === tab.value
                ? 'bg-hn-orange text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-hn-orange/40 hover:text-hn-orange'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {isLoading && (
          <span className="text-sm text-gray-400 ml-2">Fetching stories...</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-600">Failed to load stories. Please try again later.</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && stories.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stories list */}
      {!isLoading && stories.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">No stories found.</div>
      )}

      <div className="space-y-3">
        {stories.map((story, index) => (
          <StoryCard key={story.id} story={story} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
