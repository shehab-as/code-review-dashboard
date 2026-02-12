import {
  calculateTimeInReview,
  calculatePRAge,
  determineReviewStatus,
  identifyAlerts,
  calculateReviewLoad,
  calculateStats,
} from '@/lib/analytics';
import { AlertType } from '@/lib/types';
import { makePR, makeReview, makeCheck } from './helpers';

// ─── calculateTimeInReview ──────────────────────────────────────────

describe('calculateTimeInReview', () => {
  it('returns null when there are no reviews', () => {
    const result = calculateTimeInReview('2026-02-01T10:00:00Z', []);
    expect(result.hours).toBeNull();
    expect(result.firstReviewAt).toBeNull();
  });

  it('returns null when reviews are only comments', () => {
    const reviews = [
      makeReview({ state: 'COMMENTED', submitted_at: '2026-02-02T10:00:00Z' }),
    ];
    const result = calculateTimeInReview('2026-02-01T10:00:00Z', reviews);
    expect(result.hours).toBeNull();
  });

  it('calculates hours from creation to first substantive review', () => {
    const reviews = [
      makeReview({ state: 'APPROVED', submitted_at: '2026-02-02T10:00:00Z' }),
    ];
    const result = calculateTimeInReview('2026-02-01T10:00:00Z', reviews);
    expect(result.hours).toBe(24);
    expect(result.firstReviewAt).toBe('2026-02-02T10:00:00Z');
  });

  it('picks the earliest substantive review', () => {
    const reviews = [
      makeReview({ state: 'CHANGES_REQUESTED', submitted_at: '2026-02-03T10:00:00Z', user: { login: 'carol', avatar_url: '' } }),
      makeReview({ state: 'APPROVED', submitted_at: '2026-02-02T10:00:00Z' }),
    ];
    const result = calculateTimeInReview('2026-02-01T10:00:00Z', reviews);
    expect(result.hours).toBe(24);
    expect(result.firstReviewAt).toBe('2026-02-02T10:00:00Z');
  });
});

// ─── calculatePRAge ─────────────────────────────────────────────────

describe('calculatePRAge', () => {
  it('returns positive days and hours for a past date', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const age = calculatePRAge(oneDayAgo);
    expect(age.days).toBeGreaterThanOrEqual(1);
    expect(age.hours).toBeGreaterThanOrEqual(25);
  });

  it('returns 0 for a PR just created', () => {
    const age = calculatePRAge(new Date().toISOString());
    expect(age.days).toBe(0);
    expect(age.hours).toBe(0);
  });
});

// ─── determineReviewStatus ──────────────────────────────────────────

describe('determineReviewStatus', () => {
  it('returns no_reviews when empty', () => {
    expect(determineReviewStatus([])).toBe('no_reviews');
  });

  it('returns approved when latest review is approval', () => {
    const reviews = [makeReview({ state: 'APPROVED' })];
    expect(determineReviewStatus(reviews)).toBe('approved');
  });

  it('returns changes_requested when latest review requests changes', () => {
    const reviews = [makeReview({ state: 'CHANGES_REQUESTED' })];
    expect(determineReviewStatus(reviews)).toBe('changes_requested');
  });

  it('changes_requested takes precedence over approval from different reviewers', () => {
    const reviews = [
      makeReview({ state: 'APPROVED', user: { login: 'alice', avatar_url: '' }, submitted_at: '2026-02-02T10:00:00Z' }),
      makeReview({ state: 'CHANGES_REQUESTED', user: { login: 'bob', avatar_url: '' }, submitted_at: '2026-02-02T12:00:00Z' }),
    ];
    expect(determineReviewStatus(reviews)).toBe('changes_requested');
  });

  it('uses the latest review per user', () => {
    const reviews = [
      makeReview({ state: 'CHANGES_REQUESTED', submitted_at: '2026-02-01T10:00:00Z' }),
      makeReview({ state: 'APPROVED', submitted_at: '2026-02-02T10:00:00Z' }),
    ];
    // Same user (bob) — latest is APPROVED
    expect(determineReviewStatus(reviews)).toBe('approved');
  });

  it('returns pending when only comments exist', () => {
    const reviews = [makeReview({ state: 'COMMENTED' })];
    expect(determineReviewStatus(reviews)).toBe('pending');
  });
});

// ─── identifyAlerts ─────────────────────────────────────────────────

