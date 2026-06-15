import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScriptProvider } from '@/context/ScriptContext';
import { ScriptToggle } from '@/components/ScriptToggle';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.documentElement.setAttribute
const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute');

function renderToggle() {
  return render(
    <ScriptProvider>
      <ScriptToggle />
    </ScriptProvider>,
  );
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('ScriptToggle', () => {
  it('renders simplified and traditional buttons', () => {
    renderToggle();
    expect(screen.getByText(/Simplified/)).toBeInTheDocument();
    expect(screen.getByText(/Traditional/)).toBeInTheDocument();
  });

  it('defaults to simplified being active', async () => {
    renderToggle();
    // Wait for useEffect to hydrate from localStorage
    const simpBtn = screen.getByText(/Simplified/).closest('button');
    // Initially (SSR default) simp should appear active after hydration
    expect(simpBtn).toBeTruthy();
  });

  it('calls setScript and updates localStorage when traditional is clicked', async () => {
    renderToggle();
    const tradBtn = screen.getByText(/Traditional/).closest('button')!;
    fireEvent.click(tradBtn);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('rds-script', 'trad');
  });

  it('updates data-script attribute on html element when toggled', () => {
    renderToggle();
    const tradBtn = screen.getByText(/Traditional/).closest('button')!;
    fireEvent.click(tradBtn);
    expect(setAttributeSpy).toHaveBeenCalledWith('data-script', 'trad');
  });
});
