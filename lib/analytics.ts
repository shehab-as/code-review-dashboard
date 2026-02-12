import { differenceInHours, differenceInDays, format, subDays } from 'date-fns';
import { PRWithMetrics, GitHubReview, AlertType, ReviewStats } from './types';

export function calculateTimeInReview(
  createdAt: string,
  reviews: GitHubReview[]
): { hours: number | null; firstReviewAt: string | null } {
  if (reviews.length === 0) {
    return { hours: null, firstReviewAt: null };
  }

  // Find first review (excluding comments)
  const substantiveReviews = reviews.filter(
    r => r.state === 'APPROVED' || r.state === 'CHANGES_REQUESTED'
  );

  if (substantiveReviews.length === 0) {
    return { hours: null, firstReviewAt: null };
  }

  const firstReview = substantiveReviews.sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  )[0];

  const hours = differenceInHours(
    new Date(firstReview.submitted_at),
    new Date(createdAt)
  );

  return {
    hours: hours,
    firstReviewAt: firstReview.submitted_at,
  };
}

export function calculatePRAge(createdAt: string): { days: number; hours: number } {
  const now = new Date();
  const created = new Date(createdAt);

  return {
    days: differenceInDays(now, created),
    hours: differenceInHours(now, created),
  };
}

export function determineReviewStatus(
  reviews: GitHubReview[]
): 'approved' | 'changes_requested' | 'pending' | 'no_reviews' {
  if (reviews.length === 0) {
    return 'no_reviews';
  }

  // Get latest review from each reviewer
  const latestReviewsByUser = new Map<string, GitHubReview>();

  reviews.forEach(review => {
    const existing = latestReviewsByUser.get(review.user.login);
    if (!existing || new Date(review.submitted_at) > new Date(existing.submitted_at)) {
      latestReviewsByUser.set(review.user.login, review);
    }
  });

  const latestReviews = Array.from(latestReviewsByUser.values());

  // Check for changes requested
  if (latestReviews.some(r => r.state === 'CHANGES_REQUESTED')) {
    return 'changes_requested';
  }

  // Check for approval
  if (latestReviews.some(r => r.state === 'APPROVED')) {
    return 'approved';
  }

  return 'pending';
}

export function identifyAlerts(pr: PRWithMetrics): AlertType[] {
  const alerts: AlertType[] = [];

  // Stale PR (>3 days)
  if (pr.ageInDays > 3) {
    alerts.push(AlertType.STALE);
  }

  // No reviewers assigned
  if (pr.requested_reviewers.length === 0) {
    alerts.push(AlertType.NO_REVIEWERS);
  }

  // Failing CI
  const failingChecks = pr.checks.filter(
    check => check.status === 'completed' && check.conclusion === 'failure'
  );
  if (failingChecks.length > 0) {
    alerts.push(AlertType.FAILING_CI);
  }

  // Changes requested but not addressed (PR updated before last review)
  if (pr.reviewStatus === 'changes_requested') {
    const lastReview = pr.reviews.sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )[0];

    if (lastReview && new Date(pr.updated_at) < new Date(lastReview.submitted_at)) {
      alerts.push(AlertType.CHANGES_REQUESTED);
    }
  }

  return alerts;
}

export function calculateReviewLoad(prs: PRWithMetrics[]): Record<string, number> {
  const load: Record<string, number> = {};

  prs.forEach(pr => {
    pr.requested_reviewers.forEach(reviewer => {
      load[reviewer.login] = (load[reviewer.login] || 0) + 1;
    });
  });

  return load;
}

export function calculateApprovalTrends(
  closedPRs: PRWithMetrics[],
  days: number = 30
): Array<{ date: string; averageApprovalTime: number; totalApproved: number }> {
  const trends: Array<{ date: string; averageApprovalTime: number; totalApproved: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Filter PRs closed on this date
    const prsClosedOnDate = closedPRs.filter(pr => {
      const closedDate = format(new Date(pr.updated_at), 'yyyy-MM-dd');
      return closedDate === dateStr && pr.reviewStatus === 'approved';
    });

    const totalApproved = prsClosedOnDate.length;
    const averageApprovalTime = totalApproved > 0
      ? prsClosedOnDate.reduce((sum, pr) => sum + (pr.timeInReviewHours || 0), 0) / totalApproved
      : 0;

    trends.push({
      date: dateStr,
      averageApprovalTime,
      totalApproved,
    });
  }

  return trends;
}

export function calculateStats(prs: PRWithMetrics[]): ReviewStats {
  // Average review time
  const prsWithReviews = prs.filter(pr => pr.timeInReviewHours !== null);
  const averageReviewTimeHours = prsWithReviews.length > 0
    ? prsWithReviews.reduce((sum, pr) => sum + (pr.timeInReviewHours || 0), 0) / prsWithReviews.length
    : 0;

  // Average review time by repository
  const averageReviewTimeByRepo: Record<string, number> = {};
  const repoGroups: Record<string, PRWithMetrics[]> = {};

  prs.forEach(pr => {
    const repoKey = pr.repository;
    if (!repoGroups[repoKey]) {
      repoGroups[repoKey] = [];
    }
    repoGroups[repoKey].push(pr);
  });

  Object.entries(repoGroups).forEach(([repo, repoPRs]) => {
    const withReviews = repoPRs.filter(pr => pr.timeInReviewHours !== null);
    averageReviewTimeByRepo[repo] = withReviews.length > 0
      ? withReviews.reduce((sum, pr) => sum + (pr.timeInReviewHours || 0), 0) / withReviews.length
      : 0;
  });

  // PR aging distribution
  const prAgingDistribution = {
    lessThanOneDay: prs.filter(pr => pr.ageInDays < 1).length,
    oneToThreeDays: prs.filter(pr => pr.ageInDays >= 1 && pr.ageInDays <= 3).length,
    threeToSevenDays: prs.filter(pr => pr.ageInDays > 3 && pr.ageInDays <= 7).length,
    moreThanSevenDays: prs.filter(pr => pr.ageInDays > 7).length,
  };

  // Review load
  const reviewLoadByMember = calculateReviewLoad(prs);

  // Alerts
  const totalAlerts = prs.reduce((sum, pr) => sum + pr.alerts.length, 0);
  const alertsByType: Record<AlertType, number> = {
    [AlertType.STALE]: 0,
    [AlertType.NO_REVIEWERS]: 0,
    [AlertType.FAILING_CI]: 0,
    [AlertType.CHANGES_REQUESTED]: 0,
  };

  prs.forEach(pr => {
    pr.alerts.forEach(alert => {
      alertsByType[alert]++;
    });
  });

  return {
    averageReviewTimeHours,
    averageReviewTimeByRepo,
    prAgingDistribution,
    reviewLoadByMember,
    approvalTrends: [], // Will be populated separately with closed PRs
    totalOpenPRs: prs.length,
    totalAlerts,
    alertsByType,
  };
}