describe('identifyAlerts', () => {
  it('flags stale PR (>3 days)', () => {
    const pr = makePR({ ageInDays: 5 });
    const alerts = identifyAlerts(pr);
    expect(alerts).toContain(AlertType.STALE);
  });

  it('does not flag fresh PR', () => {
    const pr = makePR({ ageInDays: 1 });
    const alerts = identifyAlerts(pr);
    expect(alerts).not.toContain(AlertType.STALE);
  });

  it('flags PR with no reviewers', () => {
    const pr = makePR({ requested_reviewers: [] });
    const alerts = identifyAlerts(pr);
    expect(alerts).toContain(AlertType.NO_REVIEWERS);
  });

  it('does not flag PR with reviewers assigned', () => {
    const pr = makePR({
      requested_reviewers: [{ login: 'bob', avatar_url: '' }],
    });
    const alerts = identifyAlerts(pr);
    expect(alerts).not.toContain(AlertType.NO_REVIEWERS);
  });

  it('flags PR with failing CI', () => {
    const pr = makePR({
      checks: [makeCheck({ status: 'completed', conclusion: 'failure' })],
    });
    const alerts = identifyAlerts(pr);
    expect(alerts).toContain(AlertType.FAILING_CI);
  });

  it('does not flag PR with passing CI', () => {
    const pr = makePR({
      checks: [makeCheck({ status: 'completed', conclusion: 'success' })],
    });
    const alerts = identifyAlerts(pr);
    expect(alerts).not.toContain(AlertType.FAILING_CI);
  });

  it('flags changes_requested when PR not updated after review', () => {
    const pr = makePR({
      reviewStatus: 'changes_requested',
      updated_at: '2026-02-01T08:00:00Z',
      reviews: [
        makeReview({ state: 'CHANGES_REQUESTED', submitted_at: '2026-02-01T10:00:00Z' }),
      ],
    });
    const alerts = identifyAlerts(pr);
    expect(alerts).toContain(AlertType.CHANGES_REQUESTED);
  });

  it('does not flag changes_requested when PR updated after review', () => {
    const pr = makePR({
      reviewStatus: 'changes_requested',
      updated_at: '2026-02-02T10:00:00Z',
      reviews: [
        makeReview({ state: 'CHANGES_REQUESTED', submitted_at: '2026-02-01T10:00:00Z' }),
      ],
    });
    const alerts = identifyAlerts(pr);
    expect(alerts).not.toContain(AlertType.CHANGES_REQUESTED);
  });

  it('can return multiple alerts at once', () => {
    const pr = makePR({
      ageInDays: 10,
      requested_reviewers: [],
      checks: [makeCheck({ status: 'completed', conclusion: 'failure' })],
    });
    const alerts = identifyAlerts(pr);
    expect(alerts).toContain(AlertType.STALE);
    expect(alerts).toContain(AlertType.NO_REVIEWERS);
    expect(alerts).toContain(AlertType.FAILING_CI);
  });
});

// ─── calculateReviewLoad ────────────────────────────────────────────

describe('calculateReviewLoad', () => {
  it('returns empty object for no PRs', () => {
    expect(calculateReviewLoad([])).toEqual({});
  });

  it('counts PRs per reviewer', () => {
    const prs = [
      makePR({ requested_reviewers: [{ login: 'bob', avatar_url: '' }] }),
      makePR({ requested_reviewers: [{ login: 'bob', avatar_url: '' }, { login: 'carol', avatar_url: '' }] }),
    ];
    const load = calculateReviewLoad(prs);
    expect(load['bob']).toBe(2);
    expect(load['carol']).toBe(1);
  });
});

// ─── calculateStats ─────────────────────────────────────────────────

describe('calculateStats', () => {
  it('returns zeroed stats for empty PR list', () => {
    const stats = calculateStats([]);
    expect(stats.totalOpenPRs).toBe(0);
    expect(stats.totalAlerts).toBe(0);
    expect(stats.averageReviewTimeHours).toBe(0);
    expect(stats.prAgingDistribution.lessThanOneDay).toBe(0);
  });

  it('calculates correct totals', () => {
    const prs = [
      makePR({ ageInDays: 0, timeInReviewHours: 10, alerts: [AlertType.NO_REVIEWERS] }),
      makePR({ ageInDays: 2, timeInReviewHours: 20, alerts: [] }),
      makePR({ ageInDays: 5, timeInReviewHours: null, alerts: [AlertType.STALE] }),
    ];
    const stats = calculateStats(prs);
    expect(stats.totalOpenPRs).toBe(3);
    expect(stats.totalAlerts).toBe(2);
    expect(stats.averageReviewTimeHours).toBe(15); // (10+20)/2, null excluded
  });

  it('buckets PR ages correctly', () => {
    const prs = [
      makePR({ ageInDays: 0 }),
      makePR({ ageInDays: 2 }),
      makePR({ ageInDays: 5 }),
      makePR({ ageInDays: 10 }),
    ];
    const stats = calculateStats(prs);
    expect(stats.prAgingDistribution.lessThanOneDay).toBe(1);
    expect(stats.prAgingDistribution.oneToThreeDays).toBe(1);
    expect(stats.prAgingDistribution.threeToSevenDays).toBe(1);
    expect(stats.prAgingDistribution.moreThanSevenDays).toBe(1);
  });

  it('groups average review time by repository', () => {
    const prs = [
      makePR({ repository: 'frontend', timeInReviewHours: 10 }),
      makePR({ repository: 'frontend', timeInReviewHours: 20 }),
      makePR({ repository: 'backend', timeInReviewHours: 6 }),
    ];
    const stats = calculateStats(prs);
    expect(stats.averageReviewTimeByRepo['frontend']).toBe(15);
    expect(stats.averageReviewTimeByRepo['backend']).toBe(6);
  });
});
