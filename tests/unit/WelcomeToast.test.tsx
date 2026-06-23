import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useSearchParams: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WelcomeToast } from '@/components/WelcomeToast';

const mockUseSearchParams = vi.mocked(useSearchParams);
const mockCreateClient = vi.mocked(createClient);

// ── localStorage mock ──────────────────────────────────────────────────────
// store is kept outside the closure so beforeEach can reference it for
// restoring the default getItem implementation after mockImplementation overrides.

const localStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => localStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStore[key] = value; }),
  clear() { Object.keys(localStore).forEach(k => delete localStore[k]); },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── helpers ────────────────────────────────────────────────────────────────

const USER_ID = 'user-test-123';
const WELCOMED_KEY = `rds_welcomed_${USER_ID}`;

function setupParams(hasWelcome: boolean) {
  mockUseSearchParams.mockReturnValue(
    new URLSearchParams(hasWelcome ? 'welcome=1' : '') as never,
  );
}

function setupUser(id: string | null) {
  mockCreateClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: id ? { id } : null } }),
    },
  } as never);
}

/** Flush async effects: the getUser promise + resulting setState batch. */
async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  // Restore default getItem — a mockImplementation in one test would otherwise
  // persist into the next test because clearAllMocks does not reset implementations.
  localStorageMock.getItem.mockImplementation((key: string) => localStore[key] ?? null);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── show / hide conditions ─────────────────────────────────────────────────

describe('WelcomeToast — visibility conditions', () => {
  it('does not render when ?welcome=1 is absent', async () => {
    setupParams(false);
    setupUser(USER_ID);
    render(<WelcomeToast />);
    await flushEffects();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders on first visit when ?welcome=1 is present', async () => {
    setupParams(true);
    setupUser(USER_ID);
    render(<WelcomeToast />);
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(screen.getByText(/Welcome to the Circle/)).toBeInTheDocument();
  });

  it('does not render when the user has already seen the toast', async () => {
    setupParams(true);
    setupUser(USER_ID);
    localStorageMock.getItem.mockImplementation((key: string) =>
      key === WELCOMED_KEY ? '1' : null,
    );
    render(<WelcomeToast />);
    await flushEffects();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not render when no user is logged in', async () => {
    setupParams(true);
    setupUser(null);
    render(<WelcomeToast />);
    await flushEffects();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

// ── localStorage key ───────────────────────────────────────────────────────

describe('WelcomeToast — localStorage', () => {
  it('stores a per-user key on first show', async () => {
    setupParams(true);
    setupUser(USER_ID);
    render(<WelcomeToast />);
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(localStorageMock.setItem).toHaveBeenCalledWith(WELCOMED_KEY, '1');
  });

  it('uses different keys for different user IDs', async () => {
    setupParams(true);
    setupUser('other-user-456');
    render(<WelcomeToast />);
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(localStorageMock.setItem).toHaveBeenCalledWith('rds_welcomed_other-user-456', '1');
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(WELCOMED_KEY, '1');
  });
});

// ── dismiss timing ─────────────────────────────────────────────────────────
// waitFor polls with setTimeout internally, which hangs under fake timers.
// Instead: flush async effects manually, then advance fake timers synchronously.

describe('WelcomeToast — dismiss timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('adds toast--hiding class after 3 seconds', async () => {
    setupParams(true);
    setupUser(USER_ID);
    render(<WelcomeToast />);
    await flushEffects();

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByRole('status')).toHaveClass('toast--hiding');
  });

  it('unmounts 300 ms after hiding starts', async () => {
    setupParams(true);
    setupUser(USER_ID);
    render(<WelcomeToast />);
    await flushEffects();

    act(() => { vi.advanceTimersByTime(3000); }); // → hiding
    act(() => { vi.advanceTimersByTime(300); });  // → hidden / unmounted
    expect(screen.queryByRole('status')).toBeNull();
  });
});
