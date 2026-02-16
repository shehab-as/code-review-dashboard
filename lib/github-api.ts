import { Octokit } from '@octokit/rest';
import { GitHubPR, GitHubReview, GitHubCheck, PRWithMetrics, Repository } from './types';
import {
  calculatePRAge,
  calculateTimeInReview,
  determineReviewStatus,
  identifyAlerts,
} from './analytics';

export async function fetchPRsForRepo(
  client: Octokit,
  owner: string,
  repo: string
): Promise<GitHubPR[]> {
  try {
    const { data } = await client.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 100,
    });

    return data as GitHubPR[];
  } catch (error) {
    console.error(`Error fetching PRs for ${owner}/${repo}:`, error);
    throw error;
  }
}

export async function fetchReviewsForPR(
  client: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubReview[]> {
  try {
    const { data } = await client.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    return data as GitHubReview[];
  } catch (error) {
    console.error(`Error fetching reviews for ${owner}/${repo}#${prNumber}:`, error);
    return [];
  }
}

export async function fetchPRChecks(
  client: Octokit,
  owner: string,
  repo: string,
  ref: string
): Promise<GitHubCheck[]> {
  try {
    const { data } = await client.checks.listForRef({
      owner,
      repo,
      ref,
      per_page: 100,
    });

    return data.check_runs.map(check => ({
      status: check.status as 'queued' | 'in_progress' | 'completed',
      conclusion: check.conclusion as GitHubCheck['conclusion'],
      name: check.name,
    }));
  } catch (error) {
    console.error(`Error fetching checks for ${owner}/${repo}@${ref}:`, error);
    return [];
  }
}

export async function fetchClosedPRs(
  client: Octokit,
  owner: string,
  repo: string,
  since: Date
): Promise<GitHubPR[]> {
  try {
    const { data } = await client.pulls.list({
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    // Filter by date
    return data.filter(pr => new Date(pr.updated_at) >= since) as GitHubPR[];
  } catch (error) {
    console.error(`Error fetching closed PRs for ${owner}/${repo}:`, error);
    return [];
  }
}

export async function testConnection(client: Octokit): Promise<boolean> {
  try {
    await client.users.getAuthenticated();
    return true;
  } catch {
    return false;
  }
}

// Shared PR enrichment: fetches reviews + checks, computes metrics and alerts
function enrichPR(
  pr: GitHubPR,
  repo: Repository,
  reviews: GitHubReview[],
  checks: GitHubCheck[]
): PRWithMetrics {
  const age = calculatePRAge(pr.created_at);
  const timeInReview = calculateTimeInReview(pr.created_at, reviews);
  const reviewStatus = determineReviewStatus(reviews);

  const prWithMetrics: PRWithMetrics = {
    ...pr,
    repository: repo.name,
    owner: repo.owner,
    ageInDays: age.days,
    ageInHours: age.hours,
    timeInReviewHours: timeInReview.hours,
    firstReviewAt: timeInReview.firstReviewAt,
    reviewStatus,
    reviews,
    checks,
    alerts: [],
  };

  prWithMetrics.alerts = identifyAlerts(prWithMetrics);
  return prWithMetrics;
}

export async function enrichOpenPRsForRepos(
  client: Octokit,
  repositories: Repository[]
): Promise<PRWithMetrics[]> {
  const promises = repositories.map(async (repo) => {
    try {
      const prs = await fetchPRsForRepo(client, repo.owner, repo.name);
      const enriched = await Promise.all(
        prs.map(async (pr) => {
          const [reviews, checks] = await Promise.all([
            fetchReviewsForPR(client, repo.owner, repo.name, pr.number),
            fetchPRChecks(client, repo.owner, repo.name, pr.head.sha),
          ]);
          return enrichPR(pr, repo, reviews, checks);
        })
      );
      return enriched;
    } catch (error) {
      console.error(`Error fetching PRs for ${repo.owner}/${repo.name}:`, error);
      return [];
    }
  });

  return (await Promise.all(promises)).flat();
}

export async function enrichClosedPRsForRepos(
  client: Octokit,
  repositories: Repository[],
  since: Date
): Promise<PRWithMetrics[]> {
  const promises = repositories.map(async (repo) => {
    try {
      const prs = await fetchClosedPRs(client, repo.owner, repo.name, since);
      const enriched = await Promise.all(
        prs.map(async (pr) => {
          const reviews = await fetchReviewsForPR(client, repo.owner, repo.name, pr.number);
          return enrichPR(pr, repo, reviews, []);
        })
      );
      return enriched;
    } catch (error) {
      console.error(`Error fetching closed PRs for ${repo.owner}/${repo.name}:`, error);
      return [];
    }
  });

  return (await Promise.all(promises)).flat();
}
