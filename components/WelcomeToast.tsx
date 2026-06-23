'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function WelcomeToast() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<'hidden' | 'visible' | 'hiding'>('hidden');
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (searchParams.get('welcome') !== '1') return;

    shown.current = true;
    setState('visible');

    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('welcome');
      window.history.replaceState({}, '', url.toString());
    }, 600);
  }, [searchParams]);

  useEffect(() => {
    if (state !== 'visible') return;
    const timer = setTimeout(() => setState('hiding'), 3000);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state !== 'hiding') return;
    const timer = setTimeout(() => setState('hidden'), 300);
    return () => clearTimeout(timer);
  }, [state]);

  if (state === 'hidden') return null;

  return (
    <div
      className={`toast toast--welcome${state === 'hiding' ? ' toast--hiding' : ''}`}
      role="status"
      aria-live="polite"
    >
      ✨ Welcome to the Circle!
    </div>
  );
}
