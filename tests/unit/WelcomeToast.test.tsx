import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useSearchParams: vi.fn() }));

import { useSearchParams } from 'next/navigation';
import { WelcomeToast } from '@/components/WelcomeToast';

const mockUseSearchParams = vi.mocked(useSearchParams);

function setupParams(hasWelcome: boolean) {
  mockUseSearchParams.mockReturnValue(
    new URLSearchParams(hasWelcome ? 'welcome=1' : '') as never,
  );
}

/** Flush async effects. */
async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── show / hide conditions ─────────────────────────────────────────────────

describe('WelcomeToast — visibility conditions', () => {
  it('does not render when ?welcome=1 is absent', async () => {
    setupParams(false);
    render(<WelcomeToast />);
    await flushEffects();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders when ?welcome=1 is present', async () => {
    setupParams(true);
    render(<WelcomeToast />);
    await flushEffects();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the Circle/)).toBeInTheDocument();
  });

  it('renders every time ?welcome=1 is present (no localStorage gate)', async () => {
    setupParams(true);
    const { unmount } = render(<WelcomeToast />);
    await flushEffects();
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();

    // Second mount — should show again
    render(<WelcomeToast />);
    await flushEffects();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ── dismiss timing ─────────────────────────────────────────────────────────

describe('WelcomeToast — dismiss timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('adds toast--hiding class after 3 seconds', async () => {
    setupParams(true);
    render(<WelcomeToast />);
    await flushEffects();

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByRole('status')).toHaveClass('toast--hiding');
  });

  it('unmounts 300 ms after hiding starts', async () => {
    setupParams(true);
    render(<WelcomeToast />);
    await flushEffects();

    act(() => { vi.advanceTimersByTime(3000); }); // → hiding
    act(() => { vi.advanceTimersByTime(300); });  // → hidden / unmounted
    expect(screen.queryByRole('status')).toBeNull();
  });
});
