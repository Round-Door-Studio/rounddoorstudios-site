import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock: next/cache ────────────────────────────────────────────────────────
//
// unstable_cache throws ("Invariant: incrementalCache missing") when invoked
// outside a real Next.js request/build context — which is exactly what a
// vitest run is. So we can't exercise the real caching behavior here (that
// was verified manually against `next build` + `next start`: cache keys stay
// distinct per slug, and a warm cache serves without re-hitting Supabase).
// What we CAN and should guard in unit tests:
//   1. each cached export is wired to the correct underlying `*FromDB` fn
//   2. every cache key is unique (a collision would silently merge two
//      different reads into the same cache bucket — see stories-by-slug,
//      which is called with different slug arguments and MUST NOT collide)
//   3. TTL/tags haven't silently drifted (e.g. someone drops `tags` while
//      editing, or revalidate becomes 0/undefined)
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

// ── Mock: @supabase/supabase-js ─────────────────────────────────────────────
// Same thenable-builder pattern as db-stories.test.ts.

type QueryResult = { data: unknown; error: unknown };
let mockResult: QueryResult = { data: null, error: null };

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve(mockResult)),
  then: (resolve: (v: QueryResult) => unknown) => Promise.resolve(mockResult).then(resolve),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn(() => queryBuilder) })),
}));

import {
  STORY_CACHE_TTL_SECONDS,
  getReleasedStoriesCached,
  getStoryBySlugCached,
  getAllStoriesCached,
  getLatestReleasedStoryCached,
} from '@/lib/db/stories';

// Capture the unstable_cache(...) call args made at module-import time,
// before any beforeEach clears mock state.
const cacheCalls = mockUnstableCache.mock.calls.map(([, keyParts, options]) => ({
  keyParts,
  options,
}));

const rawRow = {
  num: 1, slug: 'maliang', season: 1, released: true,
  title_en: 'Ma Liang', title_simp: '马良', title_trad: '馬良',
  blurb: 'A boy with a magic brush.', runtime: '12:34',
  pub: '2024-01-01', cover_color: '#ff0000',
  cover_image: '/img.webp', cover_image_landscape: '/img-ls.webp',
  audio: { en: '/en.mp3' }, has_bundle: true,
};

beforeEach(() => {
  queryBuilder.select.mockClear().mockReturnThis();
  queryBuilder.eq.mockClear().mockReturnThis();
  queryBuilder.order.mockClear().mockReturnThis();
  queryBuilder.limit.mockClear().mockReturnThis();
  queryBuilder.single.mockClear();
  mockResult = { data: [rawRow], error: null };
});

// ── Cache configuration ──────────────────────────────────────────────────────

describe('story cache configuration', () => {
  it('wraps exactly the four expected reads', () => {
    expect(cacheCalls).toHaveLength(4);
  });

  it('gives every cached read a unique key — a collision would merge unrelated results', () => {
    const keys = cacheCalls.map((c) => JSON.stringify(c.keyParts));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses STORY_CACHE_TTL_SECONDS (not a hardcoded number) for every read', () => {
    for (const { options } of cacheCalls) {
      expect(options.revalidate).toBe(STORY_CACHE_TTL_SECONDS);
    }
  });

  it('tags every read "stories" so a future revalidateTag("stories") covers all of them', () => {
    for (const { options } of cacheCalls) {
      expect(options.tags).toEqual(['stories']);
    }
  });

  it('TTL is a sane positive number, not accidentally 0/undefined/NaN', () => {
    expect(STORY_CACHE_TTL_SECONDS).toBeGreaterThan(0);
    expect(Number.isFinite(STORY_CACHE_TTL_SECONDS)).toBe(true);
  });
});

// ── Delegation (cached export → correct underlying DB read) ─────────────────

describe('cached exports delegate to the correct DB read', () => {
  it('getReleasedStoriesCached filters by released=true', async () => {
    await getReleasedStoriesCached();
    expect(queryBuilder.eq).toHaveBeenCalledWith('released', true);
  });

  it('getStoryBySlugCached passes its slug argument through', async () => {
    mockResult = { data: rawRow, error: null };
    queryBuilder.single.mockImplementation(() => Promise.resolve(mockResult));
    await getStoryBySlugCached('maliang');
    expect(queryBuilder.eq).toHaveBeenCalledWith('slug', 'maliang');
  });

  it('getAllStoriesCached does not filter by released', async () => {
    await getAllStoriesCached();
    expect(queryBuilder.eq).not.toHaveBeenCalled();
  });

  it('getLatestReleasedStoryCached orders desc and limits to 1', async () => {
    mockResult = { data: rawRow, error: null };
    queryBuilder.single.mockImplementation(() => Promise.resolve(mockResult));
    await getLatestReleasedStoryCached();
    expect(queryBuilder.order).toHaveBeenCalledWith('num', { ascending: false });
    expect(queryBuilder.limit).toHaveBeenCalledWith(1);
  });
});
