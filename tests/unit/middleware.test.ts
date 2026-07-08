import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Shared cookies.set tracker — all MockResponse instances use the same fn so
// we can assert on it after the middleware runs without needing to hold a ref
// to the actual response object.
const mockCookiesSet = vi.hoisted(() => vi.fn());
const mockGetUser    = vi.hoisted(() => vi.fn());

// Capture the setAll handler so tests can simulate a session refresh.
const capturedSetAll = vi.hoisted(
  () => ({ current: null as ((c: Array<{ name: string; value: string; options?: object }>) => void) | null })
);

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, options: {
    cookies: { setAll: (c: unknown[]) => void }
  }) => {
    capturedSetAll.current = options.cookies.setAll;
    return { auth: { getUser: mockGetUser } };
  }),
}));

vi.mock('next/server', () => {
  class MockResponse {
    cookies = { set: mockCookiesSet };
  }
  return {
    NextResponse: {
      next: vi.fn(() => new MockResponse()),
    },
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

import type { NextRequest } from 'next/server';

function makeRequest(): NextRequest {
  const store = new Map<string, string>();
  return {
    cookies: {
      getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
      set: vi.fn((name: string, value: string) => store.set(name, value)),
    },
  } as unknown as NextRequest;
}

import { middleware, config } from '@/middleware';

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  capturedSetAll.current = null;
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
});

describe('middleware — session refresh', () => {
  it('calls getUser() on every request to keep the session alive', async () => {
    await middleware(makeRequest());
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it('returns a response for every request', async () => {
    const response = await middleware(makeRequest());
    expect(response).toBeDefined();
  });

  it('returns a response even when getUser() reports an error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'jwt expired' } });
    const response = await middleware(makeRequest());
    expect(response).toBeDefined();
  });
});

describe('middleware — cookie propagation', () => {
  it('sets refreshed session cookies on the response when Supabase calls setAll', async () => {
    // Simulate Supabase refreshing the access token during getUser()
    mockGetUser.mockImplementation(async () => {
      capturedSetAll.current!([
        { name: 'sb-access-token',  value: 'new-access-token',  options: { path: '/' } },
        { name: 'sb-refresh-token', value: 'new-refresh-token', options: { path: '/' } },
      ]);
      return { data: { user: { id: '1' } }, error: null };
    });

    await middleware(makeRequest());

    expect(mockCookiesSet).toHaveBeenCalledWith(
      'sb-access-token', 'new-access-token', { path: '/' }
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      'sb-refresh-token', 'new-refresh-token', { path: '/' }
    );
  });

  it('does not set any cookies when the session does not need refreshing', async () => {
    // getUser() returns normally without calling setAll
    await middleware(makeRequest());
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });

  it('passes existing request cookies to the Supabase client', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    await middleware(makeRequest());
    expect(createServerClient).toHaveBeenCalledOnce();
    // Verify the cookies.getAll option is wired to the request
    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock.calls[0];
    const cookies = options.cookies.getAll();
    expect(Array.isArray(cookies)).toBe(true);
  });
});

describe('middleware — config matcher', () => {
  it('excludes auth/callback from the matcher pattern', () => {
    const [pattern] = config.matcher;
    // Negative lookahead must mention auth/callback
    expect(pattern).toContain('auth/callback');
  });

  it('excludes _next/static from the matcher pattern', () => {
    const [pattern] = config.matcher;
    expect(pattern).toContain('_next/static');
  });
});
