import { fetchStories, fetchStoryIds, fetchItem } from '@/lib/hn';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockStory = (id: number) => ({
  id,
  title: `Story ${id}`,
  url: `https://example.com/${id}`,
  by: 'testuser',
  score: 100 + id,
  time: Math.floor(Date.now() / 1000),
  descendants: 10 + id,
  type: 'story',
});

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── fetchStoryIds ──────────────────────────────────────────────────

describe('fetchStoryIds', () => {
  it('fetches top story IDs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([1, 2, 3]),
    });

    const ids = await fetchStoryIds('top');
    expect(ids).toEqual([1, 2, 3]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('topstories.json')
    );
  });

  it('fetches new story IDs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([10, 11]),
    });

    await fetchStoryIds('new');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('newstories.json')
    );
  });

  it('fetches best story IDs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([20]),
    });

    await fetchStoryIds('best');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('beststories.json')
    );
  });

  it('throws when the API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(fetchStoryIds('top')).rejects.toThrow('Failed to fetch top stories');
  });
});

// ─── fetchItem ──────────────────────────────────────────────────────

describe('fetchItem', () => {
  it('returns a story object for a valid ID', async () => {
    const story = mockStory(42);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(story),
    });

    const result = await fetchItem(42);
    expect(result).toEqual(story);
  });

  it('returns null when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const result = await fetchItem(999);
    expect(result).toBeNull();
  });
});

// ─── fetchStories ───────────────────────────────────────────────────

describe('fetchStories', () => {
  it('returns stories for given type', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([1, 2, 3]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(1)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(2)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(3)) });

    const stories = await fetchStories('top', 30);
    expect(stories).toHaveLength(3);
    expect(stories[0].title).toBe('Story 1');
  });

  it('respects the limit parameter', async () => {
    const ids = Array.from({ length: 50 }, (_, i) => i + 1);
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ids) });
    for (let i = 1; i <= 5; i++) {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(i)) });
    }

    const stories = await fetchStories('top', 5);
    expect(stories).toHaveLength(5);
  });

  it('caps limit at 50', async () => {
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ids) });
    for (let i = 1; i <= 50; i++) {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(i)) });
    }

    const stories = await fetchStories('top', 999);
    expect(stories).toHaveLength(50);
  });

  it('filters out null items from failed fetches', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([1, 2, 3]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(1)) })
      .mockResolvedValueOnce({ ok: false })  // item 2 fails
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(3)) });

    const stories = await fetchStories('top', 30);
    expect(stories).toHaveLength(2);
    expect(stories.map(s => s.id)).toEqual([1, 3]);
  });

  it('filters out non-story items like job posts', async () => {
    const jobPost = { ...mockStory(2), type: 'job' };
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([1, 2]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(1)) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(jobPost) });

    const stories = await fetchStories('top', 30);
    expect(stories).toHaveLength(1);
    expect(stories[0].id).toBe(1);
  });

  it('throws when story IDs fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(fetchStories('top')).rejects.toThrow();
  });

  it('returns correct story fields', async () => {
    const story = mockStory(42);
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([42]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(story) });

    const stories = await fetchStories('top', 30);
    expect(stories[0]).toMatchObject({
      id: 42,
      title: 'Story 42',
      url: 'https://example.com/42',
      by: 'testuser',
      score: 142,
      type: 'story',
    });
  });

  it('defaults to top stories with limit 30', async () => {
    const ids = Array.from({ length: 35 }, (_, i) => i + 1);
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ids) });
    for (let i = 1; i <= 30; i++) {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStory(i)) });
    }

    const stories = await fetchStories();
    expect(stories).toHaveLength(30);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('topstories.json')
    );
  });
});
