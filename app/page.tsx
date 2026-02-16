'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGithubAuth } from '@/hooks/useGithubAuth';
import { usePRs } from '@/hooks/usePRs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useHackerNews } from '@/hooks/useHackerNews';
import PRList from '@/components/PRList';
import { AlertType } from '@/lib/types';
import { CalendarEvent, loadEvents } from '@/lib/calendar-storage';
import { format, isToday, isTomorrow, isAfter, startOfDay } from 'date-fns';

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export default function Home() {
  const { config, isAuthenticated, isLoading: authLoading } = useGithubAuth();
  const { prs, isLoading: prsLoading } = usePRs({
    token: config?.token,
    repositories: config?.repositories,
  });
  const { stats, isLoading: statsLoading } = useAnalytics({
    token: config?.token,
    repositories: config?.repositories,
  });
  const { stories: hnStories, isLoading: hnLoading } = useHackerNews('top', 5);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const all = loadEvents();
    const today = startOfDay(new Date());
    const upcoming = all
      .filter(e => isAfter(new Date(e.date + 'T23:59:59'), today))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 5);
    setUpcomingEvents(upcoming);
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not configured — show landing page
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            My Workspace
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Your developer hub — track PRs, manage your calendar, and stay updated
            with Hacker News, all in one place.
          </p>

          <div className="mb-16">
            <Link
              href="/settings"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600">
                Track average review times, PR aging, and approval trends across your repositories.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Alerts</h3>
              <p className="text-gray-600">
                Get notified about stale PRs, missing reviewers, and failing CI/CD checks.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Queue Management</h3>
              <p className="text-gray-600">
                View and filter all open PRs with detailed status information and review metrics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">▦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar</h3>
              <p className="text-gray-600">
                Manage your schedule with a built-in calendar. Create events, set reminders, and stay organized.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">▲</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hacker News</h3>
              <p className="text-gray-600">
                Stay updated with trending stories from Hacker News. Browse top, new, and best stories.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
            <ol className="text-left text-blue-800 space-y-2">
              <li>1. Create a GitHub Personal Access Token with <code className="bg-blue-100 px-1 rounded">repo</code> scope</li>
              <li>2. Configure your token and repositories in Settings</li>
              <li>3. View your dashboard and start tracking PRs!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated — show dashboard
  const isLoading = prsLoading || statsLoading;

  const alertCounts = {
    [AlertType.STALE]: 0,
    [AlertType.NO_REVIEWERS]: 0,
    [AlertType.FAILING_CI]: 0,
  };
  prs.forEach(pr => pr.alerts.forEach(a => {
    if (a in alertCounts) alertCounts[a as keyof typeof alertCounts]++;
  }));
  const totalAlerts = Object.values(alertCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          {isLoading && <span className="text-sm text-gray-500">Refreshing...</span>}
          <Link
            href="/queue"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Queue
          </Link>
        </div>
      </div>

      {/* Top Row: HN Feed (left) + Metrics (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Hacker News Widget */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              <span className="text-hn-orange">▲</span> Hacker News
            </h2>
            <Link href="/news" className="text-hn-orange hover:text-orange-600 text-sm font-medium">
              View All
            </Link>
          </div>
          {hnLoading && hnStories.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-3.5 bg-gray-200 rounded w-5/6 mb-1.5" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {hnStories.map((story, i) => (
                <a
                  key={story.id}
                  href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <p className="text-sm text-gray-900 group-hover:text-hn-orange transition-colors leading-snug">
                    <span className="text-xs text-gray-400 mr-1.5">{i + 1}.</span>
                    {story.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {story.score} pts &middot; {story.descendants ?? 0} comments
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Metrics Panel */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-center">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Open PRs</h3>
              <p className="text-4xl font-bold text-gray-900">{isLoading && !stats ? '—' : (stats?.totalOpenPRs ?? prs.length)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-center">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Repositories</h3>
              <p className="text-4xl font-bold text-gray-900">{config?.repositories.length ?? 0}</p>
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border p-5 text-center ${totalAlerts > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Alerts</h3>
            <p className={`text-4xl font-bold mb-3 ${totalAlerts > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalAlerts}</p>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
              <div className="flex-1">
                <p className={`text-base font-bold ${alertCounts[AlertType.STALE] > 0 ? 'text-alert-stale' : 'text-gray-400'}`}>{alertCounts[AlertType.STALE]}</p>
                <p className="text-[10px] text-gray-500">Stale</p>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex-1">
                <p className={`text-base font-bold ${alertCounts[AlertType.NO_REVIEWERS] > 0 ? 'text-alert-critical' : 'text-gray-400'}`}>{alertCounts[AlertType.NO_REVIEWERS]}</p>
                <p className="text-[10px] text-gray-500">No Reviewers</p>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex-1">
                <p className={`text-base font-bold ${alertCounts[AlertType.FAILING_CI] > 0 ? 'text-alert-critical' : 'text-gray-400'}`}>{alertCounts[AlertType.FAILING_CI]}</p>
                <p className="text-[10px] text-gray-500">Failing CI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: PR Queue (left) + Calendar (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PR Queue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">PR Queue</h2>
            <Link href="/queue" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          {isLoading && prs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <PRList
              prs={[...prs].sort((a, b) => b.ageInDays - a.ageInDays)}
              limit={5}
            />
          )}
        </div>

        {/* Calendar / Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link href="/calendar" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Open Calendar
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl text-gray-300 mb-3">▦</div>
              <p className="text-sm text-gray-400 mb-3">No upcoming events</p>
              <Link
                href="/calendar"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add an event
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatEventDate(event.date)}
                      {event.time && ` at ${event.time}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
