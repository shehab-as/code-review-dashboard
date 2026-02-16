const HN_API = 'https://hacker-news.firebaseio.com/v0';

export interface HNStory {
  id: number;
  title: string;
  url?: string;
  by: string;
  score: number;
  time: number;
  descendants: number;
  type: string;
}

export type StoryType = 'top' | 'new' | 'best';

export async function fetchStoryIds(type: StoryType): Promise<number[]> {
  const res = await fetch(`${HN_API}/${type}stories.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${type} stories`);
  return res.json();
}

export async function fetchItem(id: number): Promise<HNStory | null> {
  const res = await fetch(`${HN_API}/item/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchStories(type: StoryType = 'top', limit: number = 30): Promise<HNStory[]> {
  const cappedLimit = Math.min(limit, 50);
  const storyIds = await fetchStoryIds(type);
  const topIds = storyIds.slice(0, cappedLimit);
  const stories = await Promise.all(topIds.map(fetchItem));
  return stories.filter((s): s is HNStory => s !== null && s.type === 'story');
}
