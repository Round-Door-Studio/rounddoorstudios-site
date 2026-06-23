'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function WelcomeToast() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<'hidden' | 'visible' | 'hiding'>('hidden');
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (searchParams.get('welcome') !== '1') return;

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Key is per-user so multiple accounts on the same browser each get the toast
      const key = `rds_welcomed_${user.id}`;
      if (localStorage.getItem(key)) return;

      shown.current = true;
      localStorage.setItem(key, '1');
      setState('visible');

      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('welcome');
        window.history.replaceState({}, '', url.toString());
      }, 600);
    })();
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
