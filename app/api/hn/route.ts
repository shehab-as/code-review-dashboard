import { NextRequest, NextResponse } from 'next/server';
import { fetchStories, StoryType } from '@/lib/hn';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'top') as StoryType;
    const limit = parseInt(searchParams.get('limit') || '30');

    const stories = await fetchStories(type, limit);
    return NextResponse.json({ stories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Hacker News stories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
