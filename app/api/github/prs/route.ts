import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';
import { enrichOpenPRsForRepos } from '@/lib/github-api';

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
    const prs = await enrichOpenPRsForRepos(client, repositories);

    return NextResponse.json({ prs });
  } catch (error: unknown) {
    console.error('Error in /api/github/prs:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch PRs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
