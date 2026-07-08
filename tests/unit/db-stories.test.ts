import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock: @supabase/supabase-js ───────────────────────────────────────────────
//
// The Supabase client uses heavy method chaining:
//   supabase.from('t').select('*').eq('col', val).order('n').single()
//
// We make the builder thenable so `await builder` resolves when .single() is
// not the terminal call, while .single() returns its own Promise for the cases
// where it is.

type QueryResult = { data: unknown; error: unknown };
let mockResult: QueryResult = { data: null, error: null };

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq:     vi.fn().mockReturnThis(),
  order:  vi.fn().mockReturnThis(),
  limit:  vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve(mockResult)),
  // Makes `await queryBuilder` work for chains that end in .order()
  then: (resolve: (v: QueryResult) => unknown) => Promise.resolve(mockResult).then(resolve),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn(() => queryBuilder) })),
}));

import {
  getReleasedStoriesFromDB,
  getStoryBySlugFromDB,
  getAllStoriesFromDB,
  getLatestReleasedStoryFromDB,
} from '@/lib/db/stories';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const rawRow = {
  num: 1, slug: 'maliang', season: 1, released: true,
  title_en: 'Ma Liang', title_simp: '马良', title_trad: '馬良',
  blurb: 'A boy with a magic brush.', runtime: '12:34',
  pub: '2024-01-01', cover_color: '#ff0000',
  cover_image: '/img.webp', cover_image_landscape: '/img-ls.webp',
  audio: { en: '/en.mp3' }, has_bundle: true,
  part: undefined, parts: undefined,
};

const expectedStory = {
  num: 1, slug: 'maliang', season: 1, released: true,
  title: { en: 'Ma Liang', simp: '马良', trad: '馬良' },
  blurb: 'A boy with a magic brush.', runtime: '12:34',
  pub: '2024-01-01', coverColor: '#ff0000',
  coverImage: '/img.webp', coverImageLandscape: '/img-ls.webp',
  audio: { en: '/en.mp3' }, hasBundle: true,
  part: undefined, parts: undefined,
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire chaining after clearAllMocks() clears mockReturnThis
  queryBuilder.select.mockReturnThis();
  queryBuilder.eq.mockReturnThis();
  queryBuilder.order.mockReturnThis();
  queryBuilder.limit.mockReturnThis();
  mockResult = { data: [rawRow], error: null };
});

// ── getReleasedStoriesFromDB ───────────────────────────────────────────────────

describe('getReleasedStoriesFromDB', () => {
  it('returns mapped stories on success', async () => {
    const stories = await getReleasedStoriesFromDB();
    expect(stories).toEqual([expectedStory]);
  });

  it('queries only released stories', async () => {
    await getReleasedStoriesFromDB();
    expect(queryBuilder.eq).toHaveBeenCalledWith('released', true);
  });

  it('returns [] when the query errors', async () => {
    mockResult = { data: null, error: { message: 'connection refused' } };
    const stories = await getReleasedStoriesFromDB();
    expect(stories).toEqual([]);
  });

  it('logs a console.error when the query errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockResult = { data: null, error: { message: 'connection refused' } };
    await getReleasedStoriesFromDB();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[db/stories]'),
      expect.stringContaining('connection refused'),
    );
  });
});

// ── getStoryBySlugFromDB ───────────────────────────────────────────────────────

describe('getStoryBySlugFromDB', () => {
  beforeEach(() => {
    mockResult = { data: rawRow, error: null };
    queryBuilder.single.mockImplementation(() => Promise.resolve(mockResult));
  });

  it('returns a mapped story on success', async () => {
    const story = await getStoryBySlugFromDB('maliang');
    expect(story).toEqual(expectedStory);
  });

  it('passes the slug to the eq filter', async () => {
    await getStoryBySlugFromDB('maliang');
    expect(queryBuilder.eq).toHaveBeenCalledWith('slug', 'maliang');
  });

  it('returns null when the story is not found (PGRST116)', async () => {
    queryBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    const story = await getStoryBySlugFromDB('unknown');
    expect(story).toBeNull();
  });

  it('does not log PGRST116 (expected no-rows result)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    await getStoryBySlugFromDB('unknown');
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns null and logs on unexpected errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryBuilder.single.mockResolvedValue({ data: null, error: { code: '500', message: 'db error' } });
    const story = await getStoryBySlugFromDB('maliang');
    expect(story).toBeNull();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[db/stories]'),
      'maliang',
      expect.stringContaining('db error'),
    );
  });
});

// ── getAllStoriesFromDB ────────────────────────────────────────────────────────

describe('getAllStoriesFromDB', () => {
  it('returns all stories including unreleased', async () => {
    const unreleased = { ...rawRow, num: 2, slug: 'coming-soon', released: false };
    mockResult = { data: [rawRow, unreleased], error: null };
    const stories = await getAllStoriesFromDB();
    expect(stories).toHaveLength(2);
    expect(stories[1].released).toBe(false);
  });

  it('does not filter by released status', async () => {
    await getAllStoriesFromDB();
    expect(queryBuilder.eq).not.toHaveBeenCalled();
  });

  it('returns [] and logs on error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockResult = { data: null, error: { message: 'timeout' } };
    const stories = await getAllStoriesFromDB();
    expect(stories).toEqual([]);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[db/stories]'),
      expect.stringContaining('timeout'),
    );
  });
});

// ── getLatestReleasedStoryFromDB ──────────────────────────────────────────────

describe('getLatestReleasedStoryFromDB', () => {
  beforeEach(() => {
    mockResult = { data: rawRow, error: null };
    queryBuilder.single.mockImplementation(() => Promise.resolve(mockResult));
  });

  it('returns the latest released story on success', async () => {
    const story = await getLatestReleasedStoryFromDB();
    expect(story).toEqual(expectedStory);
  });

  it('orders by num descending and limits to 1', async () => {
    await getLatestReleasedStoryFromDB();
    expect(queryBuilder.order).toHaveBeenCalledWith('num', { ascending: false });
    expect(queryBuilder.limit).toHaveBeenCalledWith(1);
  });

  it('returns null when no stories exist (PGRST116)', async () => {
    queryBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    expect(await getLatestReleasedStoryFromDB()).toBeNull();
  });

  it('does not log PGRST116', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    await getLatestReleasedStoryFromDB();
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns null and logs on unexpected errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryBuilder.single.mockResolvedValue({ data: null, error: { code: '500', message: 'db error' } });
    const story = await getLatestReleasedStoryFromDB();
    expect(story).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});
