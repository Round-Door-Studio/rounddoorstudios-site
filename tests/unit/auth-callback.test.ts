import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockExchangeCodeForSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

// Track every URL passed to NextResponse.redirect
const redirectUrls: string[] = [];

vi.mock('next/server', () => {
  class FakeResponse {
    cookies = { set: vi.fn() };
  }
  return {
    NextResponse: {
      redirect: vi.fn((url: string | URL) => {
        redirectUrls.push(url.toString());
        return new FakeResponse();
      }),
    },
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return {
    url,
    cookies: { getAll: () => [], set: vi.fn() },
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as import('next/server').NextRequest;
}

import { GET } from '@/app/auth/callback/route';

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  redirectUrls.length = 0;
  vi.clearAllMocks();
  mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
});

describe('auth callback — no code', () => {
  it('redirects to /login when no code param is present', async () => {
    await GET(makeRequest('https://rounddoorstudio.com/auth/callback'));
    expect(redirectUrls[0]).toMatch(/\/login$/);
  });
});

describe('auth callback — welcome suffix', () => {
  it('appends ?welcome=1 for a normal next path', async () => {
    await GET(makeRequest('https://rounddoorstudio.com/auth/callback?code=abc&next=/library'));
    // First redirect is the placeholder; second is the final destination
    const final = redirectUrls[redirectUrls.length - 1];
    expect(final).toContain('?welcome=1');
    expect(final).toContain('/library');
  });

  it('skips ?welcome=1 when next is an /auth/ route', async () => {
    await GET(makeRequest('https://rounddoorstudio.com/auth/callback?code=abc&next=/auth/reset-password'));
    const final = redirectUrls[redirectUrls.length - 1];
    expect(final).not.toContain('welcome');
    expect(final).toContain('/auth/reset-password');
  });

  it('defaults next to /library when the param is absent', async () => {
    await GET(makeRequest('https://rounddoorstudio.com/auth/callback?code=abc'));
    const final = redirectUrls[redirectUrls.length - 1];
    expect(final).toContain('/library');
    expect(final).toContain('?welcome=1');
  });
});

describe('auth callback — x-forwarded-host', () => {
  it('uses x-forwarded-host as the redirect base when present', async () => {
    await GET(
      makeRequest(
        'https://internal.vercel.com/auth/callback?code=abc&next=/library',
        { 'x-forwarded-host': 'rounddoorstudio.com', 'x-forwarded-proto': 'https' }
      )
    );
    const final = redirectUrls[redirectUrls.length - 1];
    expect(final).toMatch(/^https:\/\/rounddoorstudio\.com/);
  });

  it('falls back to origin when x-forwarded-host is absent', async () => {
    await GET(makeRequest('https://rounddoorstudio.com/auth/callback?code=abc&next=/library'));
    const final = redirectUrls[redirectUrls.length - 1];
    expect(final).toMatch(/^https:\/\/rounddoorstudio\.com/);
  });
});

describe('auth callback — exchange error', () => {
  it('redirects to /login when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: null, error: { message: 'invalid' } });
    await GET(makeRequest('https://rounddoorstudio.com/auth/callback?code=bad'));
    const final = redirectUrls[redirectUrls.length - 1];
    expect(final).toMatch(/\/login$/);
  });
});
