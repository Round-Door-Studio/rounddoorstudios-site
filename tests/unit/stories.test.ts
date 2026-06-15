import { describe, it, expect } from 'vitest';
import { STORIES, getStoryBySlug, getReleasedStories, getLatestReleasedStory, padEp } from '@/lib/stories';

describe('STORIES catalog', () => {
  it('has 12 entries', () => {
    expect(STORIES).toHaveLength(12);
  });

  it('every story has required fields', () => {
    for (const s of STORIES) {
      expect(s.ep).toBeTypeOf('number');
      expect(s.slug).toBeTypeOf('string');
      expect(s.season).toBeTypeOf('number');
      expect(typeof s.released).toBe('boolean');
      expect(s.title.en).toBeTruthy();
      expect(s.title.simp).toBeTruthy();
      expect(s.title.trad).toBeTruthy();
    }
  });

  it('slugs are unique', () => {
    const slugs = STORIES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(STORIES.length);
  });

  it('episode numbers are sequential starting at 1', () => {
    const eps = STORIES.map((s) => s.ep).sort((a, b) => a - b);
    eps.forEach((ep, i) => expect(ep).toBe(i + 1));
  });
});

describe('getStoryBySlug', () => {
  it('returns the correct story', () => {
    const s = getStoryBySlug('frog-at-the-bottom-of-the-well');
    expect(s?.ep).toBe(1);
    expect(s?.released).toBe(true);
  });

  it('returns undefined for unknown slug', () => {
    expect(getStoryBySlug('not-a-real-story')).toBeUndefined();
  });
});

describe('getReleasedStories', () => {
  it('only returns released stories', () => {
    const released = getReleasedStories();
    expect(released.every((s) => s.released)).toBe(true);
  });

  it('returns at least one story', () => {
    expect(getReleasedStories().length).toBeGreaterThan(0);
  });
});

describe('getLatestReleasedStory', () => {
  it('returns ep 1 as the latest released', () => {
    const latest = getLatestReleasedStory();
    expect(latest?.ep).toBe(1);
  });
});

describe('padEp', () => {
  it('pads single-digit numbers', () => {
    expect(padEp(1)).toBe('01');
    expect(padEp(9)).toBe('09');
  });

  it('does not pad double-digit numbers', () => {
    expect(padEp(10)).toBe('10');
    expect(padEp(12)).toBe('12');
  });
});
