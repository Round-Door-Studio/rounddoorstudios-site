import { describe, it, expect, vi, beforeEach } from 'vitest';

// See db-stories-cache.test.ts for why we mock next/cache rather than
// exercising the real implementation (it throws outside a Next request/
// build context) and what that leaves us able to guard here.
const mockUnstableCache = vi.hoisted(() =>
  vi.fn(
    (
      fn: (...args: never[]) => unknown,
      _keyParts: string[],
      _options: { revalidate: number; tags: string[] },
    ) =>
      (...args: never[]) =>
        fn(...args),
  ),
);

vi.mock('next/cache', () => ({
  unstable_cache: mockUnstableCache,
}));

vi.mock('@/lib/db/stories', () => ({
  STORY_CACHE_TTL_SECONDS: 300,
}));

type QueryResult = { data: unknown; error: unknown };
let mockResult: QueryResult = { data: null, error: null };

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve(mockResult)),
};

const mockServiceClient = { from: vi.fn(() => queryBuilder) };

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}));

import {
  loadAllContentCached,
  getContentCountsCached,
} from '@/lib/db/content';

const cacheCalls = mockUnstableCache.mock.calls.map(([, keyParts, options]) => ({
  keyParts,
  options,
}));

const rawContent = {
  read_along: { slug: 'maliang', pages: [] },
  vocab: { slug: 'maliang', vocab: [{ word: '马' }] },
  questions: { slug: 'maliang', open: [{ q: 'Why?' }], beyond: [] },
  activities: { slug: 'maliang', activities: [{ title: 'Draw' }] },
};

beforeEach(() => {
  queryBuilder.select.mockClear().mockReturnThis();
  queryBuilder.eq.mockClear().mockReturnThis();
  queryBuilder.single.mockClear();
  mockResult = { data: rawContent, error: null };
  queryBuilder.single.mockImplementation(() => Promise.resolve(mockResult));
});

describe('story content cache configuration', () => {
  it('wraps exactly the two expected reads', () => {
    expect(cacheCalls).toHaveLength(2);
  });

  it('gives loadAllContentCached and getContentCountsCached distinct keys', () => {
    const keys = cacheCalls.map((c) => JSON.stringify(c.keyParts));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('reuses the shared story-cache TTL for both reads', () => {
    for (const { options } of cacheCalls) {
      expect(options.revalidate).toBe(300);
    }
  });

  it('tags both reads "story-content"', () => {
    for (const { options } of cacheCalls) {
      expect(options.tags).toEqual(['story-content']);
    }
  });
});

describe('cached exports delegate to the correct DB read, per slug', () => {
  it('loadAllContentCached queries by the given slug', async () => {
    await loadAllContentCached('maliang');
    expect(queryBuilder.eq).toHaveBeenCalledWith('slug', 'maliang');
  });

  it('getContentCountsCached queries by the given slug', async () => {
    await getContentCountsCached('maliang');
    expect(queryBuilder.eq).toHaveBeenCalledWith('slug', 'maliang');
  });

  it('a null content_content row surfaces as null storyContent (the "still being prepared" branch)', async () => {
    mockResult = { data: null, error: null };
    const result = await loadAllContentCached('unseeded-slug');
    expect(result.storyContent).toBeNull();
  });
});
