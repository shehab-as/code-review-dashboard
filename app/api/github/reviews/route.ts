import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { fetchReviewsForPR } from '@/lib/github-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, owner, repo, prNumber } = body;

    if (!token || !owner || !repo || !prNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const client = createGitHubClient(token);
    const reviews = await fetchReviewsForPR(client, owner, repo, prNumber);

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Error in /api/github/reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
