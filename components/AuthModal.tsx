'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { signIn, signUp, requestPasswordReset } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';

type View = 'signin' | 'signup' | 'forgot';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'signin' | 'signup') => void;
  redirectTo: string;
}

export function AuthModal({ mode, onClose, onSwitchMode, redirectTo }: AuthModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [view, setView] = useState<View>(mode);
  const [forgotKey, setForgotKey] = useState(0);

  // Sync view when parent switches tabs
  useEffect(() => {
    setView(mode);
  }, [mode]);

  const [signInState, signInAction, signingIn] = useActionState(signIn, null);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, null);

  const authState = view === 'signin' ? signInState : view === 'signup' ? signUpState : null;
  const formAction = view === 'signin' ? signInAction : signUpAction;
  const pending = view === 'signin' ? signingIn : signingUp;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleGoogleSignIn() {
    setGooglePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) {
      setGooglePending(false);
      setGoogleError(error.message);
    }
  }

  // ── Single return — stable .modal div prevents CSS animation from re-firing ─
  return (
    <div className="overlay open" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {view === 'forgot' ? (
          <ForgotPasswordForm key={forgotKey} onBack={() => { setView('signin'); onSwitchMode('signin'); }} />
        ) : (
          <>
            <div className="modal-tabs">
              <button
                type="button"
                className={`modal-tab${view === 'signin' ? ' is-on' : ''}`}
                onClick={() => { onSwitchMode('signin'); setView('signin'); }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`modal-tab${view === 'signup' ? ' is-on' : ''}`}
                onClick={() => { onSwitchMode('signup'); setView('signup'); }}
              >
                Join the Circle
              </button>
            </div>

            <h2>{view === 'signin' ? 'Welcome back' : 'Join the Circle'}</h2>

            <button
              type="button"
              className="btn-google"
              onClick={handleGoogleSignIn}
              disabled={googlePending}
            >
              <GoogleIcon />
              {googlePending ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="auth-divider"><span>or</span></div>

            {(authState?.error || googleError) && (
              <p className="auth-error">{authState?.error ?? googleError}</p>
            )}

            <form action={formAction}>
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {view === 'signup' && (
                <div className="field">
                  <label htmlFor="modal-fullName">Your Name</label>
                  <input
                    type="text"
                    id="modal-fullName"
                    name="fullName"
                    placeholder="First name"
                    autoComplete="given-name"
                    required
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="modal-email">Email Address</label>
                <input
                  type="email"
                  id="modal-email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="modal-password">Password</label>
                <input
                  type="password"
                  id="modal-password"
                  name="password"
                  placeholder={view === 'signup' ? '8+ characters, at least 1 number' : '••••••••'}
                  autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
                  minLength={8}
                  pattern={view === 'signup' ? '(?=.*[0-9]).{8,}' : undefined}
                  title={view === 'signup' ? 'At least 8 characters including 1 number' : undefined}
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={pending}>
                {pending
                  ? 'Please wait…'
                  : view === 'signin'
                  ? 'Sign in'
                  : 'Join the Circle'}
              </button>
            </form>

            {view === 'signin' && (
              <button
                type="button"
                className="auth-link"
                onClick={() => { setView('forgot'); setForgotKey(k => k + 1); }}
              >
                Forgot password?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  return (
    <>
      <h2>Reset password</h2>
      {state?.success ? (
        <p className="modal-hint">Check your email — a reset link is on its way.</p>
      ) : (
        <>
          <p className="modal-hint">Enter your email and we&rsquo;ll send you a link to reset your password.</p>
          {typeof state?.error === 'string' && state.error && <p className="auth-error">{state.error}</p>}
          <form action={action}>
            <div className="field">
              <label htmlFor="forgot-email">Email Address</label>
              <input
                type="email"
                id="forgot-email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={pending}>
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
      <button type="button" className="auth-link" onClick={onBack}>
        ← Back to sign in
      </button>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
