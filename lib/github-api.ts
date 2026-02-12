import { Octokit } from '@octokit/rest';
import { GitHubPR, GitHubReview, GitHubCheck } from './types';

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
      conclusion: check.conclusion as any,
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
