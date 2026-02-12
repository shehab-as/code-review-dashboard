import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { fetchPRsForRepo, fetchReviewsForPR, fetchPRChecks, fetchClosedPRs } from '@/lib/github-api';
import {
  calculatePRAge,
  calculateTimeInReview,
  determineReviewStatus,
  identifyAlerts,
  calculateStats,
  calculateApprovalTrends,
} from '@/lib/analytics';
import { PRWithMetrics, Repository } from '@/lib/types';
import { subDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, repositories } = body;

    if (!token || !repositories || repositories.length === 0) {
      return NextResponse.json(
        { error: 'Missing token or repositories' },
        { status: 400 }
      );
    }

    const client = createGitHubClient(token);

    // Fetch open PRs
    const openPRPromises = repositories.map(async (repo: Repository) => {
      try {
        const prs = await fetchPRsForRepo(client, repo.owner, repo.name);

        const enrichedPRs = await Promise.all(
          prs.map(async (pr) => {
            const [reviews, checks] = await Promise.all([
              fetchReviewsForPR(client, repo.owner, repo.name, pr.number),
              fetchPRChecks(client, repo.owner, repo.name, pr.head.sha),
            ]);

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
          })
        );

        return enrichedPRs;
      } catch (error) {
        console.error(`Error fetching PRs for ${repo.owner}/${repo.name}:`, error);
        return [];
      }
    });

    const allOpenPRs = (await Promise.all(openPRPromises)).flat();

    // Fetch closed PRs from last 30 days for trends
    const since = subDays(new Date(), 30);
    const closedPRPromises = repositories.map(async (repo: Repository) => {
      try {
        const prs = await fetchClosedPRs(client, repo.owner, repo.name, since);

        const enrichedPRs = await Promise.all(
          prs.map(async (pr) => {
            const reviews = await fetchReviewsForPR(client, repo.owner, repo.name, pr.number);
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
              checks: [],
              alerts: [],
            };

            return prWithMetrics;
          })
        );

        return enrichedPRs;
      } catch (error) {
        console.error(`Error fetching closed PRs for ${repo.owner}/${repo.name}:`, error);
        return [];
      }
    });

    const allClosedPRs = (await Promise.all(closedPRPromises)).flat();

    // Calculate statistics
    const stats = calculateStats(allOpenPRs);
    stats.approvalTrends = calculateApprovalTrends(allClosedPRs, 30);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error in /api/github/stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}
