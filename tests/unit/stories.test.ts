import { describe, it, expect } from 'vitest';
import { STORIES, getStoryBySlug, getReleasedStories, getLatestReleasedStory, padNum } from '@/lib/stories';

describe('STORIES catalog', () => {
  it('has 12 entries', () => {
    expect(STORIES).toHaveLength(12);
  });

  it('every story has required fields', () => {
    for (const s of STORIES) {
      expect(s.num).toBeTypeOf('number');
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

  it('story numbers are sequential starting at 1', () => {
    const nums = STORIES.map((s) => s.num).sort((a, b) => a - b);
    nums.forEach((n, i) => expect(n).toBe(i + 1));
  });
});

describe('getStoryBySlug', () => {
  it('returns the correct story', () => {
    const s = getStoryBySlug('frog-at-the-bottom-of-the-well');
    expect(s?.num).toBe(1);
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
  it('returns a released story with the highest episode number', () => {
    const latest = getLatestReleasedStory();
    const released = getReleasedStories();
    const maxNum = Math.max(...released.map((s) => s.num));
    expect(latest?.num).toBe(maxNum);
    expect(latest?.released).toBe(true);
  });
});

describe('released story audio links', () => {
  it('every released story has all audio links filled (no empty strings or placeholders)', () => {
    const released = getReleasedStories();
    for (const s of released) {
      expect(s.audio, `${s.slug} is missing audio`).toBeDefined();
      for (const lang of ['en', 'zh'] as const) {
        const links = s.audio![lang];
        for (const platform of ['spotify', 'youtube', 'apple'] as const) {
          const url = links[platform];
          expect(url, `${s.slug} audio.${lang}.${platform} is empty`).not.toBe('');
          expect(url, `${s.slug} audio.${lang}.${platform} is a placeholder`).not.toBe('#');
        }
      }
    }
  });
});

describe('padNum', () => {
  it('pads single-digit numbers', () => {
    expect(padNum(1)).toBe('01');
    expect(padNum(9)).toBe('09');
  });

  it('does not pad double-digit numbers', () => {
    expect(padNum(10)).toBe('10');
    expect(padNum(12)).toBe('12');
  });
});
