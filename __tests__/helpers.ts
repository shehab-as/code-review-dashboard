import { PRWithMetrics, GitHubReview, GitHubCheck, AlertType } from '@/lib/types';

export function makePR(overrides: Partial<PRWithMetrics> = {}): PRWithMetrics {
  return {
    id: 1,
    number: 42,
    title: 'Fix login bug',
    html_url: 'https://github.com/acme/app/pull/42',
    state: 'open',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-05T10:00:00Z',
    user: { login: 'alice', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
    requested_reviewers: [
      { login: 'bob', avatar_url: 'https://avatars.githubusercontent.com/u/2' },
    ],
    assignees: [],
    labels: [],
    head: { ref: 'fix-login', sha: 'abc123' },
    base: { ref: 'main', repo: { name: 'app', owner: { login: 'acme' } } },
    repository: 'app',
    owner: 'acme',
    ageInDays: 5,
    ageInHours: 120,
    timeInReviewHours: 24,
    firstReviewAt: '2026-02-02T10:00:00Z',
    reviewStatus: 'pending',
    reviews: [],
    checks: [],
    alerts: [],
    ...overrides,
  };
}

export function makeReview(overrides: Partial<GitHubReview> = {}): GitHubReview {
  return {
    id: 1,
    user: { login: 'bob', avatar_url: 'https://avatars.githubusercontent.com/u/2' },
    state: 'APPROVED',
    submitted_at: '2026-02-02T10:00:00Z',
    ...overrides,
  };
}

export function makeCheck(overrides: Partial<GitHubCheck> = {}): GitHubCheck {
  return {
    status: 'completed',
    conclusion: 'success',
    name: 'ci',
    ...overrides,
  };
}
