'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn, signUp } from '@/app/auth/actions';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [signInState, signInAction, signingIn] = useActionState(signIn, null);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, null);

  const state = mode === 'signin' ? signInState : signUpState;
  const action = mode === 'signin' ? signInAction : signUpAction;
  const pending = mode === 'signin' ? signingIn : signingUp;

  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link href="/" className="nav-brand">
          <Image src="/icons/round-door.png" alt="Round Door Studio" width={34} height={34} />
          <b>Round Door Studio</b>
        </Link>
      </header>

      <div className="signup-body">
        <div className="signup-wrap">
          <div className="modal">
            <div className="modal-tabs">
              <button
                type="button"
                className={`modal-tab${mode === 'signin' ? ' is-on' : ''}`}
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`modal-tab${mode === 'signup' ? ' is-on' : ''}`}
                onClick={() => setMode('signup')}
              >
                Join the Circle
              </button>
            </div>

            <h2>{mode === 'signin' ? 'Welcome back' : 'Join the Circle'}</h2>

            {state?.error && (
              <p className="auth-error">{state.error}</p>
            )}

            <form action={action}>
              <input type="hidden" name="redirectTo" value="/library" />

              {mode === 'signup' && (
                <div className="field">
                  <label htmlFor="fullName">Your Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="First name"
                    autoComplete="given-name"
                    required
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={pending}>
                {pending
                  ? 'Please wait…'
                  : mode === 'signin'
                  ? 'Sign in'
                  : 'Join the Circle'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
