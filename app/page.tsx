'use client';

import Link from 'next/link';
import { useGithubAuth } from '@/hooks/useGithubAuth';
import { usePRs } from '@/hooks/usePRs';
import { useAnalytics } from '@/hooks/useAnalytics';
import PRAgingChart from '@/components/analytics/PRAgingChart';
import PRList from '@/components/PRList';
import { AlertType } from '@/lib/types';

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
            My Code Reviews
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Track GitHub pull requests, monitor review times, and identify bottlenecks
            in your team&apos;s code review process.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
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

      {isLoading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-64 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Metrics + Alerts Row */}
          {(() => {
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
              <div className="flex justify-center mb-8">
                <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-center">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Open PRs</h3>
                    <p className="text-4xl font-bold text-gray-900">{stats?.totalOpenPRs ?? prs.length}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-center">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Repositories</h3>
                    <p className="text-4xl font-bold text-gray-900">{config?.repositories.length ?? 0}</p>
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
            );
          })()}

          {/* PR Age Chart + Oldest PRs side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats && <PRAgingChart stats={stats} />}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Oldest PRs</h2>
                <Link href="/queue" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <PRList
                prs={[...prs].sort((a, b) => b.ageInDays - a.ageInDays)}
                limit={5}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
