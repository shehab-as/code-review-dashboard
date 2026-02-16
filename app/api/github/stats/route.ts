import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { enrichOpenPRsForRepos, enrichClosedPRsForRepos } from '@/lib/github-api';
import { calculateStats, calculateApprovalTrends } from '@/lib/analytics';
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

    const allOpenPRs = await enrichOpenPRsForRepos(client, repositories);

    const since = subDays(new Date(), 30);
    const allClosedPRs = await enrichClosedPRsForRepos(client, repositories, since);

    const stats = calculateStats(allOpenPRs);
    stats.approvalTrends = calculateApprovalTrends(allClosedPRs, 30);

    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error('Error in /api/github/stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to calculate stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
