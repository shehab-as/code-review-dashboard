// GitHub API types
export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  requested_reviewers: Array<{
    login: string;
    avatar_url: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments?: number;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    repo: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
}

export interface GitHubReview {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at: string;
}

export interface GitHubCheck {
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | null;
  name: string;
}

// Extended PR with calculated metrics
export interface PRWithMetrics extends GitHubPR {
  repository: string;
  owner: string;
  ageInDays: number;
  ageInHours: number;
  timeInReviewHours: number | null;
  firstReviewAt: string | null;
  reviewStatus: 'approved' | 'changes_requested' | 'pending' | 'no_reviews';
  reviews: GitHubReview[];
  checks: GitHubCheck[];
  alerts: AlertType[];
}

// Alert types
export enum AlertType {
  STALE = 'stale',                    // Open > 3 days
  NO_REVIEWERS = 'no_reviewers',      // No reviewers assigned
  FAILING_CI = 'failing_ci',          // CI/CD checks failing
  CHANGES_REQUESTED = 'changes_requested', // Changes requested but not addressed
}

// Repository configuration
export interface Repository {
  owner: string;
  name: string;
  fullName: string; // "owner/name"
}

// User configuration stored in LocalStorage
export interface UserConfig {
  token: string;
  repositories: Repository[];
}

// Analytics data structures
export interface ReviewStats {
  averageReviewTimeHours: number;
  averageReviewTimeByRepo: Record<string, number>;
  prAgingDistribution: {
    lessThanOneDay: number;
    oneToThreeDays: number;
    threeToSevenDays: number;
    moreThanSevenDays: number;
  };
  reviewLoadByMember: Record<string, number>;
  approvalTrends: Array<{
    date: string;
    averageApprovalTime: number;
    totalApproved: number;
  }>;
  totalOpenPRs: number;
  totalAlerts: number;
  alertsByType: Record<AlertType, number>;
}

// Sort options
export type SortField = 'age' | 'author' | 'repository' | 'title' | 'comments';
export type SortDirection = 'asc' | 'desc';
