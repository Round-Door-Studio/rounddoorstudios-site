'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
        <Link href="/" className="reset-card__brand">
          <Image src="/icons/round-door.png" alt="Round Door Studio" width={32} height={32} />
          <span>Round Door Studio</span>
        </Link>

        <h1>Set a new password</h1>
        <p className="modal-hint">Choose something you&rsquo;ll remember — at least 8 characters.</p>

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
                placeholder="8+ characters, at least 1 number"
                autoComplete="new-password"
                minLength={8}
                pattern="(?=.*[0-9]).{8,}"
                title="At least 8 characters including 1 number"
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
