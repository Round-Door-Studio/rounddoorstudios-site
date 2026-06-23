import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted above imports, so mockAuth must be declared with vi.hoisted
const mockAuth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn(() => null) }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ auth: mockAuth }),
}));

import { redirect } from 'next/navigation';
import { signIn, signUp, updatePassword } from '@/app/auth/actions';

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.signInWithPassword.mockResolvedValue({ error: null });
  mockAuth.signUp.mockResolvedValue({ error: null });
  mockAuth.updateUser.mockResolvedValue({ error: null });
});

// ── signUp password validation ─────────────────────────────────────────────

describe('signUp — password validation', () => {
  it('rejects passwords shorter than 8 characters', async () => {
    const result = await signUp(null, form({ email: 'a@b.com', password: 'pass1', fullName: 'T', redirectTo: '/library' }));
    expect(result).toEqual({ error: 'Password must be at least 8 characters and include 1 number.' });
  });

  it('rejects passwords with no digit', async () => {
    const result = await signUp(null, form({ email: 'a@b.com', password: 'password', fullName: 'T', redirectTo: '/library' }));
    expect(result).toEqual({ error: 'Password must be at least 8 characters and include 1 number.' });
  });

  it('accepts passwords with 8+ characters and a digit', async () => {
    await signUp(null, form({ email: 'a@b.com', password: 'password1', fullName: 'T', redirectTo: '/library' }));
    expect(redirect).toHaveBeenCalled();
  });

  it('returns supabase error when signup fails', async () => {
    mockAuth.signUp.mockResolvedValue({ error: { message: 'Email already in use' } });
    const result = await signUp(null, form({ email: 'a@b.com', password: 'password1', fullName: 'T', redirectTo: '/library' }));
    expect(result).toEqual({ error: 'Email already in use' });
  });
});

// ── signUp redirect logic ──────────────────────────────────────────────────

describe('signUp — redirect logic', () => {
  const validForm = (redirectTo: string) =>
    form({ email: 'a@b.com', password: 'password1', fullName: 'T', redirectTo });

  it('redirects to /library?welcome=1 when redirectTo is an auth route', async () => {
    await signUp(null, validForm('/auth/reset-password'));
    expect(redirect).toHaveBeenCalledWith('/library?welcome=1');
  });

  it('appends ?welcome=1 for normal paths', async () => {
    await signUp(null, validForm('/library'));
    expect(redirect).toHaveBeenCalledWith('/library?welcome=1');
  });

  it('falls back to /?welcome=1 when redirectTo is empty', async () => {
    await signUp(null, validForm(''));
    expect(redirect).toHaveBeenCalledWith('/?welcome=1');
  });
});

// ── signIn redirect logic ──────────────────────────────────────────────────

describe('signIn — redirect logic', () => {
  const validForm = (redirectTo: string) =>
    form({ email: 'a@b.com', password: 'password1', redirectTo });

  it('redirects to /library?welcome=1 when redirectTo is an auth route', async () => {
    await signIn(null, validForm('/auth/reset-password'));
    expect(redirect).toHaveBeenCalledWith('/library?welcome=1');
  });

  it('appends ?welcome=1 for normal paths', async () => {
    await signIn(null, validForm('/library'));
    expect(redirect).toHaveBeenCalledWith('/library?welcome=1');
  });

  it('returns error on bad credentials without redirecting', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    const result = await signIn(null, validForm('/library'));
    expect(result).toEqual({ error: 'Invalid credentials' });
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ── updatePassword validation ──────────────────────────────────────────────

describe('updatePassword — password validation', () => {
  it('rejects passwords shorter than 8 characters', async () => {
    const result = await updatePassword(null, form({ password: 'pass1' }));
    expect(result).toEqual({ error: 'Password must be at least 8 characters and include 1 number.' });
  });

  it('rejects passwords with no digit', async () => {
    const result = await updatePassword(null, form({ password: 'password' }));
    expect(result).toEqual({ error: 'Password must be at least 8 characters and include 1 number.' });
  });

  it('returns { success: true } for a valid password', async () => {
    const result = await updatePassword(null, form({ password: 'password1' }));
    expect(result).toEqual({ success: true });
  });

  it('returns supabase error when update fails', async () => {
    mockAuth.updateUser.mockResolvedValue({ error: { message: 'Session expired' } });
    const result = await updatePassword(null, form({ password: 'password1' }));
    expect(result).toEqual({ error: 'Session expired' });
  });
});
