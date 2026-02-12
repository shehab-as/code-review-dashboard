import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { fetchPRsForRepo, fetchReviewsForPR, fetchPRChecks } from '@/lib/github-api';
import {
  calculatePRAge,
  calculateTimeInReview,
  determineReviewStatus,
  identifyAlerts,
} from '@/lib/analytics';
import { PRWithMetrics, Repository } from '@/lib/types';

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

    // Fetch PRs from all repositories in parallel
    const prPromises = repositories.map(async (repo: Repository) => {
      try {
        const prs = await fetchPRsForRepo(client, repo.owner, repo.name);

        // Fetch reviews and checks for each PR
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

            // Identify alerts
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

    const allPRs = (await Promise.all(prPromises)).flat();

    return NextResponse.json({ prs: allPRs });
  } catch (error: any) {
    console.error('Error in /api/github/prs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch PRs' },
      { status: 500 }
    );
  }
}
