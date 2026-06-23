'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { updatePassword } from '@/app/auth/actions';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(updatePassword, null);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => router.push('/library'), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1>Set a new password</h1>

        {state?.success ? (
          <p className="reset-card__ok">Password updated! Taking you to your library…</p>
        ) : (
          <form action={action}>
            {state?.error && <p className="auth-error">{state.error}</p>}
            <div className="field">
              <label htmlFor="reset-password">New password</label>
              <input
                type="password"
                id="reset-password"
                name="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button type="submit" className="btn-submit" disabled={pending}>
              {pending ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
