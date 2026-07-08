import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock: @/lib/supabase/service ──────────────────────────────────────────────

type QueryResult = { data: unknown; error: unknown };
let mockResult: QueryResult = { data: null, error: null };

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq:     vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve(mockResult)),
};

const mockServiceClient = { from: vi.fn(() => queryBuilder) };

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}));

import {
  loadAllContentFromDB,
  getContentCountsFromDB,
} from '@/lib/db/content';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const rawContent = {
  read_along: { slug: 'maliang', pages: [] },
  vocab: { slug: 'maliang', vocab: [{ word: '马' }, { word: '良' }] },
  questions: { slug: 'maliang', open: [{ q: 'Why?' }], beyond: [{ q: 'What?' }] },
  activities: { slug: 'maliang', activities: [{ title: 'Draw' }] },
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  queryBuilder.select.mockReturnThis();
  queryBuilder.eq.mockReturnThis();
  mockResult = { data: rawContent, error: null };
  queryBuilder.single.mockImplementation(() => Promise.resolve(mockResult));
});

// ── loadAllContentFromDB ──────────────────────────────────────────────────────

describe('loadAllContentFromDB', () => {
  it('returns all content sections on success', async () => {
    const result = await loadAllContentFromDB('maliang');
    expect(result.storyContent).toEqual(rawContent.read_along);
    expect(result.vocab).toEqual(rawContent.vocab);
    expect(result.questions).toEqual(rawContent.questions);
    expect(result.activities).toEqual(rawContent.activities);
  });

  it('queries by slug', async () => {
    await loadAllContentFromDB('maliang');
    expect(queryBuilder.eq).toHaveBeenCalledWith('slug', 'maliang');
  });

  it('returns null storyContent and empty defaults when data is null', async () => {
    mockResult = { data: null, error: { message: 'not found' } };
    const result = await loadAllContentFromDB('maliang');
    expect(result.storyContent).toBeNull();
    expect(result.vocab).toEqual({ slug: 'maliang', vocab: [] });
    expect(result.questions).toEqual({ slug: 'maliang', open: [], beyond: [] });
    expect(result.activities).toEqual({ slug: 'maliang', activities: [] });
  });

  it('logs a console.error when the query fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockResult = { data: null, error: { message: 'connection refused' } };
    await loadAllContentFromDB('maliang');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[db/content]'),
      'maliang',
      expect.stringContaining('connection refused'),
    );
  });

  it('does not log when the query succeeds', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await loadAllContentFromDB('maliang');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── getContentCountsFromDB ────────────────────────────────────────────────────

describe('getContentCountsFromDB', () => {
  it('returns correct counts from the content data', async () => {
    const counts = await getContentCountsFromDB('maliang');
    expect(counts).toEqual({ vocabCount: 2, questionCount: 2, activityCount: 1 });
  });

  it('queries by slug', async () => {
    await getContentCountsFromDB('maliang');
    expect(queryBuilder.eq).toHaveBeenCalledWith('slug', 'maliang');
  });

  it('returns zeros when data is null', async () => {
    mockResult = { data: null, error: { message: 'not found' } };
    const counts = await getContentCountsFromDB('maliang');
    expect(counts).toEqual({ vocabCount: 0, questionCount: 0, activityCount: 0 });
  });

  it('returns zeros when content arrays are missing', async () => {
    mockResult = { data: { vocab: null, questions: null, activities: null }, error: null };
    const counts = await getContentCountsFromDB('maliang');
    expect(counts).toEqual({ vocabCount: 0, questionCount: 0, activityCount: 0 });
  });

  it('counts open and beyond questions together', async () => {
    mockResult = {
      data: {
        vocab: { vocab: [] },
        questions: { open: [{ q: '1' }, { q: '2' }], beyond: [{ q: '3' }] },
        activities: { activities: [] },
      },
      error: null,
    };
    const counts = await getContentCountsFromDB('maliang');
    expect(counts.questionCount).toBe(3);
  });

  it('logs a console.error when the query fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockResult = { data: null, error: { message: 'rls denied' } };
    await getContentCountsFromDB('maliang');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[db/content]'),
      'maliang',
      expect.stringContaining('rls denied'),
    );
  });

  it('does not log when the query succeeds', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await getContentCountsFromDB('maliang');
    expect(spy).not.toHaveBeenCalled();
  });
});
