import { describe, it, expect, vi } from 'vitest';
import { withCacheFallback } from '@/lib/db/cache-fallback';

describe('withCacheFallback', () => {
  it('returns the cached result when it resolves before the timeout', async () => {
    const cached = vi.fn(async () => 'cached-value');
    const raw = vi.fn(async () => 'raw-value');
    const wrapped = withCacheFallback(cached, raw, 1000, 'test');

    await expect(wrapped()).resolves.toBe('cached-value');
    expect(raw).not.toHaveBeenCalled();
  });

  it('falls back to the raw read when the cached call exceeds the timeout', async () => {
    vi.useFakeTimers();
    try {
      const cached = vi.fn(() => new Promise<string>(() => {})); // never resolves
      const raw = vi.fn(async () => 'raw-value');
      const wrapped = withCacheFallback(cached, raw, 1000, 'test');

      const resultPromise = wrapped();
      await vi.advanceTimersByTimeAsync(1000);

      await expect(resultPromise).resolves.toBe('raw-value');
      expect(raw).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('forwards arguments to both the cached and raw functions', async () => {
    vi.useFakeTimers();
    try {
      const cached = vi.fn((_slug: string) => new Promise<string>(() => {}));
      const raw = vi.fn(async (slug: string) => `raw-${slug}`);
      const wrapped = withCacheFallback(cached, raw, 1000, 'test');

      const resultPromise = wrapped('my-slug');
      await vi.advanceTimersByTimeAsync(1000);

      await expect(resultPromise).resolves.toBe('raw-my-slug');
      expect(cached).toHaveBeenCalledWith('my-slug');
      expect(raw).toHaveBeenCalledWith('my-slug');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not call the raw fallback on the fast path', async () => {
    const cached = vi.fn(async (slug: string) => `cached-${slug}`);
    const raw = vi.fn(async (slug: string) => `raw-${slug}`);
    const wrapped = withCacheFallback(cached, raw, 1000, 'test');

    await expect(wrapped('my-slug')).resolves.toBe('cached-my-slug');
    expect(raw).not.toHaveBeenCalled();
  });
});
